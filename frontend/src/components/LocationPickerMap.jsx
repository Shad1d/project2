import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Navigation, Loader2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

// Fix Leaflet default marker icon broken by Vite/Webpack bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom styled marker icon
const customMarkerIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map Controller: smooth fly-to upon coords update
function MapController({ coords, zoom = 14 }) {
  const map = useMap();

  useEffect(() => {
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      map.flyTo([coords.lat, coords.lng], zoom, { duration: 1.2 });
    }
  }, [coords, zoom, map]);

  return null;
}

// Map Click Handler: registers click events to pick coordinates
function MapClickHandler({ onLocationPick, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onLocationPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Reverse Geocoding via OpenStreetMap Nominatim
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json();
}

export function buildAddressString(nominatimData) {
  const a = nominatimData?.address || {};
  const parts = [
    a.house_number,
    a.road || a.pedestrian || a.footway,
    a.suburb || a.neighbourhood || a.quarter,
    a.city || a.town || a.village || a.county,
    a.state,
    a.country,
  ].filter(Boolean);
  return parts.join(", ") || nominatimData.display_name || "";
}

export default function LocationPickerMap({
  coords, // { lat: number, lng: number }
  address = "",
  onChange, // ({ lat, lng, address, city, countryCode }) => void
  readOnly = false,
  height = "320px",
  zoom = 13,
  label = "Select Location",
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentAddress, setCurrentAddress] = useState(address);

  // Default fallback center: Boston, MA (42.3601, -71.0589) if no coords supplied
  const defaultCenter = { lat: 42.3601, lng: -71.0589 };
  const activeCoords = coords && coords.lat && coords.lng ? coords : null;

  useEffect(() => {
    if (address) {
      setCurrentAddress(address);
    }
  }, [address]);

  // Handle location pick from map click
  const handleMapClick = async (lat, lng) => {
    if (readOnly) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const geoData = await reverseGeocode(lat, lng);
      const formatted = buildAddressString(geoData);
      const a = geoData?.address || {};
      const city = a.city || a.town || a.village || a.county || "";
      const countryCode = a.country_code ? a.country_code.toUpperCase() : "";

      setCurrentAddress(formatted);
      if (onChange) {
        onChange({
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          address: formatted,
          city,
          countryCode,
        });
      }
    } catch {
      const fallbackAddr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      setCurrentAddress(fallbackAddr);
      if (onChange) {
        onChange({
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          address: fallbackAddr,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // "Use My Current Location" via HTML5 Geolocation API
  const handleUseCurrentLocation = () => {
    if (readOnly) return;
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await handleMapClick(latitude, longitude);
      },
      (err) => {
        setLoading(false);
        setErrorMsg(
          err.code === 1
            ? "Location permission was denied. Please pick on the map."
            : "Could not retrieve your location. Try picking on the map."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Top Header / Action Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-gray-700">
            {label}
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>Use My Current Location</span>
          </button>
        </div>
      )}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Leaflet Map Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-2xs"
        style={{ height }}
      >
        <MapContainer
          center={activeCoords ? [activeCoords.lat, activeCoords.lng] : [defaultCenter.lat, defaultCenter.lng]}
          zoom={zoom}
          scrollWheelZoom={!readOnly}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Smooth Map Panning/Flying */}
          <MapController coords={activeCoords} zoom={zoom} />

          {/* Map Click Listener */}
          {!readOnly && <MapClickHandler onLocationPick={handleMapClick} disabled={loading} />}

          {/* Marker at picked location */}
          {activeCoords && (
            <Marker
              position={[activeCoords.lat, activeCoords.lng]}
              icon={customMarkerIcon}
            >
              <Popup>
                <div className="text-xs leading-normal font-sans">
                  <strong className="block text-gray-900 mb-1">Selected Location:</strong>
                  <span>{currentAddress || `${activeCoords.lat}, ${activeCoords.lng}`}</span>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-gray-100 text-xs font-semibold text-gray-700">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Detecting location & address...</span>
            </div>
          </div>
        )}

        {/* Helper Badge Overlay on Map */}
        {!readOnly && (
          <div className="absolute bottom-2 left-2 z-[999] bg-white/90 backdrop-blur-xs border border-gray-200/80 px-2.5 py-1 rounded-md text-[10px] text-gray-600 pointer-events-none shadow-2xs">
            Click anywhere on map to drop pin
          </div>
        )}
      </div>

      {/* Current Address & Coordinate Readout */}
      {activeCoords && (
        <div className="flex items-start gap-2 p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-700">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-900 block truncate">
              {currentAddress || "Custom Map Pin"}
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              Coordinates: {activeCoords.lat.toFixed(4)}, {activeCoords.lng.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
