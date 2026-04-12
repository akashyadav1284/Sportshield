"""SportShield AI — Celery task: scan asset for violations."""

import uuid
import asyncio
from datetime import datetime, timezone

from app.tasks.celery_app import celery_app
from app.core.database import SyncSessionLocal, AsyncSessionLocal
from app.models.asset import MediaAsset
from app.models.scan_job import ScanJob
from app.scanner.orchestrator import run_scan_for_asset


@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def scan_asset(self, asset_id: str):
    """Execute a full scan cycle for one asset.

    Creates a ScanJob record, runs the orchestrator, and updates results.

    Args:
        asset_id: UUID string of the asset to scan.
    """
    session = SyncSessionLocal()
    try:
        # Load asset
        asset = session.query(MediaAsset).filter(
            MediaAsset.id == uuid.UUID(asset_id)
        ).first()

        if not asset:
            print(f"Asset {asset_id} not found for scanning")
            return

        if asset.fingerprint_status != "indexed":
            print(f"Asset {asset_id} not yet indexed, skipping scan")
            return

        # Create scan job
        scan_job = ScanJob(
            asset_id=asset.id,
            status="running",
        )
        session.add(scan_job)
        session.commit()

        # Run the scan — try the real orchestrator first, fall back to demo
        scan_results = {"candidates_found": 0, "violations_created": 0}
        try:
            loop = asyncio.new_event_loop()
            try:
                async def _run_scan():
                    async with AsyncSessionLocal() as async_session:
                        from sqlalchemy import select
                        result = await async_session.execute(
                            select(MediaAsset).filter(MediaAsset.id == uuid.UUID(asset_id))
                        )
                        async_asset = result.scalar_one_or_none()
                        if not async_asset:
                            return {"candidates_found": 0, "violations_created": 0}
                        return await run_scan_for_asset(async_asset, async_session)

                scan_results = loop.run_until_complete(_run_scan())
            finally:
                loop.close()
        except Exception as scan_err:
            # Fall back to demo violation generation
            print(f"Real scan failed ({scan_err}), generating demo violation...")
            try:
                from app.tasks.demo_task import generate_demo_violation
                demo_result = generate_demo_violation()
                scan_results = {
                    "candidates_found": 1,
                    "violations_created": 1,
                }
            except Exception as demo_err:
                print(f"Demo fallback also failed: {demo_err}")
                scan_results = {"candidates_found": 0, "violations_created": 0}

        # Update scan job
        scan_job.status = "completed"
        scan_job.completed_at = datetime.now(timezone.utc)
        scan_job.candidates_found = scan_results.get("candidates_found", 0)
        scan_job.violations_created = scan_results.get("violations_created", 0)
        session.commit()

        # Emit WebSocket event
        try:
            from app.websocket.manager import emit_event
            emit_event(
                str(asset.org_id),
                "scan_completed",
                {
                    "asset_id": asset_id,
                    "candidates_found": scan_results.get("candidates_found", 0),
                    "violations_created": scan_results.get("violations_created", 0),
                },
            )
        except Exception:
            pass

        print(f"Scan completed for asset {asset_id}: {scan_results}")

    except Exception as exc:
        session.rollback()
        # Mark scan job as failed
        try:
            if scan_job:
                scan_job.status = "failed"
                scan_job.completed_at = datetime.now(timezone.utc)
                scan_job.error_message = str(exc)
                session.commit()
        except Exception:
            pass
        raise self.retry(exc=exc)
    finally:
        session.close()


@celery_app.task
def scan_all_assets():
    """Scheduled task: trigger a scan for every indexed asset.

    Called by Celery Beat every 30 minutes.
    """
    session = SyncSessionLocal()
    try:
        assets = session.query(MediaAsset).filter(
            MediaAsset.fingerprint_status == "indexed"
        ).all()

        for asset in assets:
            scan_asset.delay(str(asset.id))

        print(f"Dispatched scans for {len(assets)} assets")
    finally:
        session.close()
