"""SportShield AI — Celery task: fingerprint an asset after upload."""

import uuid

from app.tasks.celery_app import celery_app
from app.core.database import SyncSessionLocal
from app.models.asset import MediaAsset
from app.ai.fingerprint import generate_phash, generate_dhash
from app.ai.embeddings import extract_embedding
from app.ai.similarity import add_to_index


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def fingerprint_asset(self, asset_id: str):
    """Generate perceptual hash + CNN embedding for an uploaded asset.

    This task:
    1. Downloads the file from storage
    2. Generates pHash and dHash
    3. Extracts CNN embedding
    4. Adds to FAISS index
    5. Updates asset status to 'indexed'
    6. Dispatches an initial scan task

    Args:
        asset_id: UUID string of the asset to fingerprint.
    """
    session = SyncSessionLocal()
    try:
        # Load asset
        asset = session.query(MediaAsset).filter(
            MediaAsset.id == uuid.UUID(asset_id)
        ).first()

        if not asset:
            print(f"Asset {asset_id} not found")
            return

        # Update status to processing
        asset.fingerprint_status = "processing"
        session.commit()

        # Download file from storage
        from app.core.storage import storage
        import asyncio

        loop = asyncio.new_event_loop()
        try:
            file_bytes = loop.run_until_complete(storage.download(asset.storage_key))
        finally:
            loop.close()

        if asset.file_type == "video":
            # For video, extract the first keyframe for fingerprinting
            import tempfile
            import os
            from app.ai.video import extract_keyframes

            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            try:
                frames = extract_keyframes(tmp_path, max_frames=1)
                if frames:
                    file_bytes = frames[0]
                else:
                    raise ValueError("No keyframes extracted from video")
            finally:
                os.unlink(tmp_path)

        # Generate perceptual hashes
        phash = generate_phash(file_bytes)
        dhash = generate_dhash(file_bytes)

        # Extract CNN embedding
        embedding = extract_embedding(file_bytes)

        # Add to FAISS index
        faiss_id = add_to_index(asset_id, embedding)

        # Update asset
        asset.phash = phash
        asset.dhash = dhash
        asset.faiss_index_id = faiss_id
        asset.fingerprint_status = "indexed"
        session.commit()

        # Emit WebSocket event
        try:
            from app.websocket.manager import emit_event
            emit_event(
                str(asset.org_id),
                "fingerprint_ready",
                {"asset_id": asset_id, "status": "indexed"},
            )
        except Exception:
            pass

        # Dispatch initial scan
        from app.tasks.scan_task import scan_asset
        scan_asset.delay(asset_id)

        print(f"Asset {asset_id} fingerprinted successfully")

    except Exception as exc:
        session.rollback()
        # Mark as failed
        try:
            asset = session.query(MediaAsset).filter(
                MediaAsset.id == uuid.UUID(asset_id)
            ).first()
            if asset:
                asset.fingerprint_status = "failed"
                session.commit()
        except Exception:
            pass
        raise self.retry(exc=exc)
    finally:
        session.close()
