"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import usePickupPoint from "@/hooks/pickupPoints/usePickupPoint";
import { usePickupPointProducts } from "@/hooks/pickupPoints/usePickupPointCities";
import {
  useUpdatePickupPoint,
  useUpdatePickupPointStatus,
  useDeletePickupPoint,
  useUploadPickupPointImage,
  useDeletePickupPointImage,
  useUploadPickupPointVideo,
  useDeletePickupPointVideo,
} from "@/hooks/pickupPoints/usePickupPointMutations";
import { useGeocodeSearch } from "@/hooks/pickupPoints/useGeocode";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingStorefront,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
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

export default function PickupPointDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { sidebarOpen } = useContext(UIContext);

  const { data: salon, isLoading, isError, error, refetch } = usePickupPoint(id);

  // Products list query
  const [productsPage, setProductsPage] = useState(1);
  const productsLimit = 10;
  const { data: productsData, isLoading: productsLoading } = usePickupPointProducts(id, {
    page: productsPage,
    limit: productsLimit,
  });

  // Edit form state
  const [editMode, setEditMode] = useState("patch"); // "patch" | "put"
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

  // Media state
  const [imageFile, setImageFile] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Geocoding state
  const [geoQuery, setGeoQuery] = useState("");
  const [geoTrigger, setGeoTrigger] = useState("");
  const { data: geoData, isLoading: geoLoading } = useGeocodeSearch(geoTrigger);

  // Mutations
  const { mutate: updatePickupPoint, isPending: isUpdating } = useUpdatePickupPoint();
  const { mutate: updateStatus } = useUpdatePickupPointStatus();
  const { mutate: deletePickupPoint } = useDeletePickupPoint();
  const { mutate: uploadImage, isPending: isUploadingImage } = useUploadPickupPointImage();
  const { mutate: deleteImage, isPending: isDeletingImage } = useDeletePickupPointImage();
  const { mutate: uploadVideo, isPending: isUploadingVideo } = useUploadPickupPointVideo();
  const { mutate: deleteVideo, isPending: isDeletingVideo } = useDeletePickupPointVideo();

  // Prefill edit form when salon data is fetched
  useEffect(() => {
    if (salon) {
      setFormData({
        name: salon.name || "",
        city: salon.city || "",
        address: salon.address || "",
        phone: salon.phone || "",
        opensAt: salon.opensAt || "09:00",
        closesAt: salon.closesAt || "19:00",
        latitude: salon.latitude !== null && salon.latitude !== undefined ? salon.latitude : "",
        longitude: salon.longitude !== null && salon.longitude !== undefined ? salon.longitude : "",
        image: salon.image || "",
      });
    }
  }, [salon]);

  // Handlers
  const handleToggleStatus = () => {
    if (!salon) return;
    updateStatus(
      { id: salon.id, isActive: !salon.isActive },
      {
        onSuccess: () => {
          toast.success("Salon holati o'zgartirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Holatni o'zgartirishda xatolik");
        },
      }
    );
  };

  const handleSaveForm = (e) => {
    e.preventDefault();

    const isPut = editMode === "put";

    // Build payload
    const payload = {};
    if (formData.name.trim()) payload.name = formData.name.trim();
    if (formData.city.trim()) payload.city = formData.city.trim();
    if (formData.address.trim()) payload.address = formData.address.trim();
    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.opensAt) payload.opensAt = formData.opensAt;
    if (formData.closesAt) payload.closesAt = formData.closesAt;

    payload.latitude = formData.latitude !== "" ? Number(formData.latitude) : null;
    payload.longitude = formData.longitude !== "" ? Number(formData.longitude) : null;
    payload.image = formData.image.trim() ? formData.image.trim() : null;

    if (!isPut && Object.keys(payload).length === 0) {
      toast.error("O'zgartiradigan hech narsa yo'q");
      return;
    }

    updatePickupPoint(
      { id, isPut, data: payload },
      {
        onSuccess: () => {
          toast.success(isPut ? "Salon to'liq yangilandi (PUT)" : "Salon qisman yangilandi (PATCH)");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Salonni yangilashda xatolik");
        },
      }
    );
  };

  const handleImageUploadSubmit = (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Rasm faylini tanlang");
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append("image", imageFile);

    setImageUploadProgress(10);
    uploadImage(
      {
        id,
        formData: formDataObj,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setImageUploadProgress(percent);
        },
      },
      {
        onSuccess: () => {
          toast.success("Rasm muvaffaqiyatli yuklandi!");
          setImageFile(null);
          setImageUploadProgress(0);
          refetch();
        },
        onError: (err) => {
          setImageUploadProgress(0);
          toast.error(err?.response?.data?.message || "Rasm yuklashda xatolik");
        },
      }
    );
  };

  const handleDeleteImage = () => {
    if (confirm("Salon rasmini o'chirmoqchimisiz?")) {
      deleteImage(id, {
        onSuccess: () => {
          toast.success("Salon rasmi o'chirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Rasmni o'chirishda xatolik");
        },
      });
    }
  };

  const handleVideoUploadSubmit = (e) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error("Video faylini tanlang");
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append("video", videoFile);

    setVideoUploadProgress(5);
    uploadVideo(
      {
        id,
        formData: formDataObj,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setVideoUploadProgress(percent);
        },
      },
      {
        onSuccess: () => {
          toast.success("Video muvaffaqiyatli yuklandi va qayta ishlandi!");
          setVideoFile(null);
          setVideoUploadProgress(0);
          refetch();
        },
        onError: (err) => {
          setVideoUploadProgress(0);
          toast.error(err?.response?.data?.message || "Video yuklashda xatolik");
        },
      }
    );
  };

  const handleDeleteVideo = () => {
    if (confirm("Salon videosini o'chirmoqchimisiz?")) {
      deleteVideo(id, {
        onSuccess: () => {
          toast.success("Salon videosi o'chirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Videoni o'chirishda xatolik (Video yo'q bo'lishi mumkin)");
        },
      });
    }
  };

  const handleMapLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude !== undefined ? loc.latitude : prev.latitude,
      longitude: loc.longitude !== undefined ? loc.longitude : prev.longitude,
      address: loc.address ? loc.address : prev.address,
      city: loc.city ? loc.city : prev.city,
    }));
  };

  const productsList = productsData?.data?.items || productsData?.items || (Array.isArray(productsData) ? productsData : []);
  const productsTotal = productsData?.data?.meta?.total || productsData?.meta?.total || productsList.length;
  const productsTotalPages = productsData?.data?.meta?.totalPages || productsData?.meta?.totalPages || Math.ceil(productsTotal / productsLimit) || 1;

  return (
    <div className="w-full flex justify-end p-5">
      <SideBar />
      <main className={`transition-all duration-300 ${sidebarOpen ? "w-[calc(100%-240px)]" : "w-[calc(100%-80px)]"}`}>
        {/* Header Navigation */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/pickup-points"
              className="p-2 border border-border-base rounded-lg bg-bg-base/30 hover:bg-bg-hover transition-colors text-slate-400 hover:text-slate-200"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{salon?.name || `Salon #${id}`}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Salon tafsilotlarini ko'rish, tahrirlash, rasm/video va avtomobillarni boshqarish
              </p>
            </div>
          </div>

          {salon && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-0 transition-all ${
                  salon.isActive
                    ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                    : "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                }`}
              >
                {salon.isActive ? "● Ochiq (Faol)" : "○ Yopiq (Nofaol)"}
              </button>
            </div>
          )}
        </header>

        {isLoading && <p className="dashboard-state">Salon ma'lumotlari yuklanmoqda...</p>}
        {isError && (
          <p className="dashboard-state dashboard-state-error">
            Salonni yuklashda xatolik: {error.message}
          </p>
        )}

        {salon && (
          <div className="space-y-6">
            {/* Salon Stats Banner */}
            <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {salon.imageUrl || salon.image ? (
                  <img
                    src={salon.imageUrl || salon.image}
                    alt={salon.name}
                    className="w-16 h-16 object-cover rounded-xl border border-border-base bg-bg-base"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-border-base bg-bg-base flex items-center justify-center text-slate-400">
                    <HiOutlineBuildingStorefront className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-text-base">{salon.name}</h2>
                  <p className="text-sm text-slate-400">{salon.city}, {salon.address}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span><HiOutlinePhone className="inline w-3.5 h-3.5" /> {salon.phone}</span>
                    <span><HiOutlineClock className="inline w-3.5 h-3.5" /> {salon.opensAt || "09:00"} - {salon.closesAt || "19:00"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-bg-base/50 border border-border-base rounded-xl">
                  <div className="text-xs text-slate-400">Avtomobillar</div>
                  <div className="text-lg font-bold text-sky-400">{salon.productsCount ?? 0} ta</div>
                </div>

                <div className="text-center px-4 py-2 bg-bg-base/50 border border-border-base rounded-xl">
                  <div className="text-xs text-slate-400">Ish vaqti holati</div>
                  <div className="text-sm font-semibold mt-1">
                    {salon.isOpenNow ? (
                      <span className="text-emerald-400">● Hozir ochiq</span>
                    ) : (
                      <span className="text-slate-400">○ Hozir yopiq</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2-columns: Left Edit Form, Right Media Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-2 bg-bg-card border border-border-base rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border-base pb-4">
                  <h3 className="text-lg font-bold">Salon Ma'lumotlarini Tahrirlash</h3>
                  <div className="flex items-center gap-2 bg-bg-base/50 p-1 rounded-lg border border-border-base text-xs">
                    <button
                      type="button"
                      onClick={() => setEditMode("patch")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all border-0 cursor-pointer ${
                        editMode === "patch" ? "bg-primary text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      PATCH (Qisman)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode("put")}
                      className={`px-3 py-1 rounded-md font-semibold transition-all border-0 cursor-pointer ${
                        editMode === "put" ? "bg-primary text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      PUT (To'liq)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Salon Nomi</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Shahar</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">To'liq Manzil</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Telefon Raqami</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Ochilish</label>
                        <input
                          type="time"
                          value={formData.opensAt}
                          onChange={(e) => setFormData({ ...formData, opensAt: e.target.value })}
                          className="w-full px-2 py-2 text-xs rounded-lg border border-border-base bg-bg-base/30 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Yopilish</label>
                        <input
                          type="time"
                          value={formData.closesAt}
                          onChange={(e) => setFormData({ ...formData, closesAt: e.target.value })}
                          className="w-full px-2 py-2 text-xs rounded-lg border border-border-base bg-bg-base/30 outline-none"
                        />
                      </div>
                    </div>

                    {/* Interactive Map Location Picker */}
                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">
                        Xaritadan Tanlash (Ustiga bosing yoki pinkani suring)
                      </label>
                      <InteractiveMapPicker
                        selectedLat={formData.latitude}
                        selectedLng={formData.longitude}
                        onSelectLocation={handleMapLocationSelect}
                        height="300px"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-400">Latitude (Kenglik)</label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, latitude: "" })}
                          className="text-[10px] text-rose-400 hover:underline border-0 bg-transparent cursor-pointer"
                        >
                          Clear (null)
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-400">Longitude (Uzunlik)</label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, longitude: "" })}
                          className="text-[10px] text-rose-400 hover:underline border-0 bg-transparent cursor-pointer"
                        >
                          Clear (null)
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-400">Tashqi Rasm Havolasi (image)</label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: "" })}
                          className="text-[10px] text-rose-400 hover:underline border-0 bg-transparent cursor-pointer"
                        >
                          Clear (null)
                        </button>
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all border-0 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdating ? "Saqlanmoqda..." : editMode === "put" ? "To'liq Yangilash (PUT)" : "Qisman Saqlash (PATCH)"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Media Upload Column */}
              <div className="space-y-6">
                {/* Image Upload Box */}
                <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border-base pb-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <HiOutlinePhoto className="w-5 h-5 text-sky-400" />
                      <span>Salon Rasmi (Upload)</span>
                    </div>
                    {(salon.imagePath || salon.imageUrl) && (
                      <button
                        onClick={handleDeleteImage}
                        disabled={isDeletingImage}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border-0 cursor-pointer"
                        title="Rasmni o'chirish"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {salon.imageUrl || salon.image ? (
                    <div className="relative group rounded-xl overflow-hidden border border-border-base bg-bg-base">
                      <img
                        src={salon.imageUrl || salon.image}
                        alt="Salon"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-border-base rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      Rasm yo'q
                    </div>
                  )}

                  <form onSubmit={handleImageUploadSubmit} className="space-y-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
                    />

                    {imageUploadProgress > 0 && (
                      <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden border border-border-base">
                        <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${imageUploadProgress}%` }} />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!imageFile || isUploadingImage}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingImage ? "Rasm yuklanmoqda..." : "Yangi Rasm Yuklash"}
                    </button>
                  </form>
                </div>

                {/* Video Upload Box */}
                <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border-base pb-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <HiOutlineVideoCamera className="w-5 h-5 text-indigo-400" />
                      <span>Tanishtiruv Videosi</span>
                    </div>
                    {salon.videoUrl && (
                      <button
                        onClick={handleDeleteVideo}
                        disabled={isDeletingVideo}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border-0 cursor-pointer"
                        title="Videoni o'chirish"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {salon.videoUrl ? (
                    <div className="rounded-xl overflow-hidden border border-border-base bg-black">
                      <video src={salon.videoUrl} controls className="w-full max-h-48 object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-border-base rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs p-3 text-center">
                      <span>Video yuklanmagan</span>
                      <span className="text-[10px] text-slate-500 mt-1">mp4, mov, webm (max 50 MB, 30 soniya)</span>
                    </div>
                  )}

                  <form onSubmit={handleVideoUploadSubmit} className="space-y-3">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
                    />

                    {videoUploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Yuklanmoqda va siqilmoqda...</span>
                          <span>{videoUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden border border-border-base">
                          <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${videoUploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!videoFile || isUploadingVideo}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingVideo ? "Video qayta ishlanmoqda..." : "Video Yuklash"}
                    </button>
                  </form>
                </div>

                {/* Google Maps Box */}
                <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm border-b border-border-base pb-3">
                    <HiOutlineMapPin className="w-5 h-5 text-rose-500" />
                    <span>Google Maps Joylashuvi</span>
                  </div>
                  <GoogleMapEmbed
                    lat={salon.latitude}
                    lng={salon.longitude}
                    name={salon.name}
                    address={`${salon.city}, ${salon.address}`}
                    height="240px"
                  />
                </div>
              </div>
            </div>

            {/* Products Table Section */}
            <div className="bg-bg-card border border-border-base rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-base pb-4">
                <div>
                  <h3 className="text-lg font-bold">Ushbu Salondagi Avtomobillar</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hozirda salon hududida turgan barcha avtomobillar ro'yxati
                  </p>
                </div>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold rounded-full">
                  Jami: {productsTotal} ta
                </span>
              </div>

              {productsLoading && <p className="dashboard-state">Avtomobillar yuklanmoqda...</p>}

              {!productsLoading && productsList.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Ushbu salonda avtomobil mavjud emas.
                </div>
              )}

              {!productsLoading && productsList.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-bg-base/30 dark:bg-bg-base/20 border-b border-border-base text-xs text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-start">ID</th>
                        <th className="px-4 py-3 text-start">Nomi</th>
                        <th className="px-4 py-3 text-start">Kategoriya</th>
                        <th className="px-4 py-3 text-start">Narxi</th>
                        <th className="px-4 py-3 text-center">Zaxira (Stock)</th>
                        <th className="px-4 py-3 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base">
                      {productsList.map((car) => (
                        <tr key={car.id} className="hover:bg-bg-hover/80 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-primary">#{car.id}</td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            <Link href={`/cars/${car.slug || car.id}`} className="hover:underline text-text-base">
                              {car.name || car.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {car.category?.name || car.categoryName || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono font-bold text-emerald-400">
                            {car.price ? `$${Number(car.price).toLocaleString()}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-semibold">
                            {car.stock ?? 1} ta
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/cars/${car.slug || car.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-bg-base border border-border-base hover:bg-bg-hover text-slate-300"
                            >
                              Ko'rish <HiOutlineArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {productsTotalPages > 1 && (
                    <div className="pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-border-base mt-4">
                      <span>
                        Sahifa {productsPage} / {productsTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProductsPage((p) => Math.max(p - 1, 1))}
                          disabled={productsPage === 1}
                          className="px-3 py-1 border border-border-base rounded bg-bg-base disabled:opacity-40"
                        >
                          Oldingi
                        </button>
                        <button
                          onClick={() => setProductsPage((p) => Math.min(p + 1, productsTotalPages))}
                          disabled={productsPage === productsTotalPages}
                          className="px-3 py-1 border border-border-base rounded bg-bg-base disabled:opacity-40"
                        >
                          Keyingi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
