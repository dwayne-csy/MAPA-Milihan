// Mapa-Milihan/frontend/src/Components/User/OrderDetails.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const MapPinIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CheckCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const TruckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/>
  </svg>
);

const XCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const PackageIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Map states
  const [mapLoading, setMapLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [farmerName, setFarmerName] = useState('');

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLayersRef = useRef([]);
  const mapInitRef = useRef(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ── Load Leaflet (cached) ────────────────────────────────────────────
  const loadLeaflet = useCallback(() => new Promise((resolve) => {
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
  }), []);

  // ── Get user location (cached) ──────────────────────────────────────
  const getUserLocation = useCallback(() => {
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
  }, []);

  // ── Geocode address (cached) ────────────────────────────────────────
  const geocodeAddress = useCallback(async (addressString) => {
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
  }, []);

  // ── OSRM Routing ──────────────────────────────────────────────────────
  const fetchOsrmRoute = useCallback(async (startLat, startLng, endLat, endLng) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error('OSRM request failed');
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');
      return data.routes[0];
    } catch (err) {
      throw err;
    }
  }, []);

  // ── Init Map ──────────────────────────────────────────────────────────
  const initMap = useCallback(async (centerLat, centerLng, zoom = 14) => {
    if (mapInitRef.current && leafletMapRef.current) {
      leafletMapRef.current.setView([centerLat, centerLng], zoom);
      setMapReady(true);
      setMapLoading(false);
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
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      mapInitRef.current = true;
      setMapReady(true);
      setMapLoading(false);
      
      setTimeout(() => map.invalidateSize({ animate: false }), 100);
    } catch (error) {
      setMapReady(false);
      setMapLoading(false);
    }
  }, [loadLeaflet]);

  // ── Place User Marker ────────────────────────────────────────────────
  const placeUserMarker = useCallback((lat, lng) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#1565c0;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(21,101,192,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: ''
    });
    userMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
  }, []);

  // ── Place Destination Marker ─────────────────────────────────────────
  const placeDestinationMarker = useCallback((lat, lng, name) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);
    const icon = L.divIcon({
      html: `<div style="width:32px;height:32px;background:#c62828;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px rgba(198,40,40,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: ''
    });
    destinationMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<div style="font-weight:600;color:#c62828;">${name}</div>`)
      .openPopup();
  }, []);

  // ── Draw Route ──────────────────────────────────────────────────────
  const drawRoute = useCallback((coords) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    routeLayersRef.current.forEach(l => map.removeLayer(l));
    routeLayersRef.current = [];

    const latlngs = coords.map(c => [c[1], c[0]]);
    const outline = L.polyline(latlngs, { color: '#ffffff', weight: 9, opacity: 0.7 }).addTo(map);
    const route = L.polyline(latlngs, { color: '#1565c0', weight: 5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }).addTo(map);
    routeLayersRef.current = [outline, route];
    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
  }, []);

  // ── Calculate Route ──────────────────────────────────────────────────
  const calculateRoute = useCallback(async (destLat, destLng, destName) => {
    if (!destLat || !destLng || destLat === 0 || destLng === 0) return;

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
          return;
        }
      }

      placeDestinationMarker(destLat, destLng, destName);
      placeUserMarker(startLat, startLng);
      
      try {
        const osrmRoute = await fetchOsrmRoute(startLat, startLng, destLat, destLng);
        drawRoute(osrmRoute.geometry.coordinates);
      } catch (err) {
        console.warn('OSRM routing failed, using fallback:', err);
        drawRoute([[startLng, startLat], [destLng, destLat]]);
      }
    } catch (err) {
      console.error('Routing error:', err);
    }
  }, [userLocation, getUserLocation, placeDestinationMarker, placeUserMarker, fetchOsrmRoute, drawRoute]);

  // ── Fetch Order ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
          setOrder(data.order);
          
          const firstItem = data.order.orderItems?.[0];
          if (firstItem) {
            const name = firstItem.farmerName || 'Farmer';
            setFarmerName(name);
            
            let lat = firstItem.farmer?.location?.coordinates?.[1] || 0;
            let lng = firstItem.farmer?.location?.coordinates?.[0] || 0;
            let address = firstItem.farmer?.address?.fullAddress || data.order.shippingInfo?.address || '';
            
            if ((lat === 0 || lng === 0) && address) {
              const coords = await geocodeAddress(address);
              if (coords) { lat = coords.lat; lng = coords.lng; }
            }
            
            if (lat !== 0 && lng !== 0) {
              setFarmerLocation({ lat, lng });
              const geo = await getUserLocation();
              if (geo) {
                setUserLocation(geo);
                // Initialize map and calculate route (non-blocking)
                setTimeout(async () => {
                  await initMap(geo.lat, geo.lng, 13);
                  setTimeout(() => calculateRoute(lat, lng, name), 300);
                }, 100);
              } else {
                setTimeout(async () => {
                  await initMap(lat, lng, 14);
                  placeDestinationMarker(lat, lng, name);
                  setMapLoading(false);
                }, 100);
              }
            } else {
              setMapLoading(false);
            }
          }
        } else {
          setError(data.message || 'Failed to fetch order details');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate, geocodeAddress, getUserLocation, initMap, calculateRoute, placeDestinationMarker]);

  // ── Cancel Order ──────────────────────────────────────────────────────
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setOrder(data.order);
        setShowCancelConfirm(false);
        alert('✅ Order cancelled successfully!');
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // ── Loading State ──
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

  // ── Error State ──
  if (error || !order) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-lg shadow max-w-md w-full">
            <XCircleIcon size={48} style={{ color: '#ef5350', margin: '0 auto' }} />
            <h3 className="text-lg font-semibold text-gray-800 mt-4">{error || 'Order not found'}</h3>
            <p className="text-gray-600 mt-2">The order you're looking for might have been removed or doesn't exist.</p>
            <button onClick={() => navigate('/orders')} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Updated statusInfo with new order statuses
  const statusInfo = {
    'Processing': { color: '#f57c00', bg: '#fff3e0', icon: <ClockIcon size={16} />, label: 'Processing' },
    'Accepted': { color: '#2E7D32', bg: '#e8f5e9', icon: <CheckCircleIcon size={16} />, label: 'Accepted' },
    'Out for Delivery': { color: '#1565C0', bg: '#e3f2fd', icon: <TruckIcon size={16} />, label: 'Out for Delivery' },
    'Delivered': { color: '#2E7D32', bg: '#e8f5e9', icon: <CheckCircleIcon size={16} />, label: 'Delivered' },
    'Cancelled': { color: '#c62828', bg: '#ffebee', icon: <XCircleIcon size={16} />, label: 'Cancelled' }
  }[order.orderStatus] || { color: '#78909c', bg: '#f5f7f5', icon: <ClockIcon size={16} />, label: order.orderStatus || 'Processing' };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        @keyframes spin { to { transform: rotate(360deg); } }

        .order-details-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          padding: 32px 20px 60px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .order-details-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          animation: fadeInUp 0.3s ease both;
        }

        .order-details-header .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #546e7a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .order-details-header .back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .order-details-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #1a3d2b;
          margin: 0;
        }

        .order-details-card {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          padding: 28px 32px;
          animation: fadeInUp 0.4s ease both;
        }

        .order-details-card .section { margin-bottom: 20px; }
        .order-details-card .section:last-child { margin-bottom: 0; }

        .order-details-card .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.05rem;
          color: #1a3d2b;
          margin: 0 0 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e8f5e9;
          margin-bottom: 14px;
        }
        .order-info-row .order-id { font-size: 0.95rem; color: #263238; }
        .order-info-row .order-id .label { color: #78909c; font-weight: 400; }

        .order-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .order-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }
        .order-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .order-meta-item .meta-label { font-size: 0.65rem; text-transform: uppercase; color: #90a4ae; font-weight: 600; letter-spacing: 0.05em; }
        .order-meta-item .meta-value { font-size: 0.9rem; color: #263238; }

        .order-items-list { display: flex; flex-direction: column; gap: 10px; }
        .order-item-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 12px;
          background: #f5f7f5;
          border-radius: 10px;
          transition: background 0.2s;
        }
        .order-item-row:hover { background: #e8f5e9; }
        .order-item-row .item-image { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #e8f5e9; flex-shrink: 0; }
        .order-item-row .item-image img { width: 100%; height: 100%; object-fit: cover; }
        .order-item-row .item-info { flex: 1; }
        .order-item-row .item-info .name { font-weight: 600; color: #263238; font-size: 0.88rem; }
        .order-item-row .item-info .meta { font-size: 0.75rem; color: #78909c; display: flex; gap: 12px; }
        .order-item-row .item-price { font-weight: 600; color: #2E7D32; font-size: 0.9rem; }

        .order-totals-box { border-top: 1px solid #e8f5e9; padding-top: 12px; margin-top: 12px; }
        .order-total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 0.88rem; color: #546e7a; }
        .order-total-row.grand-total { border-top: 2px solid #e8f5e9; margin-top: 6px; padding-top: 10px; font-weight: 700; font-size: 1rem; color: #263238; }
        .order-total-row.grand-total .price { color: #2E7D32; font-family: 'DM Serif Display', serif; font-size: 1.2rem; }

        /* Map Styles */
        .map-wrapper {
          width: 100%;
          height: 350px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #c8e6c9;
          background: #e8f5e9;
          position: relative;
          min-height: 250px;
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
          width: 28px;
          height: 28px;
          border: 3px solid #c8e6c9;
          border-top-color: #2E7D32;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .order-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e8f5e9;
          flex-wrap: wrap;
        }
        .order-actions .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .order-actions .btn:hover { transform: translateY(-2px); }
        .order-actions .btn-primary { background: linear-gradient(135deg, #2E7D32, #43A047); color: #fff; box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25); }
        .order-actions .btn-danger { background: #fff; color: #c62828; border: 1.5px solid #ffebee; }
        .order-actions .btn-danger:hover { background: #ffebee; border-color: #ef5350; }
        .order-actions .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .cancel-confirm-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
          animation: fadeInUp 0.2s ease;
        }
        .cancel-confirm-modal {
          background: white; border-radius: 16px; padding: 28px; max-width: 380px; width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: fadeInUp 0.3s ease;
        }
        .cancel-confirm-modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: #1a3d2b; margin: 0 0 8px; }
        .cancel-confirm-modal p { color: #78909c; font-size: 0.9rem; margin: 0 0 16px; }
        .cancel-confirm-actions { display: flex; gap: 10px; }
        .cancel-confirm-actions button { flex: 1; padding: 8px 16px; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .cancel-confirm-actions .confirm-btn { background: #ef5350; color: white; }
        .cancel-confirm-actions .confirm-btn:hover { background: #c62828; }
        .cancel-confirm-actions .cancel-btn { background: #e8f5e9; color: #2E7D32; }
        .cancel-confirm-actions .cancel-btn:hover { background: #c8e6c9; }

        .leaflet-container { font-family: 'DM Sans', sans-serif !important; height: 100%; width: 100%; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important; border: 1px solid #e8f5e9 !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 10px 14px !important; }
        .leaflet-popup-tip-container { margin-top: -1px; }

        @media (max-width: 768px) {
          .order-details-card { padding: 20px; }
          .order-meta-grid { grid-template-columns: 1fr; }
          .order-actions { flex-direction: column; }
          .map-wrapper { height: 280px; }
        }
        @media (max-width: 480px) {
          .order-details-root { padding: 16px 12px; }
          .order-details-header h1 { font-size: 1.2rem; }
          .map-wrapper { height: 220px; }
        }
      `}</style>

      <div className="order-details-root">
        <div className="order-details-header">
          <button className="back-btn" onClick={() => navigate('/orders')}>
            <ArrowLeftIcon size={16} /> Back to Orders
          </button>
          <h1>Order Details</h1>
        </div>

        <div className="order-details-card">
          {/* ── Order Info ── */}
          <div className="section">
            <div className="order-info-row">
              <div className="order-id"><span className="label">Order #</span> {order._id?.slice(-8) || 'N/A'}</div>
              <div className="order-status-badge" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>
                {statusInfo.icon} {statusInfo.label}
              </div>
            </div>
            <div className="order-meta-grid">
              <div className="order-meta-item">
                <span className="meta-label">Order Date</span>
                <span className="meta-value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="order-meta-item">
                <span className="meta-label">Payment Method</span>
                <span className="meta-value">{order.paymentMethod || 'Cash on Delivery'}</span>
              </div>
              <div className="order-meta-item">
                <span className="meta-label">Payment Status</span>
                <span className="meta-value">{order.paymentStatus || 'Pending'}</span>
              </div>
              <div className="order-meta-item">
                <span className="meta-label">Items</span>
                <span className="meta-value">{order.orderItems?.length || 0} item(s)</span>
              </div>
            </div>
          </div>

          {/* ── Map Section ── */}
          {farmerLocation && (
            <div className="section">
              <div className="section-title">
                <MapPinIcon size={18} />
                Location of {farmerName || 'Farmer'}
              </div>

              <div className="map-wrapper">
                {mapLoading ? (
                  <div className="map-loading">
                    <div className="spinner"></div>
                    <span>Loading map...</span>
                  </div>
                ) : mapReady ? (
                  <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <div className="map-loading">
                    <span>⚠️ Could not load map</span>
                    <button onClick={() => window.location.reload()} style={{ padding: '6px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Shipping Info ── */}
          <div className="section">
            <div className="section-title"><MapPinIcon size={18} /> Shipping Information</div>
            <div style={{ fontSize: '0.9rem', color: '#263238' }}>
              <p style={{ margin: '0 0 2px' }}>{order.shippingInfo?.address || 'N/A'}</p>
              <p style={{ margin: '0' }}>📞 {order.shippingInfo?.phoneNo || 'N/A'}</p>
            </div>
          </div>

          {/* ── Order Items ── */}
          <div className="section">
            <div className="section-title"><PackageIcon size={18} /> Order Items</div>
            <div className="order-items-list">
              {order.orderItems?.map((item, index) => {
                const imageUrl = getProductImage(item.image);
                const isVideo = isVideoUrl(item.image);
                return (
                  <div key={index} className="order-item-row">
                    <div className="item-image">
                      {imageUrl && !isVideo ? (
                        <img src={imageUrl} alt={item.name} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : isVideo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1a1a2e', color: 'white', fontSize: '1.2rem' }}>🎬</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a5b8a5', fontSize: '0.6rem', background: '#f5f7f5' }}>No img</div>
                      )}
                    </div>
                    <div className="item-info">
                      <div className="name">{item.name}</div>
                      <div className="meta"><span>Qty: {item.quantity}</span><span>₱{Number(item.price).toFixed(2)} / {item.unit || 'pc'}</span></div>
                    </div>
                    <div className="item-price">₱{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Totals ── */}
          <div className="section">
            <div className="order-totals-box">
              <div className="order-total-row"><span>Subtotal</span><span>₱{order.itemsPrice?.toFixed(2) || '0.00'}</span></div>
              <div className="order-total-row"><span>Shipping</span><span>₱{order.shippingPrice?.toFixed(2) || '0.00'}</span></div>
              <div className="order-total-row"><span>Tax (12%)</span><span>₱{order.taxPrice?.toFixed(2) || '0.00'}</span></div>
              <div className="order-total-row grand-total"><span>Total</span><span className="price">₱{order.totalPrice?.toFixed(2) || '0.00'}</span></div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="order-actions">
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              Continue Shopping
            </button>
            {/* ✅ Cancel button ONLY shows when order status is "Processing" */}
            {order.orderStatus === 'Processing' && (
              <button className="btn btn-danger" onClick={() => setShowCancelConfirm(true)} disabled={cancelling}>
                <XCircleIcon size={16} /> Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelConfirm && (
        <div className="cancel-confirm-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order?</h3>
            <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="cancel-confirm-actions">
              <button className="cancel-btn" onClick={() => setShowCancelConfirm(false)}>Keep Order</button>
              <button className="confirm-btn" onClick={handleCancelOrder} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;