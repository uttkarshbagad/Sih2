import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import locationSocket from '../utils/socketService';
import {
  Search, MapPin, LocateFixed, RefreshCw, Cloud, Zap
} from 'lucide-react';

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center[0] && center[1]) {
      map.invalidateSize();
      map.flyTo(center, 12, { animate: true, duration: 1.4 });
    }
  }, [center, map]);
  return null;
}

const WMO_CODE = {
  0: { en: 'Clear Sky', hi: 'साफ आसमान', or: 'ସ୍ଵଚ୍ଛ ଆକାଶ', emoji: '☀️' },
  1: { en: 'Mainly Clear', hi: 'मुख्यतः साफ', or: 'ମୁଖ୍ୟତଃ ସ୍ଵଚ୍ଛ', emoji: '🌤️' },
  2: { en: 'Partly Cloudy', hi: 'आंशिक बादल', or: 'ଆଂଶିକ ମେଘ', emoji: '⛅' },
  3: { en: 'Overcast', hi: 'बादलों से ढका', or: 'ମେଘାଚ୍ଛନ୍ନ', emoji: '☁️' },
  45: { en: 'Foggy', hi: 'कोहरा', or: 'କୁହୁଡ଼ି', emoji: '🌫️' },
  48: { en: 'Rime Fog', hi: 'बर्फीला कोहरा', or: 'ବରଫ କୁହୁଡ଼ି', emoji: '🌫️' },
  51: { en: 'Light Drizzle', hi: 'हल्की बूंदाबांदी', or: 'ହାଲୁକା ବୃଷ୍ଟି', emoji: '🌦️' },
  53: { en: 'Moderate Drizzle', hi: 'मध्यम बूंदाबांदी', or: 'ମଧ୍ୟମ ବୃଷ୍ଟି', emoji: '🌦️' },
  55: { en: 'Dense Drizzle', hi: 'तेज बूंदाबांदी', or: 'ତୀବ୍ର ବୃଷ୍ଟି', emoji: '🌧️' },
  61: { en: 'Slight Rain', hi: 'हल्की बारिश', or: 'ହାଲୁକା ବର୍ଷା', emoji: '🌧️' },
  63: { en: 'Moderate Rain', hi: 'मध्यम बारिश', or: 'ମଧ୍ୟମ ବର୍ଷା', emoji: '🌧️' },
  65: { en: 'Heavy Rain', hi: 'भारी बारिश', or: 'ପ୍ରବଳ ବର୍ଷା', emoji: '🌧️' },
  71: { en: 'Slight Snow', hi: 'हल्का हिमपात', or: 'ହାଲୁକା ବରଫ', emoji: '🌨️' },
  73: { en: 'Moderate Snow', hi: 'मध्यम हिमपात', or: 'ମଧ୍ୟମ ବରଫ', emoji: '🌨️' },
  75: { en: 'Heavy Snow', hi: 'भारी हिमपात', or: 'ପ୍ରବଳ ବରଫ', emoji: '❄️' },
  80: { en: 'Slight Showers', hi: 'हल्की बारिश', or: 'ହାଲୁକା ବର୍ଷା', emoji: '🌦️' },
  81: { en: 'Moderate Showers', hi: 'मध्यम बारिश', or: 'ମଧ୍ୟମ ବର୍ଷା', emoji: '🌧️' },
  82: { en: 'Violent Showers', hi: 'तेज बारिश', or: 'ତୀବ୍ର ବର୍ଷା', emoji: '⛈️' },
  95: { en: 'Thunderstorm', hi: 'तूफान', or: 'ଝଡ଼', emoji: '⛈️' },
  96: { en: 'Thunderstorm + Hail', hi: 'तूफान + ओले', or: 'ଝଡ଼ + ଶିଳାହୃଷ୍ଟ', emoji: '⛈️' },
  99: { en: 'Thunderstorm + Heavy Hail', hi: 'तूफान + भारी ओले', or: 'ଝଡ଼ + ପ୍ରବଳ ଶିଳାହୃଷ୍ଟ', emoji: '⛈️' },
};

function getWMO(code, lang = 'en') {
  const entry = WMO_CODE[code] || WMO_CODE[0];
  return { emoji: entry.emoji, label: entry[lang] || entry.en };
}

