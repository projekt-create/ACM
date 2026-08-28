"use client";

import { HiOutlineMapPin, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";

export default function GoogleMapEmbed({
  lat,
  lng,
  name,
  address,
  height = "280px",
  zoom = 15,
  className = "",
}) {
  const hasCoords = lat !== null && lat !== undefined && lng !== null && lng !== undefined && lat !== "" && lng !== "";

  if (!hasCoords && !address && !name) {
    return (
      <div
        className={`w-full bg-bg-base/50 border border-border-base rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center ${className}`}
        style={{ height }}
      >
        <HiOutlineMapPin className="w-8 h-8 text-slate-500 mb-2" />
        <p className="text-xs font-semibold">Xaritada ko'rsatish uchun koordinata yoki manzil kiriting</p>
      </div>
    );
  }

  const query = hasCoords ? `${lat},${lng}` : encodeURIComponent(`${name || ''} ${address || ''}`);
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${query}&z=${zoom}&output=embed`;
  const mapsExternalUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name || ''} ${address || ''}`)}`;

  return (
    <div className={`w-full overflow-hidden border border-border-base rounded-xl bg-bg-card shadow-xs relative group ${className}`}>
      <div className="relative w-full" style={{ height }}>
        <iframe
          title={`Google Maps - ${name || "Salon joylashuvi"}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapsEmbedUrl}
          className="w-full h-full border-0 filter dark:contrast-105"
          loading="lazy"
          allowFullScreen
        />
      </div>

      <div className="p-3 bg-bg-base/90 backdrop-blur-xs border-t border-border-base flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate">
          <HiOutlineMapPin className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="font-semibold text-text-base truncate">
            {name ? name : address ? address : `GPS: ${lat}, ${lng}`}
          </span>
        </div>
        <a
          href={mapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-semibold transition-all shrink-0 text-[11px]"
        >
          Google Maps'da ochish <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
