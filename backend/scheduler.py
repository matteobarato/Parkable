from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from app import create_app, db
from models import ParkingSpot
import atexit

def cleanup_old_spots():
    """Background job to clean up old parking spots"""
    app = create_app()
    
    with app.app_context():
        try:
            # Remove spots older than 2 hours
            cutoff_time = datetime.utcnow() - timedelta(hours=2)
            
            old_spots = ParkingSpot.query.filter(
                ParkingSpot.timestamp < cutoff_time,
                ParkingSpot.status.in_(['new', 'chosen'])
            ).all()
            
            for spot in old_spots:
                spot.status = 'occupied'  # Mark as occupied instead of deleting
            
            db.session.commit()
            print(f"Updated {len(old_spots)} old spots to occupied status")
            
        except Exception as e:
            print(f"Error in cleanup job: {e}")
            db.session.rollback()

def start_scheduler():
    """Start the background scheduler"""
    scheduler = BlockingScheduler()
    
    # Run cleanup every 30 minutes
    scheduler.add_job(
        func=cleanup_old_spots,
        trigger=IntervalTrigger(minutes=30),
        id='cleanup_spots',
        name='Cleanup old parking spots',
        replace_existing=True
    )
    
    # Register cleanup function to run on exit
    atexit.register(lambda: scheduler.shutdown())
    
    try:
        scheduler.start()
    except KeyboardInterrupt:
        print("Scheduler stopped.")
        scheduler.shutdown()

if __name__ == '__main__':
    start_scheduler()