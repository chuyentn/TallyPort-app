import React from 'react';
import { Ship, Truck, Container, ArrowRightLeft, Target, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { HoldProgress } from '../../types';
import { formatNumber } from '../../lib/formatters';

interface HoldDetailCardProps {
  hold: HoldProgress;
}

export const HoldDetailCard: React.FC<HoldDetailCardProps> = ({ hold }) => {
  const isDone = hold.trang_thai_ham === 'Hoàn thành';
  const isNearlyDone = hold.trang_thai_ham === 'Gần xong';

  const getStatusColor = () => {
    if (isDone) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
    if (isNearlyDone) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background ID Watermark */}
      <div className="absolute top-4 right-8 text-[8rem] font-black text-slate-100 dark:text-slate-800/10 leading-none pointer-events-none select-none z-0">
        {hold.ham_so}
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-10">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <Ship className={`w-8 h-8 ${isDone ? 'text-emerald-500' : 'text-blue-500'}`} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">HẦM {hold.ham_so}</h3>
            <div className={`inline-flex px-3 py-1 mt-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor()}`}>
              {hold.trang_thai_ham}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${isDone ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'}`}>
            {formatNumber(hold.phan_tram, 1, 1)}<span className="text-2xl font-black ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* Modern Progress Bar */}
      <div className="relative z-10 w-full mb-10">
         <div className="w-full h-4 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-inner">
           <motion.div
             initial={{ width: 0 }}
             animate={{ width: `${Math.min(hold.phan_tram, 100)}%` }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             className={`h-full rounded-2xl ${isDone ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : isNearlyDone ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'} shadow-lg`}
           />
         </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">THỰC TẾ</p>
              <div className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
                <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums truncate">
                  {formatNumber(hold.tong_hang)}
                </span>
                <span className="text-xs font-bold text-slate-400 shrink-0">T</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">KẾ HOẠCH</p>
              <div className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
                <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums truncate">
                  {formatNumber(hold.ke_hoach_tan)}
                </span>
                <span className="text-xs font-bold text-slate-400 shrink-0">T</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${hold.chenh_lech > 0 ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
              <ArrowRightLeft className={`w-6 h-6 ${hold.chenh_lech > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">CHÊNH LỆCH</p>
              <div className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
                <span className={`text-lg sm:text-xl font-black leading-none tabular-nums truncate ${hold.chenh_lech > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {hold.chenh_lech > 0 ? `-${formatNumber(hold.chenh_lech)}` : `+${formatNumber(Math.abs(hold.chenh_lech))}`}
                </span>
                <span className={`text-xs font-bold shrink-0 ${hold.chenh_lech > 0 ? 'text-rose-600/60' : 'text-emerald-600/60'}`}>T</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Container className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">XE CONT</p>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums">
                  {hold.xe_cont}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-400">xe</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Truck className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">XE THÙNG</p>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums">
                  {hold.xe_thung}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-400">xe</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3">
            <div className="flex -space-x-2.5">
              {[hold.sao_vang, hold.khanh_dong, hold.ninh_tay, hold.krong_bong].map((val, idx) => (
                val > 0 && (
                   <div 
                    key={idx} 
                    title={idx === 0 ? 'Sao Vàng' : idx === 1 ? 'Khánh Đông' : idx === 2 ? 'Ninh Tây' : 'Krông Bông'}
                    className={`w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 shadow-md flex items-center justify-center text-[9px] font-black text-white ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                   >
                     {idx === 0 ? 'SV' : idx === 1 ? 'KD' : idx === 2 ? 'NT' : 'KB'}
                   </div>
                )
              ))}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ĐA NGUỒN</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
