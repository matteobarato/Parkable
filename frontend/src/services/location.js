import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { ref, reactive } from 'vue';

/**
 * Ionic Location Service for Vue.js
 * Manages geolocation API with caching, permissions, and cross-platform support
 * Falls back to native browser APIs when Capacitor is not available
 */
export class LocationService {
  constructor(options = {}) {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
    this.watchId = null;
    this.isCapacitorAvailable = false;
    
    // Default options
    this.options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
      cacheTimeout: 300000, // 5 minutes default cache
      ...options
    };
    
    // Reactive state for Vue components
    this.state = reactive({
      isLoading: false,
      hasPermission: false,
      permissionStatus: 'prompt',
      lastError: null,
      isSupported: true,
      platform: this.detectPlatform()
    });

    // Reactive current location
    this.currentLocation = ref(null);

    this.initialize();
  }

  /**
   * Detect current platform
   */
  detectPlatform() {
    try {
      return Capacitor.getPlatform();
    } catch {
      return 'web';
    }
  }

  /**
   * Initialize the service and check platform support
   */
  async initialize() {
    try {
      this.state.platform = this.detectPlatform();
      this.isCapacitorAvailable = await this.checkCapacitorAvailability();
      this.state.isSupported = await this.checkPlatformSupport();
      
      if (this.state.isSupported) {
        await this.checkPermissions();
      }
    } catch (error) {
      this.handleError('Failed to initialize location service', error);
    }
  }

  /**
   * Check if Capacitor Geolocation is available
   */
  async checkCapacitorAvailability() {
    try {
      if (Capacitor.isNativePlatform()) {
        return true;
      }
      
      // Test if Capacitor geolocation is available on web
      await Geolocation.checkPermissions();
      return true;
    } catch (error) {
      // Capacitor geolocation not available, will use browser API
      return false;
    }
  }

  /**
   * Check if geolocation is supported on current platform
   */
  async checkPlatformSupport() {
    try {
      if (this.isCapacitorAvailable) {
        return true;
      } else {
        // Check browser geolocation support
        return 'geolocation' in navigator;
      }
    } catch {
      return false;
    }
  }

  /**
   * Check current permission status
   */
  async checkPermissions() {
    try {
      this.state.isLoading = true;
      
      if (this.isCapacitorAvailable) {
        // Use Capacitor API
        const permissions = await Geolocation.checkPermissions();
        this.state.permissionStatus = permissions.location;
        this.state.hasPermission = permissions.location === 'granted';
      } else {
        // Use browser API
        if (!navigator.geolocation) {
          this.state.hasPermission = false;
          this.state.permissionStatus = 'denied';
          return false;
        }
        
        // Check if permissions API is available
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            this.state.permissionStatus = permission.state;
            this.state.hasPermission = permission.state === 'granted';
            
            // Listen for permission changes
            permission.onchange = () => {
              this.state.permissionStatus = permission.state;
              this.state.hasPermission = permission.state === 'granted';
            };
          } catch (error) {
            // Some browsers don't support geolocation permission query
            this.state.permissionStatus = 'prompt';
            this.state.hasPermission = false;
          }
        } else {
          // Fallback: assume we need to request permission
          this.state.permissionStatus = 'prompt';
          this.state.hasPermission = false;
        }
      }
      
      return this.state.hasPermission;
    } catch (error) {
      this.handleError('Failed to check permissions', error);
      return false;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    try {
      this.state.isLoading = true;
      
      if (this.isCapacitorAvailable) {
        // Use Capacitor API
        const permissions = await Geolocation.requestPermissions();
        this.state.permissionStatus = permissions.location;
        this.state.hasPermission = permissions.location === 'granted';
        
        if (!this.state.hasPermission) {
          throw new Error(`Permission ${permissions.location}. Please enable location access in settings.`);
        }
      } else {
        // Use browser API - request permission by attempting to get location
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        // Try to get current position to trigger permission request
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.state.hasPermission = true;
              this.state.permissionStatus = 'granted';
              resolve(position);
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                this.state.hasPermission = false;
                this.state.permissionStatus = 'denied';
                reject(new Error('Location access denied by user'));
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                // Position unavailable doesn't mean permission denied
                this.state.hasPermission = true;
                this.state.permissionStatus = 'granted';
                reject(new Error('Location unavailable'));
              } else if (error.code === error.TIMEOUT) {
                // Timeout doesn't mean permission denied
                this.state.hasPermission = true;
                this.state.permissionStatus = 'granted';
                reject(new Error('Location request timed out'));
              } else {
                reject(error);
              }
            },
            { 
              timeout: 5000,
              enableHighAccuracy: false,
              maximumAge: Infinity 
            }
          );
        });
      }
      
      return this.state.hasPermission;
    } catch (error) {
      this.handleError('Failed to request permissions', error);
      return false;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Get current position with caching
   * @param {boolean} forceRefresh - Force new request ignoring cache
   * @returns {Object|null} Location data object or null
   */
  async getCurrentPosition(forceRefresh = false) {
    try {
      this.state.isLoading = true;
      this.state.lastError = null;

      // Check if we have valid cached location and don't need to force refresh
      if (!forceRefresh && this.isCacheValid()) {
        this.currentLocation.value = this.cachedLocation;
        return this.cachedLocation;
      }

      const positionOptions = {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: forceRefresh ? 0 : this.options.maximumAge
      };

      let position;
      
      if (this.isCapacitorAvailable) {
        // Use Capacitor API
        position = await Geolocation.getCurrentPosition(positionOptions);
      } else {
        // Use browser API
        position = await this.getBrowserPosition(positionOptions);
      }
      
      const locationData = this.formatLocationData(position);

      // Cache the location
      this.cacheLocation(locationData);
      this.currentLocation.value = locationData;
      
      return locationData;
    } catch (error) {
      this.handleError('Failed to get current position', error);
      return null;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Refresh current location (force new request)
   * @returns {Object|null} Location data object or null
   */
  async refreshLocation() {
    return this.getCurrentPosition(true);
  }

  /**
   * Start watching position changes
   * @param {Function} callback - Optional callback function for position updates
   * @returns {boolean} Success status
   */
  async startWatching(callback = null) {
    try {
      if (this.watchId) {
        await this.stopWatching();
      }

      // Check geolocation support
      if (!this.isCapacitorAvailable && !navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const positionOptions = {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge
      };

      if (this.isCapacitorAvailable) {
        // Use Capacitor API
        this.watchId = await Geolocation.watchPosition(positionOptions, (position, err) => {
          if (err) {
            this.handleError('Watch position error', err);
            return;
          }

          if (position) {
            const locationData = this.formatLocationData(position);
            this.cacheLocation(locationData);
            this.currentLocation.value = locationData;
            
            if (callback) {
              callback(locationData);
            }
          }
        });
      } else {
        // Use browser API
        this.watchId = navigator.geolocation.watchPosition(
          (position) => {
            // Update permission state on successful location
            this.state.hasPermission = true;
            this.state.permissionStatus = 'granted';
            
            const locationData = this.formatLocationData(position);
            this.cacheLocation(locationData);
            this.currentLocation.value = locationData;
            
            if (callback) {
              callback(locationData);
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              this.state.hasPermission = false;
              this.state.permissionStatus = 'denied';
            }
            this.handleError('Watch position error', error);
          },
          positionOptions
        );
      }

      return true;
    } catch (error) {
      this.handleError('Failed to start watching position', error);
      return false;
    }
  }

  /**
   * Stop watching position changes
   */
  async stopWatching() {
    if (this.watchId) {
      if (this.isCapacitorAvailable) {
        await Geolocation.clearWatch({ id: this.watchId });
      } else {
        navigator.geolocation.clearWatch(this.watchId);
      }
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two points in kilometers using Haversine formula
   * @param {number} lat1 - First point latitude
   * @param {number} lon1 - First point longitude
   * @param {number} lat2 - Second point latitude
   * @param {number} lon2 - Second point longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get distance from current location to a point
   * @param {number} latitude - Target latitude
   * @param {number} longitude - Target longitude
   * @returns {number|null} Distance in kilometers or null if location unavailable
   */
  async getDistanceToPoint(latitude, longitude) {
    const currentPos = await this.getCurrentPosition();
    if (!currentPos) {
      return null;
    }
    
    return this.calculateDistance(
      currentPos.latitude,
      currentPos.longitude,
      latitude,
      longitude
    );
  }

  /**
   * Check if user is within a certain radius of a point
   * @param {number} latitude - Target latitude
   * @param {number} longitude - Target longitude
   * @param {number} radiusKm - Radius in kilometers
   * @returns {boolean|null} True if within radius, null if location unavailable
   */
  async isWithinRadius(latitude, longitude, radiusKm) {
    const distance = await this.getDistanceToPoint(latitude, longitude);
    if (distance === null) {
      return null;
    }
    
    return distance <= radiusKm;
  }

  /**
   * Get cached location if available and valid
   * @returns {Object|null} Cached location data or null
   */
  getCachedLocation() {
    if (this.isCacheValid()) {
      return this.cachedLocation;
    }
    return null;
  }

  /**
   * Clear cached location
   */
  clearCache() {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Update service options
   * @param {Object} newOptions - New options to merge
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current service options
   * @returns {Object} Current options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Check if service is currently watching position
   * @returns {boolean} True if watching
   */
  isWatching() {
    return this.watchId !== null;
  }

  /**
   * Get current platform information
   * @returns {Object} Platform info
   */
  getPlatformInfo() {
    return {
      platform: this.state.platform,
      isNative: this.state.platform !== 'web',
      isSupported: this.state.isSupported,
      isCapacitorAvailable: this.isCapacitorAvailable,
      apiUsed: this.isCapacitorAvailable ? 'Capacitor' : 'Browser'
    };
  }

  /**
   * Get formatted location string
   * @param {Object} location - Location object (optional, uses current if not provided)
   * @param {number} precision - Decimal places for coordinates
   * @returns {string|null} Formatted location string
   */
  getFormattedLocation(location = null, precision = 6) {
    const loc = location || this.currentLocation.value;
    if (!loc) {
      return null;
    }
    
    return `${loc.latitude.toFixed(precision)}, ${loc.longitude.toFixed(precision)}`;
  }

  /**
   * Get current accuracy in meters
   * @returns {number|null} Accuracy in meters or null if no location
   */
  getCurrentAccuracy() {
    const location = this.currentLocation.value;
    return location ? location.accuracy : null;
  }

  /**
   * Check if current location has high accuracy
   * @param {number} threshold - Accuracy threshold in meters (default: 50)
   * @returns {boolean|null} True if high accuracy, null if no location
   */
  hasHighAccuracy(threshold = 50) {
    const accuracy = this.getCurrentAccuracy();
    return accuracy !== null ? accuracy <= threshold : null;
  }

  /**
   * Get location age in milliseconds
   * @returns {number|null} Age in milliseconds or null if no location
   */
  getLocationAge() {
    const location = this.currentLocation.value;
    return location ? Date.now() - location.timestamp : null;
  }

  /**
   * Check if current location is fresh
   * @param {number} maxAge - Maximum age in milliseconds (default: 60000 = 1 minute)
   * @returns {boolean|null} True if fresh, null if no location
   */
  isLocationFresh(maxAge = 60000) {
    const age = this.getLocationAge();
    return age !== null ? age <= maxAge : null;
  }

  /**
   * Dispose of the service and clean up resources
   */
  async dispose() {
    await this.stopWatching();
    this.clearCache();
    this.currentLocation.value = null;
  }

  // Private helper methods

  /**
   * Get position using browser geolocation API
   * @private
   * @param {Object} options - Position options
   * @returns {Promise<Position>} Position object
   */
  async getBrowserPosition(options) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Update permission state on successful location
          this.state.hasPermission = true;
          this.state.permissionStatus = 'granted';
          resolve(position);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            this.state.hasPermission = false;
            this.state.permissionStatus = 'denied';
          }
          reject(error);
        },
        options
      );
    });
  }

  /**
   * Format location data consistently across APIs
   * @private
   * @param {Position} position - Position object from geolocation API
   * @returns {Object} Formatted location data
   */
  formatLocationData(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp || Date.now()
    };
  }

  /**
   * Cache location data with timestamp
   * @private
   */
  cacheLocation(location) {
    this.cachedLocation = location;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Check if cached location is still valid
   * @private
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    if (!this.cachedLocation || !this.cacheTimestamp) {
      return false;
    }
    
    const cacheAge = Date.now() - this.cacheTimestamp;
    return cacheAge < (this.options.cacheTimeout || 300000);
  }

  /**
   * Convert degrees to radians
   * @private
   * @param {number} degrees - Degrees to convert
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Handle and log errors
   * @private
   * @param {string} message - Error message
   * @param {*} error - Error object
   */
  handleError(message, error) {
    const errorMessage = error?.message || error || message;
    this.state.lastError = errorMessage;
    console.error(`LocationService: ${message}`, error);
  }
}

