import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const MapPinIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 18 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconNavigation = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const IconWalk = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="4" r="2"/>
    <path d="M14.5 10.5l2 4.5H20v2h-5l-1.5-3.5-3 3.5V22h-2v-6.5l3-3.5-1-3.5"/>
    <path d="M8 11.5l2-1.5"/>
  </svg>
);

const IconMotorcycle = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/>
    <path d="M5 17H3V14L5 8H13L17.5 12H19.5"/>
    <path d="M13 8L15 12"/><path d="M7 14H13"/>
  </svg>
);

const IconCar = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3v-7l2-5h14l2 5v7h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M5 10h14"/>
  </svg>
);

const IconRoute = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>
);

const IconClock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconRuler = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 8.7l-8-8a1 1 0 0 0-1.4 0l-9.2 9.2a1 1 0 0 0 0 1.4l8 8a1 1 0 0 0 1.4 0l9.2-9.2a1 1 0 0 0 0-1.4z"/>
    <line x1="7.5" y1="10.5" x2="7.51" y2="10.5"/><line x1="10.5" y1="7.5" x2="10.51" y2="7.5"/>
    <line x1="13.5" y1="10.5" x2="13.51" y2="10.5"/><line x1="10.5" y1="13.5" x2="10.51" y2="13.5"/>
  </svg>
);

