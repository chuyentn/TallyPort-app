import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Ship, Target, Anchor } from 'lucide-react';
import { motion } from 'motion/react';
import { dataService } from '../../services/dataService';
import { VesselSettings } from '../../types';

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<VesselSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const data = await dataService.getSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleHoldTargetChange = (holdNum: number, value: string) => {
    if (!settings) return;
    const numValue = parseFloat(value) || 0;
    const newHoldTargets = { ...settings.hold_targets, [holdNum]: numValue };
    
    // Recalculate total
    const newTotal = Object.values(newHoldTargets).reduce((a, b) => a + (b as number), 0);
    
    setSettings({
      ...settings,
      hold_targets: newHoldTargets,
      total_target: newTotal
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const ok = await dataService.saveSettings(settings);
    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-[#1b9aaa] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-[#1b9aaa]/10 rounded-xl">
              <SettingsIcon className="w-6 h-6 text-[#1b9aaa]" />
            </div>
            Cấu hình Hầm Tàu
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý kế hoạch và thông tin tàu</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg ${
            success 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-[#1b9aaa] text-white hover:bg-[#1b9aaa]/90 shadow-[#1b9aaa]/20'
          }`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {success ? 'Đã lưu' : 'Lưu cài đặt'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vessel Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Ship className="w-4 h-4 text-[#1b9aaa]" /> Thông tin tàu
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên tàu</label>
                <input 
                  type="text"
                  value={settings?.vessel_name || ''}
                  onChange={(e) => setSettings(s => s ? { ...s, vessel_name: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-[#1b9aaa] rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Chuyến</label>
                <input 
                  type="text"
                  value={settings?.voyage || ''}
                  onChange={(e) => setSettings(s => s ? { ...s, voyage: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-[#1b9aaa] rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mục tiêu năng suất (T/h)</label>
                <input 
                  type="number"
                  value={settings?.efficiency_target || 0}
                  onChange={(e) => setSettings(s => s ? { ...s, efficiency_target: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-[#1b9aaa] rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0d1b2a] p-6 rounded-3xl shadow-xl text-white space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                 <Target className="w-5 h-5 text-[#1b9aaa]" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tổng kế hoạch</p>
                 <p className="text-2xl font-black">{(settings?.total_target || 0).toLocaleString()} <span className="text-sm">tấn</span></p>
               </div>
             </div>
          </div>
        </div>

        {/* Hold Targets */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-full">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Anchor className="w-4 h-4 text-[#1b9aaa]" /> Chỉ tiêu từng hầm
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {settings && Object.entries(settings.hold_targets).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([num, target]) => (
                <div key={num} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-black text-[#1b9aaa] shadow-sm">
                      H{num}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kế hoạch Hầm {num}</p>
                      <div className="relative mt-1">
                        <input 
                          type="number"
                          step="0.001"
                          value={target}
                          onChange={(e) => handleHoldTargetChange(parseInt(num), e.target.value)}
                          className="w-32 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none"
                        />
                        <div className="absolute left-0 bottom-0 w-full h-0.5 bg-[#1b9aaa] scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">tấn</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                ⚠️ Lưu ý:
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
                Thay đổi kế hoạch hầm tàu sẽ ảnh hưởng trực tiếp đến tính toán tiến độ (%) trên Dashboard và báo cáo. Dữ liệu này được đồng bộ trực tiếp với Google Sheet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