// Export a singleton instance for easy use across the app
export const locationService = new LocationService();

/**
 * Vue composable for reactive location data
 * @param {Object} options - Service options
 * @returns {Object} Location service methods and reactive data
 */
export function useLocation(options = {}) {
  // Create service instance if custom options provided, otherwise use singleton
  const service = Object.keys(options).length > 0 ? new LocationService(options) : locationService;
  
  return {
    locationService: service,
    state: service.state,
    currentLocation: service.currentLocation,
    
    // Convenience methods
    async getCurrentPosition(forceRefresh = false) {
      return service.getCurrentPosition(forceRefresh);
    },
    
    async refreshLocation() {
      return service.refreshLocation();
    },
    
    async requestPermissions() {
      return service.requestPermissions();
    },
    
    async checkPermissions() {
      return service.checkPermissions();
    },
    
    async startWatching(callback = null) {
      return service.startWatching(callback);
    },
    
    async stopWatching() {
      return service.stopWatching();
    },
    
    async getDistanceToPoint(latitude, longitude) {
      return service.getDistanceToPoint(latitude, longitude);
    },
    
    async isWithinRadius(latitude, longitude, radiusKm) {
      return service.isWithinRadius(latitude, longitude, radiusKm);
    },
    
    calculateDistance(lat1, lon1, lat2, lon2) {
      return service.calculateDistance(lat1, lon1, lat2, lon2);
    },
    
    getCachedLocation() {
      return service.getCachedLocation();
    },
    
    clearCache() {
      service.clearCache();
    },
    
    getPlatformInfo() {
      return service.getPlatformInfo();
    },
    
    getFormattedLocation(location = null, precision = 6) {
      return service.getFormattedLocation(location, precision);
    },
    
    getCurrentAccuracy() {
      return service.getCurrentAccuracy();
    },
    
    hasHighAccuracy(threshold = 50) {
      return service.hasHighAccuracy(threshold);
    },
    
    getLocationAge() {
      return service.getLocationAge();
    },
    
    isLocationFresh(maxAge = 60000) {
      return service.isLocationFresh(maxAge);
    }
  };
}