from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import ENUM

class User(db.Model):
    """User model for authentication and profile management"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    credits = db.Column(db.Integer, default=1, nullable=False)
    spots_shared = db.Column(db.Integer, default=0, nullable=False)
    credits_earned = db.Column(db.Integer, default=0, nullable=False)
    spots_found = db.Column(db.Integer, default=0, nullable=False)
    reputation = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    submitted_spots = db.relationship(
        'ParkingSpot', 
        backref='submitter', 
        lazy=True,
        foreign_keys='ParkingSpot.submitter_id'
    )
    
    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'credits': self.credits,
            'spots_shared': self.spots_shared,
            'credits_earned': self.credits_earned,
            'spots_found': self.spots_found,
            'reputation': self.reputation,
            'created_at': self.created_at.isoformat(),
        }

# Create ENUM type for spot status
spot_status_enum = ENUM('new', 'disabled', 'chosen', 'occupied', name='spot_status')

class ParkingSpot(db.Model):
    """Parking spot model with PostGIS geometry support"""
    __tablename__ = 'parking_spots'
    
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(Geometry('POINT', srid=4326), nullable=False)
    submitter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(spot_status_enum, default='new', nullable=False)
    reports = db.Column(db.Integer, default=0, nullable=False)
    chosen_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert parking spot to dictionary"""
        from sqlalchemy import func
        lat_lng = db.session.query(
            func.ST_Y(self.location).label('lat'),
            func.ST_X(self.location).label('lng')
        ).filter(ParkingSpot.id == self.id).first()
        
        return {
            'id': self.id,
            'latitude': float(lat_lng.lat),
            'longitude': float(lat_lng.lng),
            'submitter_id': self.submitter_id,
            'timestamp': self.timestamp.isoformat(),
            'status': self.status,
            'reports': self.reports,
            'submitter_username': self.submitter.username if self.submitter else None
        }