"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useLogin from "@/hooks/auth/useLogin";
import { useUI } from "@/context/UiContext";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import '@/app/globals.css'

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { mutate: login, isPending } = useLogin();

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.login.trim() || !form.password.trim()) {
      setError("Iltimos, login va parolni kiriting.");
      return;
    }
    login(form, {
      onSuccess: () => router.replace(callbackUrl),
      onError: (err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Login yoki parol noto'g'ri.";
        setError(msg);
      },
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {/* Username / Login */}
      <div className="flex flex-col gap-2">
        <label htmlFor="login" className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          Foydalanuvchi nomi
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
          </span>
          <input
            id="login"
            name="login"
            type="text"
            autoComplete="username"
            autoFocus
            value={form.login}
            onChange={handleChange}
            placeholder="admin"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 dark:bg-bg-base/50 focus:border-(--primary) focus:ring-2 focus:ring-blue-500/15 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          Parol
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-border-base bg-bg-base/30 dark:bg-bg-base/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            disabled={isPending}
          />
          <button
            type="button"
            className="absolute right-3.5 text-slate-400 hover:text-(--primary) dark:text-slate-500 transition-colors"
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
            aria-label="Parolni ko'rsatish"
          >
            {showPass ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-2.5 text-xs text-red-500 shadow-sm animate-pulse" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-(--primary) to-(--secondary) text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-500/5 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none cursor-pointer"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
            Kirish...
          </>
        ) : (
          "Tizimga kirish"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const { theme, toggleTheme } = useUI();

  return (
    <div className="min-h-screen flex bg-bg-base text-text-base transition-colors duration-150 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-lg border border-border-base bg-bg-card hover:bg-bg-base/30 text-text-base transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer z-10"
        aria-label="Loyihani rejimini tanlash"
      >
        {theme === "dark" ? <MdLightMode className="w-5 h-5 text-yellow-500" /> : <MdDarkMode className="w-5 h-5 text-slate-700" />}
      </button>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[440px] bg-bg-card border border-border-base rounded-2xl p-8 sm:p-10 shadow-xl transition-all duration-300 select-none">
          <div className="flex items-center gap-4.5 mb-8 pb-6 border-b border-border-base/40">
            <div>
              <svg viewBox="0 0 32 32" fill="none" className="w-11 h-11">
                <rect width="32" height="32" rx="8" fill="url(#cg)"/>
                <path d="M9 23V11l7 6 7-6v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb"/>
                    <stop offset="1" stopColor="#4f46e5"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tizimga kirish</h1>
              <p className="text-xs text-slate-400 mt-0.5">Admin hisobingizga kiring</p>
            </div>
          </div>

          <Suspense fallback={<p className="text-sm text-slate-400 text-center py-4">Yuklanmoqda…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
