import React, { useEffect, useState } from 'react';
import { Ship, Package, CheckCircle2, AlertCircle, Clock, Table, BarChart } from 'lucide-react';
import { motion } from 'motion/react';
import { dataService } from '../../services/dataService';
import { HoldProgress } from '../../types';
import { formatNumber, formatPercent } from '../../lib/formatters';

export default function Progress() {
  const [holds, setHolds] = useState<HoldProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 5000); // REFRESH 5S - REALTIME
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await dataService.getHoldProgress();
      setHolds(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const totalTarget = holds.reduce((acc, h) => acc + h.ke_hoach_tan, 0);
  const totalCurrent = holds.reduce((acc, h) => acc + h.tong_hang, 0);
  const overallPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="max-w-full mx-auto space-y-8 pb-32 lg:pb-10 font-sans">
      <header className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#002855] p-10 rounded-[2.5rem] text-white shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#00a8cc,transparent_70%)] group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border-2 border-white/10 backdrop-blur-md shadow-2xl group-hover:rotate-3 transition-transform">
            <Ship className="w-12 h-12 text-[#00a8cc]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-[#00a8cc] text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20 animate-pulse">NHIỆM VỤ LIVE</span>
              <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest">Snow Camellia V.52</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
              Tiến Độ Xếp Hàng
            </h1>
            <p className="text-blue-200/50 text-[10px] font-black uppercase tracking-[0.3em] mt-2">BC_NHANH: Real-time Cargo Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-8 relative z-10 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
           <div className="text-right">
             <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 opacity-60">Tổng mục tiêu</p>
             <p className="text-2xl font-black font-mono leading-none">{formatNumber(totalTarget)} <span className="text-xs opacity-40">T</span></p>
           </div>
           <div className="w-px h-12 bg-white/10" />
           <div className="text-right">
             <div className="flex items-center justify-end gap-3 mb-1">
               <span className="text-[10px] font-black text-[#00a8cc] uppercase tracking-widest">Efficiency</span>
               <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,168,204,0.5)]" />
             </div>
             <p className="text-5xl font-black font-mono leading-none tracking-tighter text-[#00a8cc]">
               {formatPercent(overallPct)}
             </p>
           </div>
        </div>
      </header>

      <div className="flex justify-end gap-2">
         <button 
           onClick={() => setViewMode('grid')}
           className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#002855] text-white shadow-lg' : 'bg-white text-zinc-400 hover:bg-zinc-50'}`}
         >
           <BarChart className="w-5 h-5" />
         </button>
         <button 
           onClick={() => setViewMode('table')}
           className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-[#002855] text-white shadow-lg' : 'bg-white text-zinc-400 hover:bg-zinc-50'}`}
         >
           <Table className="w-5 h-5" />
         </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {holds.map((hold, idx) => (
            <motion.div 
              key={`hold-grid-${hold.ham_so || idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-[2.5rem] p-8 border-2 shadow-sm transition-all relative overflow-hidden group ${
                hold.phan_tram >= 100 ? 'border-green-100 bg-green-50/10' : 'border-zinc-50'
              }`}
            >
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${
                      hold.trang_thai_ham === 'Hoàn thành' ? 'bg-green-500' :
                      hold.trang_thai_ham === 'Gần xong' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <h3 className="text-2xl font-black text-[#0d1b2a] tracking-tight uppercase">Hầm {hold.ham_so}</h3>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-none">Vị trí LOADING #{hold.ham_so}</p>
                </div>
                {hold.trang_thai_ham === 'Hoàn thành' ? (
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/10"><CheckCircle2 className="w-7 h-7" /></div>
                ) : hold.trang_thai_ham === 'Gần xong' ? (
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10"><AlertCircle className="w-7 h-7" /></div>
                ) : (
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10"><Clock className="w-7 h-7" /></div>
                )}
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Tiến độ hầm</p>
                   <p className={`text-4xl font-black font-mono tracking-tighter leading-none ${
                     hold.phan_tram >= 100 ? 'text-green-600' : 'text-[#0d1b2a]'
                   }`}>
                     {formatPercent(hold.phan_tram)}
                   </p>
                </div>

                <div className="relative h-6 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(hold.phan_tram, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-lg relative overflow-hidden ${
                      hold.trang_thai_ham === 'Hoàn thành' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      hold.trang_thai_ham === 'Gần xong' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                      'bg-gradient-to-r from-[#00a8cc] to-blue-600'
                    }`}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-shimmer" />
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-2">Kế hoạch (T)</p>
                    <p className="text-xl font-black font-mono text-[#0d1b2a]">{formatNumber(hold.ke_hoach_tan)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-2">Thực tế (T)</p>
                    <p className={`text-xl font-black font-mono ${hold.tong_hang >= hold.ke_hoach_tan ? 'text-green-600' : 'text-blue-600'}`}>
                      {formatNumber(hold.tong_hang)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border-2 border-zinc-50 shadow-sm overflow-hidden overflow-x-auto">
           <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#002855] text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="px-4 py-6 text-center">Hầm</th>
                  <th className="px-4 py-6">Xe Cont</th>
                  <th className="px-4 py-6">Xe Thùng</th>
                  <th className="px-4 py-6 bg-[#003d7a]/50 text-center">Tổng Xe</th>
                  <th className="px-4 py-6">Sao Vàng</th>
                  <th className="px-4 py-6">Ninh Tây</th>
                  <th className="px-4 py-6">Krông Bông</th>
                  <th className="px-4 py-6">Khánh Đông</th>
                  <th className="px-4 py-6 bg-emerald-600 text-center">Tổng Hàng</th>
                  <th className="px-4 py-6">Kế Hoạch</th>
                  <th className="px-4 py-6">Chênh Lệch</th>
                  <th className="px-4 py-6 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {holds.map((h, idx) => (
                  <tr key={`hold-row-${h.ham_so || idx}`} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-5 text-center font-black text-[#002855]">H{h.ham_so}</td>
                    <td className="px-4 py-5 font-mono font-bold text-zinc-500">{h.xe_cont}</td>
                    <td className="px-4 py-5 font-mono font-bold text-zinc-500">{h.xe_thung}</td>
                    <td className="px-4 py-5 bg-[#003d7a]/5 text-center font-black text-[#002855]">{formatNumber(h.tong_xe)}</td>
                    <td className="px-4 py-5 font-mono font-bold text-zinc-400">{formatNumber(h.sao_vang)}</td>
                    <td className="px-4 py-5 font-mono font-bold text-zinc-400">{formatNumber(h.ninh_tay)}</td>
                    <td className="px-4 py-5 font-mono font-bold text-zinc-400">{formatNumber(h.krong_bong)}</td>
                    <td className="px-4 py-5 font-mono font-bold text-zinc-400">{formatNumber(h.khanh_dong)}</td>
                    <td className="px-4 py-5 bg-emerald-50 text-center font-black text-emerald-700 border-x border-emerald-100">{formatNumber(h.tong_hang)}</td>
                    <td className="px-4 py-5 font-mono font-black text-slate-800">{formatNumber(h.ke_hoach_tan)}</td>
                    <td className={`px-4 py-5 font-mono font-bold ${h.chenh_lech > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(Math.abs(h.chenh_lech))}</td>
                    <td className="px-4 py-5 text-right">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-black ${h.phan_tram >= 100 ? 'bg-green-100 text-green-700' : h.phan_tram > 90 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                         {formatNumber(h.phan_tram, 1, 1)}%
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50/50 font-black text-[11px] uppercase tracking-tighter">
                 <tr className="border-t-2 border-[#002855]">
                    <td className="px-4 py-6 text-center text-[#002855]">TỔNG CỘNG</td>
                    <td className="px-4 py-6">{holds.reduce((s, h) => s + h.xe_cont, 0)}</td>
                    <td className="px-4 py-6">{holds.reduce((s, h) => s + h.xe_thung, 0)}</td>
                    <td className="px-4 py-6 bg-[#003d7a]/5 text-center text-[#002855]">{holds.reduce((s, h) => s + h.tong_xe, 0)}</td>
                    <td className="px-4 py-6 text-zinc-400">{formatNumber(holds.reduce((s, h) => s + h.sao_vang, 0))}</td>
                    <td className="px-4 py-6 text-zinc-400">{formatNumber(holds.reduce((s, h) => s + h.ninh_tay, 0))}</td>
                    <td className="px-4 py-6 text-zinc-400">{formatNumber(holds.reduce((s, h) => s + h.krong_bong, 0))}</td>
                    <td className="px-4 py-6 text-zinc-400">{formatNumber(holds.reduce((s, h) => s + h.khanh_dong, 0))}</td>
                    <td className="px-4 py-6 bg-emerald-50 text-center text-emerald-700 border-x border-emerald-100">{formatNumber(holds.reduce((s, h) => s + h.tong_hang, 0))}</td>
                    <td className="px-4 py-6 text-slate-800">{formatNumber(holds.reduce((s, h) => s + h.ke_hoach_tan, 0))}</td>
                    <td className="px-4 py-6 text-[#002855]">{formatNumber(Math.abs(holds.reduce((s, h) => s + h.chenh_lech, 0)))}</td>
                    <td className="px-4 py-6 text-right text-[#00a8cc]">{formatPercent(overallPct)}</td>
                 </tr>
              </tfoot>
           </table>
        </div>
      )}
    </div>
  );
}