// 30 Odisha Districts Coordinates Lookup Table
const ODISHA_DISTRICT_COORDS = {
  'Angul': { lat: 20.8400, lon: 85.1000 },
  'Balasore': { lat: 21.4934, lon: 86.9135 },
  'Baleshwar': { lat: 21.4934, lon: 86.9135 },
  'Bargarh': { lat: 21.3323, lon: 83.6200 },
  'Bhadrak': { lat: 21.0575, lon: 86.4965 },
  'Bolangir': { lat: 20.7088, lon: 83.4839 },
  'Balangir': { lat: 20.7088, lon: 83.4839 },
  'Boudh': { lat: 20.8407, lon: 84.3267 },
  'Cuttack': { lat: 20.4625, lon: 85.8828 },
  'Deogarh': { lat: 21.5348, lon: 84.7338 },
  'Dhenkanal': { lat: 20.6625, lon: 85.5972 },
  'Gajapati': { lat: 18.7758, lon: 84.0886 },
  'Ganjam': { lat: 19.3150, lon: 84.7941 },
  'Jagatsinghpur': { lat: 20.2678, lon: 86.1724 },
  'Jajpur': { lat: 20.8500, lon: 86.3300 },
  'Jharsuguda': { lat: 21.8574, lon: 84.0075 },
  'Kalahandi': { lat: 19.9075, lon: 83.1659 },
  'Kandhamal': { lat: 20.4735, lon: 84.2323 },
  'Kendrapara': { lat: 20.5000, lon: 86.4200 },
  'Keonjhar': { lat: 21.6289, lon: 85.5817 },
  'Khordha': { lat: 20.2961, lon: 85.8245 },
  'Koraput': { lat: 18.8135, lon: 82.7123 },
  'Malkangiri': { lat: 18.3444, lon: 81.8845 },
  'Mayurbhanj': { lat: 21.9333, lon: 86.7333 },
  'Nabarangpur': { lat: 19.2312, lon: 82.5487 },
  'Nayagarh': { lat: 20.1294, lon: 85.1054 },
  'Nuapada': { lat: 20.8333, lon: 82.5333 },
  'Puri': { lat: 19.8135, lon: 85.8312 },
  'Rayagada': { lat: 19.1711, lon: 83.4163 },
  'Sambalpur': { lat: 21.4669, lon: 83.9812 },
  'Subarnapur': { lat: 20.8398, lon: 83.9168 },
  'Sonepur': { lat: 20.8398, lon: 83.9168 },
  'Sundargarh': { lat: 22.2604, lon: 84.8536 },
};

const NEARBY_BLOCKS = [
  { name: 'Bhubaneswar', district: 'Khordha', lat: 20.2961, lon: 85.8245 },
  { name: 'Cuttack', district: 'Cuttack', lat: 20.4625, lon: 85.8828 },
  { name: 'Puri', district: 'Puri', lat: 19.8135, lon: 85.8312 },
  { name: 'Rajkanika', district: 'Kendrapara', lat: 20.7300, lon: 86.6600 },
  { name: 'Jajpur', district: 'Jajpur', lat: 20.8500, lon: 86.3300 },
  { name: 'Balasore', district: 'Balasore', lat: 21.4934, lon: 86.9135 },
  { name: 'Sambalpur', district: 'Sambalpur', lat: 21.4669, lon: 83.9812 },
  { name: 'Berhampur', district: 'Ganjam', lat: 19.3150, lon: 84.7941 },
  { name: 'Koraput', district: 'Koraput', lat: 18.8135, lon: 82.7123 },
  { name: 'Rourkela', district: 'Sundargarh', lat: 22.2604, lon: 84.8536 },
  { name: 'Angul', district: 'Angul', lat: 20.8400, lon: 85.1000 },
  { name: 'Kalahandi', district: 'Kalahandi', lat: 19.9075, lon: 83.1659 }
];

