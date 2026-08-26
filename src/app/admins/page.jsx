"use client";

import { useContext, useState } from "react";
import { UIContext } from "@/context/UiContext";
import { useAuth } from "@/context/AuthContext";
import SideBar from "@/components/SideBar";
import useAdmins from "@/hooks/admins/useAdmins";
import useCreateAdmin from "@/hooks/admins/useCreateAdmin";
import useEditAdmin from "@/hooks/admins/useEditAdmin";
import useEditMe from "@/hooks/admins/useEditMe";
import useDeleteAdmin from "@/hooks/admins/useDeleteAdmin";
import useProfile from "@/hooks/profile/useProfile";
import { toast } from "sonner";
import { 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineUserPlus, 
  HiOutlineLockClosed, 
  HiOutlineCheck, 
  HiOutlineXMark,
  HiOutlineInformationCircle
} from "react-icons/hi2";

export default function AdminsPage() {
  const { sidebarOpen } = useContext(UIContext);
  const { user: authUser } = useAuth();
  const { data: apiProfile } = useProfile();
  
  const currentUser = { ...(authUser || {}), ...(apiProfile || {}) };

  // React Query Hooks
  const { data: adminsData, isLoading, isError, error, refetch } = useAdmins();
  const { mutate: createAdmin, isPending: isCreating } = useCreateAdmin();
  const { mutate: editAdmin, isPending: isEditing } = useEditAdmin();
  const { mutate: editMyPassword, isPending: isChangingOwnPassword } = useEditMe();
  const { mutate: deleteAdmin } = useDeleteAdmin();

  const adminsList = Array.isArray(adminsData) ? adminsData : (adminsData?.items || []);

  // Ba'zi auth javoblarida isSuperAdmin kelmasligi mumkin. Bunday holatda
  // joriy foydalanuvchini admins ro'yxatidan topib, shu obyektning flag'ini ishlatamiz.
  const currentAdmin = adminsList.find((admin) => {
    if (admin?.id && currentUser?.id && String(admin.id) === String(currentUser.id)) return true;
    const adminLogin = String(admin?.login || admin?.username || "").toLowerCase();
    const currentLogin = String(currentUser?.login || currentUser?.username || "").toLowerCase();
    return Boolean(adminLogin && currentLogin && adminLogin === currentLogin);
  });
  const currentRole = String(currentUser?.role || "").toLowerCase();
  const isSuperAdmin =
    currentUser?.isSuperAdmin === true ||
    currentAdmin?.isSuperAdmin === true ||
    currentRole.includes("super");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null); // null means "Create New", object means "Edit"
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    currentPassword: "",
    password: "",
  });

  const checkIsSelf = (admin) => {
    if (!admin || !currentUser) return false;
    if (admin.id && currentUser.id && String(admin.id) === String(currentUser.id)) return true;
    const adminLogin = String(admin.login || admin.username || "").toLowerCase();
    const myLogin = String(currentUser.login || currentUser.username || "").toLowerCase();
    return Boolean(adminLogin && myLogin && adminLogin === myLogin);
  };

  const getAdminName = (admin) => admin?.fullName || admin?.name || "";

  const getApiErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    const details = Array.isArray(data?.errors) ? data.errors.join(" ") : data?.message;
    return details || error?.message || fallback;
  };

  const canChangePassword = (admin) => {
    if (!admin) return false;
    const isSelf = checkIsSelf(admin);
    return isSuperAdmin ? !isSelf : isSelf;
  };

  const openCreateModal = () => {
    setSelectedAdmin(null);
    setFormData({ name: "", login: "", currentPassword: "", password: "" });
    setModalOpen(true);
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: getAdminName(admin),
      login: admin.login || admin.username || "",
      currentPassword: "",
      password: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAdmin(null);
    setFormData({ name: "", login: "", currentPassword: "", password: "" });
  };

  const handleDelete = (admin) => {
    if (!isSuperAdmin) {
      toast.error("Faqat Super Admin boshqa ma'murlarni o'chira oladi!");
      return;
    }
    if (checkIsSelf(admin)) {
      toast.error("O'zingizning hisobingizni o'chira olmaysiz!");
      return;
    }

    if (window.confirm(`${getAdminName(admin) || admin.login} ma'murini o'chirishni tasdiqlaysizmi?`)) {
      deleteAdmin(admin.id, {
        onSuccess: () => {
          toast.success("Ma'mur muvaffaqiyatli o'chirildi");
          refetch();
        },
        onError: (err) => {
          toast.error(`O'chirishda xatolik: ${err?.message || "Server xatosi"}`);
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Ism-familiya kiritilishi shart");
      return;
    }

    const isSelf = selectedAdmin && checkIsSelf(selectedAdmin);

    // Rule 2: Regular Admin editing someone else
    if (!isSuperAdmin && selectedAdmin && !isSelf) {
      toast.error("Boshqa ma'murlarning ma'lumotlarini o'zgartirish huquqingiz yo'q!");
      return;
    }

    if (!isSuperAdmin && selectedAdmin && isSelf && !formData.password.trim()) {
      toast.error("Bu sahifada faqat o'z parolingizni almashtira olasiz");
      return;
    }

    if (formData.password.trim() && !canChangePassword(selectedAdmin)) {
      toast.error(
        isSuperAdmin
          ? "Super Admin o'z parolini bu yerdan o'zgartira olmaydi!"
          : "Siz faqat o'z parolingizni o'zgartira olasiz!",
      );
      return;
    }

    if (selectedAdmin) {
      // Edit Existing Admin
      const payload = { id: selectedAdmin.id, fullName: formData.name.trim() };

      // Loginni faqat bosh admin boshqa admin uchun o'zgartira oladi.
      if (isSuperAdmin && !isSelf) {
        const normalizedLogin = formData.login.trim().toLowerCase();
        if (!/^[a-z0-9._-]+$/.test(normalizedLogin)) {
          toast.error("Login faqat lotin harflari, raqamlar, nuqta, _ yoki - dan iborat bo'lishi mumkin");
          return;
        }

        const oldLogin = String(selectedAdmin.login || selectedAdmin.username || "").toLowerCase();
        const loginExists = adminsList.some(
          (admin) =>
            String(admin.login || admin.username || "").toLowerCase() === normalizedLogin &&
            String(admin.id) !== String(selectedAdmin.id),
        );
        if (loginExists) {
          toast.error("Bu login allaqachon mavjud");
          return;
        }

        if (normalizedLogin !== oldLogin) payload.login = normalizedLogin;
      }
      
      // Oddiy admin o'z parolini alohida /me/password endpoint orqali almashtiradi.
      const changeOwnPassword = !isSuperAdmin && isSelf && formData.password.trim();

      if (changeOwnPassword && !formData.currentPassword.trim()) {
        toast.error("Hozirgi parolingizni kiriting");
        return;
      }

      if (changeOwnPassword && formData.password.trim().length < 6) {
        toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
        return;
      }

      if (changeOwnPassword) {
        editMyPassword(
          {
            currentPassword: formData.currentPassword.trim(),
            newPassword: formData.password.trim(),
          },
          {
            onSuccess: () => {
              toast.success("Parolingiz muvaffaqiyatli almashtirildi");
              closeModal();
            },
            onError: (err) => {
              toast.error(`Parolni almashtirishda xatolik: ${getApiErrorMessage(err, "Server xatosi")}`);
            },
          },
        );
        return;
      }

      // Bosh admin boshqa admin parolini shu admin endpointi orqali o'zgartiradi.
      if (formData.password.trim() && isSuperAdmin && canChangePassword(selectedAdmin)) {
        if (formData.password.trim().length < 6) {
          toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
          return;
        }
        payload.password = formData.password;
      }

      editAdmin(payload, {
        onSuccess: () => {
          const finish = () => {
            toast.success("Ma'lumotlar muvaffaqiyatli yangilandi");
            closeModal();
            refetch();
          };

          finish();
        },
        onError: (err) => {
          toast.error(`Yangilashda xatolik: ${err?.message || "Server xatosi"}`);
        }
      });
    } else {
      // Create New Admin
      if (!formData.login.trim()) {
        toast.error("Yangi admin uchun login kiritilishi shart");
        return;
      }

      const normalizedLogin = formData.login.trim().toLowerCase();
      if (!/^[a-z0-9._-]+$/.test(normalizedLogin)) {
        toast.error("Login faqat lotin harflari, raqamlar, nuqta, _ yoki - dan iborat bo'lishi mumkin");
        return;
      }

      const loginExists = adminsList.some(
        (admin) => String(admin.login || admin.username || "").toLowerCase() === normalizedLogin,
      );
      if (loginExists) {
        toast.error("Bu login allaqachon mavjud");
        return;
      }

      if (!formData.password.trim()) {
        toast.error("Yangi admin uchun parol kiritilishi shart");
        return;
      }

      if (formData.password.trim().length < 6) {
        toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        return;
      }

      const payload = {
        fullName: formData.name.trim(),
        login: normalizedLogin,
        password: formData.password.trim(),
      };

      createAdmin(payload, {
        onSuccess: () => {
          toast.success("Yangi ma'mur muvaffaqiyatli yaratildi");
          closeModal();
          refetch();
        },
        onError: (err) => {
          toast.error(`Yaratishda xatolik: ${getApiErrorMessage(err, "Server xatosi")}`);
        }
      });
    }
  };

  return (
    <div className="w-full flex justify-end p-5">
      <SideBar />
      <main className={`transition-all duration-300 ${sidebarOpen ? "w-[calc(100%-240px)]" : "w-[calc(100%-80px)]"}`}>
        
        {/* Header Section */}
        <header className="h-16 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-base flex items-center gap-2">
              <HiOutlineUserGroup className="w-7 h-7 text-primary" />
              Tizim Ma&apos;murlari (Admins)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tizimdagi barcha ma&apos;murlar va ularning kirish huquqlarini boshqarish
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer border-0"
            >
              <HiOutlineUserPlus className="w-4 h-4" /> Yangi Admin Qo&apos;shish
            </button>
          )}
        </header>

        {/* Current User Role Notice */}
        <div className="bg-bg-card border border-border-base rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Sizning Rolingiz:</span>
              <span className="font-bold text-text-base text-sm capitalize">
                {isSuperAdmin ? "Super Admin" : "Oddiy Admin"} ({getAdminName(currentUser) || currentUser.login || "Foydalanuvchi"})
              </span>
            </div>
          </div>

          <div className="text-slate-500 font-medium text-right max-w-md hidden sm:block">
            {isSuperAdmin ? (
              <span className="text-emerald-500 font-semibold flex items-center gap-1 justify-end">
                <HiOutlineCheck className="w-4 h-4" /> Boshqa adminlarni tahrirlashingiz hamda yangisini yaratishingiz mumkin
              </span>
            ) : (
              <span className="text-amber-500 font-semibold flex items-center gap-1 justify-end">
                <HiOutlineLockClosed className="w-4 h-4" /> Faqat o&apos;z parolingiz va profil ma&apos;lumotlaringizni o&apos;zgartirishingiz mumkin
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-bg-card border border-border-base rounded-xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium text-sm">Ma&apos;murlar ro&apos;yxati yuklanmoqda...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium">Ma&apos;murlarni yuklashda xatolik: {String(error?.message || error)}</p>
          </div>
        )}

        {/* Admins Data Table */}
        {!isLoading && !isError && (
          <div className="bg-bg-card border border-border-base rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border-base flex items-center justify-between">
              <h3 className="font-semibold text-text-base flex items-center gap-2">
                <HiOutlineShieldCheck className="w-5 h-5 text-primary" />
                Ro&apos;yxatdagi Ma&apos;murlar
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                Jami: {adminsList.length} ta admin
              </span>
            </div>

            {adminsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-base/40 border-b border-border-base text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5 text-start font-semibold">ID</th>
                      <th className="px-6 py-3.5 text-start font-semibold">Foydalanuvchi Nomi</th>
                      <th className="px-6 py-3.5 text-start font-semibold">Login</th>
                      <th className="px-6 py-3.5 text-start font-semibold">Roli</th>
                      <th className="px-6 py-3.5 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base">
                    {adminsList.map((admin, idx) => {
                      const isSelf = checkIsSelf(admin);
                      const canEditThisAdmin = isSuperAdmin ? true : isSelf;

                      return (
                        <tr key={admin.id || idx} className="hover:bg-bg-hover/80 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">
                            #{admin.id || idx + 1}
                          </td>
                          <td className="px-6 py-4 font-semibold text-text-base">
                            <div className="flex items-center gap-2">
                              {getAdminName(admin) || "Admin"}
                              {isSelf && (
                                <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded">
                                  Siz
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            @{admin.login || admin.username || "admin"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md font-semibold text-xs inline-flex items-center gap-1 uppercase">
                              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                              {admin.isSuperAdmin === true ? "Super Admin" : (admin.role || "Admin")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canEditThisAdmin ? (
                                <button
                                  onClick={() => openEditModal(admin)}
                                  className="p-1.5 hover:bg-bg-base rounded-lg text-slate-500 hover:text-primary transition-all cursor-pointer border border-transparent hover:border-border-base"
                                  title="Tahrirlash"
                                >
                                  <HiOutlinePencilSquare className="w-4 h-4" />
                                </button>
                              ) : (
                                <span 
                                  className="p-1.5 text-slate-400 cursor-not-allowed opacity-50"
                                  title="Faqat Super Admin boshqalarni tahrirlashi mumkin"
                                >
                                  <HiOutlineLockClosed className="w-4 h-4" />
                                </span>
                              )}

                              {isSuperAdmin && !isSelf && (
                                <button
                                  onClick={() => handleDelete(admin)}
                                  className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
                                  title="O'chirish"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Tizimda ma&apos;murlar topilmadi
              </div>
            )}
          </div>
        )}

        {/* MODAL DIALOG: EDIT / CREATE ADMIN */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-bg-card border border-border-base rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
              
              <div className="flex items-center justify-between pb-4 border-b border-border-base mb-5">
                <h3 className="font-bold text-text-base text-lg flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-5 h-5 text-primary" />
                  {selectedAdmin ? "Admin Ma'lumotlarini Tahrirlash" : "Yangi Admin Yaratish"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-text-base hover:bg-bg-hover transition-all cursor-pointer border-0"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Form Field: Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-base">To&apos;liq Ism-Familiya</label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin && selectedAdmin && checkIsSelf(selectedAdmin)}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: Jamshid Alimov"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border-base bg-bg-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                {/* Loginni yaratishda yoki bosh admin boshqa adminni tahrirlashda ko'rsatamiz */}
                {(!selectedAdmin || (isSuperAdmin && selectedAdmin && !checkIsSelf(selectedAdmin))) && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-base">Foydalanuvchi Logini (@username)</label>
                    <input
                      type="text"
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                      placeholder="admin_login"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-border-base bg-bg-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                    />
                  </div>
                )}

                {/* Oddiy admin o'z parolini almashtirganda hozirgi parol ham kerak */}
                {!isSuperAdmin && selectedAdmin && checkIsSelf(selectedAdmin) && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-base">Hozirgi parol</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Hozirgi parolingiz"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-border-base bg-bg-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                    />
                  </div>
                )}

                {/* Form Field: Password (Rule Controlled) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-base">
                      {selectedAdmin ? "Yangi parol (ixtiyoriy)" : "Parol"}
                    </label>
                    {isSuperAdmin && selectedAdmin && checkIsSelf(selectedAdmin) && (
                      <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                        <HiOutlineLockClosed className="w-3 h-3" /> O&apos;zingiznikini o&apos;zgartira olmaysiz
                      </span>
                    )}
                  </div>

                  <input
                    type="password"
                    disabled={selectedAdmin && !canChangePassword(selectedAdmin)}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={selectedAdmin ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border-base bg-bg-base disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                  />

                  {/* Rule Information Banner */}
                  {isSuperAdmin && selectedAdmin && checkIsSelf(selectedAdmin) && (
                    <p className="text-[11px] text-amber-500/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-md mt-1 flex items-start gap-1.5">
                      <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      Super Admin xavfsizlik qoidalariga ko&apos;ra o&apos;z parolini ushbu sahifadan o&apos;zgartira olmaydi.
                    </p>
                  )}

                  {!isSuperAdmin && selectedAdmin && checkIsSelf(selectedAdmin) && (
                    <p className="text-[11px] text-emerald-500/90 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-md mt-1 flex items-start gap-1.5">
                      <HiOutlineCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      Oddiy admin sifatida o&apos;zingizning yangi parolingizni kiritishingiz mumkin.
                    </p>
                  )}
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-base mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-text-base hover:bg-bg-hover rounded-lg transition-all border border-border-base cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    onClick={(event) => {
                      event.preventDefault();
                      handleSubmit(event);
                    }}
                    disabled={isCreating || isEditing || isChangingOwnPassword}
                    className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer border-0"
                  >
                    {isCreating || isEditing || isChangingOwnPassword ? "Saqlanmoqda..." : (selectedAdmin ? "Saqlash" : "Yaratish")}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
