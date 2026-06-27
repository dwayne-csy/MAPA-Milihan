// Mapa-Milihan/frontend/src/Components/User/CheckoutConfirmation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserHeader from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const CheckCircleIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const MapPinIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── Cache ──────────────────────────────────────────────────────────────
const geocodeCache = new Map();
let leafletLoaded = false;
let leafletLoading = false;
let userLocationCache = null;

// ── Helper ──────────────────────────────────────────────────────────────
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mpeg', '.ogg', '.3gpp', '.flv', '.wmv'];
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (videoExtensions.some(ext => url.toLowerCase().includes(ext))) return true;
  if (videoMimeTypes.some(mime => url.toLowerCase().includes(mime))) return true;
  if (url.includes('/video/upload/')) return true;
  return false;
};

const CheckoutConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [farmerName, setFarmerName] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLayersRef = useRef([]);
  const mapInitRef = useRef(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ── Load Leaflet from CDN ────────────────────────────────────────────
  const loadLeaflet = () => new Promise((resolve) => {
    if (window.L) {
      leafletLoaded = true;
      resolve();
      return;
    }

    if (leafletLoading) {
      const checkLoaded = () => {
        if (window.L) {
          leafletLoaded = true;
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    leafletLoading = true;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      leafletLoaded = true;
      leafletLoading = false;
      resolve();
    };
    script.onerror = () => {
      leafletLoading = false;
      resolve();
    };
    document.head.appendChild(script);
  });

  // ── Get user location ─────────────────────────────────────────────────
  const getUserLocation = () => {
    return new Promise((resolve) => {
      if (userLocationCache) {
        resolve(userLocationCache);
        return;
      }

      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          userLocationCache = loc;
          resolve(loc);
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  // ── Geocode address ──────────────────────────────────────────────────
  const geocodeAddress = async (addressString) => {
    if (!addressString || addressString.length < 5) return null;
    
    const cacheKey = addressString.trim().toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=ph`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      
      const data = await response.json();
      if (data && data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache.set(cacheKey, result);
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // ── OSRM Route ──────────────────────────────────────────────────────
  const fetchOsrmRoute = async (startLat, startLng, endLat, endLng) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route');
      return data.routes[0];
    } catch (err) {
      throw err;
    }
  };

  // ── Init Map ──────────────────────────────────────────────────────────
  const initMap = async (centerLat, centerLng, zoom = 14) => {
    if (mapInitRef.current && leafletMapRef.current) {
      leafletMapRef.current.setView([centerLat, centerLng], zoom);
      setMapReady(true);
      return;
    }

    try {
      await loadLeaflet();
      
      const L = window.L;
      if (!L || !mapContainerRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        zoomControl: true,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      mapInitRef.current = true;
      setMapReady(true);
      
      setTimeout(() => {
        if (map) map.invalidateSize({ animate: false });
      }, 100);

    } catch (error) {
      console.error('Map init error:', error);
      setMapReady(false);
    }
  };

  // ── Place User Marker ────────────────────────────────────────────────
  const placeUserMarker = (lat, lng) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#1565c0;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(21,101,192,0.3);"></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    userMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup('<div style="font-weight:600;color:#1565c0;">📍 Your Location</div>');
  };

  // ── Place Destination Marker ─────────────────────────────────────────
  const placeDestinationMarker = (lat, lng, name) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);

    const icon = L.divIcon({
      html: `<div style="width:32px;height:32px;background:#c62828;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px rgba(198,40,40,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;">📍</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    destinationMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<div style="font-weight:600;color:#c62828;font-size:0.8rem;">${name}</div>`)
      .openPopup();
  };

  // ── Draw Route ──────────────────────────────────────────────────────
  const drawRoute = (coords) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    routeLayersRef.current.forEach(l => map.removeLayer(l));
    routeLayersRef.current = [];

    const latlngs = coords.map(c => [c[1], c[0]]);

    const outline = L.polyline(latlngs, {
      color: '#ffffff',
      weight: 9,
      opacity: 0.7
    }).addTo(map);

    const route = L.polyline(latlngs, {
      color: '#1565c0',
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(map);

    routeLayersRef.current = [outline, route];

    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
  };

  // ── Calculate Route (AUTO) ──────────────────────────────────────────
  const calculateRoute = async (destLat, destLng, destName) => {
    if (!destLat || !destLng || destLat === 0 || destLng === 0) {
      return;
    }

    setRouteLoading(true);

    try {
      let startLat, startLng;
      
      if (userLocation) {
        startLat = userLocation.lat;
        startLng = userLocation.lng;
      } else {
        const geo = await getUserLocation();
        if (geo) {
          startLat = geo.lat;
          startLng = geo.lng;
          setUserLocation(geo);
        } else {
          setRouteLoading(false);
          return;
        }
      }

      // Place markers
      placeDestinationMarker(destLat, destLng, destName);
      placeUserMarker(startLat, startLng);

      // Try OSRM route
      try {
        const osrmRoute = await fetchOsrmRoute(startLat, startLng, destLat, destLng);
        drawRoute(osrmRoute.geometry.coordinates);
      } catch (err) {
        // Fallback: straight line
        console.warn('OSRM failed, using fallback:', err);
        drawRoute([[startLng, startLat], [destLng, destLat]]);
      }
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setRouteLoading(false);
    }
  };

  // ── Main Initialization ──────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const orderData = location.state?.order;
      if (!orderData) {
        navigate('/home');
        return;
      }

      setOrder(orderData);
      
      const firstItem = orderData.orderItems?.[0];
      if (!firstItem) {
        setLoading(false);
        return;
      }

      const name = firstItem.farmerName || 'Farmer';
      setFarmerName(name);

      // Get farmer location
      let lat = firstItem.farmer?.location?.coordinates?.[1] || 0;
      let lng = firstItem.farmer?.location?.coordinates?.[0] || 0;
      let address = firstItem.farmer?.address?.fullAddress || orderData.shippingInfo?.address || '';

      if ((lat === 0 || lng === 0) && address) {
        const coords = await geocodeAddress(address);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      if (lat === 0 || lng === 0) {
        setLoading(false);
        return;
      }

      setFarmerLocation({ lat, lng });

      // Get user location
      const geo = await getUserLocation();
      
      if (geo) {
        setUserLocation(geo);
        
        // Initialize map
        setTimeout(async () => {
          await initMap(geo.lat, geo.lng, 13);
          // AUTO-CALCULATE ROUTE (no click needed)
          calculateRoute(lat, lng, name);
        }, 100);
        
      } else {
        // No user location, center on farmer
        setTimeout(async () => {
          await initMap(lat, lng, 14);
          placeDestinationMarker(lat, lng, name);
        }, 100);
      }

      setLoading(false);
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        mapInitRef.current = false;
      }
    };
  }, [location, navigate]);

  // ── Loading State ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">Order not found</h3>
            <button onClick={() => navigate('/orders')} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg">
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductImage = (imageUrl) => {
    if (!imageUrl) return null;
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  };

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .confirmation-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          padding: 32px 20px 60px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .confirmation-card {
          background: #fff;
          border-radius: 16px;
          padding: 32px 36px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
          animation: fadeInUp 0.3s ease both;
          border: 1px solid #e8f5e9;
        }

        .success-icon {
          text-align: center;
          margin-bottom: 16px;
        }

        .success-icon .checkmark {
          width: 64px;
          height: 64px;
          background: #e8f5e9;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .success-title {
          text-align: center;
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #1a3d2b;
          margin: 0 0 4px;
        }

        .success-subtitle {
          text-align: center;
          color: #78909c;
          font-size: 0.9rem;
          margin: 0 0 20px;
        }

        .map-section {
          border-top: 1px solid #e8f5e9;
          border-bottom: 1px solid #e8f5e9;
          padding: 16px 0;
          margin: 16px 0;
        }

        .map-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1a3d2b;
          font-size: 0.95rem;
          margin-bottom: 12px;
        }

        .map-section-title .badge {
          font-size: 0.65rem;
          font-weight: 500;
          color: #78909c;
          background: #f5f7f5;
          padding: 2px 10px;
          border-radius: 10px;
          margin-left: auto;
        }

        .map-wrapper {
          width: 100%;
          height: 400px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #c8e6c9;
          background: #e8f5e9;
          position: relative;
          min-height: 300px;
        }

        .map-wrapper .map-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #78909c;
          flex-direction: column;
          gap: 12px;
        }

        .map-wrapper .map-loading .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #c8e6c9;
          border-top-color: #2E7D32;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 24px;
          padding: 12px 0;
        }

        .order-detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .order-detail-item .label {
          font-size: 0.65rem;
          text-transform: uppercase;
          color: #90a4ae;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .order-detail-item .value {
          font-size: 0.9rem;
          color: #263238;
        }

        .order-items-list {
          margin: 12px 0;
        }

        .order-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f5f7f5;
        }

        .order-item-row:last-child {
          border-bottom: none;
        }

        .order-item-row .item-image {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          background: #e8f5e9;
          flex-shrink: 0;
        }

        .order-item-row .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-item-row .item-info {
          flex: 1;
        }

        .order-item-row .item-info .name {
          font-weight: 500;
          color: #263238;
          font-size: 0.85rem;
        }

        .order-item-row .item-info .meta {
          font-size: 0.75rem;
          color: #78909c;
        }

        .order-item-row .item-price {
          font-weight: 600;
          color: #2E7D32;
          font-size: 0.85rem;
        }

        .order-totals-box {
          border-top: 1px solid #e8f5e9;
          padding-top: 12px;
          margin-top: 12px;
        }

        .order-total-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 0.88rem;
          color: #546e7a;
        }

        .order-total-row.grand-total {
          border-top: 2px solid #e8f5e9;
          margin-top: 6px;
          padding-top: 10px;
          font-weight: 700;
          font-size: 1rem;
          color: #263238;
        }

        .order-total-row.grand-total .price {
          color: #2E7D32;
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25);
        }

        .action-btn.secondary {
          background: #fff;
          color: #2E7D32;
          border: 1.5px solid #e8f5e9;
        }

        .action-btn.secondary:hover {
          border-color: #2E7D32;
          background: #f5f7f5;
        }

        .leaflet-container { 
          font-family: 'DM Sans', sans-serif !important; 
          height: 100%;
          width: 100%;
        }
        
        .leaflet-popup-content-wrapper { 
          border-radius: 12px !important; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important; 
          border: 1px solid #e8f5e9 !important; 
          padding: 0 !important; 
        }
        
        .leaflet-popup-content { 
          margin: 12px 16px !important; 
        }
        
        .leaflet-popup-tip-container { 
          margin-top: -1px; 
        }

        @media (max-width: 768px) {
          .confirmation-card { padding: 20px; }
          .order-details-grid { grid-template-columns: 1fr; }
          .map-wrapper { height: 300px; }
          .action-buttons { flex-direction: column; }
        }

        @media (max-width: 480px) {
          .confirmation-root { padding: 16px 12px; }
          .success-title { font-size: 1.3rem; }
          .map-wrapper { height: 250px; }
        }
      `}</style>

      <div className="confirmation-root">
        <div className="confirmation-card">
          {/* Success Icon */}
          <div className="success-icon">
            <div className="checkmark">
              <CheckCircleIcon size={40} />
            </div>
          </div>

          <h1 className="success-title">Order Placed Successfully! 🎉</h1>
          <p className="success-subtitle">
            Thank you for your order. We'll notify you once your order is confirmed.
          </p>

          {/* ── Map Section ── */}
          {farmerLocation && (
            <div className="map-section">
              <div className="map-section-title">
                <MapPinIcon size={18} />
                Location of {farmerName || 'Farmer'}
                {routeLoading && (
                  <span className="badge">Calculating route...</span>
                )}
                {!routeLoading && mapReady && (
                  <span className="badge" style={{ color: '#2E7D32', background: '#e8f5e9' }}>✓ Route ready</span>
                )}
              </div>

              <div className="map-wrapper">
                {!mapReady ? (
                  <div className="map-loading">
                    <div className="spinner"></div>
                    <span>Loading map...</span>
                  </div>
                ) : (
                  <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
                )}
              </div>
            </div>
          )}

          {/* ── Order Details ── */}
          <div className="order-details-grid">
            <div className="order-detail-item">
              <span className="label">Order ID</span>
              <span className="value">#{order._id?.slice(-8) || 'N/A'}</span>
            </div>
            <div className="order-detail-item">
              <span className="label">Order Date</span>
              <span className="value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="order-detail-item">
              <span className="label">Payment Method</span>
              <span className="value">{order.paymentMethod || 'Cash on Delivery'}</span>
            </div>
            <div className="order-detail-item">
              <span className="label">Order Status</span>
              <span className="value" style={{ color: '#2E7D32', fontWeight: 600 }}>
                {order.orderStatus || 'Processing'}
              </span>
            </div>
          </div>

          {/* ── Shipping Info ── */}
          <div className="order-details-grid" style={{ borderTop: '1px solid #e8f5e9', paddingTop: '12px' }}>
            <div className="order-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="label">📦 Shipping Address</span>
              <span className="value">{order.shippingInfo?.address || 'N/A'}</span>
            </div>
            <div className="order-detail-item">
              <span className="label">Phone</span>
              <span className="value">{order.shippingInfo?.phoneNo || 'N/A'}</span>
            </div>
            <div className="order-detail-item">
              <span className="label">Farmer</span>
              <span className="value">{order.orderItems?.[0]?.farmerName || 'N/A'}</span>
            </div>
          </div>

          {/* ── Order Items ── */}
          <div className="order-items-list">
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1rem', margin: '12px 0 8px' }}>
              🛒 Order Items
            </h3>
            {order.orderItems?.map((item, index) => {
              const imageUrl = getProductImage(item.image);
              const isVideo = isVideoUrl(item.image);
              
              return (
                <div key={index} className="order-item-row">
                  <div className="item-image">
                    {imageUrl && !isVideo ? (
                      <img 
                        src={imageUrl} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a5b8a5;font-size:0.5rem;background:#f5f7f5;">
                              No img
                            </div>
                          `;
                        }}
                      />
                    ) : isVideo ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        background: '#1a1a2e',
                        color: 'white',
                        fontSize: '1.2rem'
                      }}>
                        🎬
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        color: '#a5b8a5',
                        fontSize: '0.5rem',
                        background: '#f5f7f5'
                      }}>
                        No img
                      </div>
                    )}
                  </div>
                  <div className="item-info">
                    <div className="name">{item.name}</div>
                    <div className="meta">Qty: {item.quantity} × ₱{Number(item.price).toFixed(2)}</div>
                  </div>
                  <div className="item-price">₱{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* ── Totals ── */}
          <div className="order-totals-box">
            <div className="order-total-row">
              <span>Subtotal</span>
              <span>₱{order.itemsPrice?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="order-total-row">
              <span>Shipping</span>
              <span>₱{order.shippingPrice?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="order-total-row">
              <span>Tax (12%)</span>
              <span>₱{order.taxPrice?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="order-total-row grand-total">
              <span>Total</span>
              <span className="price">₱{order.totalPrice?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/orders')}
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirmation;