"""SportShield AI — Celery task: send violation alerts (email + WebSocket)."""

import uuid

from app.tasks.celery_app import celery_app
from app.core.database import SyncSessionLocal
from app.models.violation import Violation
from app.models.asset import MediaAsset
from app.models.alert import Alert
from app.models.organization import Organization
from app.models.user import User


@celery_app.task
def send_violation_alert(violation_id: str):
    """Send alert notifications for a detected violation.

    1. Sends email via SendGrid (if configured)
    2. Emits WebSocket event to the org room
    3. Creates Alert records in the database

    Args:
        violation_id: UUID string of the violation.
    """
    session = SyncSessionLocal()
    try:
        # Load violation with related models
        violation = session.query(Violation).filter(
            Violation.id == uuid.UUID(violation_id)
        ).first()

        if not violation:
            print(f"Violation {violation_id} not found")
            return

        asset = session.query(MediaAsset).filter(
            MediaAsset.id == violation.asset_id
        ).first()

        org = session.query(Organization).filter(
            Organization.id == violation.org_id
        ).first()

        # Get org admin users for email alerts
        admin_users = session.query(User).filter(
            User.org_id == violation.org_id,
            User.role.in_(["admin", "analyst"]),
            User.is_active == True,
        ).all()

        # Send email alerts
        try:
            from app.services.email_service import send_violation_email

            for user in admin_users:
                send_violation_email(
                    to_email=user.email,
                    violation=violation,
                    asset=asset,
                    org=org,
                )

                # Create email alert record
                alert = Alert(
                    org_id=violation.org_id,
                    violation_id=violation.id,
                    alert_type="email",
                    recipient=user.email,
                    metadata_json={
                        "severity": violation.severity,
                        "confidence_score": violation.confidence_score,
                        "asset_name": asset.name if asset else "Unknown",
                    },
                )
                session.add(alert)
        except Exception as e:
            print(f"Email alert error: {e}")

        # Emit WebSocket event
        try:
            from app.websocket.manager import emit_event
            emit_event(
                str(violation.org_id),
                "new_violation",
                {
                    "id": str(violation.id),
                    "asset_id": str(violation.asset_id),
                    "asset_name": asset.name if asset else "Unknown",
                    "detected_url": violation.detected_url,
                    "platform": violation.platform,
                    "confidence_score": violation.confidence_score,
                    "severity": violation.severity,
                    "thumbnail_url": violation.thumbnail_url,
                    "detected_at": violation.detected_at.isoformat() if violation.detected_at else None,
                },
            )

            # Create WebSocket alert record
            ws_alert = Alert(
                org_id=violation.org_id,
                violation_id=violation.id,
                alert_type="websocket",
                metadata_json={
                    "severity": violation.severity,
                    "confidence_score": violation.confidence_score,
                },
            )
            session.add(ws_alert)
        except Exception as e:
            print(f"WebSocket alert error: {e}")

        session.commit()
        print(f"Alerts sent for violation {violation_id}")

    except Exception as e:
        session.rollback()
        print(f"Alert task error: {e}")
    finally:
        session.close()
