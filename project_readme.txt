# Parking Spot Finder App

A mobile-first web application for finding and sharing parking spots with a gamified credit system.

## 🚀 Features

- **Real-time parking spot sharing** with interactive maps
- **GPS proximity validation** (50-meter radius)
- **Gamified credit system** - earn credits for sharing, spend to claim spots
- **User reputation system** based on activity and accuracy
- **Mobile-first responsive design** using Ionic framework
- **Background spot aging** automatically manages old spots
- **Secure JWT authentication** with user profiles

## 🛠 Technology Stack

### Backend
- **Python Flask** - Web framework
- **PostgreSQL + PostGIS** - Database with geospatial support
- **SQLAlchemy** - ORM for database operations
- **Shapely** - Geometry processing and GPS validation
- **JWT Extended** - Authentication tokens
- **APScheduler** - Background job scheduling

### Frontend
- **Vue.js 3** - JavaScript framework with Composition API
- **Ionic 6** - Mobile UI components
- **Leaflet.js** - Interactive maps
- **Pinia** - State management
- **Axios** - HTTP client

## 📁 Project Structure

```
parking-spot-finder/
├── backend/
│   ├── __init__.py
│   ├── app.py                 # Flask application factory
│   ├── config.py              # Configuration settings
│   ├── models.py              # Database models
│   ├── routes.py              # API endpoints
│   ├── scheduler.py           # Background job scheduler
│   ├── services/
│   │   ├── __init__.py
│   │   └── spot_manager.py    # Business logic
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Vue components
│   │   ├── views/             # Page components
│   │   ├── router/            # Route configuration
│   │   ├── services/          # API services
│   │   ├── stores/            # Pinia stores
│   │   └── main.js            # App entry point
│   ├── package.json           # Node dependencies
│   └── vue.config.js          # Vue CLI configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+ with PostGIS extension

### 1. Database Setup

```bash
# Install PostgreSQL and PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Create database
sudo -u postgres psql
CREATE DATABASE parking_spots_db;
\c parking_spots_db
CREATE EXTENSION postgis;

# Create user
CREATE USER parkinguser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE parking_spots_db TO parkinguser;
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Set environment variables
export SECRET_KEY="your-super-secret-key"
export JWT_SECRET_KEY="your-jwt-secret-key"
export DATABASE_URL="postgresql://parkinguser:your_password@localhost/parking_spots_db"

# Run the application
python app.py
```

### 3. Background Scheduler (separate terminal)

```bash
cd backend
source venv/bin/activate
python scheduler.py
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run serve
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Parking Spots
- `GET /api/spots` - Get available spots (paginated)
- `POST /api/spots` - Submit new parking spot
- `POST /api/spots/{id}/choose` - Choose a spot (costs 1 credit)
- `POST /api/spots/{id}/occupy` - Mark spot as occupied
- `POST /api/spots/{id}/report` - Report invalid spot

### User Profile
- `GET /api/user/profile` - Get user statistics

## 🎮 How It Works

### Credit System
- **Start with 1 credit** when you register
- **Earn 1 credit** for each spot you share
- **Spend 1 credit** to claim a spot
- **Lose 1 credit** if your shared spot gets 3+ reports

### Spot Lifecycle
1. **New** - Available for claiming
2. **Chosen** - Reserved by a user
3. **Occupied** - No longer available
4. **Disabled** - Reported as invalid

### GPS Validation
- Spots must be within 50 meters of user's location
- Uses Shapely geometry for accurate distance calculation
- Prevents fake spot submissions

## 🔒 Security Features

- JWT token authentication
- Password hashing with Werkzeug
- CORS protection
- Input validation and sanitization
- SQL injection protection via SQLAlchemy ORM

## 📱 Mobile Features

- **Responsive design** works on all devices
- **Geolocation services** for automatic positioning
- **Touch-friendly interface** with Ionic components
- **Offline-ready** (can be extended as PWA)

## 🛠 Development

### Backend Development
```bash
# Run in debug mode
python app.py

# Database migrations (manual)
# Modify models.py and restart app to recreate tables

# Test API endpoints
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password"}'
```

### Frontend Development
```bash
# Development server with hot reload
npm run serve

# Build for production
npm run build

# Lint and fix files
npm run lint
```

## 🚀 Production Deployment

### Backend Production
```bash
# Use production WSGI server
pip install gunicorn
gunicorn --bind 0.0.0.0:5000 app:app

# Environment variables
export FLASK_ENV=production
export SECRET_KEY="production-secret-key"
export DATABASE_URL="postgresql://user:pass@host/db"
```

### Database Optimization
```sql
-- Add spatial index for better performance
CREATE INDEX idx_parking_spots_location ON parking_spots USING GIST (location);
CREATE INDEX idx_parking_spots_status ON parking_spots (status);
CREATE INDEX idx_parking_spots_submitter ON parking_spots (submitter_id);
```

### Frontend Production
```bash
# Build optimized bundle
npm run build

# Serve from dist/ directory with nginx or similar
```

## 🐛 Troubleshooting

### Common Issues

1. **PostGIS not found**
   ```bash
   sudo apt-get install postgresql-12-postgis-3
   ```

2. **Location services not working**
   - Ensure HTTPS in production (required for geolocation)
   - Check browser permissions

3. **CORS errors**
   - Verify backend CORS configuration
   - Check API base URL in frontend

4. **Map not loading**
   - Check internet connection for tile loading
   - Verify Leaflet CSS import

## 🔮 Future Enhancements

- **Real-time updates** with WebSockets
- **Push notifications** for nearby spots
- **Photo verification** for spot submissions
- **Payment integration** for premium features
- **Advanced analytics** dashboard
- **Machine learning** for spot prediction
- **Native mobile app** with Ionic Capacitor

## 📄 License

This project is intended for educational and demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the troubleshooting section
- Review API documentation
- Examine browser console for errors
- Verify database connections and permissions