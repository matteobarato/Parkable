-- Database initialization script
-- This runs when the PostgreSQL container first starts

-- Create the PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create indexes for better performance (will be created after tables exist)
-- These will be applied by the Flask app when models are created

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO parkinguser;
GRANT CREATE ON SCHEMA public TO parkinguser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO parkinguser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO parkinguser;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO parkinguser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO parkinguser;