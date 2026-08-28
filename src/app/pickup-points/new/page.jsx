"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import { useCreatePickupPoint } from "@/hooks/pickupPoints/usePickupPointMutations";
import { useGeocode, useGeocodeSearch } from "@/hooks/pickupPoints/useGeocode";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineBuildingStorefront,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";

const InteractiveMapPicker = dynamic(() => import("@/components/InteractiveMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-bg-card border border-border-base rounded-2xl flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Interaktiv xarita yuklanmoqda...
    </div>
  ),
});

export default function NewPickupPointPage() {
  const { sidebarOpen } = useContext(UIContext);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    opensAt: "09:00",
    closesAt: "19:00",
    latitude: "",
    longitude: "",
    image: "",
  });

  // Geocoding helper states
  const [geocodeQuery, setGeocodeQuery] = useState("");
  const [searchAddressTrigger, setSearchAddressTrigger] = useState("");

  const { data: searchGeocodeData, isLoading: searchGeocodeLoading, error: geocodeSearchError } =
    useGeocodeSearch(searchAddressTrigger);

  const { mutate: createPickupPoint, isPending } = useCreatePickupPoint();

  // Handle address lookup button
  const handleGeocodeSearch = () => {
    if (!geocodeQuery.trim()) {
      toast.error("Qidirish uchun manzil kiriting");
      return;
    }
    setSearchAddressTrigger(geocodeQuery.trim());
  };

  // Populate form from geocode response
  const applyGeocodeData = (geoData) => {
    if (!geoData) return;
    setFormData((prev) => ({
      ...prev,
      city: geoData.city || prev.city,
      address: geoData.address || geoData.displayName || prev.address,
      latitude: geoData.latitude !== undefined ? geoData.latitude : prev.latitude,
      longitude: geoData.longitude !== undefined ? geoData.longitude : prev.longitude,
      name: prev.name || (geoData.suggestedName ? `Magnate Motors — ${geoData.suggestedName}` : ""),
    }));
    toast.success("Manzil va koordinatalar avtomatik to'ldirildi!");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Salon nomini kiriting");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("Shaharni kiriting");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Manzilni kiriting");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Telefon raqamini kiriting");
      return;
    }

    if (formData.opensAt && formData.closesAt && formData.closesAt <= formData.opensAt) {
      toast.error("Yopilish vaqti ochilish vaqtidan keyin bo'lishi kerak");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      opensAt: formData.opensAt || "09:00",
      closesAt: formData.closesAt || "19:00",
      ...(formData.latitude !== "" ? { latitude: Number(formData.latitude) } : {}),
      ...(formData.longitude !== "" ? { longitude: Number(formData.longitude) } : {}),
      ...(formData.image.trim() ? { image: formData.image.trim() } : {}),
    };

    createPickupPoint(payload, {
      onSuccess: () => {
        toast.success("Yangi salon muvaffaqiyatli yaratildi!");
        router.push("/pickup-points");
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Salon yaratishda xatolik yuz berdi");
      },
    });
  };

  // Handle location selection from interactive map picker
  const handleMapLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude !== undefined ? loc.latitude : prev.latitude,
      longitude: loc.longitude !== undefined ? loc.longitude : prev.longitude,
      address: loc.address ? loc.address : prev.address,
      city: loc.city ? loc.city : prev.city,
    }));
  };

  return (
    <div className="w-full flex justify-end p-5">
      <SideBar />
      <main className={`transition-all duration-300 ${sidebarOpen ? "w-[calc(100%-240px)]" : "w-[calc(100%-80px)]"}`}>
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/pickup-points"
            className="p-2 border border-border-base rounded-lg bg-bg-base/30 hover:bg-bg-hover transition-colors text-slate-400 hover:text-slate-200"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Yangi Tarqatuvchi Salon Qo'shish</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Yangi tarqatuvchi salon ma'lumotlarini va koordinatalarini kiritish
            </p>
          </div>
        </header>

        {/* Geocoding Assistant Card */}
        <section className="bg-gradient-to-r from-indigo-900/20 to-sky-900/20 border border-indigo-500/20 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <HiOutlineMapPin className="w-5 h-5" />
            <span>OpenStreetMap (Nominatim) Manzil Qidiruv Yordamchisi</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Xaritadan joyni qidirib manzil, shahar va koordinatalarni avtomatik to'ldirishingiz mumkin.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masalan: Chilonzor, Bunyodkor shoh ko'chasi 12"
                value={geocodeQuery}
                onChange={(e) => setGeocodeQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGeocodeSearch())}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border-base bg-bg-base/60 focus:border-indigo-500 outline-none"
              />
              <HiOutlineMagnifyingGlass className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
            <button
              type="button"
              onClick={handleGeocodeSearch}
              disabled={searchGeocodeLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all border-0 cursor-pointer disabled:opacity-50"
            >
              {searchGeocodeLoading ? "Qidirilmoqda..." : "Koordinatni Aniqlash"}
            </button>
          </div>

          {searchGeocodeData && (
            <div className="mt-3 p-3 bg-bg-base/80 border border-indigo-500/30 rounded-lg text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="font-semibold text-indigo-300">{searchGeocodeData.displayName}</p>
                <p className="text-slate-400 mt-0.5">
                  Lat: {searchGeocodeData.latitude}, Lng: {searchGeocodeData.longitude} | Shahar: {searchGeocodeData.city || "Topilmadi"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyGeocodeData(searchGeocodeData)}
                className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold rounded-md border border-indigo-500/40 transition-all cursor-pointer whitespace-nowrap"
              >
                Formaga qo'llash
              </button>
            </div>
          )}

          {geocodeSearchError && (
            <p className="mt-2 text-xs text-rose-400">
              {geocodeSearchError?.response?.data?.message || "Manzil bo'yicha koordinatalar topilmadi."}
            </p>
          )}
        </section>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-bg-card border border-border-base rounded-xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salon Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-text-base mb-2">
                Salon Nomi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  placeholder="Masalan: Magnate Motors — Chilonzor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                  required
                />
                <HiOutlineBuildingStorefront className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-text-base mb-2">
                Shahar <span className="text-rose-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                placeholder="Masalan: Toshkent"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                required
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold text-text-base mb-2">
                To'liq Manzil <span className="text-rose-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                placeholder="Chilonzor tumani, Bunyodkor shoh ko'chasi, 12-uy"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-text-base mb-2">
                Telefon Raqami <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none font-mono"
                  required
                />
                <HiOutlinePhone className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Server o'zi avtomatik +998901234567 formatida saqlaydi</p>
            </div>

            {/* Hours: opensAt / closesAt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="opensAt" className="block text-sm font-semibold text-text-base mb-2">
                  Ochilish vaqti
                </label>
                <div className="relative">
                  <input
                    id="opensAt"
                    type="time"
                    value={formData.opensAt}
                    onChange={(e) => setFormData({ ...formData, opensAt: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary outline-none"
                  />
                  <HiOutlineClock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                </div>
              </div>
              <div>
                <label htmlFor="closesAt" className="block text-sm font-semibold text-text-base mb-2">
                  Yopilish vaqti
                </label>
                <div className="relative">
                  <input
                    id="closesAt"
                    type="time"
                    value={formData.closesAt}
                    onChange={(e) => setFormData({ ...formData, closesAt: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary outline-none"
                  />
                  <HiOutlineClock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Interactive Map Picker */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-text-base">
                Xaritadan Tanlash (Interaktiv Xarita) <span className="text-indigo-400 font-normal text-xs">(Xaritaning ustiga bosing, koordinata va manzil avtomatik to'ldiriladi)</span>
              </label>
              <InteractiveMapPicker
                selectedLat={formData.latitude}
                selectedLng={formData.longitude}
                onSelectLocation={handleMapLocationSelect}
                height="320px"
              />
            </div>

            {/* Latitude & Longitude */}
            <div>
              <label htmlFor="latitude" className="block text-sm font-semibold text-text-base mb-2">
                Kenglik (Latitude)
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="41.285"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Latitude va Longitudesiz salon /nearby ro'yxatiga tushmaydi</p>
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-semibold text-text-base mb-2">
                Uzunlik (Longitude)
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="69.204"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary outline-none font-mono"
              />
            </div>

            {/* Live Google Map Location Preview */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-text-base">
                Google Maps Joylashuv Ko'rinishi
              </label>
              <GoogleMapEmbed
                lat={formData.latitude}
                lng={formData.longitude}
                name={formData.name}
                address={formData.address || formData.city}
                height="260px"
              />
            </div>

            {/* External Image URL */}
            <div className="md:col-span-2">
              <label htmlFor="image" className="block text-sm font-semibold text-text-base mb-2">
                Rasm (Tashqi URL havola)
              </label>
              <div className="relative">
                <input
                  id="image"
                  type="url"
                  placeholder="https://backend.magnateshop.uz/images/salons/chilonzor.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary outline-none"
                />
                <HiOutlinePhoto className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Yoki salon yaratilgandan so'ng rasm fayl yuklasangiz ham bo'ladi</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-base">
            <Link
              href="/pickup-points"
              className="px-5 py-2.5 rounded-xl border border-border-base bg-bg-base hover:bg-bg-hover text-slate-300 text-sm font-medium transition-all"
            >
              Bekor qilish
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all border-0 cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Saqlanmoqda..." : "Salonni Saqlash"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
