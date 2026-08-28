"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineMapPin, HiOutlineMagnifyingGlass, HiOutlineCheck } from "react-icons/hi2";
import "leaflet/dist/leaflet.css";

export default function InteractiveMapPicker({
  selectedLat,
  selectedLng,
  onSelectLocation,
  height = "340px",
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [addressDetails, setAddressDetails] = useState(null);

  // Default center: Tashkent (41.311, 69.240)
  const defaultLat = selectedLat ? Number(selectedLat) : 41.311081;
  const defaultLng = selectedLng ? Number(selectedLng) : 69.240562;

  useEffect(() => {
    let isMounted = true;

    // Dynamically import Leaflet to avoid SSR window errors
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon assets
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialize map instance if not already created
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: selectedLat && selectedLng ? 15 : 12,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        // Add initial marker if coordinates are provided
        if (selectedLat && selectedLng) {
          const marker = L.marker([Number(selectedLat), Number(selectedLng)], { draggable: true }).addTo(map);
          markerRef.current = marker;

          marker.on("dragend", (e) => {
            const { lat, lng } = e.target.getLatLng();
            handleLocationChosen(lat, lng, L);
          });
        }

        // Map Click Listener to move/place marker pin
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          handleLocationChosen(lat, lng, L);
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLat || !selectedLng) return;
    const L = window.L;
    const lat = Number(selectedLat);
    const lng = Number(selectedLng);

    if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (L) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        markerRef.current = marker;

        marker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          handleLocationChosen(pos.lat, pos.lng, L);
        });
      }
    }
  }, [selectedLat, selectedLng]);

  // Handle location selection with reverse geocoding
  const handleLocationChosen = async (lat, lng, L_lib) => {
    const latFixed = Number(lat.toFixed(6));
    const lngFixed = Number(lng.toFixed(6));

    // Move marker pin
    if (mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const L = L_lib || window.L;
        if (L) {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
          markerRef.current = marker;

          marker.on("dragend", (e) => {
            const pos = e.target.getLatLng();
            handleLocationChosen(pos.lat, pos.lng, L);
          });
        }
      }
    }

    // Trigger basic coordinate callback immediately
    onSelectLocation?.({
      latitude: latFixed,
      longitude: lngFixed,
    });

    // Reverse geocode via Nominatim
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latFixed}&lon=${lngFixed}&format=json&accept-language=uz`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.state || "";
        const road = addr.road || addr.street || addr.suburb || addr.neighbourhood || "";
        const house = addr.house_number ? `${addr.house_number}-uy` : "";
        const formattedAddress = [road, house].filter(Boolean).join(", ") || data.display_name || "";

        const detailedResult = {
          latitude: latFixed,
          longitude: lngFixed,
          address: formattedAddress,
          city: city,
          displayName: data.display_name,
        };

        setAddressDetails(detailedResult);
        onSelectLocation?.(detailedResult);
      }
    } catch {
      // Fallback if reverse geocoding is slow or blocked
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search address on map
  const handleSearchAddress = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}&format=json&limit=1&accept-language=uz`
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const top = results[0];
          const lat = parseFloat(top.lat);
          const lng = parseFloat(top.lon);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            handleLocationChosen(lat, lng);
          }
        }
      }
    } catch {
      // Error handling
    } finally {
      setIsSearching(false);
    }
  };

  // Get current GPS location
  const handleCurrentGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          handleLocationChosen(lat, lng);
        }
      },
      () => {},
      { timeout: 10000 }
    );
  };

  return (
    <div className={`w-full bg-bg-card border border-border-base rounded-2xl overflow-hidden shadow-sm space-y-0 ${className}`}>
      {/* Header Bar */}
      <div className="p-3 bg-bg-base/80 border-b border-border-base flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold w-full sm:w-auto">
          <HiOutlineMapPin className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Xaritadan joyni ustiga bosing (Koordinat avtomatik tanlanadi)</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchAddress} className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Ko'cha, shahar qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border-base bg-bg-card text-text-base outline-none focus:border-indigo-500"
            />
            <HiOutlineMagnifyingGlass className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          </form>
          <button
            type="button"
            onClick={handleCurrentGPS}
            className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold rounded-lg border border-indigo-500/30 transition-all shrink-0 cursor-pointer"
            title="Mening GPS joylashuvim"
          >
            GPS
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Loading overlay for reverse geocoding */}
        {isReverseGeocoding && (
          <div className="absolute top-3 right-3 z-20 px-3 py-1.5 bg-black/75 backdrop-blur-xs text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg animate-pulse">
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Manzil aniqlanmoqda...
          </div>
        )}
      </div>

      {/* Footer Selected Coordinates info */}
      <div className="p-3 bg-bg-base/90 border-t border-border-base flex flex-wrap items-center justify-between gap-2 text-xs">
        {selectedLat && selectedLng ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <HiOutlineCheck className="w-4 h-4" />
              <span>Tanlangan koordinata:</span>
            </div>
            <span className="font-mono text-slate-300">
              Lat: {Number(selectedLat).toFixed(6)}, Lng: {Number(selectedLng).toFixed(6)}
            </span>
          </div>
        ) : (
          <div className="text-slate-400 italic">Hali koordinata tanlanmadi. Xaritadagi istalgan nuqtani bosing.</div>
        )}

        {addressDetails?.address && (
          <div className="text-slate-300 truncate max-w-md font-medium text-[11px]" title={addressDetails.displayName}>
            📍 {addressDetails.city ? `${addressDetails.city}, ` : ""}{addressDetails.address}
          </div>
        )}
      </div>
    </div>
  );
}
