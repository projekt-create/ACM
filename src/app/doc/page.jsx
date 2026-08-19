"use client";

import { useContext } from "react";
import { UIContext } from "@/context/UiContext";
import SideBar from "@/components/SideBar";

const apiDoc = [
  {
    group: "0. Boshlanish & Health",
    endpoints: [
      { method: "GET", path: "/api", desc: "Server holatini tekshirish hamda API versiyani so'rash (health check)." }
    ]
  },
  {
    group: "1. Avtorizatsiya (Auth)",
    endpoints: [
      { method: "POST", path: "/api/auth/login", desc: "Tizimga kirish (accessToken va admin ma'lumotlarini olish)." },
      { method: "GET", path: "/api/auth/me", desc: "Hozirgi tizimga kirgan admin tafsilotlarini so'rash." }
    ]
  },
  {
    group: "2. Kategoriyalar boshqaruvi",
    endpoints: [
      { method: "GET", path: "/api/categories", desc: "Kategoriyalarni filtrlash (page, search, isActive) va saralash bilan olish." },
      { method: "POST", path: "/api/categories", desc: "Yangi kategoriya qo'shish (name - majburiy, description - ixtiyoriy)." },
      { method: "GET", path: "/api/categories/{id}", desc: "ID bo'yicha bitta kategoriya tafsilotlarini ko'rish." },
      { method: "PUT/PATCH", path: "/api/categories/{id}", desc: "Kategoriya ma'lumotlarini o'zgartirish." },
      { method: "PATCH", path: "/api/categories/{id}/status", desc: "Kategoriyani faollashtirish (isActive: true) yoki nofaol qilish." },
      { method: "DELETE", path: "/api/categories/{id}", desc: "Kategoriyani o'chirib tashlash." }
    ]
  },
  {
    group: "3. Avtomobillar boshqaruvi (Products)",
    endpoints: [
      { method: "GET", path: "/api/products", desc: "Avtomobillar ro'yxatini olish (qidiruv, kategoriya, qoldiq, narx va status bo'yicha filtrlash)." },
      { method: "POST", path: "/api/products", desc: "Yangi mashina yaratish (name, price, stock, image url, categoryId)." },
      { method: "GET", path: "/api/products/{id}", desc: "Bitta avtomobil haqida batafsil ma'lumot olish." },
      { method: "PUT/PATCH", path: "/api/products/{id}", desc: "Mashina ma'lumotlarini qisman yoki to'liq yangilash." },
      { method: "PATCH", path: "/api/products/{id}/status", desc: "Mashina statusini active/inactive qilish." },
      { method: "DELETE", path: "/api/products/{id}", desc: "Avtomobilni o'chirish." }
    ]
  },
  {
    group: "4. Dashboard Statistikasi",
    endpoints: [
      { method: "GET", path: "/api/dashboard/stats", desc: "Tizimning umumiy raqamli ko'rsatkichlari (jami mashina, user, kategoriya)." },
      { method: "GET", path: "/api/dashboard/category-stats", desc: "Kategoriyalar bo'yicha mashinalar miqdori taqsimoti." },
      { method: "GET", path: "/api/dashboard/low-stock", desc: "Omborda/salonda qoldig'i 5 tadan kam qolgan mashinalar ro'yxati." }
    ]
  }
];

export default function DocPage() {
  const { sidebarOpen } = useContext(UIContext);

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header mb-6">
          <p className="dash-eyebrow">Texnik hujjatlar</p>
          <h1 className="dash-title">Tizim API xaritasi</h1>
          <p className="dash-subtitle">{"Loyihaga bog'langan backend endpointlar ro'yxati va ishlash logikasi."}</p>
        </header>

        <div className="max-w-4xl flex flex-col gap-8">
          {apiDoc.map((group) => (
            <section key={group.group} className="bg-bg-card border border-border-base rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-4 pb-2 border-b border-border-base/40 text-primary">
                {group.group}
              </h2>
              <div className="flex flex-col gap-4">
                {group.endpoints.map((ep) => {
                  const isGet = ep.method === "GET";
                  const isPost = ep.method === "POST";
                  const isDel = ep.method === "DELETE";

                  const badgeColor = isGet
                    ? "bg-sky-500/15 text-sky-500"
                    : isPost
                    ? "bg-emerald-500/15 text-emerald-500"
                    : isDel
                    ? "bg-rose-500/15 text-rose-500"
                    : "bg-indigo-500/15 text-indigo-500";

                  return (
                    <div key={`${ep.method}-${ep.path}`} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-bg-base/30 rounded-lg dark:bg-bg-base/15">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase inline-block text-center w-24 shrink-0 ${badgeColor}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-semibold break-all text-slate-800 dark:text-slate-200">
                        {ep.path}
                      </code>
                      <p className="text-sm text-slate-450 sm:ml-auto">
                        {ep.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