export const RiskMapPage = () => {
  const { selectedBlock, selectedDistrict, selectedPanchayat, farmerLanguage, user, changeLocation } = useApp();
  const lang = farmerLanguage || 'en';

  const [pincode, setPincode] = useState('');
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [blockWeathers, setBlockWeathers] = useState({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState('esri-satellite');
  const [showClouds, setShowClouds] = useState(true);
  const [radarTimestamp, setRadarTimestamp] = useState(null);
  const [localMarkers, setLocalMarkers] = useState(NEARBY_BLOCKS);
  const isPincodeSearchRef = useRef(false);

  const getTileUrl = (style) => {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  };

  const normalizeDistrictName = (distName) => {
    if (!distName) return '';
    const lower = distName.toLowerCase();
    if (lower.includes('baleswar') || lower.includes('balasore')) return 'Balasore';
    if (lower.includes('khurda') || lower.includes('khordha')) return 'Khordha';
    if (lower.includes('bolangir') || lower.includes('balangir')) return 'Bolangir';
    if (lower.includes('subarnapur') || lower.includes('sonepur')) return 'Subarnapur';
    if (lower.includes('keonjhar') || lower.includes('kendujhar')) return 'Keonjhar';
    if (lower.includes('kandhamal') || lower.includes('phulbani')) return 'Kandhamal';
    return distName;
  };

  const parseLocationFromNominatim = (item, fallbackQuery) => {
    if (!item) return null;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const addr = item.address || {};

    const state = addr.state || addr.region || '';
    const rawDistrict = addr.state_district || addr.district || addr.county || addr.city_district || addr.city || '';
    const district = rawDistrict.replace(/ district/i, '').trim() || state || fallbackQuery;
    const place = addr.village || addr.suburb || addr.town || addr.city || addr.municipality || addr.neighbourhood || addr.amenity || item.name || fallbackQuery;

    let countrySubtitle = '';
    if (state && state.toLowerCase() === 'odisha') {
      countrySubtitle = district && district.toLowerCase() !== 'odisha' ? `${district}, Odisha` : 'Odisha';
    } else if (district && state && district.toLowerCase() !== state.toLowerCase()) {
      countrySubtitle = `${district}, ${state}`;
    } else if (state) {
      countrySubtitle = `${state}, ${addr.country || 'India'}`;
    } else {
      countrySubtitle = addr.country || 'India';
    }

    return {
      lat,
      lon,
      placeName: place,
      districtName: district,
      stateName: state,
      countrySubtitle
    };
  };

  // Fetch RainViewer real-time cloud & precipitation radar timestamp
  useEffect(() => {
    const fetchRadar = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const latestTime = data.radar?.nowcast?.[0]?.time || data.radar?.past?.[data.radar?.past?.length - 1]?.time;
        if (latestTime) setRadarTimestamp(latestTime);
      } catch (err) {
        console.warn('RainViewer fetch error:', err);
      }
    };
    fetchRadar();
  }, []);

  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const data = await res.json();
      setWeather(data.current);
      setForecast(data.daily);
    } catch (err) {
      console.warn('Weather fetch failed:', err);
    }
  }, []);

  // Fetch weather for a list of local markers
  const fetchWeatherForMarkers = useCallback(async (markersList) => {
    if (!markersList || !markersList.length) return;
    try {
      const lats = markersList.map(b => b.lat).join(',');
      const lons = markersList.map(b => b.lon).join(',');
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,relative_humidity_2m,precipitation&timezone=auto`);
      const data = await res.json();
      const weatherMap = {};

      if (Array.isArray(data)) {
        data.forEach((item, idx) => {
          if (markersList[idx]) weatherMap[markersList[idx].name] = item.current;
        });
      } else if (data.current && markersList[0]) {
        weatherMap[markersList[0].name] = data.current;
      }
      setBlockWeathers(weatherMap);
    } catch (err) {
      console.warn('Marker weather fetch error:', err);
    }
  }, []);

  // Initial fetch for nearby blocks
  useEffect(() => {
    fetchWeatherForMarkers(NEARBY_BLOCKS);
  }, [fetchWeatherForMarkers]);

  // Sync function that accurately geocodes District/Block/Panchayat without returning hardcoded Bhubaneswar
  const syncMapLocation = useCallback(async (targetDistrict, targetBlock, targetPanchayat) => {
    if (isPincodeSearchRef.current && (Date.now() - isPincodeSearchRef.current < 10000)) {
      return;
    }

    const d = targetDistrict || selectedDistrict || 'Khordha';
    const b = targetBlock || selectedBlock || 'Bhubaneswar';
    const p = targetPanchayat || selectedPanchayat || '';

    setLoading(true);
    const displayName = p ? `${b} • ${p}` : b;

    let finalLat = null;
    let finalLon = null;
    let countrySubtitle = ODISHA_DISTRICT_COORDS[d] ? `${d}, Odisha` : `${d}, India`;

    try {
      const searchTerms = [
        p ? `${p}, ${d}, Odisha, India` : null,
        `${b}, ${d}, Odisha, India`,
        `${b}, ${d}, India`,
        `${d}, India`
      ].filter(Boolean);

      for (const query of searchTerms) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`);
          const data = await res.json();
          if (data && data.length) {
            const parsed = parseLocationFromNominatim(data[0], b);
            if (parsed) {
              finalLat = parsed.lat;
              finalLon = parsed.lon;
              countrySubtitle = parsed.countrySubtitle;
            }
            break;
          }
        } catch (e) {
          console.warn('Geocoding query error:', query, e);
        }
      }

      if (!finalLat || !finalLon) {
        const districtLookup = ODISHA_DISTRICT_COORDS[d] || ODISHA_DISTRICT_COORDS[b] || ODISHA_DISTRICT_COORDS['Khordha'];
        finalLat = districtLookup ? districtLookup.lat : 20.2961;
        finalLon = districtLookup ? districtLookup.lon : 85.8245;
        if (!ODISHA_DISTRICT_COORDS[d]) {
          countrySubtitle = `${d}, India`;
        }
      }

      setCoords({ lat: finalLat, lon: finalLon, name: displayName, country: countrySubtitle });
      await fetchWeather(finalLat, finalLon);

      // Generate surrounding markers around target location
      const surroundAngles = [0, 60, 120, 180, 240, 300];
      const generated = surroundAngles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return {
          name: i === 0 ? `${b} North` : i === 1 ? `${b} East` : i === 2 ? `${b} South` : `${b} GP-${i + 1}`,
          district: d,
          lat: finalLat + Math.sin(rad) * 0.04,
          lon: finalLon + Math.cos(rad) * 0.05
        };
      });
      setLocalMarkers(generated);
      await fetchWeatherForMarkers(generated);

      setStatus(`📍 ${displayName}, ${countrySubtitle}`);
    } catch (err) {
      console.warn('Location sync error:', err);
      const fallback = ODISHA_DISTRICT_COORDS[d] || ODISHA_DISTRICT_COORDS['Khordha'];
      setCoords({ lat: fallback.lat, lon: fallback.lon, name: displayName, country: countrySubtitle });
      await fetchWeather(fallback.lat, fallback.lon);
    }
    setLoading(false);
  }, [selectedDistrict, selectedBlock, selectedPanchayat, fetchWeather, fetchWeatherForMarkers]);

  // Subscribe to real-time socket / event bus for IMMEDIATE map refresh when Navbar location changes
  useEffect(() => {
    const unsubscribe = locationSocket.subscribe((detail) => {
      syncMapLocation(detail.district, detail.block, detail.panchayat);
    });

    return () => unsubscribe();
  }, [syncMapLocation]);

  // Sync map location on initial mount or when Context values change
  useEffect(() => {
    syncMapLocation(selectedDistrict, selectedBlock, selectedPanchayat);
  }, [selectedDistrict, selectedBlock, selectedPanchayat, syncMapLocation]);

  const handleSelectBlockMarker = async (block) => {
    setLoading(true);
    setCoords({ lat: block.lat, lon: block.lon, name: block.name, country: block.district });
    changeLocation(block.district, block.name);
    await fetchWeather(block.lat, block.lon);
    setStatus(`📍 ${block.name}, ${block.district}`);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = pincode.trim();
    if (!query) {
      setStatus(lang === 'hi' ? 'स्थान या पिनकोड लिखें' : lang === 'or' ? 'ସ୍ଥାନ କିମ୍ବା ପିନକୋଡ୍ ଲେଖନ୍ତୁ' : 'Enter place name or pincode');
      return;
    }

    setLoading(true);
    setStatus(lang === 'hi' ? 'खोज रहे हैं...' : lang === 'or' ? 'ସନ୍ଧାନ କରୁଛି...' : 'Searching...');
    isPincodeSearchRef.current = Date.now();

    try {
      let lat = null;
      let lon = null;
      let locationName = query;
      let districtName = '';
      let countrySubtitle = '';
      let postOfficesList = [];
      const isPincode = /^\d{6}$/.test(query);

      if (isPincode) {
        // 1. Fetch official India Post details for Pincode
        try {
          const pinRes = await fetch(`https://api.postalpincode.in/pincode/${query}`);
          const pinData = await pinRes.json();
          if (pinData[0]?.Status === 'Success' && pinData[0]?.PostOffice?.length) {
            postOfficesList = pinData[0].PostOffice;
            const mainPo = postOfficesList[0];
            districtName = mainPo.District;
            locationName = mainPo.Name;
            countrySubtitle = mainPo.State ? `${districtName}, ${mainPo.State}` : `${districtName}, India`;
          }
        } catch (err) {
          console.warn('Postal pincode API error:', err);
        }

        // Fetch coordinates from OpenStreetMap Nominatim for pincode
        const geoQueries = [
          `https://nominatim.openstreetmap.org/search?q=${query}+India&format=json&limit=1&addressdetails=1`,
          locationName ? `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}+${encodeURIComponent(districtName)}+India&format=json&limit=1&addressdetails=1` : null
        ].filter(Boolean);

        for (const queryUrl of geoQueries) {
          try {
            const nomRes = await fetch(queryUrl);
            const nomData = await nomRes.json();
            if (nomData && nomData.length) {
              const parsed = parseLocationFromNominatim(nomData[0], locationName);
              if (parsed) {
                lat = parsed.lat;
                lon = parsed.lon;
                if (!countrySubtitle) countrySubtitle = parsed.countrySubtitle;
                if (!districtName) districtName = parsed.districtName;
              }
              break;
            }
          } catch (e) {
            console.warn('Nominatim query error:', e);
          }
        }

        if (!districtName) districtName = selectedDistrict || 'Khordha';
        if (!countrySubtitle) countrySubtitle = `${districtName}, Odisha`;
      } else {
        // 2. Geocode Place / GP / Village / State Name via OpenStreetMap Nominatim
        const geoQueries = [
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+India&format=json&limit=1&addressdetails=1`
        ];

        for (const queryUrl of geoQueries) {
          try {
            const nomRes = await fetch(queryUrl);
            const nomData = await nomRes.json();
            if (nomData && nomData.length) {
              const parsed = parseLocationFromNominatim(nomData[0], query);
              if (parsed) {
                lat = parsed.lat;
                lon = parsed.lon;
                locationName = parsed.placeName;
                districtName = parsed.districtName;
                countrySubtitle = parsed.countrySubtitle;
              }
              break;
            }
          } catch (e) {
            console.warn('Place Nominatim error:', e);
          }
        }
      }

      // Fallback to district lookup ONLY if geocoding yields no coords at all
      if (!lat || !lon) {
        const lookupKey = normalizeDistrictName(query) || districtName || selectedDistrict || 'Khordha';
        const dCoords = ODISHA_DISTRICT_COORDS[lookupKey] || ODISHA_DISTRICT_COORDS['Khordha'];
        lat = dCoords.lat;
        lon = dCoords.lon;
        districtName = lookupKey;
        countrySubtitle = `${districtName}, Odisha`;
      }

      const fullDisplayName = isPincode ? `${locationName} (${query})` : locationName;

      // Update map center & fetch weather
      setCoords({ lat, lon, name: fullDisplayName, country: countrySubtitle });
      await fetchWeather(lat, lon);

      // Globally update AppContext location if district exists
      changeLocation(districtName, locationName, null, locationName);
      if (isPincode) localStorage.setItem('moes_user_pincode', query);

      // Generate dynamic local GP / surrounding markers
      let newMarkers = [];
      if (postOfficesList.length > 1) {
        newMarkers = postOfficesList.slice(0, 8).map((po, idx) => {
          const count = Math.min(postOfficesList.length, 8);
          const angle = (idx / count) * 2 * Math.PI;
          const distOffset = 0.03 + (idx % 3) * 0.02;
          return {
            name: po.Name,
            district: po.Block || districtName,
            lat: lat + Math.sin(angle) * distOffset,
            lon: lon + Math.cos(angle) * (distOffset * 1.1)
          };
        });
      } else {
        const angles = [0, 60, 120, 180, 240, 300];
        newMarkers = angles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return {
            name: i === 0 ? `${locationName} North` : i === 1 ? `${locationName} East` : `${locationName} GP-${i + 1}`,
            district: districtName,
            lat: lat + Math.sin(rad) * 0.03,
            lon: lon + Math.cos(rad) * 0.04
          };
        });
      }

      setLocalMarkers(newMarkers);
      await fetchWeatherForMarkers(newMarkers);

      setStatus(`📍 ${fullDisplayName}, ${countrySubtitle}`);
    } catch (err) {
      console.error('Search error:', err);
      setStatus(lang === 'hi' ? 'खोज में त्रुटि' : lang === 'or' ? 'ସନ୍ଧାନ ତ୍ରୁଟି' : 'Search error');
    }
    setLoading(false);
  };

  const w = weather;
  const f = forecast;
  const wmo = w ? getWMO(w.weather_code, lang) : null;

  return (
    <div className="flex-1 relative bg-slate-950 w-full h-[calc(100vh-4rem)] overflow-hidden font-sans">
      
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Search Box (Accepts Place, GP, Village or 6-digit Pincode) */}
        <form onSubmit={handleSearch} className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-3 py-2 rounded-2xl shadow-2xl">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Search Place, GP or PIN (e.g. Konark, 756026)..."
            className="w-56 sm:w-72 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none font-sans font-semibold"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            <span>Search</span>
          </button>
        </form>

        {/* Right: Map Style Buttons & Location Badge (Exact Match with Reference Image) */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-1 rounded-2xl shadow-2xl flex items-center text-xs">
            <div className="px-3 py-1.5 rounded-xl font-bold bg-cyan-600 text-white shadow-md flex items-center gap-1.5">
              <span>🌍 Satellite Map</span>
            </div>
            <button
              onClick={() => setShowClouds(!showClouds)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showClouds ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌧️ Radar Overlay</span>
            </button>
          </div>

          {coords && (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-2">
              <LocateFixed className="h-4 w-4 text-cyan-400 animate-pulse" />
              <div>
                <div className="text-xs font-black text-white">{coords.name}</div>
                <div className="text-[9px] text-cyan-400 font-semibold">{coords.country}</div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Main Fullscreen GIS Leaflet Map */}
      <MapContainer
        center={coords ? [coords.lat, coords.lon] : [20.2961, 85.8245]}
        zoom={coords ? 10 : 8}
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        <MapRecenter center={coords ? [coords.lat, coords.lon] : null} />

        <TileLayer
          attribution='&copy; Esri, Maxar, Earthstar Geographics &copy; OpenStreetMap | MoES NCMRWF'
          url={getTileUrl(mapStyle)}
          maxNativeZoom={17}
          maxZoom={19}
        />

        {/* Real-time Weather Cloud & Rain Radar Tile Overlay Layer */}
        {showClouds && radarTimestamp && (
          <TileLayer
            url={`https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.6}
            zIndex={400}
            maxNativeZoom={7}
            maxZoom={19}
          />
        )}

        {/* Render Interactive Weather Pins for Surrounding Odisha Blocks */}
        {localMarkers.map((block) => {
          const bw = blockWeathers[block.name];
          const bwmo = bw ? getWMO(bw.weather_code, lang) : { emoji: '🌤️' };
          const tempDisplay = bw ? `${Math.round(bw.temperature_2m)}°` : '--';
          const isSelected = coords?.name?.includes(block.name);

          return (
            <Marker
              key={block.name}
              position={[block.lat, block.lon]}
              eventHandlers={{
                click: () => handleSelectBlockMarker(block)
              }}
              icon={L.divIcon({
                html: `<div style="position:relative;display:flex;align-items:center;gap:6px;background:${isSelected ? 'rgba(14,116,144,0.95)' : 'rgba(15,23,42,0.9)'};border:${isSelected ? '2px solid #38bdf8' : '1px solid rgba(148,163,184,0.3)'};padding:4px 8px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.6);backdrop-filter:blur(8px);cursor:pointer;transition:all 0.2s ease;">
                  <span style="font-size:16px;">${bwmo.emoji}</span>
                  <div style="display:flex;flex-direction:column;">
                    <span style="font-family:system-ui;font-size:10px;font-weight:900;color:white;line-height:1.1;">${block.name}</span>
                    <span style="font-family:system-ui;font-size:9px;font-weight:700;color:${isSelected ? '#bae6fd' : '#94a3b8'};">${block.district}</span>
                  </div>
                  <span style="font-family:system-ui;font-size:12px;font-weight:900;color:#38bdf8;margin-left:4px;">${tempDisplay}</span>
                  <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${isSelected ? '#0e7490' : '#0f172a'};"></div>
                </div>`,
                className: 'block-weather-marker',
                iconSize: [110, 36],
                iconAnchor: [55, 36]
              })}
            />
          );
        })}

        {/* Selected Location Target Pin Marker */}
        {coords && (
          <Marker
            position={[coords.lat, coords.lon]}
            icon={L.divIcon({
              html: `<div style="position:relative;display:flex;align-items:center;gap:6px;background:rgba(225,29,72,0.95);border:2px solid #f43f5e;padding:4px 8px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.6);backdrop-filter:blur(8px);cursor:pointer;">
                <span style="font-size:16px;">📍</span>
                <div style="display:flex;flex-direction:column;">
                  <span style="font-family:system-ui;font-size:10px;font-weight:900;color:white;line-height:1.1;">${coords.name}</span>
                  <span style="font-family:system-ui;font-size:9px;font-weight:700;color:#fecdd3;">${coords.country}</span>
                </div>
                <span style="font-family:system-ui;font-size:12px;font-weight:900;color:white;margin-left:4px;">${w ? `${Math.round(w.temperature_2m)}°` : ''}</span>
              </div>`,
              className: 'custom-location-marker',
              iconSize: [120, 36],
              iconAnchor: [60, 36]
            })}
          />
        )}
      </MapContainer>

      {/* Floating Bottom Weather Forecast Widget Card (Exact Match with Reference Image) */}
      {w && wmo && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] w-[95%] max-w-4xl bg-slate-900/92 backdrop-blur-2xl border border-slate-700/80 p-4 sm:p-5 rounded-3xl shadow-2xl space-y-4">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Main Current Weather Block */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="text-5xl sm:text-6xl drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                {wmo.emoji}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">{Math.round(w.temperature_2m)}°</span>
                  <span className="text-sm font-bold text-cyan-400">{wmo.label}</span>
                </div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>{coords?.name}</span>
                  <span className="text-xs text-slate-400 font-semibold">({coords?.country})</span>
                </h2>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-300 mt-1">
                  <span>{lang === 'hi' ? 'अनुभव' : lang === 'or' ? 'ଅନୁଭବ' : 'Feels'}: {Math.round(w.apparent_temperature)}°C</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-cyan-300">💧 {w.relative_humidity_2m}%</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-sky-300">💨 {Math.round(w.wind_speed_10m)} km/h</span>
                </div>
              </div>
            </div>

            {/* Right: 7-Day Forecast Strip (Exact Match with Reference Image) */}
            {f && (
              <div className="w-full md:w-auto flex-1 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1">
                  <Cloud className="h-3 w-3" />
                  <span>{lang === 'hi' ? '7-दिवसीय मौसम पूर्वानुमान' : lang === 'or' ? '୭-ଦିନିଆ ପାଣିପାଗ ପୂର୍ବାନୁମାନ' : '7-DAY WEATHER OUTLOOK'}</span>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center">
                  {f.time?.slice(0, 7).map((date, i) => {
                    const dayWMO = getWMO(f.weather_code[i], lang);
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={date} className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{dayName}</span>
                        <span className="text-base my-0.5">{dayWMO.emoji}</span>
                        <div className="text-[10px] font-black text-white">
                          {Math.round(f.temperature_2m_max[i])}°
                        </div>
                        <div className="text-[9px] font-bold text-slate-500">
                          {Math.round(f.temperature_2m_min[i])}°
                        </div>
                        {f.precipitation_sum[i] > 0 && (
                          <div className="text-[8px] font-bold text-cyan-400 mt-0.5">
                            {f.precipitation_sum[i]}m
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[600] bg-slate-950/70 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-900/95 px-6 py-4 rounded-2xl border border-slate-700 shadow-2xl">
            <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
            <span className="text-xs font-black text-white">{lang === 'hi' ? 'मौसम लोड हो रहा है...' : lang === 'or' ? 'ପାଣିପାଗ ଲୋଡ୍ ହେଉଛି...' : 'Syncing GIS Risk Map...'}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default RiskMapPage;

/** GIS Risk Map - Interactive Leaflet Radar & Geocoding Layer */
