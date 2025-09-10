from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from models import User, ParkingSpot
from services.spot_manager import SpotManager
from sqlalchemy import func
from geoalchemy2.types import Geography

api_bp = Blueprint('api', __name__)
spot_manager = SpotManager()

# Authentication routes
@api_bp.route('/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Parking spot routes
@api_bp.route('/spots', methods=['GET'])
@jwt_required()
def get_spots():
    """Get available parking spots with pagination. Filters by a radius and orders by proximity to the user if location is provided."""
    try:
        user_latitude = request.args.get('user_latitude', None, type=float)
        user_longitude = request.args.get('user_longitude', None, type=float)
        radius = request.args.get('radius', None, type=float)  # Radius in meters

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        
        # Base query for available spots
        query = ParkingSpot.query.filter_by(status='new')

        # If user location is provided, apply ordering and optional radius filter
        if user_latitude is not None and user_longitude is not None:
            
            # Create a point geometry for the user's location
            user_point = func.ST_SetSRID(func.ST_MakePoint(user_longitude, user_latitude), 4326)
            
            # If a radius is specified, filter spots within that radius
            if radius is not None:
                query = query.filter(func.ST_DWithin(ParkingSpot.location, user_point, radius))
            
            # Order the results by distance from the user's location
            query = query.order_by(func.ST_Distance(ParkingSpot.location, user_point))
        
        # Paginate the final query
        spots = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'spots': [spot.to_dict() for spot in spots.items],
            'pagination': {
                'page': spots.page,
                'pages': spots.pages,
                'per_page': spots.per_page,
                'total': spots.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/spots', methods=['POST'])
@jwt_required()
def submit_spot():
    """Submit a new parking spot"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        user_latitude = data.get('user_latitude')
        user_longitude = data.get('user_longitude')
        
        if not all([latitude, longitude, user_latitude, user_longitude]):
            return jsonify({'error': 'Missing location data'}), 400
        
        # Validate GPS proximity using SpotManager
        if not spot_manager.validate_gps_proximity(
            (latitude, longitude), (user_latitude, user_longitude)
        ):
            return jsonify({'error': 'Spot location too far from user location'}), 400
        
        # Create new parking spot
        spot = ParkingSpot(
            location=func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
            submitter_id=user_id
        )
        
        db.session.add(spot)
        
        # Update user stats
        user = User.query.get(user_id)
        user.spots_shared += 1
        user.credits_earned += 1
        user.credits += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Parking spot submitted successfully',
            'spot': spot.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/spots/<int:spot_id>/choose', methods=['POST'])
@jwt_required()
def choose_spot(spot_id):
    """Choose a parking spot (costs 1 credit)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.credits < 1:
            return jsonify({'error': 'Insufficient credits'}), 400
        
        spot = ParkingSpot.query.get_or_404(spot_id)
        
        if spot.status != 'new':
            return jsonify({'error': 'Spot not available'}), 400
        
        # Update spot and user
        spot.status = 'chosen'
        spot.chosen_by = user_id
        user.credits -= 1
        user.spots_found += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Spot chosen successfully',
            'spot': spot.to_dict(),
            'remaining_credits': user.credits
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/spots/<int:spot_id>/occupy', methods=['POST'])
@jwt_required()
def occupy_spot(spot_id):
    """Mark a spot as occupied"""
    try:
        spot = ParkingSpot.query.get_or_404(spot_id)
        spot.status = 'occupied'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Spot marked as occupied',
            'spot': spot.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/spots/<int:spot_id>/report', methods=['POST'])
@jwt_required()
def report_spot(spot_id):
    """Report a parking spot"""
    try:
        spot = ParkingSpot.query.get_or_404(spot_id)
        spot.reports += 1
        
        # If reports reach 3, disable spot and penalize submitter
        if spot.reports >= 3:
            spot.status = 'disabled'
            submitter = User.query.get(spot.submitter_id)
            if submitter and submitter.credits > 0:
                submitter.credits -= 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Spot reported successfully',
            'spot': spot.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile and statistics"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check"""    
    return jsonify({
        'status': 'ok',
    }), 200
        
    