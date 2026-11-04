/**
 * GPS Tracking Service using Browser Geolocation API
 */
import { calculateHaversineDistance } from '../utils/calculations';

class GpsTracker {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.isPaused = false;
    this.route = []; // Array of [lat, lng]
    this.totalDistanceKm = 0;
    this.lastPosition = null;
    this.onLocationUpdate = null;
    this.onError = null;
    this.onStatusChange = null;
  }

  isSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Start tracking GPS route
   */
  start({ onLocationUpdate, onError, onStatusChange }) {
    if (!this.isSupported()) {
      if (onError) onError(new Error('Geolocation is not supported by your browser.'));
      return false;
    }

    this.onLocationUpdate = onLocationUpdate;
    this.onError = onError;
    this.onStatusChange = onStatusChange;

    this.route = [];
    this.totalDistanceKm = 0;
    this.lastPosition = null;
    this.isTracking = true;
    this.isPaused = false;

    if (this.onStatusChange) this.onStatusChange('tracking');

    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleSuccess(position),
      (error) => this.handleError(error),
      options
    );

    return true;
  }

  handleSuccess(position) {
    if (!this.isTracking || this.isPaused) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Filter out wildly inaccurate readings (> 80 meters)
    if (accuracy > 80 && this.route.length > 0) {
      return;
    }

    const newCoord = [lat, lng];

    if (this.lastPosition) {
      const stepDist = calculateHaversineDistance(
        this.lastPosition[0],
        this.lastPosition[1],
        lat,
        lng
      );

      // Only accumulate if moved at least 3 meters (0.003 km) to reduce stationary GPS jitter
      if (stepDist >= 0.003) {
        this.totalDistanceKm += stepDist;
        this.route.push(newCoord);
        this.lastPosition = newCoord;
      }
    } else {
      this.route.push(newCoord);
      this.lastPosition = newCoord;
    }

    if (this.onLocationUpdate) {
      this.onLocationUpdate({
        currentLocation: newCoord,
        route: [...this.route],
        distanceKm: parseFloat(this.totalDistanceKm.toFixed(3)),
        accuracy: Math.round(accuracy)
      });
    }
  }

  handleError(error) {
    let friendlyMessage = 'An unknown GPS error occurred.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        friendlyMessage = 'Location permission was denied. Please allow location access in your browser settings or use manual run entry.';
        break;
      case error.POSITION_UNAVAILABLE:
        friendlyMessage = 'Location information is currently unavailable. Check your device GPS signal.';
        break;
      case error.TIMEOUT:
        friendlyMessage = 'Location request timed out. Trying to acquire GPS lock...';
        break;
    }

    if (this.onError) {
      this.onError({ code: error.code, message: friendlyMessage });
    }
  }

  pause() {
    if (!this.isTracking || this.isPaused) return;
    this.isPaused = true;
    if (this.onStatusChange) this.onStatusChange('paused');
  }

  resume() {
    if (!this.isTracking || !this.isPaused) return;
    this.isPaused = false;
    if (this.onStatusChange) this.onStatusChange('tracking');
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.isPaused = false;
    if (this.onStatusChange) this.onStatusChange('stopped');

    return {
      route: [...this.route],
      distanceKm: parseFloat(this.totalDistanceKm.toFixed(2))
    };
  }
}

export const gpsTracker = new GpsTracker();
