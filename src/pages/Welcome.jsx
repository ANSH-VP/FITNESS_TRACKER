import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  ScanBarcode,
  Dumbbell,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      {/* Top Navigation */}
      <header className="welcome-header">
        <div className="welcome-container welcome-nav-content">
          <div className="brand-logo-wrap">
            <div className="brand-icon">
              <Zap size={22} className="text-emerald-400" />
            </div>
            <div className="brand-text">
              <span className="brand-name">FitTrack</span>
              <span className="brand-sub">FITNESS COMPANION</span>
            </div>
          </div>

          <div className="welcome-nav-actions">
            {user ? (
              <button
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
                className="btn btn-primary"
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="welcome-container hero-grid">
          <div className="hero-content">
            <div className="hero-pill">
              <Sparkles size={14} className="text-emerald-400" />
              <span>University Project • React & Vite Powered</span>
            </div>

            <h1 className="hero-title">
              Your Fitness. <br />
              <span className="text-gradient">Your Progress.</span> <br />
              Your Journey.
            </h1>

            <p className="hero-description">
              Track your runs with real-time GPS maps, scan foods using Open Food Facts, record strength workouts, and achieve your health goals with FitTrack.
            </p>

            <div className="hero-cta-group">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Tracking Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Demo Accounts Sign In
              </Link>
            </div>

            {/* Quick Demo Credentials Box */}
            <div className="demo-credentials-banner">
              <div className="demo-creds-title">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Pre-configured University Review Accounts</span>
              </div>
              <div className="demo-creds-row">
                <div className="demo-cred-item">
                  <span className="cred-badge">User:</span>
                  <code>demo@fittrack.app</code> / <code>Fittrack123</code>
                </div>
                <div className="demo-cred-item">
                  <span className="cred-badge admin-cred-badge">Admin:</span>
                  <code>admin@fittrack.app</code> / <code>Admin12345</code>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Feature Visual Preview */}
          <div className="hero-preview-col">
            <div className="hero-stats-card-floating card-1">
              <Flame size={24} className="text-emerald-400" />
              <div>
                <span className="floating-stat-num">5.20 km</span>
                <span className="floating-stat-label">Morning University Loop</span>
              </div>
            </div>

            <div className="hero-preview-device">
              <div className="device-screen">
                <div className="device-header">
                  <span className="device-dot"></span>
                  <span className="device-title">FITTRACK LIVE HUD</span>
                  <span className="device-badge">GPS ON</span>
                </div>
                <div className="device-stats-grid">
                  <div className="device-stat">
                    <span className="ds-label">DISTANCE</span>
                    <span className="ds-value">6.42 <small>km</small></span>
                  </div>
                  <div className="device-stat">
                    <span className="ds-label">PACE</span>
                    <span className="ds-value">5:24 <small>/km</small></span>
                  </div>
                  <div className="device-stat">
                    <span className="ds-label">TIME</span>
                    <span className="ds-value">34:48</span>
                  </div>
                  <div className="device-stat">
                    <span className="ds-label">CALORIES</span>
                    <span className="ds-value">468 <small>kcal</small></span>
                  </div>
                </div>
                <div className="device-map-graphic">
                  <div className="map-route-line"></div>
                  <div className="map-user-pin">
                    <div className="pin-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-stats-card-floating card-2">
              <ScanBarcode size={24} className="text-cyan-400" />
              <div>
                <span className="floating-stat-num">Open Food Facts</span>
                <span className="floating-stat-label">Live Nutri-Scanner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="welcome-features">
        <div className="welcome-container">
          <div className="section-header text-center">
            <span className="section-pill">EVERYTHING YOU NEED</span>
            <h2 className="section-title">Built For Peak Athletic Performance</h2>
            <p className="section-subtitle">
              Engineered with clean JavaScript, local data isolation, OpenStreetMap, and rich fitness analytics.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap icon-emerald">
                <MapPin size={26} />
              </div>
              <h3 className="feature-title">GPS Route Tracking</h3>
              <p className="feature-desc">
                Record real runs using the browser Geolocation API and visualize your exact route live on interactive OpenStreetMap tiles with Leaflet.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={15} /> Real-time Haversine distance</li>
                <li><CheckCircle2 size={15} /> Live pace (min/km) & calories</li>
                <li><CheckCircle2 size={15} /> Desktop manual run entry fallback</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap icon-cyan">
                <ScanBarcode size={26} />
              </div>
              <h3 className="feature-title">Barcode & Food Scanner</h3>
              <p className="feature-desc">
                Scan grocery barcodes or search over 2 million food items directly from the global Open Food Facts API with instant macro breakdowns.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={15} /> Live camera barcode scanning</li>
                <li><CheckCircle2 size={15} /> Automatic calorie & macro scaling</li>
                <li><CheckCircle2 size={15} /> Offline fallback food database</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap icon-amber">
                <Dumbbell size={26} />
              </div>
              <h3 className="feature-title">Workout & Exercise Logger</h3>
              <p className="feature-desc">
                Log strength training sets, repetitions, weights, cardio sessions, and custom exercises with precise calorie estimates.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={15} /> Built-in exercise library</li>
                <li><CheckCircle2 size={15} /> Multi-set & resistance tracking</li>
                <li><CheckCircle2 size={15} /> Category breakdown analysis</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap icon-purple">
                <TrendingUp size={26} />
              </div>
              <h3 className="feature-title">Progress & Goals HUD</h3>
              <p className="feature-desc">
                Monitor your body weight evolution, calculate BMI with healthcare guidance, and set customized fitness milestones.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={15} /> Interactive Recharts progress graphs</li>
                <li><CheckCircle2 size={15} /> Target weight & pace milestones</li>
                <li><CheckCircle2 size={15} /> Weekly volume & distance summaries</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap icon-rose">
                <ShieldCheck size={26} />
              </div>
              <h3 className="feature-title">User Data Isolation</h3>
              <p className="feature-desc">
                Every registered user maintains an isolated data sandbox in LocalStorage. Switching accounts never leaks previous user records.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={15} /> SessionStorage session safety</li>
                <li><CheckCircle2 size={15} /> Clean user logout transitions</li>
                <li><CheckCircle2 size={15} /> Zero shared record pollution</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap icon-indigo">
                <Users size={26} />
              </div>
              <h3 className="feature-title">Admin Management Console</h3>
              <p className="feature-desc">
                Dedicated administration portal to monitor application-wide statistics, inspect registered athletes, and manage platform activity.
              </p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={15} /> System-wide activity logs</li>
                <li><CheckCircle2 size={15} /> User profile inspections</li>
                <li><CheckCircle2 size={15} /> Cascading account cleanup</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="welcome-container footer-content">
          <div className="footer-brand">
            <span className="brand-name">FitTrack</span>
            <p>Your Personal Fitness Companion • University Academic Project</p>
          </div>
          <div className="footer-meta">
            <span>Built with React 19, Vite, Leaflet, Open Food Facts & LocalStorage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
