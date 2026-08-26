"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import useCategories from "@/hooks/categories/useCategories";
import useUpdateCategory from "@/hooks/categories/useUpdateCategory";
import useDeleteCategory from "@/hooks/categories/useDeleteCategory";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { sidebarOpen } = useContext(UIContext);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const params = {
    page,
    limit,
    ...(search.trim() ? { search } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
    sortBy: "id",
    order: "DESC",
  };

  const { data, isLoading, isError, error, refetch } = useCategories(params);
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();

  const categoriesList = data?.items || (Array.isArray(data) ? data : []);
  const totalItems = data?.meta?.total || categoriesList.length;
  const totalPages = data?.meta?.totalPages || Math.ceil(totalItems / limit) || 1;

  const handleToggleStatus = (category) => {
    updateCategory(
      { id: category.id, isStatusChange: true, isActive: !category.isActive },
      {
        onSuccess: () => {
          toast.success("Kategoriya holati muvaffaqiyatli o'zgartirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Holatni o'zgartirishda xatolik yuz berdi");
        },
      }
    );
  };

  const handleDelete = (id, name) => {
    if (confirm(`Rostdan ham "${name}" kategoriyasini o'chirmoqchimisiz?`)) {
      deleteCategory(id, {
        onSuccess: () => {
          toast.success("Kategoriya muvaffaqiyatli o'chirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Kategoriyani o'chirishda xatolik yuz berdi");
        },
      });
    }
  };

  return (
    <div className="w-full flex justify-end p-5">
      <SideBar />
      <main className={`transition-all duration-300 ${sidebarOpen ? "w-[calc(100%-240px)]" : "w-[calc(100%-80px)]"}`}>
        <header className="h-16 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kategoriyalar</h1>
          </div>
          <Link href="/categories/new" className="flex items-center gap-2 text-primary border border-primary rounded-lg px-4 py-2 bg-sky-700/10 hover:bg-sky-700/20 cursor-pointer">
            <HiOutlinePlus className="w-5 h-5" /> {"Kategoriya Qo'shish"}
          </Link>
        </header>

        <section className="bg-bg-card border border-border-base rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Qidiruv</label>
            <input
              id="search"
              type="text"
              placeholder="Nomi yoki izohi bo'yicha qidiruv..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="status" className="sr-only">Holati</label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>
          </div>
        </section>

        {isLoading && <p className="dashboard-state">Kategoriyalar yuklanmoqda...</p>}
        {isError && (
          <p className="dashboard-state dashboard-state-error">
            Kategoriyalarni yuklashda xatolik: {error.message}
          </p>
        )}

        {!isLoading && !isError && (
          <div className="bg-bg-card border border-border-base rounded-xl shadow-sm overflow-hidden">
            {categoriesList.length === 0 ? (
              <p className="dashboard-state py-12">Kategoriyalar topilmadi.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-base/30 dark:bg-bg-base/20 border-b border-border-base">
                    <tr>
                      <th className="px-6 py-4 text-start">ID</th>
                      <th className="px-6 py-4 text-start">Nomi</th>
                      <th className="px-6 py-4 text-start">Tavsifi</th>
                      <th className="px-6 py-4 text-start">Holati</th>
                      <th className="px-6 py-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesList.map((category) => (
                      <tr key={category.id} className="hover:bg-bg-hover/80 transition-colors border-b border-border-base">
                        <td className="px-6 py-4 text-sm font-semibold text-primary">#{category.id}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{category.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {category.description || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(category)}
                            className={`rounded-lg cursor-pointer border-0 select-none uppercase font-bold text-[12px] tracking-wider transition-all duration-200 active:scale-95 ${
                              category.isActive
                                ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                : "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                            }`}
                            title="Holatni o'zgartirish"
                          >
                            {category.isActive ? "Faol" : "Nofaol"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/categories/${category.id}`}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Tahrirlash"
                            >
                              <HiOutlinePencilSquare className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(category.id, category.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border-0 cursor-pointer"
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
