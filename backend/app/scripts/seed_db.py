"""SportShield AI — Database seed script.

Populates the database with realistic demo data so the dashboard
comes alive with real numbers, violations, alerts, and analytics.

Usage:
    docker-compose exec backend python -m app.scripts.seed_db
"""

import uuid
import random
import hashlib
from datetime import datetime, timedelta, timezone

from app.core.database import SyncSessionLocal
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User
from app.models.asset import MediaAsset
from app.models.violation import Violation
from app.models.alert import Alert
from app.models.scan_job import ScanJob


# ── Realistic Data Pools ──

ASSET_NAMES = [
    "Premier League Matchday Highlights - Arsenal vs Chelsea",
    "NBA Finals Game 7 Broadcast Clip",
    "FIFA World Cup 2026 Official Logo",
    "Olympics Opening Ceremony Footage",
    "Champions League Final Trophy Celebration",
    "UFC 308 Main Event Promo",
    "IPL 2026 Season Opener Highlights",
    "Formula 1 Monaco Grand Prix Onboard Camera",
    "Wimbledon Centre Court Match Point",
    "Super Bowl LXII Halftime Show Clip",
    "MLB World Series Walk-Off Home Run",
    "Tour de France Stage 21 Sprint Finish",
]

VIOLATION_URLS = [
    "https://piratestreams.live/watch/premier-league-2026",
    "https://freegoals.net/arsenal-chelsea-highlights-hd",
    "https://sportzbay.com/nba-finals-full-replay-free",
    "https://hdstreamz.io/fifa-world-cup-stream",
    "https://watchsports247.net/champions-league-final",
    "https://livecricketstream.me/ipl-2026-live",
    "https://streameast.to/formula1-monaco-gp-2026",
    "https://reddit-streams.org/ufc-308-free",
    "https://sports-pirate.cc/wimbledon-finals-stream",
    "https://clipshare.biz/nba-finals-highlights",
    "https://tube-rip.net/super-bowl-halftime-2026",
    "https://torrentball.com/mlb-world-series-torrent",
    "https://dailymotion.com/video/x92kflp",
    "https://vk.com/video401229387_456239017",
    "https://ok.ru/video/3847293847298",
    "https://bilibili.com/video/BV1xE411f7Sd",
    "https://mega.nz/file/abc123def",
    "https://t.me/sportshighlightsfree/8472",
    "https://discord.gg/freesports/clips",
    "https://facebook.com/SportsHighlightsFree/videos/123456",
    "https://instagram.com/reel/CxYz123ABC",
    "https://twitter.com/SportsPirate99/status/182739481",
    "https://tiktok.com/@freesportshd/video/7293847298",
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "https://rumble.com/v2h3k4-nba-finals-free.html",
]

PLATFORMS = ["google", "youtube", "bing", "twitter", "web"]
PLATFORM_WEIGHTS = [30, 25, 15, 15, 15]  # Distribution %

SEVERITIES = ["high", "medium", "low"]
SEVERITY_WEIGHTS = [25, 40, 35]

ALERT_TYPES = ["email", "websocket"]


def generate_phash() -> str:
    """Generate a realistic-looking 16-char hex perceptual hash."""
    return hashlib.md5(uuid.uuid4().bytes).hexdigest()[:16]


