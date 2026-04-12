"""SportShield AI — Celery application initialization and beat schedule."""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "sportshield",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    # RedBeat settings
    redbeat_redis_url=settings.REDIS_URL,
    # Beat schedule — scan all assets every 30 minutes
    beat_schedule={
        "scan-all-assets": {
            "task": "app.tasks.scan_task.scan_all_assets",
            "schedule": 1800.0,  # 30 minutes
        },
        "demo-generate-violation": {
            "task": "app.tasks.demo_task.generate_demo_violation",
            "schedule": 60.0,  # Every 60 seconds for live demo
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(
    ["app.tasks.fingerprint_task", "app.tasks.scan_task", "app.tasks.alert_task", "app.tasks.demo_task"]
)
