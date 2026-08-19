"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import useCategory from "@/hooks/categories/useCategory";
import { use } from "react";
import useUpdateCategory from "@/hooks/categories/useUpdateCategory";
import { HiOutlineArrowLeft, HiOutlineCheck } from "react-icons/hi2";
import { toast } from "sonner";
import Link from "next/link";

export default function EditCategoryPage({ params }) {
  const { id } = use(params);
  const { sidebarOpen } = useContext(UIContext);
  const router = useRouter();

  const { data: categoryData, isLoading, isError, error } = useCategory(id);
  const { mutate: updateCategory, isPending } = useUpdateCategory();

  const [form, setForm] = useState({ name: "", description: "" });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (categoryData) {
      setTimeout(() => {
        setForm({
          name: categoryData.name || "",
          description: categoryData.description || "",
        });
      }, 0);
    }
  }, [categoryData]);

  const handleChange = (e) => {
    setErrorMsg("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setErrorMsg("Kategoriya nomi majburiy.");
      return;
    }

    updateCategory(
      { id, ...form },
      {
        onSuccess: () => {
          toast.success("Kategoriya muvaffaqiyatli saqlandi");
          router.push("/categories");
        },
        onError: (err) => {
          setErrorMsg(err?.response?.data?.message || "Kategoriyani yangilashda xatolik yuz berdi.");
        },
      }
    );
  };

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header mb-6">
          <Link href="/categories" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-3">
            <HiOutlineArrowLeft className="w-4 h-4" /> {"Kategoriyalar ro'yxatiga qaytish"}
          </Link>
          <h1 className="dash-title">Kategoriyani Tahrirlash</h1>
          <p className="dash-subtitle">{"Kategoriya ma'lumotlarini o'zgartirish formasi."}</p>
        </header>

        {isLoading && <p className="dashboard-state">{"Kategoriya ma'lumotlari yuklanmoqda..."}</p>}
        {isError && (
          <p className="dashboard-state dashboard-state-error">
            Kategoriyani saqlashda xatolik yuz berdi: {error.message}
          </p>
        )}

        {!isLoading && !isError && (
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

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-xs text-red-500 shadow-sm" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errorMsg}
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
                      <HiOutlineCheck className="w-4.5 h-4.5" /> Saqlash
                    </>
                  )}
                </button>
              </div>
              
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
