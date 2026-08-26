"use client";

import React, { useState, useEffect, useContext, use } from "react";
import { useRouter } from "next/navigation";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";
import useCar from "@/hooks/cars/useCar";
import useUpdateCar from "@/hooks/cars/useUpdateCar";
import useActiveCategories from "@/hooks/categories/useActiveCategories";
import { HiOutlineArrowLeft, HiOutlineCheck } from "react-icons/hi2";
import { toast } from "sonner";
import Link from "next/link";

export default function EditCarPage({ params }) {
  const { slug } = use(params);
  const id = slug; 

  const { sidebarOpen } = useContext(UIContext);
  const router = useRouter();

  const { data: carData, isLoading, isError, error } = useCar(id);
  const { mutate: updateCar, isPending } = useUpdateCar();
  const { data: categoriesData } = useActiveCategories();
  const activeCategories = categoriesData?.items || (Array.isArray(categoriesData) ? categoriesData : []);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    categoryId: ""
  });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (carData) {
      setTimeout(() => {
        setForm({
          name: carData.name || "",
          description: carData.description || "",
          price: carData.price ?? "",
          stock: carData.stock ?? "",
          image: carData.image || "",
          categoryId: carData.categoryId ?? ""
        });
      }, 0);
    }
  }, [carData]);

  const handleChange = (e) => {
    setErrorMsg("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setErrorMsg("Avtomobil nomi majburiy.");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setErrorMsg("Iltimos, to'g'ri narx kiriting.");
      return;
    }
    if (form.stock === "" || Number(form.stock) < 0) {
      setErrorMsg("Iltimos, to'g'ri qoldiq miqdorini kiriting.");
      return;
    }
    if (!form.categoryId) {
      setErrorMsg("Iltimos, avtomobil uchun kategoriyani tanlang.");
      return;
    }

    const payload = {
      id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim() || undefined,
      categoryId: Number(form.categoryId)
    };

    updateCar(payload, {
      onSuccess: () => {
        toast.success("Avtomobil muvaffaqiyatli saqlandi");
        router.push("/cars");
      },
      onError: (err) => {
        setErrorMsg(err?.response?.data?.message || "Avtomobilni yangilashda xatolik yuz berdi.");
      },
    });
  };

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header mb-6">
          <Link href="/cars" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-3">
            <HiOutlineArrowLeft className="w-4 h-4" /> {"Avtomobillar ro'yxatiga qaytish"}
          </Link>
          <h1 className="dash-title">Avtomobilni Tahrirlash</h1>
          <p className="dash-subtitle">{"Katalogdagi avtomobil ma'lumotlarini o'zgartirish formasi."}</p>
        </header>

        {isLoading && <p className="dashboard-state">{"Avtomobil ma'lumotlari yuklanmoqda..."}</p>}
        {isError && (
          <p className="dashboard-state dashboard-state-error">
            {"Avtomobil ma'lumotlarini yuklashda xatolik yuz berdi: "}{error.message}
          </p>
        )}

        {!isLoading && !isError && (
          <div className="max-w-2xl bg-bg-card border border-border-base rounded-xl p-6 sm:p-8 shadow-sm">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit} noValidate>
              
              {/* Car Name */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="name" className="text-sm font-semibold text-text-base">
                  Avtomobil Nomi / Marka-Modeli *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Masalan: Chevrolet Malibu 2, BYD Song Plus..."
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
                  disabled={isPending}
                />
              </div>

              {/* Category selection */}
              <div className="flex flex-col gap-2">
                <label htmlFor="categoryId" className="text-sm font-semibold text-text-base">
                  Kategoriya *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 cursor-pointer"
                  disabled={isPending}
                >
                  <option value="">Kategoriyani tanlang</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="price" className="text-sm font-semibold text-text-base">
                  {"Narxi (so'mda) *"}
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  placeholder="Masalan: 320000000"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="stock" className="text-sm font-semibold text-text-base">
                  Qoldiq (dona) *
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="Masalan: 4"
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="image" className="text-sm font-semibold text-text-base">
                  Rasm Havolasi (URL)
                </label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  placeholder="https://example.com/car.jpg"
                  value={form.image}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-semibold text-text-base">
                  Tavsifi / Texnik xususiyatlari
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Avtomobil haqida qo'shimcha ma'lumotlar, dvigatel sig'imi, rangi va h.k."
                  value={form.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20 resize-none"
                  disabled={isPending}
                />
              </div>

              {errorMsg && (
                <div className="md:col-span-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-xs text-red-500 shadow-sm animate-pulse" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/cars"
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
