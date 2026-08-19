"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import useCars from "@/hooks/cars/useCars";
import useActiveCategories from "@/hooks/categories/useActiveCategories";
import useUpdateCar from "@/hooks/cars/useUpdateCar";
import useDeleteCar from "@/hooks/cars/useDeleteCar";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";
import { toast } from "sonner";

export default function CarsPage() {
  const { sidebarOpen } = useContext(UIContext);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: categoriesData } = useActiveCategories();
  const activeCategories = categoriesData?.items || (Array.isArray(categoriesData) ? categoriesData : []);

  const params = {
    page,
    limit,
    ...(search.trim() ? { search } : {}),
    ...(categoryId !== "all" ? { categoryId: Number(categoryId) } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
    ...(stockStatus === "in" ? { inStock: true } : stockStatus === "out" ? { inStock: false } : {}),
    sortBy: "id",
    order: "DESC",
  };

  const { data, isLoading, isError, error, refetch } = useCars(params);
  const { mutate: updateCar } = useUpdateCar();
  const { mutate: deleteCar } = useDeleteCar();

  const carsList = data?.items || (Array.isArray(data) ? data : []);
  const totalItems = data?.meta?.total || carsList.length;
  const totalPages = data?.meta?.totalPages || Math.ceil(totalItems / limit) || 1;

  const handleToggleStatus = (car) => {
    updateCar(
      { id: car.id, isStatusChange: true, isActive: !car.isActive },
      {
        onSuccess: () => {
          toast.success("Avtomobil faollik holati muvaffaqiyatli o'zgartirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Holatni o'zgartirishda xatolik yuz berdi");
        },
      }
    );
  };

  const handleDelete = (id, name) => {
    if (confirm(`Rostdan ham "${name}" avtomobilini o'chirmoqchimisiz?`)) {
      deleteCar(id, {
        onSuccess: () => {
          toast.success("Avtomobil muvaffaqiyatli o'chirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Avtomobilni o'chirishda xatolik yuz berdi");
        },
      });
    }
  };

  // Helper formatter for uzb som price
  const formatPrice = (price) => {
    if (!price && price !== 0) return "-";
    return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Avtosalon boshqaruvi</p>
            <h1 className="dash-title">Avtomobillar</h1>
            <p className="dash-subtitle">Sotuvdagi barcha avtomobillar, ularning narxlari va qoldiqlari.</p>
          </div>
          <Link href="/cars/new" className="dashboard-action cursor-pointer">
            <HiOutlinePlus className="w-5 h-5" /> {"Mashina Qo'shish"}
          </Link>
        </header>

        {/* Filters */}
        <section className="bg-bg-card border border-border-base rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <label htmlFor="search" className="sr-only">Qidiruv</label>
            <input
              id="search"
              type="text"
              placeholder="Marka, model yoki tavsif bo'yicha..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
            />
          </div>

          <div className="w-full sm:w-44">
            <label htmlFor="category" className="sr-only">Kategoriya</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="all">Barcha kategoriyalar</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label htmlFor="stock" className="sr-only">Qoldiq holati</label>
            <select
              id="stock"
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="all">Barcha qoldiqlar</option>
              <option value="in">Sotuvda bor</option>
              <option value="out">Tugagan</option>
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label htmlFor="status" className="sr-only">Faolligi</label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="all">Barcha statuslar</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>
          </div>
        </section>

        {/* Cars Content */}
        {isLoading && <p className="dashboard-state">{"Avtomobillar ro'yxati yuklanmoqda..."}</p>}
        {isError && (
          <p className="dashboard-state dashboard-state-error">
            {"Avtomobillarni yuklashda xatolik yuz berdi: "}{error.message}
          </p>
        )}

        {!isLoading && !isError && (
          <div className="bg-bg-card border border-border-base rounded-xl shadow-sm overflow-hidden">
            {carsList.length === 0 ? (
              <p className="dashboard-state py-12">Avtomobillar topilmadi.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="dash-table w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Avtomobil</th>
                      <th className="px-6 py-4">Kategoriya</th>
                      <th className="px-6 py-4">Narxi</th>
                      <th className="px-6 py-4">Qoldiq</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carsList.map((car) => {
                      const carCategory = car.category || activeCategories.find(c => c.id === car.categoryId);
                      return (
                        <tr key={car.id} className="hover:bg-bg-hover/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {car.image ? (
                                <img
                                  src={car.image}
                                  alt={car.name}
                                  className="w-12 h-10 object-cover rounded-lg border border-border-base bg-slate-100"
                                  onError={(e) => {
                                    e.target.src = "/logo.png";
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                                  No img
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-sm block">{car.name}</span>
                                <span className="text-xs text-slate-450 block truncate max-w-50" title={car.description}>
                                  {car.description || "Tavsif berilmagan"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {carCategory?.name || `ID: ${car.categoryId}`}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                            {formatPrice(car.price)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {car.stock > 0 ? (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${car.stock <= 5 ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
                                {car.stock} dona
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">
                                Tugagan
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(car)}
                              className={`dash-badge cursor-pointer border-0 select-none uppercase font-bold text-[10px] tracking-wider transition-all duration-200 active:scale-95 ${
                                car.isActive
                                  ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                  : "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                              }`}
                              title="Holatni o'zgartirish"
                            >
                              {car.isActive ? "Faol" : "Nofaol"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/cars/${car.id}`}
                                className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Tahrirlash"
                              >
                                <HiOutlinePencilSquare className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(car.id, car.name)}
                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border-0 cursor-pointer"
                                title="O'chirish"
                              >
                                <HiOutlineTrash className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="dashboard-pagination px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-base">
                <span className="text-sm text-slate-400">
                  Sahifa <span className="font-semibold text-text-base">{page}</span> / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 border border-border-base rounded-lg bg-bg-base/30 text-sm hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <HiOutlineArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 border border-border-base rounded-lg bg-bg-base/30 text-sm hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
