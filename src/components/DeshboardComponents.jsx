"use client";

import { useContext } from 'react';
import SideBar from './SideBar';
import { UIContext } from '@/context/UiContext';
import useDashboardStats from '@/hooks/dashboard/useDashboardStats';
import useCategoryStats from '@/hooks/dashboard/useCategoryStats';
import usePickupPointStats from '@/hooks/dashboard/usePickupPointStats';
import useLowStock from '@/hooks/dashboard/useLowStock';
import useCars from '@/hooks/cars/useCars';
import Link from 'next/link';
import { 
  IoCarSportSharp, 
} from "react-icons/io5";
import { 
  HiOutlineSquares2X2, 
  HiOutlineMapPin, 
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineCircleStack,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar
} from "react-icons/hi2";

function unwrapData(res) {
  if (!res) return null;
  if (typeof res === 'object' && !Array.isArray(res) && 'data' in res && res.data !== undefined) {
    return unwrapData(res.data);
  }
  return res;
}

function safeExtractCount(item) {
  if (typeof item === 'number') return item;
  if (!item || typeof item !== 'object') return 0;
  if (typeof item.productsCount === 'number') return item.productsCount;
  if (typeof item.activeProductsCount === 'number') return item.activeProductsCount;
  if (typeof item.carsCount === 'number') return item.carsCount;
  if (typeof item.count === 'number') return item.count;
  if (typeof item.total === 'number') return item.total;
  if (typeof item.totalStock === 'number') return item.totalStock;
  if (typeof item.quantity === 'number') return item.quantity;
  if (typeof item.stock === 'number') return item.stock;
  if (item.val && typeof item.val !== 'object') return Number(item.val) || 0;
  if (item.val) return safeExtractCount(item.val);
  return 0;
}

function safeExtractName(item, fallback = "Noma'lum") {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return fallback;
  if (typeof item.name === 'string') return item.name;
  if (typeof item.title === 'string') return item.title;
  if (typeof item.carName === 'string') return item.carName;
  if (typeof item.address === 'string') return item.address;
  if (item.val && typeof item.val === 'string') return item.val;
  if (item.val) return safeExtractName(item.val, fallback);
  return fallback;
}

