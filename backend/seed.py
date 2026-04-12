"""SportShield AI — Seed script for demo data.

Creates demo organization, user, assets, violations, and alerts.
Run with: python -m seed
"""

import uuid
import random
from datetime import datetime, timedelta, timezone

from app.core.database import SyncSessionLocal, sync_engine
from app.core.database import Base
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User
from app.models.asset import MediaAsset
from app.models.violation import Violation
from app.models.alert import Alert


def seed():
    """Create all demo data for the hackathon demo."""
    # Create all tables
    Base.metadata.create_all(bind=sync_engine)

    session = SyncSessionLocal()
    try:
        # Check if demo data already exists
        existing = session.query(User).filter(User.email == "demo@sportshield.ai").first()
        if existing:
            print("Demo data already exists. Skipping seed.")
            return

        print("Seeding demo data...")

        # 1. Create demo organization
        org = Organization(
            id=uuid.uuid4(),
            name="Premier FC",
            email_domain="sportshield.ai",
            plan="pro",
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(org)
        session.flush()
        print(f"  OK Organization: {org.name} ({org.id})")

        # 2. Create demo user
        user = User(
            id=uuid.uuid4(),
            org_id=org.id,
            email="demo@sportshield.ai",
            hashed_password=hash_password("Demo1234!"),
            full_name="Alex Morgan",
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
        )
        session.add(user)
        session.flush()
        print(f"  OK User: {user.email} ({user.id})")

        # 3. Create 5 sample assets (using placeholder data — in prod, these would have real images)
        sample_assets = [
            {
                "name": "Premier FC Official Logo",
                "description": "Official team logo used on merchandise and media",
                "file_type": "image",
                "mime_type": "image/png",
                "tags": ["logo", "branding", "official"],
                "file_size_bytes": 2_500_000,
                "phash": "d4c67a3b2e1f5890",
                "dhash": "a3b2c1d0e5f69078",
                "fingerprint_status": "indexed",
            },
            {
                "name": "Championship Celebration Photo",
                "description": "Team celebration after winning the 2024 championship",
                "file_type": "image",
                "mime_type": "image/jpeg",
                "tags": ["celebration", "championship", "team"],
                "file_size_bytes": 4_800_000,
                "phash": "e5d7893a1b2c4f06",
                "dhash": "b4c3d2e1f0a59687",
                "fingerprint_status": "indexed",
            },
            {
                "name": "Season Highlight Reel",
                "description": "Official highlight reel video from the 2024 season",
                "file_type": "video",
                "mime_type": "video/mp4",
                "tags": ["highlights", "season", "video"],
                "file_size_bytes": 150_000_000,
                "phash": "f6e8904b2c3d5a17",
                "dhash": "c5d4e3f2a1b60798",
                "fingerprint_status": "indexed",
            },
            {
                "name": "Player Portrait — Marcus Reed",
                "description": "Official portrait photo of star player Marcus Reed",
                "file_type": "image",
                "mime_type": "image/jpeg",
                "tags": ["player", "portrait", "marcus-reed"],
                "file_size_bytes": 3_200_000,
                "phash": "a7b9015c3d4e6f28",
                "dhash": "d6e5f4a3b2c718a9",
                "fingerprint_status": "indexed",
            },
            {
                "name": "Stadium Aerial Shot",
                "description": "Drone footage of Premier FC home stadium",
                "file_type": "image",
                "mime_type": "image/jpeg",
                "tags": ["stadium", "aerial", "venue"],
                "file_size_bytes": 8_500_000,
                "phash": "b8ca126d4e5f7039",
                "dhash": "e7f6a5b4c3d829ba",
                "fingerprint_status": "indexed",
            },
        ]

        asset_objects = []
        for i, asset_data in enumerate(sample_assets):
            asset = MediaAsset(
                id=uuid.uuid4(),
                org_id=org.id,
                uploaded_by=user.id,
                name=asset_data["name"],
                description=asset_data["description"],
                file_type=asset_data["file_type"],
                mime_type=asset_data["mime_type"],
                tags=asset_data["tags"],
                file_size_bytes=asset_data["file_size_bytes"],
                storage_key=f"demo_asset_{i}.{'mp4' if asset_data['file_type'] == 'video' else 'jpg'}",
                storage_url=f"/uploads/demo_asset_{i}.{'mp4' if asset_data['file_type'] == 'video' else 'jpg'}",
                phash=asset_data["phash"],
                dhash=asset_data["dhash"],
                faiss_index_id=i,
                fingerprint_status=asset_data["fingerprint_status"],
                scan_count=random.randint(3, 15),
                violation_count=0,
                last_scan_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 120)),
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(5, 25)),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(asset)
            asset_objects.append(asset)

        session.flush()
        print(f"  OK Assets: {len(asset_objects)} created")

        # 4. Create 8 mock violations
        violation_configs = [
            {
                "asset_idx": 0, "platform": "google", "severity": "high",
                "confidence_score": 94.5, "phash_distance": 3, "cnn_similarity": 0.96,
                "detected_url": "https://unauthorized-merch-shop.com/premier-fc-logo-tshirt",
                "status": "new",
                "hours_ago": 2,
            },
            {
                "asset_idx": 1, "platform": "bing", "severity": "high",
                "confidence_score": 91.2, "phash_distance": 5, "cnn_similarity": 0.93,
                "detected_url": "https://sports-blog.net/2024/premier-fc-celebration",
                "status": "new",
                "hours_ago": 4,
            },
            {
                "asset_idx": 0, "platform": "web", "severity": "medium",
                "confidence_score": 82.7, "phash_distance": 8, "cnn_similarity": 0.85,
                "detected_url": "https://fan-art-central.com/football/premier-fc",
                "status": "flagged",
                "hours_ago": 12,
            },
            {
                "asset_idx": 2, "platform": "youtube", "severity": "high",
                "confidence_score": 96.1, "phash_distance": 2, "cnn_similarity": 0.97,
                "detected_url": "https://youtube.com/watch?v=FAKE_highlight_rip",
                "status": "new",
                "hours_ago": 6,
            },
            {
                "asset_idx": 3, "platform": "twitter", "severity": "medium",
                "confidence_score": 78.3, "phash_distance": 10, "cnn_similarity": 0.81,
                "detected_url": "https://x.com/fake_account/status/123456789",
                "status": "reviewed",
                "hours_ago": 48,
            },
            {
                "asset_idx": 4, "platform": "google", "severity": "low",
                "confidence_score": 65.8, "phash_distance": 15, "cnn_similarity": 0.72,
                "detected_url": "https://travel-blog.com/best-stadiums-world",
                "status": "dismissed",
                "hours_ago": 72,
            },
            {
                "asset_idx": 1, "platform": "web", "severity": "medium",
                "confidence_score": 76.4, "phash_distance": 11, "cnn_similarity": 0.79,
                "detected_url": "https://knockoff-sportswear.shop/premier-fc-prints",
                "status": "new",
                "hours_ago": 8,
            },
            {
                "asset_idx": 3, "platform": "bing", "severity": "low",
                "confidence_score": 62.1, "phash_distance": 18, "cnn_similarity": 0.68,
                "detected_url": "https://sports-collectibles.net/player-cards",
                "status": "reviewed",
                "hours_ago": 96,
            },
        ]

        violation_objects = []
        for vc in violation_configs:
            asset = asset_objects[vc["asset_idx"]]
            detected_at = datetime.now(timezone.utc) - timedelta(hours=vc["hours_ago"])
            violation = Violation(
                id=uuid.uuid4(),
                org_id=org.id,
                asset_id=asset.id,
                detected_url=vc["detected_url"],
                platform=vc["platform"],
                thumbnail_url=f"https://picsum.photos/seed/{random.randint(1, 1000)}/200/200",
                phash_distance=vc["phash_distance"],
                cnn_similarity=vc["cnn_similarity"],
                confidence_score=vc["confidence_score"],
                severity=vc["severity"],
                status=vc["status"],
                detected_at=detected_at,
                reviewed_at=detected_at + timedelta(hours=2) if vc["status"] in ("reviewed", "dismissed") else None,
                reviewed_by=user.id if vc["status"] in ("reviewed", "dismissed") else None,
            )
            session.add(violation)
            violation_objects.append(violation)

            # Update asset violation count
            asset.violation_count = (asset.violation_count or 0) + 1

        session.flush()
        print(f"  OK Violations: {len(violation_objects)} created")

        # 5. Create 3 mock alerts
        alert_configs = [
            {"violation_idx": 0, "alert_type": "email", "is_read": False},
            {"violation_idx": 3, "alert_type": "websocket", "is_read": False},
            {"violation_idx": 1, "alert_type": "email", "is_read": True},
        ]

        for ac in alert_configs:
            violation = violation_objects[ac["violation_idx"]]
            alert = Alert(
                id=uuid.uuid4(),
                org_id=org.id,
                violation_id=violation.id,
                alert_type=ac["alert_type"],
                recipient=user.email if ac["alert_type"] == "email" else None,
                sent_at=violation.detected_at + timedelta(minutes=1),
                is_read=ac["is_read"],
                metadata_json={
                    "severity": violation.severity,
                    "confidence_score": violation.confidence_score,
                    "asset_name": asset_objects[violation_configs[ac["violation_idx"]]["asset_idx"]].name,
                },
            )
            session.add(alert)

        session.commit()
        print(f"  OK Alerts: {len(alert_configs)} created")

        print("\nSeed data created successfully!")
        print(f"   Login: demo@sportshield.ai / Demo1234!")

    except Exception as e:
        session.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
