"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import useCreateCategory from "@/hooks/categories/useCreateCategory";
import { HiOutlineArrowLeft, HiOutlineCheck } from "react-icons/hi2";
import { toast } from "sonner";
import Link from "next/link";

export default function NewCategoryPage() {
  const { sidebarOpen } = useContext(UIContext);
  const router = useRouter();
  const { mutate: createCategory, isPending } = useCreateCategory();

  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Kategoriya nomi majburiy.");
      return;
    }

    createCategory(form, {
      onSuccess: () => {
        toast.success("Kategoriya muvaffaqiyatli yaratildi");
        router.push("/categories");
      },
      onError: (err) => {
        setError(err?.response?.data?.message || "Kategoriyani saqlashda xatolik yuz berdi.");
      },
    });
  };

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header mb-6">
          <Link href="/categories" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-3">
            <HiOutlineArrowLeft className="w-4 h-4" /> {"Kategoriyalar ro'yxatiga qaytish"}
          </Link>
          <h1 className="dash-title">Yangi Kategoriya</h1>
          <p className="dash-subtitle font-sans">Yangi avtomobil kategoriyasini yaratish formasi.</p>
        </header>

        <div className="max-w-xl bg-bg-card border border-border-base rounded-xl p-6 sm:p-8 shadow-sm">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
            
            {/* Category Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold text-text-base">
                Kategoriya Nomi *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoFocus
                placeholder="Masalan: SUV, Sedan, Elektro..."
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
                disabled={isPending}
              />
            </div>

            {/* Category Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-semibold text-text-base">
                Tavsifi / Izohi
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Kategoriya haqida batafsil ma'lumot kiriting..."
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 resize-none"
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-xs text-red-500 shadow-sm" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/categories"
                className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-bg-hover rounded-lg transition-all"
              >
                Bekor qilish
              </Link>
              <button
                type="submit"
                className="flex items-center gap-1.5 py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-primary/15 disabled:opacity-50 select-none cursor-pointer border-0"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-4.5 h-4.5" /> Yaratish
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </main>
    </div>
  );
}