const IconX = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconAlertTriangle = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconRefresh = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const Maps = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  
  // Route states
  const [showRoute, setShowRoute] = useState(false);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [transportMode, setTransportMode] = useState('motor');
  const [routeLoading, setRouteLoading] = useState(false);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLayersRef = useRef([]);
  const farmerMarkersRef = useRef([]);
  const transportModeRef = useRef('motor');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const MODE_SPEEDS = { walk: 5, motor: 50, car: 80 };

  useEffect(() => {
    transportModeRef.current = transportMode;
  }, [transportMode]);

  // ── Load Leaflet from CDN ────────────────────────────────────────────
  const loadLeaflet = () => new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      console.log('Leaflet loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Leaflet');
      resolve();
    };
    document.head.appendChild(script);
  });

  // ── Fetch Farmer Avatar ──────────────────────────────────────────────
  const fetchFarmerAvatar = async (farmerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${farmerId}/avatar`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : {}
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.avatarUrl) {
          if (data.avatarUrl.startsWith('/')) {
            return `${API_BASE_URL}${data.avatarUrl}`;
          }
          return data.avatarUrl;
        }
      }
      return null;
    } catch (error) {
      console.warn(`Failed to fetch avatar for farmer ${farmerId}:`, error);
      return null;
    }
  };

  // ── Geocode address using Nominatim ──────────────────────────────────
  const geocodeAddress = async (addressString) => {
    if (!addressString || addressString.length < 5) return null;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=ph`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.warn('Geocoding error:', error);
      return null;
    }
  };

  // ── Fetch Farmers with Products ──────────────────────────────────────
  const fetchFarmersWithProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : {}
        }
      });

      const data = await response.json();

      if (response.ok) {
        const availableProducts = (data.products || []).filter(p => p.isAvailable !== false);
        setProducts(availableProducts);

        const farmerMap = new Map();
        
        for (const product of availableProducts) {
          const farmerId = product.farmer?._id || product.farmer;
          if (farmerId && !farmerMap.has(farmerId)) {
            const farmerData = product.farmer || {};
            const address = farmerData.address || product.farmerAddress || product.location || {};
            
            const street = address.street || '';
            const barangay = address.barangay || '';
            const city = address.city || address.municipality || '';
            const zipcode = address.zipcode || address.zipCode || '';
            
            let lat = address.coordinates?.[1] || address.lat || 0;
            let lng = address.coordinates?.[0] || address.lng || 0;
            
            const addressObj = {
              street,
              barangay,
              city,
              zipcode,
              fullAddress: `${street}, ${barangay}, ${city}, Philippines`.replace(/, ,/g, ',').replace(/^, /, '')
            };
            
            let avatarUrl = product.farmerAvatar || farmerData.avatar?.url || null;
            
            farmerMap.set(farmerId, {
              id: farmerId,
              name: farmerData.name || product.farmer?.name || 'Unknown Farmer',
              avatar: avatarUrl,
              location: (lat !== 0 && lng !== 0) ? { lat, lng, ...addressObj } : null,
              address: addressObj,
              products: [],
              hasCoordinates: lat !== 0 && lng !== 0,
              avatarFetched: !!avatarUrl
            });
          }
          
          const farmerId2 = product.farmer?._id || product.farmer;
          if (farmerId2 && farmerMap.has(farmerId2)) {
            farmerMap.get(farmerId2).products.push({
              id: product._id,
              name: product.name,
              price: product.price,
              description: product.description,
              image: product.images?.[0]?.url || null
            });
          }
        }

        const farmerList = Array.from(farmerMap.values());
        const farmersToGeocode = farmerList.filter(f => !f.hasCoordinates && f.address.fullAddress);
        const farmersWithoutAvatar = farmerList.filter(f => !f.avatarFetched);
        
        setGeocodingProgress({ current: 0, total: farmersToGeocode.length + farmersWithoutAvatar.length });
        
        let processedCount = 0;
        
        for (const farmer of farmersWithoutAvatar) {
          try {
            const avatarUrl = await fetchFarmerAvatar(farmer.id);
            if (avatarUrl) {
              farmer.avatar = avatarUrl;
              farmer.avatarFetched = true;
            }
          } catch (err) {}
          setGeocodingProgress({ current: ++processedCount, total: farmersToGeocode.length + farmersWithoutAvatar.length });
        }
        
        for (const farmer of farmersToGeocode) {
          try {
            const coords = await geocodeAddress(farmer.address.fullAddress);
            if (coords) {
              farmer.location = {
                lat: coords.lat,
                lng: coords.lng,
                ...farmer.address
              };
              farmer.hasCoordinates = true;
            }
          } catch (err) {}
          setGeocodingProgress({ current: ++processedCount, total: farmersToGeocode.length + farmersWithoutAvatar.length });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const farmersWithLocation = farmerList.filter(f => f.location !== null && f.location.lat && f.location.lng && f.location.lat !== 0 && f.location.lng !== 0);
        setFarmers(farmersWithLocation);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // ── Init Leaflet map ──────────────────────────────────────────────────
  const initLeafletMap = async (centerLat = 8.1650, centerLng = 125.0667, zoom = 7) => {
    try {
      await loadLeaflet();
      
      const L = window.L;
      if (!L) {
        console.error('Leaflet not available');
        setMapReady(false);
        return;
      }

      if (!mapContainerRef.current) {
        console.warn('Map container not found, retrying...');
        setTimeout(() => {
          if (mapContainerRef.current) {
            initLeafletMap(centerLat, centerLng, zoom);
          }
        }, 500);
        return;
      }

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      console.log('Creating map with center:', centerLat, centerLng);
      
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      
      if (farmers.length > 0) {
        addFarmerMarkers(map);
      }
      
      setMapReady(true);
      console.log('Map initialized successfully');
      
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 200);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapReady(false);
    }
  };

  // ── Farmer markers ────────────────────────────────────────────────────
  const addFarmerMarkers = (map) => {
    const L = window.L;
    if (!L || !map) return;

    farmerMarkersRef.current.forEach(m => {
      if (m && map.removeLayer) map.removeLayer(m);
    });
    farmerMarkersRef.current = [];

    const farmersWithLocation = farmers.filter(f => 
      f.location && 
      f.location.lat && 
      f.location.lng && 
      f.location.lat !== 0 && 
      f.location.lng !== 0
    );

    farmersWithLocation.forEach((farmer) => {
      const avatarHtml = farmer.avatar 
        ? `<img src="${farmer.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.innerHTML='${farmer.name?.charAt(0) || 'F'}'" />`
        : farmer.name?.charAt(0) || 'F';

      const icon = L.divIcon({
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${farmer.avatar ? 'transparent' : '#2e7d32'};
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            overflow: hidden;
          ">
            ${avatarHtml}
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([farmer.location.lat, farmer.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;max-width:220px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid #2e7d32;flex-shrink:0;background:#e8f5e9;display:flex;align-items:center;justify-content:center;">
                ${farmer.avatar 
                  ? `<img src="${farmer.avatar}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.innerHTML='${farmer.name?.charAt(0) || 'F'}'" />`
                  : `<span style="font-weight:700;color:#2e7d32;font-size:16px;">${farmer.name?.charAt(0) || 'F'}</span>`
                }
              </div>
              <div style="font-weight:700;color:#1a3d2b;font-size:0.9rem;">
                🌾 ${farmer.name}
              </div>
            </div>
            <div style="font-size:0.75rem;color:#546e7a;margin-bottom:6px;">
              📍 ${farmer.location.address || farmer.location.fullAddress || `${farmer.location.barangay}, ${farmer.location.city}`}
            </div>
            <div style="font-size:0.7rem;color:#78909c;margin-bottom:8px;">
              ${farmer.products.length} product${farmer.products.length > 1 ? 's' : ''} available
            </div>
            <button 
              onclick="window.handleFarmerClick('${farmer.id}')"
              style="
                padding:4px 14px;
                background:linear-gradient(135deg,#2e7d32,#43a047);
                color:#fff;
                border:none;
                border-radius:6px;
                font-size:0.75rem;
                font-weight:600;
                cursor:pointer;
                font-family:'DM Sans',sans-serif;
                width:100%;
              "
            >
              View Products
            </button>
          </div>
        `);

      farmerMarkersRef.current.push(marker);
    });
  };

  // ── User location marker ─────────────────────────────────────────────
  const placeUserMarker = (lat, lng) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    const icon = L.divIcon({
      html: `
        <div style="
          width:16px;
          height:16px;
          background:#1565c0;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 0 0 3px rgba(21,101,192,0.3);
        "></div>
      `,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    userMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup('<div style="font-family:\'DM Sans\',sans-serif;font-weight:600;color:#1565c0;">📍 Your Location</div>');
  };

  // ── Destination marker ───────────────────────────────────────────────
  const placeDestinationMarker = (lat, lng, name) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);

    const icon = L.divIcon({
      html: `
        <div style="
          width:32px;
          height:32px;
          background:#c62828;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 12px rgba(198,40,40,0.5);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
          color:#fff;
        ">📍</div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    destinationMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-weight:600;color:#c62828;">${name}</div>`)
      .openPopup();
  };

  // ── Draw route polyline ──────────────────────────────────────────────
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

  const clearRouteFromMap = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    routeLayersRef.current.forEach(l => map.removeLayer(l));
    routeLayersRef.current = [];
    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
  };

  const flyTo = (lat, lng, zoom = 14) => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  // ── OSRM Routing Logic ──────────────────────────────────────────────
  const getOsrmProfile = (mode) => {
    if (mode === 'walk') return 'foot';
    return 'driving';
  };

  const calcDurationFromDistance = (distanceKm, mode) => {
    const speed = MODE_SPEEDS[mode] || 50;
    const totalHours = distanceKm / speed;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const fetchOsrmRoute = async (startLat, startLng, endLat, endLng, profile) => {
    if (!startLat || !startLng || !endLat || !endLng || 
        startLat === 0 || startLng === 0 || endLat === 0 || endLng === 0) {
      throw new Error('Invalid coordinates');
    }

    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.length) throw new Error(data.message || 'No route returned');
        return data.routes[0];
      } catch (err) {
        if (attempt === 1) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  const calculateRoute = async (destLat, destLng, destName) => {
    if (!destLat || !destLng || destLat === 0 || destLng === 0) {
      showToast('Destination has invalid coordinates', 'error');
      return;
    }

    const currentMode = transportModeRef.current;

    const doRoute = async (uLat, uLng) => {
      try {
        setRouteLoading(true);
        placeDestinationMarker(destLat, destLng, destName);
        
        const profile = getOsrmProfile(currentMode);
        
        try {
          const osrmRoute = await fetchOsrmRoute(uLat, uLng, destLat, destLng, profile);
          
          const distanceKm = parseFloat((osrmRoute.distance / 1000).toFixed(1));
          const duration = calcDurationFromDistance(distanceKm, currentMode);
          const coords = osrmRoute.geometry.coordinates;
          
          setRouteCoordinates(coords);
          setRouteDistance(distanceKm);
          setRouteDuration(duration);
          setRouteStart({ lat: uLat, lng: uLng });
          setRouteEnd({ lat: destLat, lng: destLng });
          setShowRoute(true);
          
          placeUserMarker(uLat, uLng);
          drawRoute(coords);
          
          showToast(`Route to ${destName} drawn on map`, 'success');
        } catch (err) {
          console.warn('OSRM routing failed, using fallback:', err);
          showFallbackRoute(uLat, uLng, destLat, destLng, currentMode);
          showToast('Using straight-line route estimation', 'info');
        }
      } catch (err) {
        console.error('Routing error:', err);
        showToast('Could not calculate route', 'error');
      } finally {
        setRouteLoading(false);
      }
    };

    if (userLocation) {
      await doRoute(userLocation.lat, userLocation.lng);
    } else {
      const geo = await getUserLocation();
      if (geo) {
        await doRoute(geo.lat, geo.lng);
      } else {
        showToast('Please enable location services', 'error');
      }
    }
  };

  const showFallbackRoute = (startLat, startLng, endLat, endLng, mode) => {
    const distanceKm = parseFloat(calculateDistance(startLat, startLng, endLat, endLng));
    const roadEstimate = parseFloat((distanceKm * 1.3).toFixed(1));
    const duration = calcDurationFromDistance(roadEstimate, mode);
    const coords = [[startLng, startLat], [endLng, endLat]];
    
    setRouteCoordinates(coords);
    setRouteDistance(roadEstimate);
    setRouteDuration(duration);
    setRouteStart({ lat: startLat, lng: startLng });
    setRouteEnd({ lat: endLat, lng: endLng });
    setShowRoute(true);
    
    placeUserMarker(startLat, startLng);
    drawRoute(coords);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };

  const changeTransportMode = async (mode) => {
    setTransportMode(mode);
    transportModeRef.current = mode;
    
    if (showRoute && routeStart && routeEnd) {
      await calculateRoute(routeEnd.lat, routeEnd.lng, selectedFarmer?.name || 'Destination');
      showToast(`Route updated for ${getModeDisplayName(mode)}`, 'info');
    }
  };

  const getModeDisplayName = (mode) => {
    const names = { walk: 'Walking', motor: 'Motorcycle', car: 'Car' };
    return names[mode] || 'Motorcycle';
  };

  const getModeIcon = (mode) => {
    switch(mode) {
      case 'walk': return <IconWalk size={16} color="#fff" />;
      case 'motor': return <IconMotorcycle size={16} color="#fff" />;
      case 'car': return <IconCar size={16} color="#fff" />;
      default: return <IconMotorcycle size={16} color="#fff" />;
    }
  };

  const clearRoute = () => {
    setShowRoute(false);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteDistance(null);
    setRouteDuration(null);
    setRouteCoordinates([]);
    clearRouteFromMap();
    if (userLocation) flyTo(userLocation.lat, userLocation.lng, 14);
    showToast('Route cleared', 'info');
  };

  // ── Get user location ─────────────────────────────────────────────────
  const getUserLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          resolve({ lat: latitude, lng: longitude });
        },
        () => {
          setLocationError('Could not get your location');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const goToMyLocation = async () => {
    const geo = await getUserLocation();
    if (geo) {
      setUserLocation(geo);
      placeUserMarker(geo.lat, geo.lng);
      flyTo(geo.lat, geo.lng, 17);
      showToast('Centered on your location', 'success');
    }
  };

  // ── Select farmer and route ──────────────────────────────────────────
  const selectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    if (farmer.location && farmer.location.lat && farmer.location.lng && 
        farmer.location.lat !== 0 && farmer.location.lng !== 0) {
      flyTo(farmer.location.lat, farmer.location.lng, 15);
      placeDestinationMarker(farmer.location.lat, farmer.location.lng, farmer.name);
    } else {
      showToast(`${farmer.name} has no valid location data`, 'error');
    }
  };

  const handleNavigateRoute = (farmer) => {
    if (farmer.location && farmer.location.lat && farmer.location.lng && 
        farmer.location.lat !== 0 && farmer.location.lng !== 0) {
      calculateRoute(farmer.location.lat, farmer.location.lng, farmer.name);
    } else {
      showToast(`${farmer.name} has no valid location data for routing`, 'error');
    }
  };

  // ── Toast notification ────────────────────────────────────────────────
  const showToast = (message, type = 'info') => {
    const colors = { success: '#2e7d32', error: '#c62828', info: '#1565c0' };
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position:fixed;
      bottom:100px;
      right:20px;
      background:${colors[type] || colors.info};
      color:white;
      padding:10px 16px;
      border-radius:10px;
      z-index:10000;
      font-size:14px;
      font-family:'DM Sans',sans-serif;
      font-weight:500;
      animation:fadeInOut 2.5s ease-in-out;
      box-shadow:0 4px 16px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ── Expose functions to window for popup buttons ─────────────────────
  useEffect(() => {
    window.handleFarmerClick = (farmerId) => {
      const farmer = farmers.find(f => f.id === farmerId);
      if (farmer) {
        selectFarmer(farmer);
        if (farmer.products.length > 0) {
          navigate(`/product/${farmer.products[0].id}`);
        }
      }
    };
    
    return () => {
      delete window.handleFarmerClick;
    };
  }, [farmers, navigate]);

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchFarmersWithProducts();

      const geo = await getUserLocation();
      if (geo) {
        setUserLocation(geo);
        setTimeout(async () => {
          await initLeafletMap(geo.lat, geo.lng, 14);
          placeUserMarker(geo.lat, geo.lng);
        }, 100);
      } else {
        setTimeout(async () => {
          await initLeafletMap(8.1650, 125.0667, 7);
        }, 100);
      }
      setLoading(false);
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      if (window.handleFarmerClick) {
        delete window.handleFarmerClick;
      }
    };
  }, []);

  // Update markers when farmers change
  useEffect(() => {
    if (leafletMapRef.current && window.L && farmers.length > 0 && mapReady) {
      addFarmerMarkers(leafletMapRef.current);
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 200);
    }
  }, [farmers, mapReady]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading farmers and map...</p>
          {geocodingProgress.total > 0 && (
            <p className="mt-2 text-gray-500 text-sm">
              Processing farmers: {geocodingProgress.current}/{geocodingProgress.total}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInOut {
          0%{opacity:0;transform:translateY(8px)}
          15%{opacity:1;transform:translateY(0)}
          85%{opacity:1}
          100%{opacity:0}
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .full-bleed {
          width: 100%;
          min-height: 100vh;
        }

        .map-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #f5f7f5;
          padding-top: 80px;
        }

        .map-container {
          flex: 1;
          max-width: 100%;
          margin: 0 auto;
          padding: 16px 20px 20px;
          width: 100%;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
          animation: fadeUp 0.3s ease both;
          flex-shrink: 0;
        }

        .map-header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          color: #1a3d2b;
          margin: 0;
        }

        .map-header-left p {
          margin: 2px 0 0;
          color: #78909c;
          font-size: 0.85rem;
        }

        .map-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .map-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }

        .map-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .map-btn-primary {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
        }

        .map-btn-blue {
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          box-shadow: 0 4px 14px rgba(21, 101, 192, 0.25);
        }

        .map-btn-danger {
          background: linear-gradient(135deg, #c62828, #d32f2f);
          color: #fff;
          box-shadow: 0 4px 14px rgba(198, 40, 40, 0.25);
        }

        .map-select {
          padding: 8px 34px 8px 14px;
          border: 1.5px solid #c8e6c9;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          color: #2E7D32;
          background: #f5fbf5;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232e7d32' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .map-select:hover, .map-select:focus {
          border-color: #2E7D32;
          outline: none;
        }

        .map-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          flex: 1;
          min-height: 0;
        }

        .map-panel {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 16px rgba(27, 94, 32, 0.06);
          overflow: hidden;
          animation: fadeUp 0.4s ease both;
          display: flex;
          flex-direction: column;
        }

        .map-panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          background: #fafffa;
          flex-shrink: 0;
        }

        .map-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1a3d2b;
          font-size: 0.9rem;
        }

        .map-wrapper {
          flex: 1;
          width: 100%;
          border-radius: 14px;
          border: 1px solid #c8e6c9;
          background: #e8f5e9;
          position: relative;
          z-index: 1;
          min-height: 400px;
        }

        .map-error {
          padding: 10px 16px;
          margin: 8px 16px;
          background: #ffebee;
          border-radius: 10px;
          border-left: 4px solid #ef5350;
          color: #c62828;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        /* ── Sidebar ── */
        .map-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
        }

        .map-sidebar-panel {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 16px rgba(27, 94, 32, 0.06);
          overflow: hidden;
          animation: fadeUp 0.4s ease 0.1s both;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .map-sidebar-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafffa;
          flex-shrink: 0;
        }

        .map-sidebar-title {
          font-weight: 600;
          color: #1a3d2b;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .map-sidebar-badge {
          background: #e8f5e9;
          color: #2E7D32;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 12px;
          border: 1px solid #c8e6c9;
        }

        .map-sidebar-body {
          padding: 10px 14px;
          flex: 1;
          overflow-y: auto;
        }

        .map-farmer-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid #eef0ee;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 6px;
        }

        .map-farmer-item:hover {
          border-color: #a5d6a7;
          background: #f5fbf5;
          transform: translateX(3px);
        }

        .map-farmer-item.selected {
          border-color: #2E7D32;
          background: #f0f9f0;
          box-shadow: 0 2px 10px rgba(46, 125, 50, 0.1);
        }

        .map-farmer-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #e8f5e9;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #c8e6c9;
        }

        .map-farmer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-farmer-avatar .fallback {
          font-size: 0.75rem;
          font-weight: 700;
          color: #2E7D32;
        }

        .map-farmer-info {
          flex: 1;
          min-width: 0;
        }

        .map-farmer-name {
          font-weight: 600;
          color: #263238;
          font-size: 0.82rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .map-farmer-location {
          font-size: 0.68rem;
          color: #78909c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .map-farmer-products {
          font-size: 0.65rem;
          color: #90a4ae;
        }

        .map-nav-btn {
          padding: 4px 10px;
          background: #2E7D32;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .map-nav-btn:hover {
          opacity: 0.85;
        }

        .map-route-chips {
          display: flex;
          gap: 10px;
          margin: 8px 16px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .map-route-chip {
          background: #f0f6ff;
          border: 1px solid #c2d4f0;
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 80px;
        }

        .map-route-chip-icon {
          width: 28px;
          height: 28px;
          background: #1565c0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .map-route-chip-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #5a7b8a;
          letter-spacing: 0.05em;
        }

        .map-route-chip-value {
          font-family: 'DM Serif Display', serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #1565c0;
        }

        .map-empty {
          text-align: center;
          padding: 30px 16px;
          color: #78909c;
        }

        .map-empty .icon {
          color: #c8e6c9;
          margin-bottom: 10px;
        }

        .map-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 4px;
          font-size: 1rem;
        }

        .map-empty p {
          margin: 0;
          font-size: 0.8rem;
        }

        .map-legend {
          display: flex;
          gap: 16px;
          padding: 6px 16px;
          flex-wrap: wrap;
          align-items: center;
          border-bottom: 1px solid #e8f5e9;
          flex-shrink: 0;
        }

        .map-tip {
          padding: 8px 16px;
          font-size: 0.72rem;
          color: #78909c;
          border-top: 1px solid #e8f5e9;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        @media (max-width: 968px) {
          .map-grid {
            grid-template-columns: 1fr;
          }
          .map-container {
            height: auto;
          }
          .map-wrapper {
            min-height: 350px;
            height: 350px;
          }
          .map-sidebar-panel {
            max-height: 300px;
          }
        }

        @media (max-width: 640px) {
          .map-header { flex-direction: column; align-items: stretch; }
          .map-header-actions { flex-direction: column; }
          .map-wrapper { height: 280px; min-height: 280px; }
          .map-route-chips { flex-direction: column; }
          .map-grid { grid-template-columns: 1fr; }
          .map-container { padding: 10px 12px 12px; }
          .map-sidebar-panel { max-height: 250px; }
        }

        .leaflet-container { 
          font-family: 'DM Sans', sans-serif !important; 
          border-radius: 14px;
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
      `}</style>

      <div className="map-root">
        <div className="map-container">
          {/* ── Header ── */}
          <div className="map-header">
            <div className="map-header-left">
              <h1>📍 Farmers Map</h1>
              <p>Find farmers with products near you</p>
            </div>
            <div className="map-header-actions">
              <select className="map-select" value={transportMode} onChange={e => changeTransportMode(e.target.value)}>
                <option value="walk">🚶 Walking</option>
                <option value="motor">🏍️ Motorcycle</option>
                <option value="car">🚗 Car</option>
              </select>
              <button className="map-btn map-btn-blue" onClick={goToMyLocation}>
                <MapPinIcon size={16} color="#fff" /> My Location
              </button>
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="map-grid">
            {/* ── Map ── */}
            <div className="map-panel">
              <div className="map-panel-header">
                <div className="map-panel-title">
                  <IconRoute size={18} color="#2E7D32" />
                  {showRoute ? `Route — ${getModeDisplayName(transportMode)}` : 'Farmers Map'}
                  {routeLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #c8e6c9',
                        borderTopColor: '#2E7D32',
                        borderRadius: '50%',
                        animation: 'spin 0.75s linear infinite'
                      }} />
                      <span style={{ fontSize: '0.7rem', color: '#2E7D32', fontWeight: '600' }}>Calculating...</span>
                    </div>
                  )}
                </div>
                {showRoute && (
                  <button className="map-btn map-btn-danger" onClick={clearRoute} style={{ padding: '4px 12px', fontSize: '0.72rem' }}>
                    <IconX size={14} color="#fff" /> Clear Route
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* ── Route Chips ── */}
                {showRoute && routeDistance && routeDuration && (
                  <div className="map-route-chips">
                    {[
                      { Icon: IconRuler, label: 'Distance', value: `${routeDistance} km` },
                      { Icon: IconClock, label: 'Est. Time', value: routeDuration },
                      { label: 'Transport', value: getModeDisplayName(transportMode) },
                    ].map((chip, i) => (
                      <div key={i} className="map-route-chip">
                        {chip.Icon && (
                          <div className="map-route-chip-icon">
                            <chip.Icon size={14} color="#fff" />
                          </div>
                        )}
                        {!chip.Icon && (
                          <div className="map-route-chip-icon">
                            {getModeIcon(transportMode)}
                          </div>
                        )}
                        <div>
                          <div className="map-route-chip-label">{chip.label}</div>
                          <div className="map-route-chip-value">{chip.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Legend ── */}
                <div className="map-legend">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2E7D32', border: '2px solid rgba(0,0,0,0.1)' }} />
                    <span style={{ fontSize: '0.72rem', color: '#546e7a' }}>Farmer</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1565c0', border: '2px solid white', boxShadow: '0 0 0 1.5px #1565c0' }} />
                    <span style={{ fontSize: '0.72rem', color: '#1565c0' }}>You</span>
                  </div>
                  {showRoute && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '22px', height: '4px', background: '#1565c0', borderRadius: '2px' }} />
                      <span style={{ fontSize: '0.72rem', color: '#1565c0' }}>Route</span>
                    </div>
                  )}
                  <span style={{ fontSize: '0.72rem', color: '#78909c', marginLeft: 'auto' }}>
                    {farmers.filter(f => f.location && f.location.lat && f.location.lng && f.location.lat !== 0 && f.location.lng !== 0).length} farmers
                  </span>
                </div>

                {/* ── Location Error ── */}
                {locationError && (
                  <div className="map-error">
                    <span>{locationError}</span>
                    <button onClick={() => setLocationError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828' }}>
                      <IconX size={16} />
                    </button>
                  </div>
                )}

                {/* ── Leaflet Map ── */}
                <div className="map-wrapper" ref={mapContainerRef} />

                {/* ── Tip ── */}
                <div className="map-tip">
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <span>Click a farmer marker or <strong>select</strong> from the list to view their location and route</span>
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="map-sidebar">
              {/* Farmers List */}
              <div className="map-sidebar-panel">
                <div className="map-sidebar-header">
                  <div className="map-sidebar-title">
                    <MapPinIcon size={16} color="#2E7D32" />
                    Farmers with Products
                  </div>
                  <span className="map-sidebar-badge">{farmers.length}</span>
                </div>
                <div className="map-sidebar-body">
                  {farmers.length === 0 ? (
                    <div className="map-empty">
                      <div className="icon"><MapPinIcon size={40} /></div>
                      <h3>No Farmers Found</h3>
                      <p>No farmers have products available in your area yet.</p>
                    </div>
                  ) : (
                    farmers.map((farmer) => {
                      const hasLocation = farmer.location && farmer.location.lat && farmer.location.lng && 
                                         farmer.location.lat !== 0 && farmer.location.lng !== 0;
                      return (
                        <div
                          key={farmer.id}
                          className={`map-farmer-item ${selectedFarmer?.id === farmer.id ? 'selected' : ''}`}
                          onClick={() => selectFarmer(farmer)}
                        >
                          <div className="map-farmer-avatar">
                            {farmer.avatar ? (
                              <img src={farmer.avatar} alt={farmer.name} onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="fallback">${farmer.name?.charAt(0) || 'F'}</span>`;
                              }} />
                            ) : (
                              <span className="fallback">{farmer.name?.charAt(0) || 'F'}</span>
                            )}
                          </div>
                          <div className="map-farmer-info">
                            <div className="map-farmer-name">{farmer.name}</div>
                            <div className="map-farmer-location">
                              {hasLocation ? 
                                `📍 ${farmer.location?.barangay || farmer.location?.city || 'Location set'}` : 
                                '📍 No location data'
                              }
                            </div>
                            <div className="map-farmer-products">{farmer.products.length} product{farmer.products.length > 1 ? 's' : ''}</div>
                          </div>
                          <button
                            className="map-nav-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateRoute(farmer);
                            }}
                            disabled={!hasLocation}
                            style={{ opacity: hasLocation ? 1 : 0.5 }}
                          >
                            <IconNavigation size={12} color="#fff" /> Route
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Farmer Details */}
              {selectedFarmer && (
                <div className="map-sidebar-panel" style={{ flex: 'none' }}>
                  <div className="map-sidebar-header">
                    <div className="map-sidebar-title">
                      <IconNavigation size={16} color="#2E7D32" />
                      Selected Farmer
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div className="map-farmer-avatar" style={{ width: '40px', height: '40px' }}>
                        {selectedFarmer.avatar ? (
                          <img src={selectedFarmer.avatar} alt={selectedFarmer.name} onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="fallback" style="font-size:1rem;">${selectedFarmer.name?.charAt(0) || 'F'}</span>`;
                          }} />
                        ) : (
                          <span className="fallback" style={{ fontSize: '1rem' }}>{selectedFarmer.name?.charAt(0) || 'F'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#263238', fontSize: '0.9rem' }}>{selectedFarmer.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#78909c' }}>
                          {selectedFarmer.products.length} products available
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#546e7a', marginBottom: '10px' }}>
                      {selectedFarmer.location && selectedFarmer.location.lat && selectedFarmer.location.lng && 
                       selectedFarmer.location.lat !== 0 && selectedFarmer.location.lng !== 0 ? (
                        `📍 ${selectedFarmer.location?.address || selectedFarmer.location?.fullAddress || `${selectedFarmer.location?.barangay}, ${selectedFarmer.location?.city}`}`
                      ) : (
                        '⚠️ No location data available for this farmer'
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="map-btn map-btn-primary"
                        onClick={() => handleNavigateRoute(selectedFarmer)}
                        style={{ flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.78rem' }}
                        disabled={!selectedFarmer.location || !selectedFarmer.location.lat || selectedFarmer.location.lat === 0}
                      >
                        <IconNavigation size={14} color="#fff" /> Navigate
                      </button>
                      <button
                        className="map-btn map-btn-blue"
                        onClick={() => {
                          const farmerProducts = products.filter(p => 
                            (p.farmer?._id === selectedFarmer.id || p.farmer === selectedFarmer.id)
                          );
                          if (farmerProducts.length > 0) {
                            navigate(`/product/${farmerProducts[0]._id}`);
                          }
                        }}
                        style={{ flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        View Products
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maps;