"""SportShield AI — Demo simulation task.

Generates realistic violations at regular intervals so the dashboard
feels alive with real-time data flowing through the system.
"""

import uuid
import random
from datetime import datetime, timezone

from app.tasks.celery_app import celery_app
from app.core.database import SyncSessionLocal
from app.models.asset import MediaAsset
from app.models.violation import Violation
from app.models.alert import Alert


DEMO_URLS = [
    "https://piratestreams.live/watch/premier-league-2026",
    "https://freegoals.net/highlights-hd-free",
    "https://sportzbay.com/nba-replay-free-stream",
    "https://hdstreamz.io/fifa-world-cup-live",
    "https://streameast.to/sports-free-live",
    "https://youtube.com/watch?v=abcdefg1234",
    "https://dailymotion.com/video/x92kf_pirate",
    "https://tiktok.com/@freesportshd/video/72938",
    "https://t.me/sportshighlightsfree/8472",
    "https://facebook.com/SportsHighlightsFree/videos/999",
]

PLATFORMS = ["google", "youtube", "bing", "twitter", "web"]


@celery_app.task(name="app.tasks.demo_task.generate_demo_violation")
def generate_demo_violation():
    """Generate a single realistic violation and alert.
    
    This task picks a random indexed asset, creates a new violation
    with realistic confidence scores, and emits a WebSocket event
    so the dashboard updates in real time.
    """
    session = SyncSessionLocal()

    try:
        # Pick a random indexed asset
        assets = session.query(MediaAsset).filter(
            MediaAsset.fingerprint_status == "indexed"
        ).all()

        if not assets:
            print("⚠️  No indexed assets found. Run seed_db first.")
            return

        asset = random.choice(assets)
        platform = random.choice(PLATFORMS)

        # Generate severity and confidence
        severity_roll = random.random()
        if severity_roll < 0.2:
            severity = "high"
            confidence = round(random.uniform(90, 98), 1)
        elif severity_roll < 0.6:
            severity = "medium"
            confidence = round(random.uniform(75, 89.9), 1)
        else:
            severity = "low"
            confidence = round(random.uniform(60, 74.9), 1)

        now = datetime.now(timezone.utc)

        violation = Violation(
            id=uuid.uuid4(),
            org_id=asset.org_id,
            asset_id=asset.id,
            detected_url=random.choice(DEMO_URLS),
            platform=platform,
            thumbnail_url=f"https://picsum.photos/seed/{uuid.uuid4().hex[:8]}/400/300",
            phash_distance=max(0, int(25 - (confidence / 4))),
            cnn_similarity=round(confidence / 100 * random.uniform(0.85, 1.0), 3),
            confidence_score=confidence,
            severity=severity,
            status="new",
            detected_at=now,
        )
        session.add(violation)

        # Update asset violation count
        asset.violation_count = (asset.violation_count or 0) + 1
        asset.last_scan_at = now
        asset.scan_count = (asset.scan_count or 0) + 1

        # Create alert
        alert = Alert(
            id=uuid.uuid4(),
            org_id=asset.org_id,
            violation_id=violation.id,
            alert_type="websocket",
            sent_at=now,
            is_read=False,
            metadata_json={
                "severity": severity,
                "confidence_score": confidence,
                "asset_name": asset.name,
                "platform": platform,
            },
        )
        session.add(alert)
        session.commit()

        print(f"🚨 Demo violation: {severity.upper()} ({confidence}%) on {platform} for '{asset.name[:40]}'")

        # Emit WebSocket event
        try:
            from app.websocket.manager import sio
            import asyncio

            async def emit():
                await sio.emit("new_violation", {
                    "id": str(violation.id),
                    "asset_id": str(asset.id),
                    "asset_name": asset.name,
                    "severity": severity,
                    "confidence_score": confidence,
                    "platform": platform,
                    "detected_url": violation.detected_url,
                    "detected_at": now.isoformat(),
                })

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(emit())
                else:
                    loop.run_until_complete(emit())
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(emit())
        except Exception as e:
            print(f"   WebSocket emit skipped: {e}")

        return {
            "violation_id": str(violation.id),
            "severity": severity,
            "confidence": confidence,
            "platform": platform,
        }

    except Exception as e:
        session.rollback()
        print(f"❌ Demo violation failed: {e}")
        raise
    finally:
        session.close()