export default function DeshboardComponents() {
  const { sidebarOpen } = useContext(UIContext);

  const { 
    data: dashboardStats, 
    isLoading: dashboardStatsLoading, 
    isError: dashboardStatsError, 
    error: dashboardStatsErrorMessage 
  } = useDashboardStats();

  const { 
    data: categorystats, 
    isLoading: categorystatsLoading, 
    isError: categorystatsError, 
    error: categorystatsErrorMessage 
  } = useCategoryStats();

  const { 
    data: PickupPointsStats, 
    isLoading: PickupPointsStatsLoading, 
    isError: PickupPointsStatsError, 
    error: PickupPointsStatsErrorMessage 
  } = usePickupPointStats();

  const { 
    data: LowStockStats, 
    isLoading: LowStockStatsLoading, 
    isError: LowStockStatsError, 
    error: LowStockStatsErrorMessage 
  } = useLowStock();

  const { data: carsData, isLoading: carsLoading } = useCars({ limit: 100 });

  const isLoading = (dashboardStatsLoading || categorystatsLoading || PickupPointsStatsLoading || LowStockStatsLoading) && carsLoading;
  const isError = dashboardStatsError && categorystatsError && PickupPointsStatsError && LowStockStatsError;
  const errorMessage = dashboardStatsErrorMessage || categorystatsErrorMessage || PickupPointsStatsErrorMessage || LowStockStatsErrorMessage;

  // 1. Unwrap Cars Data
  const unwrappedCarsData = unwrapData(carsData);
  const carsList = unwrappedCarsData?.items || (Array.isArray(unwrappedCarsData) ? unwrappedCarsData : []);
  
  // 2. Dashboard Stats Data
  const unwrappedDashboardStats = unwrapData(dashboardStats);
  const totalCars = safeExtractCount(unwrappedDashboardStats?.totalCars) || safeExtractCount(unwrappedDashboardStats?.count) || (carsList.length > 0 ? carsList.length : 0);
  const activeCarsCount = carsList.filter(c => c.isActive !== false).length;
  const inactiveCarsCount = carsList.length > 0 ? carsList.length - activeCarsCount : 0;
  const totalInventoryUnits = carsList.reduce((acc, car) => acc + (Number(car.stock) || 0), 0);

  // 3. Category Stats Unwrapping & Fallback Aggregation
  const rawCatData = unwrapData(categorystats);
  let categoryItems = [];

  if (Array.isArray(rawCatData)) {
    categoryItems = rawCatData;
  } else if (rawCatData && typeof rawCatData === 'object') {
    const items = rawCatData.items || rawCatData.categories;
    if (Array.isArray(items)) {
      categoryItems = items;
    } else {
      const ignoreKeys = new Set(['success', 'message', 'statusCode', 'page', 'limit', 'total', 'count']);
      categoryItems = Object.entries(rawCatData)
        .filter(([key]) => !ignoreKeys.has(key))
        .map(([key, val]) => ({ name: key, val }));
    }
  }

  // Fallback: If API category-stats is empty or invalid, aggregate from carsList
  if (categoryItems.length === 0 && carsList.length > 0) {
    const catMap = {};
    carsList.forEach(car => {
      const catName = typeof car.category === 'object' ? (car.category?.name || 'Boshqa') : (car.category || 'Boshqa');
      catMap[catName] = (catMap[catName] || 0) + 1;
    });
    categoryItems = Object.entries(catMap).map(([name, count]) => ({ name, count }));
  }

  const totalCategoriesCount = categoryItems.length;
  // Limit to top 5 categories for clean dashboard view
  const visibleCategories = categoryItems.slice(0, 5);

  // 4. Pickup Points Stats Unwrapping & Filter
  const rawPickupData = unwrapData(PickupPointsStats);
  let pickupPointItems = [];

  if (Array.isArray(rawPickupData)) {
    pickupPointItems = rawPickupData;
  } else if (rawPickupData && typeof rawPickupData === 'object') {
    const items = rawPickupData.items || rawPickupData.points;
    if (Array.isArray(items)) {
      pickupPointItems = items;
    } else {
      const ignoreKeys = new Set(['success', 'message', 'statusCode', 'page', 'limit', 'total', 'count']);
      pickupPointItems = Object.entries(rawPickupData)
        .filter(([key]) => !ignoreKeys.has(key))
        .map(([key, val]) => ({ name: key, val }));
    }
  }

  const totalPickupPointsCount = pickupPointItems.length;
  // Limit to 5 pickup points
  const visiblePickupPoints = pickupPointItems.slice(0, 5);

  // 5. Low Stock Items Unwrapping & Fallback from carsList
  const rawLowStockData = unwrapData(LowStockStats);
  let lowStockItems = [];

  if (Array.isArray(rawLowStockData)) {
    lowStockItems = rawLowStockData;
  } else if (rawLowStockData && typeof rawLowStockData === 'object') {
    lowStockItems = rawLowStockData.items || rawLowStockData.products || [];
  }

  // Fallback: If low stock API returns empty, calculate from carsList (stock <= 5)
  if (lowStockItems.length === 0 && carsList.length > 0) {
    lowStockItems = carsList.filter(car => Number(car.stock) <= 5);
  }

  const totalLowStockCount = lowStockItems.length;
  // Limit to top 5 low stock items
  const visibleLowStockItems = lowStockItems.slice(0, 5);

  // 6. Price Calculation
  const totalPriceSum = carsList.reduce((acc, car) => acc + (Number(car.price) || 0), 0);
  const avgCarPrice = carsList.length > 0 ? Math.round(totalPriceSum / carsList.length) : 0;

  const formatPrice = (price) => {
    if (!price && price !== 0) return "-";
    return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="w-full flex justify-end p-5">
      <SideBar />
      <main className={`transition-all duration-300 ${sidebarOpen ? "w-[calc(100%-240px)]" : "w-[calc(100%-80px)]"}`}>
        
        {/* Header Section */}
        <header className="h-16 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-base flex items-center gap-2">
              <HiOutlineChartBar className="w-7 h-7 text-primary" />
              Statistika va Tahlillar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              API dan olingan barcha real-vaqt ko&apos;rsatkichlari hamda tahlillar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/cars" 
              className="flex items-center gap-2 text-slate-700 dark:text-slate-200 border border-border-base rounded-lg px-4 py-2 bg-bg-card hover:bg-bg-hover cursor-pointer text-sm font-medium transition-all"
            >
              <IoCarSportSharp className="w-4 h-4 text-primary" /> Avtomobillar ro&apos;yxati
            </Link>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-bg-card border border-border-base rounded-xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium text-sm">API statistika ma&apos;lumotlari yuklanmoqda...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium">API statistikasini yuklashda xatolik: {String(errorMessage?.message || errorMessage)}</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">

            {/* 1. MINIMAL UNIFIED STAT CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Stat 1: Total Cars */}
              <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jami Avtomobillar</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <IoCarSportSharp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-text-base">{totalCars}</span>
                  <span className="text-[11px] font-medium text-slate-500 bg-bg-base px-2 py-0.5 rounded border border-border-base">
                    Flot
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border-base flex justify-between items-center text-[11px] text-slate-400">
                  <span>Ro&apos;yxatdagi modellari</span>
                  <Link href="/cars" className="text-primary font-semibold hover:underline">Barchasi &rarr;</Link>
                </div>
              </div>

              {/* Stat 2: Active vs Inactive Cars */}
              <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faol / Nofaol</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <HiOutlineCheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-extrabold text-text-base">{activeCarsCount}</span>
                    <span className="text-xs text-slate-400">/</span>
                    <span className="text-sm font-semibold text-slate-400">{inactiveCarsCount}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-bg-base px-2 py-0.5 rounded border border-border-base">
                    {carsList.length > 0 ? Math.round((activeCarsCount / carsList.length) * 100) : 100}%
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border-base flex justify-between items-center text-[11px] text-slate-400">
                  <span>Faol va nofaol holat</span>
                  <span className="text-slate-500 font-medium">{activeCarsCount} faol</span>
                </div>
              </div>

              {/* Stat 3: Total Categories */}
              <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategoriyalar</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <HiOutlineSquares2X2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-text-base">{totalCategoriesCount}</span>
                  <span className="text-[11px] font-medium text-slate-500 bg-bg-base px-2 py-0.5 rounded border border-border-base">
                    Turkumlar
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border-base flex justify-between items-center text-[11px] text-slate-400">
                  <span>Mavjud turkumlar</span>
                  <Link href="/categories" className="text-primary font-semibold hover:underline">Boshqarish &rarr;</Link>
                </div>
              </div>

              {/* Stat 4: Inventory Units */}
              <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jami Zaxira Donasi</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <HiOutlineCircleStack className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-text-base">{totalInventoryUnits > 0 ? totalInventoryUnits : totalCars}</span>
                  <span className="text-[11px] font-medium text-slate-500 bg-bg-base px-2 py-0.5 rounded border border-border-base">
                    Donada
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border-base flex justify-between items-center text-[11px] text-slate-400">
                  <span>Barcha qoldiq zaxira</span>
                  <span className="text-text-base font-semibold">{totalInventoryUnits} birlik</span>
                </div>
              </div>

              {/* Stat 5: Low Stock Alerts */}
              <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kam Zaxiradagilar</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <HiOutlineExclamationTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-text-base">{totalLowStockCount}</span>
                  <span className="text-[11px] font-medium text-slate-500 bg-bg-base px-2 py-0.5 rounded border border-border-base">
                    {totalLowStockCount > 0 ? "Kritik" : "Normal"}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border-base flex justify-between items-center text-[11px] text-slate-400">
                  <span>Kam qolgan modellar</span>
                  <span className="text-text-base font-semibold">{totalLowStockCount} ta</span>
                </div>
              </div>

            </div>

            {/* 2. CATEGORY BREAKDOWN & PICKUP NODES ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-base">
                  <div>
                    <h3 className="font-semibold text-text-base flex items-center gap-2">
                      <HiOutlineSquares2X2 className="w-5 h-5 text-primary" />
                      Kategoriyalar bo&apos;yicha Avtomobillar Ulushi
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top 5 ta turkumdagi avtomobillar soni</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-bg-base text-slate-600 dark:text-slate-300 rounded-lg border border-border-base">
                    {totalCategoriesCount} ta kategoriya
                  </span>
                </div>

                {visibleCategories.length > 0 ? (
                  <div className="space-y-4">
                    {visibleCategories.map((cat, idx) => {
                      const name = safeExtractName(cat, `Kategoriya #${idx + 1}`);
                      const count = safeExtractCount(cat) || (typeof cat === 'object' && cat.count ? Number(cat.count) : 0);
                      const percentage = totalCars > 0 ? Math.min(100, Math.round((count / totalCars) * 100)) : 0;

                      return (
                        <div key={cat.id || idx} className="p-3 bg-bg-base/40 rounded-lg border border-border-base space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text-base">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-base">{count} ta avtomobil</span>
                              <span className="text-[11px] text-slate-400">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
                            <div 
                              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${Math.max(percentage, 6)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Kategoriyalar bo&apos;yicha statistika mavjud emas
                  </div>
                )}
              </div>

              {/* Pickup Locations Analytics (Top 5) */}
              <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-base">
                  <div>
                    <h3 className="font-semibold text-text-base flex items-center gap-2">
                      <HiOutlineMapPin className="w-5 h-5 text-primary" />
                      Olish Punktlari va Manzillar Statistikasi
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top 5 ta faol qabul qilish shobasi</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-bg-base text-slate-600 dark:text-slate-300 rounded-lg border border-border-base">
                    {totalPickupPointsCount} ta punkt
                  </span>
                </div>

                {visiblePickupPoints.length > 0 ? (
                  <div className="space-y-3">
                    {visiblePickupPoints.map((point, idx) => {
                      const name = safeExtractName(point, `Punkt #${idx + 1}`);
                      const city = (typeof point === 'object' && point.city) || 'ACM Fleet Location';

                      return (
                        <div key={point.id || idx} className="p-3.5 bg-bg-base/40 rounded-lg border border-border-base flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                              <HiOutlineMapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-text-base">{name}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{city}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-bg-base text-slate-600 dark:text-slate-300 border border-border-base rounded-md font-medium text-[11px]">
                            Faol
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Olish punktlari bo&apos;yicha statistika yuklanmadi
                  </div>
                )}
              </div>

            </div>

            {/* 3. LOW STOCK INVENTORY STATS TABLE (Top 5) */}
            <div className="bg-bg-card border border-border-base rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border-base flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-base flex items-center gap-2">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-primary" />
                    Kam Qolgan Avtomobillar Inventari Statistikasi
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Zaxirasi kamaygan avtomobil modellari (Max 5 ta)</p>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 bg-bg-base border border-border-base px-3 py-1 rounded-md font-medium">
                  Kritik modellar: {totalLowStockCount} ta
                </span>
              </div>

              {visibleLowStockItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-base/40 border-b border-border-base text-slate-500">
                      <tr>
                        <th className="px-6 py-3.5 text-start font-semibold">Avtomobil Nomi</th>
                        <th className="px-6 py-3.5 text-start font-semibold">Kategoriya</th>
                        <th className="px-6 py-3.5 text-start font-semibold">Kritik Qoldiq Soni</th>
                        <th className="px-6 py-3.5 text-right font-semibold">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base">
                      {visibleLowStockItems.map((item, idx) => {
                        const name = safeExtractName(item, `Avtomobil #${idx + 1}`);
                        const categoryName = typeof item?.category === 'object' ? safeExtractName(item.category, 'Flot') : (item?.category || 'Flot');
                        const stockVal = safeExtractCount(item) || (typeof item.stock === 'number' ? item.stock : 1);

                        return (
                          <tr key={item.id || idx} className="hover:bg-bg-hover/80 transition-colors">
                            <td className="px-6 py-4 font-semibold text-text-base">
                              {name}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {categoryName}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-bg-base border border-border-base text-slate-700 dark:text-slate-300 rounded-md font-semibold text-xs inline-flex items-center gap-1">
                                <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-primary" />
                                {stockVal} dona qoldi
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link 
                                href="/cars"
                                className="text-primary font-semibold text-xs hover:underline inline-flex items-center gap-1"
                              >
                                Boshqarish <HiOutlineArrowRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Barcha avtomobil zaxiralari yetarli darajada. Kritik kam qolgan modellar yo&apos;q.
                </div>
              )}
            </div>

            {/* 4. FLEET FINANCIAL & SUMMARY FOOTER BAR */}
            {carsList.length > 0 && (
              <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <HiOutlineCurrencyDollar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">O&apos;rtacha Avtomobil Narxi</span>
                    <span className="font-bold text-text-base text-sm">{formatPrice(avgCarPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-slate-500 font-medium">
                  <span>Jami avtomobil modellari: <strong className="text-text-base">{carsList.length} ta</strong></span>
                  <span>Faollik ko&apos;rsatkichi: <strong className="text-text-base">{Math.round((activeCarsCount / carsList.length) * 100)}%</strong></span>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
