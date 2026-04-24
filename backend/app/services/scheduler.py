from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.push_service import send_push_to_all

scheduler = AsyncIOScheduler()


def setup_scheduler() -> None:
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=7, minute=30),
        args=["Breakfast time! 🍳", "Good morning! Check today's meal plan"],
    )
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=12, minute=0),
        args=["Lunch time! 🥗", "Time for lunch — see what's planned"],
    )
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=18, minute=0),
        args=["Dinner time! 🍽️", "Dinner time — check your meal plan"],
    )
    scheduler.add_job(
        send_push_to_all,
        CronTrigger(hour=20, minute=0),
        args=["Track progress 📊", "Don't forget to log today's progress"],
    )
    scheduler.start()
