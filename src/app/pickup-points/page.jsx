"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import usePickupPoints from "@/hooks/pickupPoints/usePickupPoints";
import { usePickupPointCities } from "@/hooks/pickupPoints/usePickupPointCities";
import useNearbyPickupPoints from "@/hooks/pickupPoints/useNearbyPickupPoints";
import {
  useUpdatePickupPointStatus,
  useDeletePickupPoint,
} from "@/hooks/pickupPoints/usePickupPointMutations";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";
import { toast } from "sonner";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";

export default function PickupPointsPage() {
  const { sidebarOpen } = useContext(UIContext);

  // Filters state
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [order, setOrder] = useState("ASC");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Nearby drawer state
  const [showNearbyDrawer, setShowNearbyDrawer] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [radiusKm, setRadiusKm] = useState(25);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Vehicle conflict modal state
  const [deleteConflict, setDeleteConflict] = useState(null);

  // Google Maps preview modal state
  const [mapModalSalon, setMapModalSalon] = useState(null);

  // Data queries
  const params = {
    page,
    limit,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(city !== "all" ? { city } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
    sortBy,
    order,
  };

  const { data, isLoading, isError, error, refetch } = usePickupPoints(params);
  const { data: citiesData } = usePickupPointCities();

  const nearbyParams = userCoords.lat && userCoords.lng ? {
    lat: userCoords.lat,
    lng: userCoords.lng,
    radiusKm: Number(radiusKm) || 25,
    limit: 10,
  } : null;

  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyPickupPoints(nearbyParams);

  // Mutations
  const { mutate: updateStatus } = useUpdatePickupPointStatus();
  const { mutate: deletePickupPoint } = useDeletePickupPoint();

  const items = data?.data?.items || data?.items || (Array.isArray(data) ? data : []);
  const totalItems = data?.data?.meta?.total || data?.meta?.total || items.length;
  const totalPages = data?.data?.meta?.totalPages || data?.meta?.totalPages || Math.ceil(totalItems / limit) || 1;

  const citiesList = citiesData?.data || (Array.isArray(citiesData) ? citiesData : []);

  // Handlers
  const handleToggleStatus = (salon) => {
    updateStatus(
      { id: salon.id, isActive: !salon.isActive },
      {
        onSuccess: () => {
          toast.success(`"${salon.name}" salon holati o'zgartirildi`);
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Holatni o'zgartirishda xatolik");
        },
      }
    );
  };

  const handleDelete = (salon) => {
    if (salon.productsCount > 0) {
      setDeleteConflict(salon);
      return;
    }

    if (confirm(`Rostdan ham "${salon.name}" salonini o'chirmoqchimisiz?`)) {
      deletePickupPoint(salon.id, {
        onSuccess: () => {
          toast.success("Salon muvaffaqiyatli o'chirildi");
          refetch();
        },
        onError: (err) => {
          const msg = err?.response?.data?.message || "Salonni o'chirishda xatolik";
          toast.error(msg);
        },
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Qurilmangizda geolocation qo'llab-quvvatlanmaydi");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
        toast.success("Koordinatalaringiz aniqlandi!");
      },
      (err) => {
        setGettingLocation(false);
        toast.error("Joylashuvni aniqlab bo'lmadi: " + err.message);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="w-full flex justify-end p-5">
      <SideBar />
      <main className={`transition-all duration-300 ${sidebarOpen ? "w-[calc(100%-240px)]" : "w-[calc(100%-80px)]"}`}>
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tarqatuvchi salonlar (Pickup Points)</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Avtomobillar saqlanadigan va mijozlar olib ketadigan punktlar
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNearbyDrawer(true)}
              className="flex items-center gap-2 text-indigo-500 border border-indigo-500/30 rounded-lg px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer font-medium text-sm"
            >
              <HiOutlineMapPin className="w-5 h-5" /> Eng yaqin salonlar (GPS)
            </button>
            <Link
              href="/pickup-points/new"
              className="flex items-center gap-2 text-primary border border-primary/30 rounded-lg px-4 py-2 bg-sky-700/10 hover:bg-sky-700/20 transition-all cursor-pointer font-medium text-sm"
            >
              <HiOutlinePlus className="w-5 h-5" /> Salon Qo'shish
            </Link>
          </div>
        </header>

        {/* Filters */}
        <section className="bg-bg-card border border-border-base rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Qidiruv</label>
            <input
              id="search"
              type="text"
              placeholder="Nom, manzil yoki telefon bo'yicha..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
            />
          </div>

          <div className="w-full md:w-44">
            <label htmlFor="city-filter" className="sr-only">Shahar</label>
            <select
              id="city-filter"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="all">Barcha shaharlar</option>
              {citiesList.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} ({c.activeSalonsCount || c.salonsCount || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-36">
            <label htmlFor="status-filter" className="sr-only">Holati</label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="all">Barchasi</option>
              <option value="active">Ochiq (Faol)</option>
              <option value="inactive">Yopiq (Nofaol)</option>
            </select>
          </div>

          <div className="w-full md:w-40">
            <label htmlFor="sort-filter" className="sr-only">Saralash</label>
            <select
              id="sort-filter"
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split("-");
                setSortBy(sb);
                setOrder(ord);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="id-ASC">ID (O'sish)</option>
              <option value="id-DESC">ID (Kamayish)</option>
              <option value="name-ASC">Nomi (A-Z)</option>
              <option value="city-ASC">Shahar (A-Z)</option>
              <option value="createdAt-DESC">Eng yangilari</option>
            </select>
          </div>
        </section>

        {/* Loading / Error States */}
        {isLoading && <p className="dashboard-state">Salonlar yuklanmoqda...</p>}
        {isError && (
          <p className="dashboard-state dashboard-state-error">
            Salonlarni yuklashda xatolik: {error.message}
          </p>
        )}

        {/* Table Content */}
        {!isLoading && !isError && (
          <div className="bg-bg-card border border-border-base rounded-xl shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <div className="text-center py-12 px-4">
                <HiOutlineBuildingStorefront className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Birorta ham salon topilmadi</p>
                <p className="text-xs text-slate-400 mt-1">Qidiruv parametrlarini o'zgartirib ko'ring yoki yangi salon qo'shing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-base/30 dark:bg-bg-base/20 border-b border-border-base text-xs text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-start">ID</th>
                      <th className="px-6 py-4 text-start">Salon Nomi</th>
                      <th className="px-6 py-4 text-start">Shahar / Manzil</th>
                      <th className="px-6 py-4 text-start">Telefon</th>
                      <th className="px-6 py-4 text-start">Ish vaqti</th>
                      <th className="px-6 py-4 text-center">Avtomobillar</th>
                      <th className="px-6 py-4 text-center">Holati</th>
                      <th className="px-6 py-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base">
                    {items.map((salon) => (
                      <tr key={salon.id} className="hover:bg-bg-hover/80 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-primary">#{salon.id}</td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          <div className="flex items-center gap-3">
                            {(salon.imageUrl || salon.image) ? (
                              <img
                                src={salon.imageUrl || salon.image}
                                alt={salon.name}
                                className="w-10 h-10 object-cover rounded-lg border border-border-base bg-bg-base"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg border border-border-base bg-bg-base flex items-center justify-center text-slate-400">
                                <HiOutlineBuildingStorefront className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <Link href={`/pickup-points/${salon.id}`} className="hover:underline text-text-base">
                                {salon.name}
                              </Link>
                              {salon.isOpenNow !== undefined && (
                                <div className="mt-0.5">
                                  {salon.isOpenNow ? (
                                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      ● Hozir ochiq
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                      ○ Hozir yopiq
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium">{salon.city}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{salon.address}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                          {salon.phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <HiOutlineClock className="w-4 h-4 text-slate-400" />
                            <span>{salon.opensAt || "09:00"} — {salon.closesAt || "19:00"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                            {salon.productsCount ?? 0} ta
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(salon)}
                            className={`px-3 py-1 rounded-lg cursor-pointer border-0 select-none uppercase font-bold text-[11px] tracking-wider transition-all duration-200 active:scale-95 ${
                              salon.isActive
                                ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                : "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                            }`}
                            title="Holatni o'zgartirish (Ochiq/Yopiq)"
                          >
                            {salon.isActive ? "Ochiq" : "Yopiq"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setMapModalSalon(salon)}
                              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border-0 cursor-pointer"
                              title="Google Maps'da ko'rish"
                            >
                              <HiOutlineMapPin className="w-5 h-5" />
                            </button>
                            <Link
                              href={`/pickup-points/${salon.id}`}
                              className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              title="Batafsil / Tahrirlash"
                            >
                              <HiOutlinePencilSquare className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(salon)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border-0 cursor-pointer"
                              title="O'chirish"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-base">
                <span className="text-sm text-slate-400">
                  Sahifa <span className="font-semibold text-text-base">{page}</span> / {totalPages} (Jami: {totalItems})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 border border-border-base rounded-lg bg-bg-base/30 text-sm hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <HiOutlineArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 border border-border-base rounded-lg bg-bg-base/30 text-sm hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Conflict Warning Modal */}
        {deleteConflict && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-bg-card border border-border-base rounded-2xl max-w-md w-full p-6 shadow-xl relative">
              <button
                onClick={() => setDeleteConflict(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 border-0 bg-transparent cursor-pointer"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <HiOutlineExclamationTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-text-base">Salonni o'chira olmaysiz</h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                «<strong className="text-white">{deleteConflict.name}</strong>» salonini o'chira olmaysiz, chunki unda{" "}
                <span className="font-bold text-amber-400">{deleteConflict.productsCount} ta</span> avtomobil bor.
              </p>

              <div className="bg-bg-base/50 border border-border-base rounded-xl p-4 text-xs text-slate-400 space-y-2 mb-6">
                <p className="font-semibold text-slate-200">Nima qilish kerak?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Avtomobillar ro'yxatini ko'rib chiqing</li>
                  <li>Ularni boshqa salonga ko'chiring (PATCH /products/:id)</li>
                  <li>Yoki salondan chiqarib qo'ying</li>
                  <li>Yoki salonni o'chirmasdan yopib qo'ying (Active state)</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/pickup-points/${deleteConflict.id}`}
                  onClick={() => setDeleteConflict(null)}
                  className="flex-1 text-center py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-medium text-sm rounded-xl transition-all"
                >
                  Salondagi avtomobillarni ko'rish
                </Link>
                <button
                  onClick={() => setDeleteConflict(null)}
                  className="py-2.5 px-4 bg-bg-base border border-border-base hover:bg-bg-hover text-slate-300 font-medium text-sm rounded-xl transition-all cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Drawer Modal */}
        {showNearbyDrawer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-bg-card border border-border-base rounded-2xl max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border-base pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <HiOutlineMapPin className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-lg font-bold">Eng yaqin salonlar (GPS lookup)</h3>
                </div>
                <button
                  onClick={() => setShowNearbyDrawer(false)}
                  className="text-slate-400 hover:text-slate-200 border-0 bg-transparent cursor-pointer"
                >
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Foydalanuvchi Lat / Lng</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude (masalan 41.311)"
                        value={userCoords.lat ?? ""}
                        onChange={(e) => setUserCoords((c) => ({ ...c, lat: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border-base bg-bg-base/30 outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude (masalan 69.240)"
                        value={userCoords.lng ?? ""}
                        onChange={(e) => setUserCoords((c) => ({ ...c, lng: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border-base bg-bg-base/30 outline-none"
                      />
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-slate-400 mb-1">Radius (km)</label>
                    <input
                      type="number"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border-base bg-bg-base/30 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border-0 cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineMapPin className="w-4 h-4" />
                    {gettingLocation ? "Aniqlanmoqda..." : "GPS joylashuv"}
                  </button>
                </div>
              </div>

              {/* Nearby Results List */}
              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {(!userCoords.lat || !userCoords.lng) && (
                  <div className="text-center py-8 text-xs text-slate-400 bg-bg-base/30 rounded-xl p-4">
                    <p className="font-semibold mb-1">Koordinatalar kiritilmadi</p>
                    <p>Yuqoridagi "GPS joylashuv" tugmasini bosing yoki kenglik va uzunlikni qo'lda kiriting.</p>
                  </div>
                )}

                {userCoords.lat && userCoords.lng && nearbyLoading && (
                  <p className="text-center py-6 text-xs text-slate-400">Eng yaqin salonlar hisoblanmoqda (Haversine formula)...</p>
                )}

                {userCoords.lat && userCoords.lng && !nearbyLoading && (
                  <>
                    {(!nearbyData?.data || nearbyData.data.length === 0) ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="font-bold text-amber-400 mb-1">Salon topilmadi!</p>
                        <p>{radiusKm} km radiusda ochiq salon mavjud emas. Radiusni kengaytirib ko'ring.</p>
                      </div>
                    ) : (
                      nearbyData.data.map((salon) => (
                        <div key={salon.id} className="p-3 rounded-xl border border-border-base bg-bg-base/40 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-text-base">{salon.name}</h4>
                            <p className="text-xs text-slate-400">{salon.city}, {salon.address}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span><HiOutlinePhone className="inline w-3 h-3" /> {salon.phone}</span>
                              <span><HiOutlineClock className="inline w-3 h-3" /> {salon.opensAt} - {salon.closesAt}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-indigo-400">{salon.distanceKm?.toFixed(1)} km</div>
                            <span className="text-[10px] text-slate-400">masofada</span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border-base text-right">
                <button
                  onClick={() => setShowNearbyDrawer(false)}
                  className="px-4 py-2 bg-bg-base border border-border-base hover:bg-bg-hover text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google Maps View Modal */}
        {mapModalSalon && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-bg-card border border-border-base rounded-2xl max-w-lg w-full p-6 shadow-xl relative space-y-4">
              <div className="flex items-center justify-between border-b border-border-base pb-3">
                <div className="flex items-center gap-2">
                  <HiOutlineMapPin className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold">{mapModalSalon.name}</h3>
                </div>
                <button
                  onClick={() => setMapModalSalon(null)}
                  className="text-slate-400 hover:text-slate-200 border-0 bg-transparent cursor-pointer"
                >
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              <GoogleMapEmbed
                lat={mapModalSalon.latitude}
                lng={mapModalSalon.longitude}
                name={mapModalSalon.name}
                address={`${mapModalSalon.city}, ${mapModalSalon.address}`}
                height="300px"
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setMapModalSalon(null)}
                  className="px-4 py-2 bg-bg-base border border-border-base hover:bg-bg-hover text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
