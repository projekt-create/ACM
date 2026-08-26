"use client";

import { useContext, useState } from "react";
import { UIContext } from "@/context/UiContext";
import { useAuth } from "@/context/AuthContext";
import SideBar from "@/components/SideBar";
import useProfile from "@/hooks/profile/useProfile";
import useUpdateProfile from "@/hooks/profile/useUpdateProfile";
import { toast } from "sonner";
import { HiOutlineUser, HiOutlineCheck } from "react-icons/hi2";

export default function ProfilePage() {
  const { sidebarOpen } = useContext(UIContext);
  const { user: authUser } = useAuth();
  
  const { data: apiProfile, refetch } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const user = apiProfile || authUser || {};

  const [form, setForm] = useState({
    name: user.name || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ism bo'sh bo'lishi mumkin emas");
      return;
    }

    updateProfile(form, {
      onSuccess: () => {
        toast.success("Profil yangilandi (Mahalliy xotiraga saqlandi)");
        refetch();
      },
    });
  };

  return (
    <div className="dashboard-shell">
      <SideBar />
      <main className={`dashboard-content ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <header className="dash-header mb-6">
          <h1 className="dash-title">Mening Profilim</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
          <div className="bg-bg-card border border-border-base rounded-xl p-6 shadow-sm flex flex-col items-center text-center lg:col-span-1">
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl mb-4 font-bold border border-primary/20">
              <HiOutlineUser className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-text-base">{user.name || "Admin"}</h2>
            <p className="text-sm text-slate-500 mb-1">@{user.login || "admin"}</p>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary select-none mt-2">
              {user.role || "Tizim Admini"}
            </span>

            <div className="w-full border-t border-border-base/55 mt-6 pt-4 text-left flex flex-col gap-3">
              <div>
                <span className="text-xs text-slate-450 block font-medium">Tizimdagi ID</span>
                <span className="text-sm font-semibold">{user.id || "#1"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-450 block font-medium">Status</span>
                <span className="text-sm font-semibold text-emerald-500">Faol</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-bg-card border border-border-base rounded-xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold mb-5 pb-3 border-b border-border-base/40">{"Ma'lumotlarni tahrirlash"}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-450">Foydalanuvchi nomi (Login)</label>
                <input
                  type="text"
                  value={user.login || "admin"}
                  disabled
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 text-slate-450 select-none outline-none dark:bg-bg-base/20 opacity-70"
                />
                <span className="text-xs text-slate-400">{"Tizim logini faqat ma'murlar tomonidan o'zgartirilishi mumkin."}</span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-text-base">{"To'liq Nomi (Ism-Familiya)"}</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  placeholder="Ismingizni kiriting"
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all dark:bg-bg-base/20"
                />
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-primary/15 disabled:opacity-50 select-none cursor-pointer border-0"
                >
                  <HiOutlineCheck className="w-4.5 h-4.5" /> Yangilash
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
