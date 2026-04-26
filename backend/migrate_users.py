import asyncio
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def run():
    async with AsyncSessionLocal() as db:
        demo = await db.execute(select(User).where(User.email == 'demo@sportshield.ai'))
        demo_user = demo.scalar_one_or_none()
        if demo_user:
            await db.execute(update(User).values(org_id=demo_user.org_id, role='admin'))
            await db.commit()
            print('All users migrated to Demo Org.')
        else:
            print('Demo user not found.')

asyncio.run(run())
