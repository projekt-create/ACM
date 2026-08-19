"use client";

import Link from "next/link";
import { useContext, useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { HiOutlineArrowRight, HiOutlineExclamationTriangle } from "react-icons/hi2";
import SideBar from "@/components/SideBar";
import { UIContext } from "@/context/UiContext";
import useDashboardStats from "@/hooks/dashboard/useDashboardStats";
import useCategoryStats from "@/hooks/dashboard/useCategoryStats";
import useLowStock from "@/hooks/dashboard/useLowStock";

const cardClass = "dashboard-chart-card";

function payload(value) {
  return value?.data ?? value?.result ?? value ?? {};
}

function listPayload(value, keys = []) {
  const data = payload(value);
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  if (data && typeof data === "object") {
    return Object.entries(data)
      .filter(([, item]) => item && typeof item === "object")
      .map(([name, item]) => ({ name, ...item }));
  }
  return [];
}

function numberFrom(item, keys) {
  for (const key of keys) {
    if (Array.isArray(item?.[key])) return item[key].length;
    const value = Number(item?.[key] ?? item?.[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]);
    if (Number.isFinite(value)) return value;
  }
  const fallback = Object.entries(item || {}).find(([key, value]) =>
    !/(id|code|year|price)/i.test(key) && value !== "" && Number.isFinite(Number(value)),
  );
  if (fallback) return Number(fallback[1]);
  return 0;
}

function labelFrom(item, fallback) {
  const values = [item?.name, item?.categoryName, item?.title, item?.model, item?.car?.name, item?.vehicle?.name, item?.category?.name, item?.category];
  return values.find((value) => typeof value === "string" || typeof value === "number") ?? fallback;
}

function StatCard({ label, value }) {
  return <article className="dash-stat-card"><div className="dash-stat-info"><span className="dash-stat-label">{label}</span><strong className="dash-stat-value">{value}</strong></div></article>;
}

export default function DashboardContent() {
  const { sidebarOpen } = useContext(UIContext);
  const stats = useDashboardStats();
  const categoryStats = useCategoryStats();
  const lowStock = useLowStock();

  const categoryData = useMemo(() => listPayload(categoryStats.data, ["categories", "items", "results"]).map((item, index) => ({
    name: labelFrom(item, `Kategoriya ${index + 1}`),
    total: numberFrom(item, ["total", "count", "value", "carsCount", "carCount", "cars", "vehicleCount", "numberOfCars"]),
  })), [categoryStats.data]);
  const lowStockData = useMemo(() => listPayload(lowStock.data, ["cars", "items", "results", "vehicles"]).map((item, index) => ({
    name: labelFrom(item, `Avtomobil ${index + 1}`),
    stock: numberFrom(item, ["stock", "quantity", "count", "available", "remaining", "stockCount", "quantityInStock"]),
  })), [lowStock.data]);

  const statsData = payload(stats.data);
  const categoryTotal = categoryData.reduce((sum, item) => sum + item.total, 0);
  const totalCars = numberFrom(statsData, ["totalCars", "carsCount", "totalVehicles", "vehiclesCount", "cars", "totalStock"]) || categoryTotal;
  const totalCategories = numberFrom(statsData, ["totalCategories", "categoriesCount", "categoryCount"]) || categoryData.length;
  const totalUsers = numberFrom(statsData, ["totalUsers", "usersCount", "userCount"]);

  const loading = stats.isLoading || categoryStats.isLoading || lowStock.isLoading;
  const error = stats.error || categoryStats.error || lowStock.error;

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header">
          <div><p className="dash-eyebrow">ACM boshqaruv paneli</p><h1 className="dash-title">Dashboard</h1><p className="dash-subtitle">Avtosalonning umumiy statistikasi.</p></div>
          <Link href="/cars" className="dashboard-action">Avtomobillarni ko‘rish <HiOutlineArrowRight /></Link>
        </header>

        {loading && <p className="dashboard-state">Statistika yuklanmoqda...</p>}
        {error && <p className="dashboard-state dashboard-state-error">Statistikani yuklashda xatolik: {error.message}</p>}

        {!loading && !error && <>
          <section className="dash-stats">
            <StatCard label="Jami avtomobillar" value={totalCars} />
            <StatCard label="Kategoriyalar" value={totalCategories} />
            <StatCard label="Foydalanuvchilar" value={totalUsers} />
            <StatCard label="Kam qolgan avtomobillar" value={lowStockData.length} />
          </section>

          <div className="dashboard-charts-grid">
            <section className={cardClass}>
              <p className="dash-eyebrow">Kategoriya statistikasi</p>
              <h2 className="dash-section-title">Har bir kategoriya bo‘yicha avtomobillar</h2>
              {categoryData.length ? <ResponsiveContainer width="100%" height={330}><BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 35 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)" }} />
                <Bar dataKey="total" name="Avtomobillar" fill="var(--primary)" radius={[7, 7, 0, 0]} />
              </BarChart></ResponsiveContainer> : <p className="dashboard-state">Kategoriya statistikasi mavjud emas.</p>}
            </section>

            <section className={cardClass}>
              <p className="dash-eyebrow">Kam qoldiq</p>
              <h2 className="dash-section-title">Salonda kam qolgan avtomobillar</h2>
              {lowStockData.length ? <ResponsiveContainer width="100%" height={330}><BarChart data={lowStockData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--text-muted)" }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)" }} />
                <Bar dataKey="stock" name="Qoldiq" fill="#f97316" radius={[0, 7, 7, 0]} />
              </BarChart></ResponsiveContainer> : <p className="dashboard-state"><HiOutlineExclamationTriangle /> Kam qoldiqdagi avtomobillar yo‘q.</p>}
            </section>
          </div>
        </>}
      </main>
    </div>
  );
}
