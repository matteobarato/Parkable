from shapely.geometry import Point
from shapely.ops import transform
import pyproj
from functools import partial

class SpotManager:
    """Business logic for parking spot management"""
    
    def __init__(self):
        # WGS84 to Web Mercator projection for distance calculations
        self.wgs84 = pyproj.CRS('EPSG:4326')
        self.web_mercator = pyproj.CRS('EPSG:3857')
        
    def validate_gps_proximity(self, spot_coords, user_coords, max_distance_meters=50):
        """
        Validate that the parking spot is within 50 meters of user's location
        
        Args:
            spot_coords: (latitude, longitude) of the parking spot
            user_coords: (latitude, longitude) of the user
            max_distance_meters: Maximum allowed distance in meters
            
        Returns:
            bool: True if spot is within allowed distance, False otherwise
        """
        try:
            # Create Point objects
            spot_point = Point(spot_coords[1], spot_coords[0])  # lon, lat
            user_point = Point(user_coords[1], user_coords[0])  # lon, lat
            
            # Transform to Web Mercator for accurate distance calculation
            project = pyproj.Transformer.from_crs(self.wgs84, self.web_mercator, always_xy=True).transform
            
            spot_projected = transform(project, spot_point)
            user_projected = transform(project, user_point)
            
            # Calculate distance in meters
            distance = spot_projected.distance(user_projected)
            
            return distance <= max_distance_meters
            
        except Exception as e:
            print(f"Error validating GPS proximity: {e}")
            return False
    
    def calculate_reputation(self, user):
        """
        Calculate user reputation based on spots shared, accuracy, etc.
        
        Args:
            user: User object
            
        Returns:
            float: Updated reputation score
        """
        try:
            # Simple reputation calculation
            # Base score from spots shared
            base_score = user.spots_shared * 10
            
            # Bonus for spots found (shows active usage)
            usage_bonus = user.spots_found * 2
            
            # Calculate accuracy (spots not reported vs spots shared)
            if user.spots_shared > 0:
                # This would require a more complex query to get reported spots
                # For now, use a simple calculation
                accuracy_score = max(0, user.spots_shared * 5)
            else:
                accuracy_score = 0
            
            total_reputation = base_score + usage_bonus + accuracy_score
            return round(total_reputation, 2)
            
        except Exception as e:
            print(f"Error calculating reputation: {e}")
            return 0.0