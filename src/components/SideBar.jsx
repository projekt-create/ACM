"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { UIContext } from "@/context/UiContext";
import { useAuth } from "@/context/AuthContext";
import { BsMoonStars, BsSun } from "react-icons/bs";
import {
  HiOutlineBars3,
  HiOutlineHome,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineUsers,
} from "react-icons/hi2";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: HiOutlineHome },
  { href: "/cars", label: "Avtomobillar", icon: HiOutlineBuildingOffice2 },
  { href: "/categories", label: "Kategoriyalar", icon: HiOutlineUsers },
  { href: "/profile", label: "Profil", icon: HiOutlineUser },
  { href: "/doc", label: "Dokumentatsiya", icon: HiOutlineDocumentText },
];

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, theme, toggleTheme, toggleSidebar } = useContext(UIContext);
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className={`sidebar-container ${sidebarOpen ? "is-open" : "is-collapsed"}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden="true">A</div>
        {sidebarOpen && <span className="sidebar-logo-text">ACM Panel</span>}
      </div>

      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Sidebarni yopish" : "Sidebarni ochish"}
        title={sidebarOpen ? "Sidebarni yopish" : "Sidebarni ochish"}
      >
        <HiOutlineBars3 />
        {sidebarOpen && <span>Sidebar</span>}
      </button>

      <nav className="sidebar-nav" aria-label="Asosiy navigatsiya">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? "sidebar-link-active" : ""}`} title={!sidebarOpen ? label : undefined}>
              <Icon className="sidebar-link-icon" />
              {sidebarOpen && <span className="sidebar-link-label">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          onClick={toggleTheme}
          className="sidebar-link sidebar-theme-btn"
          title={theme === "dark" ? "Yorug‘ rejim" : "Qorong‘i rejim"}
          aria-label={theme === "dark" ? "Yorug‘ rejimga o‘tish" : "Qorong‘i rejimga o‘tish"}
        >
          {theme === "dark" ? <BsSun className="sidebar-link-icon" /> : <BsMoonStars className="sidebar-link-icon" />}
          {sidebarOpen && <span className="sidebar-link-label">{theme === "dark" ? "Yorug‘ rejim" : "Qorong‘i rejim"}</span>}
        </button>
        <button type="button" onClick={handleLogout} disabled={loggingOut} className="sidebar-link sidebar-logout" title={!sidebarOpen ? "Chiqish" : undefined}>
          <HiOutlineArrowRightOnRectangle className="sidebar-link-icon" />
          {sidebarOpen && <span className="sidebar-link-label">{loggingOut ? "Chiqilmoqda..." : "Chiqish"}</span>}
        </button>
      </div>
    </aside>
  );
}