def seed_database():
    """Main seed function — idempotent (skips if data exists)."""
    session = SyncSessionLocal()

    try:
        # Check if data already exists
        existing_org = session.query(Organization).first()
        if existing_org:
            print("⚠️  Database already has data. Skipping seed.")
            print(f"   Found org: {existing_org.name}")
            print(f"   Assets: {session.query(MediaAsset).count()}")
            print(f"   Violations: {session.query(Violation).count()}")
            print(f"   Alerts: {session.query(Alert).count()}")
            return

        print("🌱 Seeding SportShield AI database...")

        # ── 1. Organization ──
        org = Organization(
            id=uuid.uuid4(),
            name="SportShield Demo Corp",
            email_domain="sportshield.ai",
            plan="enterprise",
        )
        session.add(org)
        session.flush()
        print(f"   ✅ Created organization: {org.name}")

        # ── 2. Admin User ──
        admin = User(
            id=uuid.uuid4(),
            org_id=org.id,
            email="admin@sportshield.ai",
            hashed_password=hash_password("admin123"),
            full_name="Akash Admin",
            role="admin",
            is_active=True,
        )
        session.add(admin)
        session.flush()
        print(f"   ✅ Created admin user: {admin.email}")

        # ── 3. Analyst User ──
        analyst = User(
            id=uuid.uuid4(),
            org_id=org.id,
            email="analyst@sportshield.ai",
            hashed_password=hash_password("analyst123"),
            full_name="Sarah Analyst",
            role="analyst",
            is_active=True,
        )
        session.add(analyst)
        session.flush()
        print(f"   ✅ Created analyst user: {analyst.email}")

        # ── 4. Media Assets ──
        assets = []
        for i, name in enumerate(ASSET_NAMES):
            file_type = "video" if any(w in name.lower() for w in ["clip", "footage", "highlights", "promo"]) else "image"
            asset = MediaAsset(
                id=uuid.uuid4(),
                org_id=org.id,
                uploaded_by=admin.id,
                name=name,
                description=f"Official licensed content — {name}",
                file_type=file_type,
                mime_type="video/mp4" if file_type == "video" else "image/jpeg",
                file_size_bytes=random.randint(500_000, 50_000_000),
                storage_key=f"{uuid.uuid4().hex}.{'mp4' if file_type == 'video' else 'jpg'}",
                storage_url=f"/uploads/{uuid.uuid4().hex}.{'mp4' if file_type == 'video' else 'jpg'}",
                phash=generate_phash(),
                dhash=generate_phash(),
                faiss_index_id=i,
                fingerprint_status="indexed",
                scan_count=random.randint(5, 50),
                violation_count=0,  # Will be updated after violations
                last_scan_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 120)),
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
            )
            assets.append(asset)
            session.add(asset)

        session.flush()
        print(f"   ✅ Created {len(assets)} media assets")

        # ── 5. Violations ──
        violations = []
        num_violations = 25
        now = datetime.now(timezone.utc)

        for i in range(num_violations):
            asset = random.choice(assets)
            platform = random.choices(PLATFORMS, weights=PLATFORM_WEIGHTS, k=1)[0]
            severity = random.choices(SEVERITIES, weights=SEVERITY_WEIGHTS, k=1)[0]

            if severity == "high":
                confidence = round(random.uniform(90, 98), 1)
            elif severity == "medium":
                confidence = round(random.uniform(75, 89.9), 1)
            else:
                confidence = round(random.uniform(60, 74.9), 1)

            phash_dist = max(0, int(25 - (confidence / 4)))
            cnn_sim = round(confidence / 100 * random.uniform(0.85, 1.0), 3)

            detected_at = now - timedelta(
                hours=random.randint(0, 168),  # Up to 7 days ago
                minutes=random.randint(0, 59),
            )

            statuses = ["new", "reviewed", "flagged", "dismissed"]
            status_weights = [40, 25, 20, 15]
            status = random.choices(statuses, weights=status_weights, k=1)[0]

            violation = Violation(
                id=uuid.uuid4(),
                org_id=org.id,
                asset_id=asset.id,
                detected_url=random.choice(VIOLATION_URLS),
                platform=platform,
                thumbnail_url=f"https://picsum.photos/seed/{uuid.uuid4().hex[:8]}/400/300",
                phash_distance=phash_dist,
                cnn_similarity=cnn_sim,
                confidence_score=confidence,
                severity=severity,
                status=status,
                detected_at=detected_at,
                reviewed_at=detected_at + timedelta(hours=random.randint(1, 24)) if status != "new" else None,
                reviewed_by=admin.id if status != "new" else None,
            )
            violations.append(violation)
            session.add(violation)

            # Update asset violation count
            asset.violation_count = (asset.violation_count or 0) + 1

        session.flush()
        print(f"   ✅ Created {len(violations)} violations")

        # ── 6. Alerts ──
        alerts_created = 0
        for v in violations:
            # Create 1-2 alerts per violation
            num_alerts = random.randint(1, 2)
            for _ in range(num_alerts):
                alert = Alert(
                    id=uuid.uuid4(),
                    org_id=org.id,
                    violation_id=v.id,
                    alert_type=random.choice(ALERT_TYPES),
                    recipient=admin.email if random.random() > 0.3 else None,
                    sent_at=v.detected_at + timedelta(seconds=random.randint(5, 60)),
                    is_read=random.random() > 0.4,  # ~60% read
                    metadata_json={
                        "severity": v.severity,
                        "confidence_score": v.confidence_score,
                        "asset_name": next(a.name for a in assets if a.id == v.asset_id),
                        "platform": v.platform,
                    },
                )
                session.add(alert)
                alerts_created += 1

        session.flush()
        print(f"   ✅ Created {alerts_created} alerts")

        # ── 7. Scan Jobs ──
        scan_jobs_created = 0
        for asset in assets:
            num_jobs = random.randint(2, 6)
            for j in range(num_jobs):
                started = now - timedelta(
                    hours=random.randint(1, 168),
                    minutes=random.randint(0, 59),
                )
                completed = started + timedelta(seconds=random.randint(15, 120))
                candidates = random.randint(3, 20)
                violations_found = random.randint(0, min(3, candidates))

                scan_job = ScanJob(
                    id=uuid.uuid4(),
                    asset_id=asset.id,
                    started_at=started,
                    completed_at=completed,
                    status="completed",
                    candidates_found=candidates,
                    violations_created=violations_found,
                )
                session.add(scan_job)
                scan_jobs_created += 1

        session.flush()
        print(f"   ✅ Created {scan_jobs_created} scan jobs")

        # ── Commit ──
        session.commit()

        print("\n🎉 Database seeded successfully!")
        print(f"   📧 Login: admin@sportshield.ai / admin123")
        print(f"   📊 {len(assets)} assets, {len(violations)} violations, {alerts_created} alerts")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
