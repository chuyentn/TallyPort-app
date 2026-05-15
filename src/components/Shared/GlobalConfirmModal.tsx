import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

interface GlobalConfirmModalProps {
  isOpen: boolean;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const GlobalConfirmModal: React.FC<GlobalConfirmModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden z-10 shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6"
          >
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20' : 
              type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' : 
              'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
            }`}>
              {type === 'danger' ? <AlertTriangle className="w-10 h-10" /> : 
               type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : 
               <Info className="w-10 h-10" />}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
              >
                Bỏ qua
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isProcessing}
                className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-lg disabled:opacity-50 ${
                  type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : 
                  type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
