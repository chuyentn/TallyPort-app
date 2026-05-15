import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { WeighingTicket } from '../../types';

interface ApproveTicketModalProps {
  isOpen: boolean;
  ticket: WeighingTicket | null;
  onClose: () => void;
  onConfirm: (updates: { ham_so: number, ca: string, checked_time: string, checked_by: string, thoi_gian: string }) => Promise<void>;
}

export const ApproveTicketModal: React.FC<ApproveTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onConfirm
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hamSo, setHamSo] = useState<number>(1);
  const [ca, setCa] = useState<string>('Ca 1');

  useEffect(() => {
    if (isOpen && ticket) {
      setHamSo(ticket.ham_tau_assign || 1);
      
      // Calculate default shift based on ticket time or current time
      const ticketTime = ticket.thoi_gian ? new Date(ticket.thoi_gian) : new Date();
      const validTime = isNaN(ticketTime.getTime()) ? new Date() : ticketTime;
      const hour = validTime.getHours();
      let defaultCa = 'Ca 1';
      if (hour >= 6 && hour < 12) defaultCa = 'Ca 1';
      else if (hour >= 12 && hour < 18) defaultCa = 'Ca 2';
      else if (hour >= 18 && hour <= 23) defaultCa = 'Ca 3';
      else defaultCa = 'Ca 4';
      
      const ticketCa = ticket.ca ? ticket.ca.toString() : '';
      setCa(['Ca 1', 'Ca 2', 'Ca 3', 'Ca 4', '1', '2', '3', '4'].includes(ticketCa)
        ? (ticketCa.startsWith('Ca ') ? ticketCa : `Ca ${ticketCa}`) 
        : defaultCa);
    }
  }, [isOpen, ticket]);

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const now = new Date();
      await onConfirm({
        ham_so: hamSo,
        ca: ca,
        checked_time: now.toISOString(),
        checked_by: 'current_user', // This will be handled in parent
        thoi_gian: now.toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && ticket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-zinc-100 dark:border-slate-800"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                Duyệt Phiếu Cân
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6 font-medium">
                Duyệt chuyển phiếu <span className="font-bold text-slate-900 dark:text-white">{ticket.so_phieu}</span> sang danh sách Kiểm Tally. Vui lòng xác định Hầm và Ca:
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hầm số <span className="text-red-500">*</span></label>
                  <select 
                    value={hamSo}
                    onChange={(e) => setHamSo(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                  >
                    {[1,2,3,4,5].map(h => (
                      <option key={h} value={h}>Hầm {h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ca làm việc <span className="text-red-500">*</span></label>
                  <select 
                    value={ca}
                    onChange={(e) => setCa(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Ca 1">Ca 1 (06:00 - 12:00)</option>
                    <option value="Ca 2">Ca 2 (12:00 - 18:00)</option>
                    <option value="Ca 3">Ca 3 (18:00 - 24:00)</option>
                    <option value="Ca 4">Ca 4 (00:00 - 06:00)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-all border border-slate-200 dark:border-slate-700"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-[2] py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessing ? 'Đang duyệt...' : 'Xác nhận duyệt'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
