import React, { useEffect, useState, useMemo } from 'react';
import { 
  Ship, 
  TrendingUp, 
  Truck, 
  PackageCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  BarChart3, 
  PieChart,
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Anchor,
  Zap,
  MapPin,
  ClipboardList,
  LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { HoldDetailCard } from '../Progress/HoldDetailCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { dataService } from '../../services/dataService';
import { WeighingTicket, HoldProgress, VesselSettings } from '../../types';
import { DashboardSkeleton } from '../Shared/Skeleton';
import { formatNumber, formatPercent } from '../../lib/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<WeighingTicket[]>([]);
  const [holds, setHolds] = useState<HoldProgress[]>([]);
  const [settings, setSettings] = useState<VesselSettings | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [ticketsData, holdsData, settingsData] = await Promise.all([
        dataService.getTickets(),
        dataService.getHoldProgress(),
        dataService.getSettings()
      ]);
      setTickets(ticketsData);
      setHolds(holdsData);
      setSettings(settingsData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!isBackground) setError('Không thể tải dữ liệu hệ thống. Kết nối server bị gián đoạn.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 5000); // Auto refresh every 5s for real-time
    return () => clearInterval(interval);
  }, []);

  // Slicers State
  const [selectedYard, setSelectedYard] = useState<string>('All');
  const [selectedShift, setSelectedShift] = useState<string>('All');

  // Filtered Data
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchYard = selectedYard === 'All' || t.bai_dam === selectedYard;
      const matchShift = selectedShift === 'All' || t.ca === selectedShift;
      return matchYard && matchShift;
    });
  }, [tickets, selectedYard, selectedShift]);

  // Real-time Hold Progress Calculation
  const realtimeHolds = useMemo(() => {
    // 1. Calculate actual stats from tally-checked tickets
    const holdStats = tickets.reduce((acc, t) => {
      if (t.trang_thai === 'checked' || t.tally_checked) {
        const h = t.ham_tau_assign || 1;
        if (!acc[h]) acc[h] = { tons: 0, trucks: 0, sao_vang: 0, ninh_tay: 0, krong_bong: 0, khanh_dong: 0 };
        acc[h].tons += t.tl_hang_tan;
        acc[h].trucks += 1;
        
        const yard = String(t.bai_dam).toLowerCase();
        if (yard.includes('sao vàng')) acc[h].sao_vang += t.tl_hang_tan;
        else if (yard.includes('ninh tây')) acc[h].ninh_tay += t.tl_hang_tan;
        else if (yard.includes('krông bông')) acc[h].krong_bong += t.tl_hang_tan;
        else if (yard.includes('khánh đông')) acc[h].khanh_dong += t.tl_hang_tan;
      }
      return acc;
    }, {} as Record<number, { tons: number, trucks: number, sao_vang: number, ninh_tay: number, krong_bong: number, khanh_dong: number }>);

    // 2. Generate holds using settings and data
    const holdNumbersFromSettings = settings ? Object.keys(settings.hold_targets).map(Number).filter(n => !isNaN(n) && n > 0) : [];
    const holdNumbersFromData = holds.map(h => h.ham_so).filter(n => !isNaN(n) && n > 0);
    const uniqueHoldNumbers = Array.from(new Set([...holdNumbersFromSettings, ...holdNumbersFromData]))
      .sort((a, b) => a - b);
    
    const finalHoldNumbers = uniqueHoldNumbers.length > 0 ? uniqueHoldNumbers : [1, 2, 3, 4, 5, 6];
    
    return finalHoldNumbers.map(hNum => {
      const stats = holdStats[hNum] || { tons: 0, trucks: 0, sao_vang: 0, ninh_tay: 0, krong_bong: 0, khanh_dong: 0 };
      // Try to get target from settings first, then from summary sheet (as fallback)
      const target = settings?.hold_targets[hNum] || holds.find(h => h.ham_so === hNum)?.ke_hoach_tan || 0;
      
      const phanTram = target > 0 ? (stats.tons / target) * 100 : 0;
      
      return {
        ham_so: hNum,
        tong_hang: stats.tons,
        tong_xe: stats.trucks,
        ke_hoach_tan: target,
        phan_tram: phanTram,
        trang_thai_ham: phanTram >= 100 ? 'Hoàn thành' : phanTram > 90 ? 'Gần xong' : 'Đang bốc',
        xe_cont: 0,
        xe_thung: stats.trucks,
        sao_vang: stats.sao_vang,
        ninh_tay: stats.ninh_tay,
        krong_bong: stats.krong_bong,
        khanh_dong: stats.khanh_dong,
        chenh_lech: target - stats.tons
      };
    });
  }, [tickets, settings, holds]);

  const checkedTickets = useMemo(() => filteredTickets.filter(t => t.trang_thai === 'checked' || t.tally_checked), [filteredTickets]);
  const totalTonnage = useMemo(() => checkedTickets.reduce((sum, t) => sum + t.tl_hang_tan, 0), [checkedTickets]);
  const targetTonnage = useMemo(() => settings?.total_target || realtimeHolds.reduce((sum, h) => sum + h.ke_hoach_tan, 0), [settings, realtimeHolds]);
  const overallProgress = targetTonnage > 0 ? (totalTonnage / targetTonnage) * 100 : 0;
  
  // Real-time source distribution
  const sourceDistribution = useMemo(() => {
    const stats = { sao_vang: 0, khanh_dong: 0, ninh_tay: 0, krong_bong: 0 };
    checkedTickets.forEach(t => {
      const yard = String(t.bai_dam).toLowerCase();
      if (yard.includes('sao vàng')) stats.sao_vang += t.tl_hang_tan;
      else if (yard.includes('ninh tây')) stats.ninh_tay += t.tl_hang_tan;
      else if (yard.includes('krông bông')) stats.krong_bong += t.tl_hang_tan;
      else if (yard.includes('khánh đông')) stats.khanh_dong += t.tl_hang_tan;
    });
    return stats;
  }, [checkedTickets]);
  
  const pendingTickets = filteredTickets.filter(t => ['pending', 'chờ kiểm', 'đang chờ', 'đã duyệt'].includes(String(t.trang_thai).toLowerCase())).length;
  const issueTickets = filteredTickets.filter(t => ['issue', 'lỗi', 'sự cố'].includes(String(t.trang_thai).toLowerCase())).length;

  // Efficiency (T/h) - Calculated from real data
  const { EfficiencyValue, EfficiencyTrend } = useMemo(() => {
    if (checkedTickets.length === 0) return { EfficiencyValue: 0, EfficiencyTrend: [] };
    
    // Group by hour
    const hourlyData: Record<string, number> = {};
    checkedTickets.forEach(t => {
      let d = new Date();
      if (t.checked_time) {
        d = new Date(t.checked_time);
        if (isNaN(d.getTime())) d = new Date();
      }
      const hour = d.getHours().toString().padStart(2, '0');
      hourlyData[hour] = (hourlyData[hour] || 0) + t.tl_hang_tan;
    });

    const hours = Object.keys(hourlyData).sort();
    const currentHour = hours[hours.length - 1];
    const val = hourlyData[currentHour] || 0;

    // Trend for the chart
    const trend = hours.map(h => ({ hour: `${h}:00`, tons: hourlyData[h] }));

    return { EfficiencyValue: val, EfficiencyTrend: trend };
  }, [checkedTickets]);

  const EfficiencyTarget = settings?.efficiency_target || 450;
  const EfficiencyPct = EfficiencyTarget > 0 ? (EfficiencyValue / EfficiencyTarget) * 100 : 0;

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'VỪA XONG';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'VỪA XONG';
    const now = new Date();
    const diffInMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMins < 1) return 'VỪA XONG';
    if (diffInMins < 60) return `${diffInMins} PHÚT TRƯỚC`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} GIỜ TRƯỚC`;
    return `${Math.floor(diffInHours / 24)} NGÀY TRƯỚC`;
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Lỗi Kết Nối</h2>
          <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">{error}</p>
        </div>
        <button onClick={() => fetchData()} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold flex items-center gap-2 shadow-lg">
          <RotateCw className="w-4 h-4" /> THỬ LẠI
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Power BI Styled Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Live Woodchip Export Control
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest ml-12">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString('vi-VN')}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1.5 text-emerald-500"><Clock className="w-3.5 h-3.5" /> Live {lastUpdated.toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Slicers (Power BI Filters) */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm pr-4">
             <div className="flex items-center gap-2 px-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={selectedYard} 
                  onChange={(e) => setSelectedYard(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                   <option value="All" className="bg-white dark:bg-slate-900">Tất cả Bãi</option>
                   <option value="Sao Vàng" className="bg-white dark:bg-slate-900">Sao Vàng</option>
                   <option value="Khánh Đông" className="bg-white dark:bg-slate-900">Khánh Đông</option>
                   <option value="Ninh Tây" className="bg-white dark:bg-slate-900">Ninh Tây</option>
                   <option value="Krông Bông" className="bg-white dark:bg-slate-900">Krông Bông</option>
                </select>
             </div>
             <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
             <div className="flex items-center gap-2 px-3 pr-2">
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={selectedShift} 
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                   <option value="All" className="bg-white dark:bg-slate-900">Tất cả Ca</option>
                   <option value="Ngày" className="bg-white dark:bg-slate-900">Ca Ngày</option>
                   <option value="Đêm" className="bg-white dark:bg-slate-900">Ca Đêm</option>
                </select>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm flex items-center gap-4">
             <div className="flex items-center gap-2 px-3">
                <Anchor className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex flex-col">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter opacity-70 leading-none mb-0.5">Vessel</p>
                   <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{settings?.vessel_name || 'Snow Camellia'}</p>
                </div>
             </div>
             <button 
               onClick={() => fetchData()} 
               className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
                <RotateCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
      </div>

      {/* Main KPI Grid - Apple Health / Premium Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { 
             label: 'THỰC TẾ BỐC', 
             value: formatNumber(totalTonnage), 
             unit: 'TẤN', 
             sub: `MỤC TIÊU: ${formatNumber(targetTonnage)}`, 
             trend: targetTonnage > 0 ? `${formatNumber((totalTonnage / targetTonnage) * 100, 1, 1)}%` : '0%', 
             up: true,
             icon: BarChart3,
             color: 'emerald'
           },
           { 
             label: 'TIẾN ĐỘ CHUNG', 
             value: formatNumber(overallProgress, 1, 1), 
             unit: '%', 
             sub: 'SO VỚI KẾ HOẠCH', 
             trend: `${formatNumber(overallProgress, 1, 1)}%`, 
             up: overallProgress > 0,
             icon: TrendingUp,
             color: 'blue'
           },
           { 
             label: 'CHỜ TALLY', 
             value: formatNumber(pendingTickets), 
             unit: 'XE', 
             sub: 'TẠI BÃI BỐC', 
             trend: `${pendingTickets} Xe`, 
             up: pendingTickets === 0,
             icon: Truck,
             color: 'amber'
           },
           { 
             label: 'NĂNG SUẤT', 
             value: formatNumber(EfficiencyValue), 
             unit: 'T/H', 
             sub: `TARGET: ${formatNumber(EfficiencyTarget)} T/H`, 
             trend: `${formatNumber(EfficiencyPct, 1, 1)}%`, 
             up: EfficiencyPct >= 100,
             icon: Timer,
             color: 'indigo'
           }
         ].map((kpi, i) => (
           <motion.div
             key={i}
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
             className="relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 group"
           >
             <div className="flex justify-between items-start mb-6">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{kpi.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">{kpi.value}</span>
                    <span className="text-sm font-black text-slate-400 font-mono">{kpi.unit}</span>
                  </div>
               </div>
               <div className={`p-4 rounded-2xl bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 text-${kpi.color}-600 dark:text-${kpi.color}-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner`}>
                  <kpi.icon className="w-6 h-6" />
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                   <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {kpi.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {kpi.trend}
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.sub}</span>
                </div>
             </div>

             {/* Animated Progress Underline */}
             <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-50 dark:bg-slate-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                  className={`h-full bg-${kpi.color}-500/30`}
                />
             </div>
           </motion.div>
         ))}
      </div>

      {/* Ship Visualization & Loading Progress */}
      <div className="grid grid-cols-1 gap-8">
         {/* Ship Plan Section - Full Width for better space */}
         <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">VESSEL STOWAGE PLAN</h3>
                    <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Phân tích chi tiết hầm hàng</p>
                  </div>
                  <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl">
                     <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">HOÀN THÀNH</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">ĐANG BỐC</span>
                     </div>
                  </div>
               </div>

               {/* Ship Plan Visual - Larger and more spaced */}
               <div className="relative py-16">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
                     {realtimeHolds.map((hold, i) => {
                        const progress = hold.phan_tram;
                        const isDone = hold.trang_thai_ham === 'Hoàn thành';
                        
                        return (
                          <div key={`hold-plan-${hold.ham_so}-${i}`} className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
                             {/* Indicator Top */}
                             <div className={`mb-4 h-6 flex items-center justify-center transition-all duration-500 ${isDone ? 'opacity-100 scale-100' : 'opacity-100 animate-bounce'}`}>
                                {isDone ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                             </div>

                             {/* Hold Tank */}
                             <div className="relative w-full aspect-[4/5] bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900/30 transition-all shadow-inner">
                                {/* Waterline / Fill */}
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${Math.min(progress, 100)}%` }}
                                  transition={{ duration: 2, ease: "easeOut", delay: i * 0.1 }}
                                  className={`absolute bottom-0 left-0 right-0 ${isDone ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-blue-600 to-blue-400'}`}
                                >
                                   {/* Subtle wave effect if not done */}
                                   {!isDone && (
                                     <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 animate-pulse" />
                                   )}
                                </motion.div>
                                
                                 {/* Hold Labels */}
                                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 z-20">
                                    <p className={`text-[10px] md:text-[12px] font-black uppercase tracking-widest leading-none mb-1 ${progress > 45 ? 'text-white' : 'text-slate-400'}`}>HOLD</p>
                                   <p className={`text-[14px] md:text-[16px] font-black leading-none mb-1 ${progress > 45 ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>{hold.ham_so}</p>
                                   <p className={`text-sm md:text-lg font-black tracking-tighter ${progress > 45 ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{formatNumber(progress, 0, 0)}%</p>
                                </div>
                             </div>
 
                             <div className="mt-5 text-center px-2 w-full">
                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 tabular-nums leading-none mb-1.5">{formatNumber(hold.tong_hang)} t</p>
                                <div className="h-[2px] w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                                <p className="text-[10px] font-bold text-slate-400 tabular-nums leading-none mt-1.5">{formatNumber(hold.ke_hoach_tan)} t</p>
                             </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Legend & Summary */}
               <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">DỰ ÁN HOÀN TẤT</p>
                       <p className="text-2xl font-black text-emerald-500 uppercase leading-none">CÒN {realtimeHolds.filter(h => h.trang_thai_ham !== 'Hoàn thành').length} HẦM ĐANG BỐC</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">TỔNG XE THỰC TẾ</p>
                       <p className="text-2xl font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{formatNumber(realtimeHolds.reduce((s, h) => s + h.tong_xe, 0))} XE</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Cargo Hold Detailed Cards Grid - Apple Health Style */}
            <div className="mt-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 px-2">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                     <LayoutGrid className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                   </div>
                   <div>
                     <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">CHI TIẾT HẦM BỐC HÀNG</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Quản lý hiệu năng & thực tế bốc hàng</p>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                 {realtimeHolds.map((hold) => (
                   <HoldDetailCard key={`hold-detail-${hold.ham_so}`} hold={hold} />
                 ))}
               </div>
            </div>

            {/* Performance Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 py-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-full w-fit">Tác nghiệp bốc hàng</h3>
                   <div className="h-64">
                      <Bar 
                        data={{
                          labels: realtimeHolds.map(h => `H${h.ham_so}`),
                          datasets: [
                            { 
                              label: 'Thực tế', 
                              data: realtimeHolds.map(h => h.tong_hang), 
                              backgroundColor: '#059669', 
                              borderRadius: 8,
                              barThickness: 24
                            },
                            { 
                              label: 'Kế hoạch', 
                              data: realtimeHolds.map(h => h.ke_hoach_tan), 
                              backgroundColor: 'rgba(148, 163, 184, 0.15)', 
                              borderRadius: 8,
                              barThickness: 24
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { grid: { display: false }, ticks: { font: { size: 9, family: 'JetBrains Mono' }, color: '#94a3b8' }, border: { display: false } },
                            x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter', weight: 'bold' }, color: '#64748b' } }
                          }
                        }}
                      />
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 py-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-full w-fit">Nhịp độ bốc hàng (Trend)</h3>
                   <div className="h-64">
                      <Line 
                        data={{
                          labels: EfficiencyTrend.length > 0 ? EfficiencyTrend.map(t => t.hour) : ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
                          datasets: [{
                            label: 'Tấn/Giờ',
                            data: EfficiencyTrend.length > 0 ? EfficiencyTrend.map(t => t.tons) : [0, 0, 0, 0, 0, 0, 0, 0],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { font: { size: 9, family: 'JetBrains Mono' }, color: '#94a3b8' }, border: { display: false } },
                            x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter' }, color: '#94a3b8' } }
                          }
                        }}
                      />
                   </div>
                </div>
            </div>
         </div>

         {/* Sidebar Control Section */}
         <div className="space-y-6">
            {/* Live Operational Feed */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Live Activity</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               </div>

               <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[500px] scrollbar-thin">
                  {tickets.slice(0, 10).map((t, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 group hover:border-emerald-200 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <PackageCheck className="w-5 h-5 text-emerald-500" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                             <p className="text-[10px] font-black text-slate-900 dark:text-white truncate">{t.bien_so_xe}</p>
                             <span className="text-[8px] font-bold text-slate-400 tabular-nums">{getTimeAgo(t.thoi_gian || t.checked_time || t.ngay_can_1)}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter">Bốc {formatNumber(t.tl_hang_tan, 0, 1)} Tấn gỗ dăm vào Hầm {t.ham_tau_assign || 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-2">
                             {t.trang_thai === 'checked' || t.tally_checked ? (
                               <>
                                 <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded uppercase tracking-tighter">Verified</span>
                                 <span className="text-[8px] font-bold text-slate-400">Tally: {t.checked_by || t.nhan_vien_can || 'Staff'}</span>
                               </>
                             ) : (
                               <>
                                 <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold rounded uppercase tracking-tighter">Pending</span>
                                 <span className="text-[8px] font-bold text-slate-400">Cân: {t.nhan_vien_can || 'Staff'}</span>
                               </>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <button 
                 onClick={() => navigate('/tickets')}
                 className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
               >
                  Xem toàn bộ nhật ký <ArrowRight className="w-3.5 h-3.5" />
               </button>
            </div>

            {/* Distribution Charts */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Nguồn Hàng (Bãi Dăm)</h3>
               <div className="h-48">
                  <Doughnut 
                    data={{
                      labels: ['Sao Vàng', 'Khánh Đông', 'Ninh Tây', 'Krông Bông'],
                      datasets: [{
                        data: [
                          sourceDistribution.sao_vang, 
                          sourceDistribution.khanh_dong, 
                          sourceDistribution.ninh_tay, 
                          sourceDistribution.krong_bong
                        ],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 10
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '75%',
                      plugins: { 
                        legend: { 
                          position: 'right', 
                          labels: { boxWidth: 6, usePointStyle: true, font: { size: 9, family: 'Inter', weight: 'bold' }, color: '#94a3b8', padding: 15 } 
                        } 
                      }
                    }}
                  />
               </div>
               
               <div className="mt-8 space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Kho Đang Ưu Tiên</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {
                          Object.entries(sourceDistribution)
                            .sort(([,a], [,b]) => b - a)[0]?.[1] > 0 
                            ? Object.entries(sourceDistribution).sort(([,a], [,b]) => b - a)[0][0].replace('_', ' ') 
                            : 'N/A'
                        }
                     </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Trạng Thái Tàu</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${realtimeHolds.every(h => h.trang_thai_ham === 'Hoàn thành') ? 'bg-emerald-500' : 'bg-blue-500 animate-ping'}`} />
                     </div>
                     <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {realtimeHolds.every(h => h.trang_thai_ham === 'Hoàn thành') && realtimeHolds.length > 0 ? 'Hoàn Tất Bốc' : 'Đang Bốc Hàng'}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
