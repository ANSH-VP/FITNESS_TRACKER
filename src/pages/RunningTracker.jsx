import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Play,
  Pause,
  Square,
  Save,
  RotateCcw,
  PlusCircle,
  MapPin,
  Clock,
  Zap,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getRuns, saveRun, deleteRun } from '../services/storageService';
import {
  calculateHaversineDistance,
  calculatePace,
  estimateRunningCalories,
  formatDuration,
  getLocalDateString,
  formatFriendlyDate
} from '../utils/calculations';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

// Leaflet custom pulsing marker icon
const userPinIcon = L.divIcon({
  className: 'custom-leaflet-pin',
  html: `<div class="gps-pulse-outer"><div class="gps-pulse-inner"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function RunningTracker() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // GPS tracking state
  const [trackingState, setTrackingState] = useState('idle'); // 'idle' | 'tracking' | 'paused' | 'summary'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Manual run entry modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    title: 'Outdoor Run',
    distance: '',
    durationMinutes: '',
    durationSeconds: '',
    date: getLocalDateString(new Date()),
    notes: ''
  });

  // Summary / Save Run state
  const [runTitle, setRunTitle] = useState('Morning Fitness Run');
  const [runNotes, setRunNotes] = useState('');

  // Run history list
  const [runsHistory, setRunsHistory] = useState([]);

  // Refs for tracking timer and Leaflet instance
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastCoordRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);

  // Load user runs on mount
  useEffect(() => {
    if (user?.id) {
      setRunsHistory(getRuns(user.id));
    }
  }, [user]);

  // Clean up timer and GPS on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize or re-render map container
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      // Default initial view (San Francisco or current location)
      const defaultCenter = routeCoordinates.length > 0
        ? routeCoordinates[routeCoordinates.length - 1]
        : [37.7749, -122.4194];

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Create polyline layer
      const polyline = L.polyline([], {
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(map);

      polylineRef.current = polyline;
      mapInstanceRef.current = map;

      // Invalidate size to ensure proper rendering inside flex containers
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  }, []);

  // Update map polyline and marker whenever route changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (routeCoordinates.length > 0) {
      const currentPos = routeCoordinates[routeCoordinates.length - 1];

      // Update or create marker
      if (!markerRef.current) {
        markerRef.current = L.marker(currentPos, { icon: userPinIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng(currentPos);
      }

      // Update polyline
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(routeCoordinates);
      }

      // Pan to user location smoothly
      map.panTo(currentPos, { animate: true });
    }
  }, [routeCoordinates]);

  // Timer tick effect
  useEffect(() => {
    if (trackingState === 'tracking') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trackingState]);

  // START RUN
  const handleStartRun = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser. Please record your run manually below.');
      showToast('Geolocation is not supported on this browser.', 'warning');
      return;
    }

    setGpsError(null);
    setTrackingState('tracking');
    setElapsedSeconds(0);
    setDistanceKm(0);
    setRouteCoordinates([]);
    lastCoordRef.current = null;

    if (polylineRef.current) polylineRef.current.setLatLngs([]);
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(Math.round(accuracy));

        // Skip excessive jitter (> 80m accuracy)
        if (accuracy > 80 && lastCoordRef.current) return;

        const newPos = [latitude, longitude];

        if (lastCoordRef.current) {
          const stepDist = calculateHaversineDistance(
            lastCoordRef.current[0],
            lastCoordRef.current[1],
            latitude,
            longitude
          );

          // Threshold: user moved at least 3 meters (0.003 km)
          if (stepDist >= 0.003) {
            setDistanceKm((prev) => parseFloat((prev + stepDist).toFixed(3)));
            setRouteCoordinates((prev) => [...prev, newPos]);
            lastCoordRef.current = newPos;
          }
        } else {
          setRouteCoordinates([newPos]);
          lastCoordRef.current = newPos;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(newPos, 16);
          }
        }
      },
      (error) => {
        let errorMsg = 'GPS acquisition error.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. You can record your run using the Manual Entry button.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS signal unavailable. Ensure location is enabled on your device.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Acquiring GPS satellite fix...';
        }
        setGpsError(errorMsg);
        showToast(errorMsg, 'warning');
      },
      options
    );

    showToast('GPS Run started! Move to record your route.', 'info');
  };

  // PAUSE RUN
  const handlePauseRun = () => {
    setTrackingState('paused');
    showToast('Run paused.', 'info');
  };

  // RESUME RUN
  const handleResumeRun = () => {
    setTrackingState('tracking');
    showToast('Run resumed.', 'info');
  };

  // END RUN
  const handleEndRun = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingState('summary');
    setRunTitle(`Outdoor Run - ${formatFriendlyDate(getLocalDateString(new Date()))}`);
  };

  // DISCARD CURRENT RUN
  const handleDiscardRun = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingState('idle');
    setElapsedSeconds(0);
    setDistanceKm(0);
    setRouteCoordinates([]);
    setGpsError(null);
    lastCoordRef.current = null;
    showToast('Run session discarded.', 'info');
  };

  // SAVE RUN TO LOCAL STORAGE
  const handleSaveRun = () => {
    const userWeight = user?.weight || 70;
    const finalCalories = estimateRunningCalories(userWeight, distanceKm, elapsedSeconds);
    const finalPace = calculatePace(elapsedSeconds, distanceKm);

    const saved = saveRun(user.id, {
      title: runTitle || 'Outdoor GPS Run',
      distance: distanceKm,
      duration: elapsedSeconds,
      pace: finalPace,
      calories: finalCalories,
      date: getLocalDateString(new Date()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'GPS Route',
      route: routeCoordinates,
      notes: runNotes
    });

    setRunsHistory(getRuns(user.id));
    setTrackingState('idle');
    setElapsedSeconds(0);
    setDistanceKm(0);
    setRouteCoordinates([]);
    lastCoordRef.current = null;
    showToast(`Run of ${distanceKm} km saved to your fitness profile!`, 'success');
  };

  // MANUAL RUN ENTRY
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const dist = parseFloat(manualForm.distance);
    const mins = parseInt(manualForm.durationMinutes, 10) || 0;
    const secs = parseInt(manualForm.durationSeconds, 10) || 0;
    const totalSecs = mins * 60 + secs;

    if (isNaN(dist) || dist <= 0) {
      showToast('Please enter a valid running distance.', 'error');
      return;
    }
    if (totalSecs <= 0) {
      showToast('Please enter a valid running duration.', 'error');
      return;
    }

    const userWeight = user?.weight || 70;
    const cals = estimateRunningCalories(userWeight, dist, totalSecs);
    const pace = calculatePace(totalSecs, dist);

    saveRun(user.id, {
      title: manualForm.title || 'Manual Run Entry',
      distance: dist,
      duration: totalSecs,
      pace,
      calories: cals,
      date: manualForm.date || getLocalDateString(new Date()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Manual Entry',
      route: [],
      notes: manualForm.notes
    });

    setRunsHistory(getRuns(user.id));
    setManualModalOpen(false);
    setManualForm({
      title: 'Outdoor Run',
      distance: '',
      durationMinutes: '',
      durationSeconds: '',
      date: getLocalDateString(new Date()),
      notes: ''
    });
    showToast(`Manual run of ${dist} km logged successfully!`, 'success');
  };

  // DELETE RUN
  const handleDeleteRun = (runId) => {
    if (window.confirm('Are you sure you want to delete this running record?')) {
      deleteRun(user.id, runId);
      setRunsHistory(getRuns(user.id));
      showToast('Running record deleted.', 'info');
    }
  };

  // Calculated live metrics
  const currentPace = calculatePace(elapsedSeconds, distanceKm);
  const currentCalories = estimateRunningCalories(user?.weight || 70, distanceKm, elapsedSeconds);

  return (
    <div className="running-tracker-page">
      {/* HUD Header */}
      <div className="running-hud-card">
        <div className="hud-top-bar">
          <div className="hud-status-indicator">
            <span className={`status-dot dot-${trackingState}`}></span>
            <span className="status-label">
              {trackingState === 'idle' && 'READY TO RUN'}
              {trackingState === 'tracking' && 'GPS TRACKING ACTIVE'}
              {trackingState === 'paused' && 'RUN PAUSED'}
              {trackingState === 'summary' && 'RUN COMPLETED'}
            </span>
          </div>

          <div className="hud-meta-tags">
            {gpsAccuracy !== null && (
              <span className="hud-gps-pill">
                <Compass size={14} className="text-emerald-400" />
                <span>Accuracy: ±{gpsAccuracy}m</span>
              </span>
            )}
            {trackingState === 'idle' && (
              <button
                onClick={() => setManualModalOpen(true)}
                className="btn btn-secondary btn-sm"
              >
                <PlusCircle size={15} />
                <span>Manual Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Live Metrics Display */}
        <div className="hud-metrics-grid">
          <div className="hud-metric-box">
            <span className="hud-metric-label">DISTANCE</span>
            <div className="hud-metric-value-wrap">
              <span className="hud-metric-num">{distanceKm.toFixed(2)}</span>
              <span className="hud-metric-unit">km</span>
            </div>
          </div>

          <div className="hud-metric-box">
            <span className="hud-metric-label">DURATION</span>
            <div className="hud-metric-value-wrap">
              <span className="hud-metric-num">{formatDuration(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="hud-metric-box">
            <span className="hud-metric-label">CURRENT PACE</span>
            <div className="hud-metric-value-wrap">
              <span className="hud-metric-num text-cyan-400">{currentPace}</span>
            </div>
          </div>

          <div className="hud-metric-box">
            <span className="hud-metric-label">CALORIES</span>
            <div className="hud-metric-value-wrap">
              <span className="hud-metric-num text-amber-400">{currentCalories}</span>
              <span className="hud-metric-unit">kcal</span>
            </div>
          </div>
        </div>

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="gps-error-banner">
            <AlertTriangle size={18} />
            <div className="gps-error-content">
              <strong>GPS Notice:</strong> {gpsError}
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="hud-controls-row">
          {trackingState === 'idle' && (
            <button onClick={handleStartRun} className="btn btn-primary btn-lg btn-hud-start">
              <Play size={20} fill="currentColor" />
              <span>Start GPS Run</span>
            </button>
          )}

          {trackingState === 'tracking' && (
            <>
              <button onClick={handlePauseRun} className="btn btn-warning btn-lg">
                <Pause size={20} />
                <span>Pause</span>
              </button>
              <button onClick={handleEndRun} className="btn btn-danger btn-lg">
                <Square size={20} />
                <span>End Run</span>
              </button>
            </>
          )}

          {trackingState === 'paused' && (
            <>
              <button onClick={handleResumeRun} className="btn btn-primary btn-lg">
                <Play size={20} fill="currentColor" />
                <span>Resume</span>
              </button>
              <button onClick={handleEndRun} className="btn btn-danger btn-lg">
                <Square size={20} />
                <span>Finish & Save</span>
              </button>
            </>
          )}

          {trackingState === 'summary' && (
            <div className="summary-actions-wrap">
              <div className="summary-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Run Title (e.g. Campus Morning Loop)"
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Notes (optional): feeling, weather, pace target..."
                  value={runNotes}
                  onChange={(e) => setRunNotes(e.target.value)}
                />
              </div>
              <div className="summary-btn-group">
                <button onClick={handleSaveRun} className="btn btn-primary btn-lg">
                  <Save size={18} />
                  <span>Save Run Record</span>
                </button>
                <button onClick={handleDiscardRun} className="btn btn-secondary btn-lg">
                  <RotateCcw size={18} />
                  <span>Discard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaflet Route Map */}
      <div className="map-section-wrapper">
        <div className="map-header-bar">
          <span className="map-title flex items-center gap-2">
            <Navigation size={16} className="text-emerald-400" />
            <span>Interactive OpenStreetMap Route View</span>
          </span>
          <span className="map-note">Powered by Leaflet & OpenStreetMap</span>
        </div>
        <div id="leaflet-run-map" ref={mapRef} className="leaflet-map-container" />
      </div>

      {/* Run History List */}
      <div className="run-history-section">
        <div className="section-header">
          <h3 className="section-title">Saved Running Activities ({runsHistory.length})</h3>
          <p className="section-subtitle">Your personal outdoor GPS runs and recorded sessions</p>
        </div>

        {runsHistory.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No running activities recorded yet"
            description="Hit the 'Start GPS Run' button above or log your mileage manually to start building your running history."
            actionLabel="Start GPS Run"
            onAction={handleStartRun}
          />
        ) : (
          <div className="run-history-grid">
            {runsHistory.map((run) => (
              <div key={run.id} className="run-card">
                <div className="run-card-header">
                  <div>
                    <h4 className="run-card-title">{run.title || 'Outdoor Run'}</h4>
                    <span className="run-card-date">{formatFriendlyDate(run.date)} • {run.time || ''}</span>
                  </div>
                  <span className={`run-badge ${run.type === 'Manual Entry' ? 'badge-manual' : 'badge-gps'}`}>
                    {run.type || 'GPS Run'}
                  </span>
                </div>

                <div className="run-card-stats">
                  <div className="run-stat-item">
                    <span className="run-stat-num text-emerald-400">{run.distance} km</span>
                    <span className="run-stat-label">Distance</span>
                  </div>
                  <div className="run-stat-item">
                    <span className="run-stat-num">{formatDuration(run.duration)}</span>
                    <span className="run-stat-label">Time</span>
                  </div>
                  <div className="run-stat-item">
                    <span className="run-stat-num">{run.pace || '--:--'}</span>
                    <span className="run-stat-label">Avg Pace</span>
                  </div>
                  <div className="run-stat-item">
                    <span className="run-stat-num text-amber-400">{run.calories}</span>
                    <span className="run-stat-label">Calories</span>
                  </div>
                </div>

                {run.notes && (
                  <p className="run-card-notes">"{run.notes}"</p>
                )}

                <div className="run-card-footer">
                  <span className="text-xs text-slate-400">
                    {run.route?.length > 0 ? `${run.route.length} GPS checkpoints` : 'Logged manual entry'}
                  </span>
                  <button
                    onClick={() => handleDeleteRun(run.id)}
                    className="btn-icon-danger"
                    title="Delete running record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Run Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Record Manual Run Activity"
      >
        <form onSubmit={handleManualSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Activity Title</label>
            <input
              type="text"
              className="form-input"
              value={manualForm.title}
              onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
              placeholder="e.g. Park 5K Morning Run"
              required
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Distance (km) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="100"
                className="form-input"
                placeholder="5.00"
                value={manualForm.distance}
                onChange={(e) => setManualForm({ ...manualForm, distance: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Minutes *</label>
              <input
                type="number"
                min="0"
                max="600"
                className="form-input"
                placeholder="25"
                value={manualForm.durationMinutes}
                onChange={(e) => setManualForm({ ...manualForm, durationMinutes: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seconds</label>
              <input
                type="number"
                min="0"
                max="59"
                className="form-input"
                placeholder="30"
                value={manualForm.durationSeconds}
                onChange={(e) => setManualForm({ ...manualForm, durationSeconds: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Perceived Effort (Optional)</label>
            <textarea
              className="form-input form-textarea"
              rows="2"
              placeholder="Weather was brisk, felt steady throughout..."
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Run Record</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
