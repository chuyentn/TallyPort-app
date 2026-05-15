import React, { useState, useEffect } from 'react';
import { Users, Truck, ShieldCheck, Settings, Plus, Key, Power, UserPlus, FileSearch, Anchor, Target, Database, Bell, History, CheckCircle2, RotateCw, AlertTriangle, Ship, Save, Pencil, Trash2, User as UserIcon, BrainCircuit, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../../services/dataService';
import api from '../../services/api';
import { User, HoldProgress, VesselSettings } from '../../types';
import { Modal } from '../Shared/Modal';

type AdminTab = 'users' | 'vessel' | 'hatches' | 'sheets' | 'notifications' | 'logs' | 'ai';

import { formatNumber } from '../../lib/formatters';

export default function AdminPanel() {
  const [activeTab, setActiveTab ] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [holds, setHolds] = useState<HoldProgress[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<VesselSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  
  const [geminiKeys, setGeminiKeys] = useState<string[]>([]);
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [isCheckingKeys, setIsCheckingKeys] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    username: '',
    role: 'tally_staff' as User['role']
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const u = await dataService.getUsers();
        setUsers(u);
      } else if (activeTab === 'hatches') {
        const h = await dataService.getHoldProgress();
        setHolds(h);
      } else if (activeTab === 'logs') {
        const l = await dataService.getAuditLogs();
        setLogs(l);
      } else if (activeTab === 'ai') {
        const res = await api.get('/ai/keys');
        setGeminiKeys(res.data || []);
      }
      
      // Always fetch settings for vessel and hatches tabs
      if (activeTab === 'vessel' || activeTab === 'hatches') {
        const s = await dataService.getSettings();
        setSettings(s);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.createUser(newUserForm);
      setIsUserModalOpen(false);
      setNewUserForm({ full_name: '', username: '', role: 'tally_staff' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      await dataService.toggleUserStatus(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Xóa vĩnh viễn tài khoản ${name}?`)) {
      try {
        await dataService.deleteUser(id);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [newSheetList, setNewSheetList] = useState<string[]>([]);

  const testConnection = async () => {
    setIsTestLoading(true);
    try {
      const response = await fetch('/api/gsheets/meta/sheets');
      const data = await response.json();
      if (data.sheets) {
        setNewSheetList(data.sheets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleAddGeminiKey = async () => {
    if (!newGeminiKey.trim()) return;
    try {
      const res = await api.post('/ai/keys', { key: newGeminiKey.trim() });
      if (res.data.success) {
        setGeminiKeys(res.data.keys);
        setNewGeminiKey('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveGeminiKey = async (index: number) => {
    try {
      const res = await api.delete(`/ai/keys/${index}`);
      if (res.data.success) {
        setGeminiKeys(res.data.keys);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckGeminiKeys = async () => {
    setIsCheckingKeys(true);
    try {
      const res = await api.post('/ai/check');
      if (res.data.success) {
        setGeminiKeys(res.data.keys);
        alert(`Kiểm tra hoàn tất. Có ${res.data.total} API key đang hoạt động tốt. Hệ thống đã tự động loại bỏ các key lỗi.`);
      }
    } catch (e) {
      console.error(e);
      alert('Kiểm tra thất bại. Vui lòng check console.');
    } finally {
      setIsCheckingKeys(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaveLoading(true);
    try {
      await dataService.saveSettings(settings);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const tabs = [
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'vessel', label: 'Cấu hình tàu', icon: Anchor },
    { id: 'hatches', label: 'Mục tiêu hầm', icon: Target },
    { id: 'sheets', label: 'Google Sheets', icon: Database },
    { id: 'ai', label: 'API AI', icon: BrainCircuit },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'logs', label: 'Nhật ký', icon: History },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-0 font-sans max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0f4c75] dark:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg transition-colors">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0f4c75] dark:text-zinc-100 tracking-tight transition-colors">Hệ Thống Quản Trị</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium transition-colors">Trung tâm điều hành TallyPort</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-zinc-100 dark:border-slate-800 text-zinc-400 transition-colors">
          <Settings className="w-3 h-3 animate-spin-slow" /> v2.4.0 — Chế độ Vận Hành
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar bg-white dark:bg-slate-900 p-1 rounded-2xl border-2 border-zinc-50 dark:border-slate-800 shadow-sm transition-colors">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-[#0f4c75] dark:bg-emerald-600 text-white shadow-lg dark:shadow-emerald-900/20' : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-slate-800 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border-2 border-zinc-50 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-zinc-50/50 dark:bg-slate-950 transition-colors">
                <h3 className="font-black text-[#0f4c75] dark:text-zinc-300 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Users className="w-4 h-4" /> Danh sách tài khoản
                </h3>
                <button 
                  onClick={() => setIsUserModalOpen(true)}
                  className="px-4 py-2 bg-[#0f4c75] dark:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-50 dark:shadow-emerald-900/20"
                >
                  <UserPlus className="w-3 h-3" /> Thêm tài khoản
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest bg-white dark:bg-slate-900 transition-colors">
                    <tr>
                      <th className="px-6 py-4">Nhân viên</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Vai Trò</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                      <th className="px-6 py-4 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="text-xs hover:bg-zinc-50/50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0f4c75]/5 dark:bg-emerald-500/10 text-[#0f4c75] dark:text-emerald-500 rounded-xl flex items-center justify-center font-black transition-colors text-inherit">
                            {u.full_name ? u.full_name[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-black text-zinc-800 dark:text-zinc-200 tracking-tight transition-colors">{u.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase transition-colors">{u.phone || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-zinc-500 dark:text-zinc-400 font-inherit">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                            u.role === 'admin' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            u.role === 'supervisor' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green-500 dark:bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                            <span className="text-[10px] font-black uppercase tracking-tight text-zinc-500 dark:text-zinc-400 transition-colors">{u.is_active ? 'Hoạt động' : 'Khóa'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                             <button 
                               className="w-7 h-7 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all shadow-sm"
                               title="Chỉnh sửa"
                             >
                               <Pencil className="w-3.5 h-3.5" />
                             </button>
                             <button 
                               className="w-7 h-7 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition-all shadow-sm"
                               title="Đổi mật khẩu"
                             >
                               <Key className="w-3.5 h-3.5" />
                             </button>
                             <button 
                               onClick={() => toggleUserStatus(u.id)}
                               className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all shadow-sm ${
                                 u.is_active 
                                   ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500' 
                                   : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500'
                               }`}
                               title={u.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                             >
                               <Power className="w-3.5 h-3.5" />
                             </button>
                             <button 
                               onClick={() => handleDeleteUser(u.id, u.full_name || u.username)}
                               className="w-7 h-7 flex items-center justify-center bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-all shadow-sm"
                               title="Xóa tài khoản"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VESSEL CONFIG */}
          {activeTab === 'vessel' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-zinc-50 dark:border-slate-800 space-y-6 transition-colors">
                <div className="flex items-center gap-3 border-b border-zinc-50 dark:border-slate-800 pb-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-emerald-900/20 text-[#0f4c75] dark:text-emerald-500 rounded-xl flex items-center justify-center transition-colors">
                    <Ship className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0f4c75] dark:text-zinc-300 uppercase tracking-widest text-xs transition-colors">Cấu hình tàu biển</h3>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Thông tin phương tiện</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tên tàu *</label>
                    <input 
                      value={settings?.vessel_name || ''} 
                      onChange={(e) => setSettings(prev => prev ? {...prev, vessel_name: e.target.value} : null)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-2xl focus:border-[#0f4c75] dark:focus:border-emerald-500 outline-none font-black uppercase tracking-widest dark:text-zinc-100 transition-colors" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chuyến (Voyage) *</label>
                      <input 
                        value={settings?.voyage || ''} 
                        onChange={(e) => setSettings(prev => prev ? {...prev, voyage: e.target.value} : null)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-2xl focus:border-[#0f4c75] dark:focus:border-emerald-500 outline-none font-bold dark:text-zinc-200 transition-colors" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tổng Sản Lượng (Tấn)</label>
                      <input 
                        type="number"
                        value={settings?.total_target || 0} 
                        onChange={(e) => setSettings(prev => prev ? {...prev, total_target: parseFloat(e.target.value)} : null)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-2xl focus:border-[#0f4c75] dark:focus:border-emerald-500 outline-none font-bold dark:text-zinc-200 transition-colors" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={saveLoading}
                    className="w-full py-4 bg-[#0f4c75] dark:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-50 dark:shadow-emerald-900/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saveLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Cập nhật cấu hình
                  </button>
                </div>
              </div>
              <div className="bg-[#0f4c75] dark:bg-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-center text-center transition-colors">
                 <Ship className="absolute -left-10 top-1/2 -translate-y-1/2 w-64 h-64 opacity-5" />
                 <h2 className="text-4xl font-black tracking-tighter mb-2">{settings?.vessel_name || 'SNOW CAMELLIA'}</h2>
                 <p className="text-sm font-black uppercase tracking-widest opacity-60">VOYAGE: {settings?.voyage || '-'}</p>
                 <div className="mt-8 border-t border-white/20 pt-8 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-[10px] font-black uppercase opacity-50 mb-1">Mục tiêu tổng</p>
                     <p className="font-bold">{settings?.total_target ? formatNumber(settings.total_target) : '0'} Tấn</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase opacity-50 mb-1">Ngày bắt đầu</p>
                     <p className="font-bold">25/03/2026</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase opacity-50 mb-1">Trạng thái</p>
                     <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-green-500/30">Đang bốc</span>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* HATCH TARGETS */}
          {activeTab === 'hatches' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-zinc-50 dark:border-slate-800 transition-colors">
               <h3 className="font-black text-[#0f4c75] dark:text-zinc-200 uppercase tracking-widest text-xs mb-8 border-b border-zinc-50 dark:border-slate-800 pb-4">Định mức khối lượng từng hầm</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {settings && Object.entries(settings.hold_targets).map(([hNum, target]) => (
                   <div key={hNum} className="p-6 bg-zinc-50 dark:bg-slate-950 rounded-3xl border border-zinc-100 dark:border-slate-800 space-y-4">
                     <div className="flex justify-between items-center">
                       <span className="w-10 h-10 bg-[#0f4c75] dark:bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">H{hNum}</span>
                       <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trọng tải mục tiêu</span>
                     </div>
                     <div className="relative">
                        <input 
                          type="number"
                          value={target}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setSettings(prev => {
                              if (!prev) return null;
                              return { ...prev, hold_targets: { ...prev.hold_targets, [hNum]: val } };
                            });
                          }}
                          className="w-full pl-4 pr-12 py-4 bg-white dark:bg-slate-900 border-2 border-zinc-100 dark:border-slate-800 rounded-2xl focus:border-[#1b9aaa] dark:focus:border-emerald-500 outline-none font-black text-lg text-[#0f4c75] dark:text-zinc-100 transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-300 font-mono">TẤN</span>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={saveLoading}
                    className="px-8 py-4 bg-[#1b9aaa] dark:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-50 dark:shadow-emerald-900/20 transition-colors disabled:opacity-50"
                  >
                    {saveLoading ? 'Đang lưu...' : 'Lưu tất cả mục tiêu hầm'}
                  </button>
               </div>
            </div>
          )}

          {/* GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-zinc-50 dark:border-slate-800 space-y-8 transition-colors">
              <div className="flex items-start gap-6 bg-blue-50/50 dark:bg-slate-950 p-6 rounded-3xl border border-blue-100 dark:border-slate-800 transition-colors">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-green-600 dark:text-emerald-500 shadow-sm shrink-0">
                  <Database className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#0f4c75] dark:text-zinc-100 tracking-tight transition-colors">Tích hợp Google Sheets</h3>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">Kết nối trực tiếp với bảng tính để lưu trữ dữ liệu. Hệ thống sử dụng Tài khoản Dịch vụ để đồng bộ thời gian thực.</p>
                </div>
                <div className="flex-1" />
                <div className="flex flex-col items-end gap-2">
                   <span className="bg-green-100 dark:bg-emerald-900/40 text-green-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 transition-colors">Đã kết nối</span>
                   <p className="text-[9px] font-bold text-zinc-400">Độ trễ: 120ms</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mã Spreadsheet (ID)</label>
                  <div className="flex gap-2">
                    <input readOnly value="1x2B3C4D5E6F7G8H9I0J..." className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-xl font-mono text-xs text-zinc-500 transition-colors" />
                    <button onClick={testConnection} className="bg-zinc-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors">
                      <RotateCw className={`w-4 h-4 text-[#0f4c75] dark:text-emerald-500 ${isTestLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Danh sách Sheet phát hiện</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-xl min-h-[50px] transition-colors">
                    {newSheetList.length > 0 ? (
                      newSheetList.map(s => (
                        <span key={s} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/30">
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Nhấn nút bên cạnh ID để làm mới danh sách...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/20 flex items-start gap-3 transition-colors">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400 leading-normal">
                  <span className="font-bold">Cảnh báo:</span> Dữ liệu được lưu trữ trực tiếp trên Cloud. Thay đổi cấu hình sai có thể dẫn đến mất kết nối hoặc sai lệch số liệu đồng bộ Dashboard. Liên hệ QA Engineer nếu cần test.
                </p>
              </div>
            </div>
          )}

          {/* AI SETTINGS */}
          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-zinc-50 dark:border-slate-800 space-y-8 transition-colors">
              <div className="flex items-start gap-6 bg-purple-50/50 dark:bg-slate-950 p-6 rounded-3xl border border-purple-100 dark:border-slate-800 transition-colors">
                 <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm shrink-0">
                   <BrainCircuit className="w-8 h-8" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight transition-colors">Quản lý API Keys AI (Gemini)</h3>
                   <p className="text-xs font-medium text-zinc-500 max-w-lg leading-relaxed">
                     Hệ thống sử dụng đa luồng (Multiple Keys) để xoay vòng API, giúp tránh sập do giới hạn (Rate Limits) của Google.
                   </p>
                 </div>
              </div>

              <div className="bg-zinc-50 dark:bg-slate-950 p-6 rounded-3xl space-y-6 border border-zinc-100 dark:border-slate-800 transition-colors">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                       <Key className="w-4 h-4" />
                     </div>
                     <div>
                       <h4 className="text-sm font-black text-slate-800 dark:text-white">API Keys Đang Hoạt Động</h4>
                       <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Tổng số: {geminiKeys.length} Keys</p>
                     </div>
                   </div>
                   <button 
                     onClick={handleCheckGeminiKeys}
                     disabled={isCheckingKeys}
                     className="px-4 py-2 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                   >
                     {isCheckingKeys ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                     Check Live & Xóa Key Chết
                   </button>
                 </div>

                 <div className="flex gap-2">
                   <input
                     type="text"
                     value={newGeminiKey}
                     onChange={(e) => setNewGeminiKey(e.target.value)}
                     placeholder="Nhập API Key mới..."
                     className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:text-white"
                   />
                   <button
                     onClick={handleAddGeminiKey}
                     disabled={!newGeminiKey.trim()}
                     className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                   >
                     Thêm
                   </button>
                 </div>

                 {geminiKeys.length > 0 ? (
                   <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                     {geminiKeys.map((key, index) => (
                       <li key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-zinc-100 dark:border-slate-800">
                         <span className="font-mono text-xs text-zinc-500">{key.substring(0, 15)}...{key.substring(key.length - 4)}</span>
                         <button 
                           onClick={() => handleRemoveGeminiKey(index)}
                           className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <div className="p-4 text-center text-xs text-zinc-500 font-medium">Chưa có API Key nào được cấu hình.</div>
                 )}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-zinc-50 dark:border-slate-800 space-y-8 transition-colors">
               <div className="flex justify-between items-center bg-zinc-50 dark:bg-slate-950 p-6 rounded-3xl border border-zinc-100 dark:border-slate-800 transition-colors">
                  <div>
                    <h3 className="font-black text-[#0f4c75] dark:text-zinc-200 uppercase tracking-widest text-xs">Telegram Bot Alerts</h3>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Gửi thông báo sự cố về nhóm điều hành</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-zinc-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b9aaa] dark:peer-checked:bg-emerald-600 transition-colors"></div>
                  </label>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bot Token</label>
                    <input type="password" value="************************" readOnly className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-xl font-mono text-xs text-zinc-500 transition-colors" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chat ID</label>
                    <input value="-100123456789" readOnly className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-xl font-mono text-xs text-zinc-500 transition-colors" />
                 </div>
               </div>
            </div>
          )}

          {/* LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border-2 border-zinc-50 dark:border-slate-800 overflow-hidden transition-colors">
               <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-red-50/10 dark:bg-red-950/10 transition-colors">
                  <h3 className="font-black text-red-600 dark:text-red-400 uppercase tracking-widest text-xs">Nhật ký Bảo mật Hệ thống</h3>
                  <button className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors">Chỉ dành cho Quản trị viên</button>
               </div>
               <div className="overflow-x-auto font-mono">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-slate-950 transition-colors">
                      <tr>
                        <th className="px-6 py-3 font-black text-zinc-400 dark:text-zinc-500 uppercase text-[9px]">Thời gian</th>
                        <th className="px-6 py-3 font-black text-zinc-400 dark:text-zinc-500 uppercase text-[9px]">Đối tượng</th>
                        <th className="px-6 py-3 font-black text-zinc-400 dark:text-zinc-500 uppercase text-[9px]">Hành động</th>
                        <th className="px-6 py-3 font-black text-zinc-400 dark:text-zinc-500 uppercase text-[9px]">Dữ Liệu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-slate-800">
                      {logs.length > 0 ? (
                        logs.map((log, i) => (
                          <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-6 py-4 font-mono text-zinc-500 dark:text-zinc-400 font-inherit">{log[0] || '-'}</td>
                            <td className="px-6 py-4 font-black text-[#0f4c75] dark:text-emerald-400">{log[1] || '-'}</td>
                            <td className="px-6 py-4 font-bold text-zinc-700 dark:text-zinc-300">{log[2] || '-'}</td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-[10px] font-medium">
                              {log[3]} | {log[4]} | {log[5]}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
                            Chưa có dữ liệu nhật ký bảo mật.
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Tạo tài khoản mới">
        <form onSubmit={handleCreateUser} className="space-y-4">
           <div className="space-y-1 text-center py-4 bg-zinc-50 dark:bg-slate-950 rounded-2xl mb-4 border border-zinc-100 dark:border-slate-800 border-dashed transition-colors">
              <UserIcon className="w-12 h-12 text-[#0f4c75] dark:text-emerald-600 mx-auto opacity-20" />
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-inherit">Thông tin người dùng mới</p>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Họ và tên *</label>
              <input 
                required 
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 rounded-xl focus:border-[#0f4c75] dark:focus:border-emerald-500 outline-none font-bold text-sm dark:text-zinc-100 transition-colors" 
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username *</label>
                <input 
                  required 
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 rounded-xl focus:border-[#0f4c75] dark:focus:border-emerald-500 outline-none font-bold text-sm dark:text-zinc-100 transition-colors" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Role *</label>
                <select 
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 rounded-xl focus:border-[#0f4c75] dark:focus:border-emerald-500 outline-none font-bold text-sm dark:text-zinc-100 transition-colors"
                >
                  <option value="tally_staff">Tally Staff</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
           </div>
           <button type="submit" className="w-full py-4 bg-[#0f4c75] dark:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-50 mt-4 transition-colors">Tạo User</button>
        </form>
      </Modal>
    </div>
  );
}
