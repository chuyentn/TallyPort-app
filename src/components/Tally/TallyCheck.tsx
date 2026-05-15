import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, CheckCircle2, Clock, Info, RotateCw, ChevronRight, X, MessageSquare, Ship, WifiOff, PackageCheck, Truck, User as UserIcon, UserCheck, HelpCircle, ArrowRight, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../../services/dataService';
import { WeighingTicket } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { formatNumber } from '../../lib/formatters';

type TallyStatus = 'all' | 'pending' | 'checked' | 'issue';

export default function TallyCheck() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<WeighingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHam, setFilterHam] = useState<number | 'all'>('all');
  const [statusTab, setStatusTab] = useState<TallyStatus>('pending');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sortConfig, setSortConfig] = useState<{ key: keyof WeighingTicket | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'desc' });
  const [selectedTicket, setSelectedTicket] = useState<WeighingTicket | null>(null);
  const [baiDamList, setBaiDamList] = useState<string[]>(['Sao Vàng', 'Ninh Tây', 'Krông Bông', 'Khánh Đông']);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tallyNote, setTallyNote] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchTickets(false);
    fetchBaiDam();
    const interval = setInterval(() => fetchTickets(true), 30000); // REFRESH 30S AS REQUESTED
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchBaiDam = async () => {
    try {
      const list = await dataService.getBaiDamList();
      if (list.length > 0) setBaiDamList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const getShiftFromTime = (timeStr?: string) => {
    const d = timeStr ? new Date(timeStr) : new Date();
    const validD = isNaN(d.getTime()) ? new Date() : d;
    const hour = validD.getHours();
    if (hour >= 6 && hour < 12) return 'Ca 1';
    if (hour >= 12 && hour < 18) return 'Ca 2';
    if (hour >= 18 && hour < 24) return 'Ca 3';
    return 'Ca 4';
  };

  const fetchTickets = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [tallyData, phieuCanData] = await Promise.all([
        dataService.getTickets(),
        dataService.getPhieuCan()
      ]);
      
      // Merge: Preference to TALLY_CHECK if duplicate so_phieu exists
      const merged = [...tallyData];
      phieuCanData.forEach(p => {
        if (!merged.find(m => m.so_phieu === p.so_phieu)) {
          merged.push(p);
        }
      });

      // Sort by latest first (id or so_phieu)
      setTickets(merged.sort((a, b) => b.id.localeCompare(a.id)));
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    let result = tickets.filter(t => {
      const matchesSearch = t.bien_so_xe.toLowerCase().includes(search.toLowerCase()) || 
                           t.so_phieu.toLowerCase().includes(search.toLowerCase());
      const matchesHam = filterHam === 'all' || Number(t.ham_tau_assign) === Number(filterHam);
      
      let matchesStatus = true;
      const status = String(t.trang_thai).toLowerCase();
      
      if (statusTab === 'pending') {
        const isIssue = status === 'issue' || status === 'lỗi' || status === 'sự cố' || 
                       (t.ghi_chu && (t.ghi_chu.toLowerCase().includes('sự cố') || t.ghi_chu.toLowerCase().includes('lỗi')));
        matchesStatus = !t.tally_checked && !isIssue;
      } else if (statusTab === 'checked') {
        matchesStatus = t.tally_checked || ['checked', 'đã kiểm', 'đã xác nhận', 'ok', 'done', 'hoàn tất'].includes(status);
      } else if (statusTab === 'issue') {
        matchesStatus = status === 'issue' || status === 'lỗi' || status === 'sự cố' || (t.ghi_chu && (t.ghi_chu.toLowerCase().includes('sự cố') || t.ghi_chu.toLowerCase().includes('lỗi')));
      }
      
      return matchesSearch && matchesHam && matchesStatus;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!] || '';
        const bValue = b[sortConfig.key!] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tickets, search, filterHam, statusTab, sortConfig]);

  const requestSort = (key: keyof WeighingTicket) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleStatusUpdate = async (id: string, updates: Partial<WeighingTicket>, sourceSheetOverride?: string) => {
    try {
      const ticket = tickets.find(t => t.id === id || t.rowIndex?.toString() === id);
      const sheet = sourceSheetOverride || ticket?.sourceSheet || 'TALLY_CHECK';
      
      await dataService.updateTicket(id, updates, sheet);
      setTickets(prev => prev.map(t => (t.id === id || t.rowIndex?.toString() === id) ? { ...t, ...updates } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const confirmSingleTicket = async (ticket: WeighingTicket) => {
    if (!ticket.rowIndex) return;
    
    // Normalize ca if not a standard CA 1/2/3/4
    const isStandardShift = (c: any) => c && typeof c === 'string' && /^Ca [1234]$/i.test(c);
    const normalizedCa = isStandardShift(ticket.ca) ? ticket.ca : getShiftFromTime(ticket.thoi_gian);

    const updates: Partial<WeighingTicket> = {
      ...ticket,
      trang_thai: 'checked' as const,
      tally_checked: true,
      ca: normalizedCa,
      checked_time: new Date().toISOString(),
      checked_by: user?.full_name || user?.username || 'Tally Assistant'
    };
    
    // If it's from PHIEU_CAN and we confirm it, it should probably be moved to TALLY_CHECK
    // to match the system's "Checked" list which usually pulls from TALLY_CHECK
    if (ticket.sourceSheet === 'PHIEU_CAN') {
      try {
        await dataService.approveTicket(ticket.rowIndex, {
          ham_so: ticket.ham_tau_assign || 1,
          ca: normalizedCa,
          checked_time: updates.checked_time,
          checked_by: updates.checked_by,
          thoi_gian: updates.checked_time
        });
        // After approval, it's transferred to TALLY_CHECK. 
        // We'll update the status to 'checked' in TALLY_CHECK using so_phieu as ID if needed, 
        // but for now, let's just update the PHIEU_CAN record so it's marked correctly there too.
        await handleStatusUpdate(ticket.rowIndex.toString(), updates, 'PHIEU_CAN');
      } catch (err) {
        console.error('Auto-approve failed, updating PHIEU_CAN directly', err);
        await handleStatusUpdate(ticket.rowIndex.toString(), updates, 'PHIEU_CAN');
      }
    } else {
      await handleStatusUpdate(ticket.rowIndex.toString(), updates, 'TALLY_CHECK');
    }
  };

  const onConfirmCheck = async () => {
    if (!selectedTicket || actionLoading) return;
    setActionLoading(true);
    try {
       await confirmSingleTicket(selectedTicket);
       setIsConfirmModalOpen(false);
       setSelectedTicket(null);
    } finally {
       setActionLoading(false);
    }
  };

  const onUpdateTicket = async () => {
    if (!selectedTicket || !selectedTicket.rowIndex || actionLoading) return;
    setActionLoading(true);
    try {
      await handleStatusUpdate(selectedTicket.rowIndex.toString(), {
        ...selectedTicket,
        tally_note: tallyNote,
      });
      setIsEditModalOpen(false);
      setTallyNote('');
      setSelectedTicket(null);
    } finally {
      setActionLoading(false);
    }
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchConfirmModalOpen, setIsBatchConfirmModalOpen] = useState(false);
  const [isBatchIssueModalOpen, setIsBatchIssueModalOpen] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendings = filteredTickets.filter(t => !t.tally_checked);
    if (selectedIds.length === pendings.length && pendings.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendings.map(t => t.id));
    }
  };

  const handleBatchConfirm = async () => {
    try {
      setBatchActionLoading(true);
      for (const id of selectedIds) {
        const ticket = tickets.find(t => t.id === id);
        if (ticket && !ticket.tally_checked) {
          await confirmSingleTicket(ticket);
        }
      }
      setSelectedIds([]);
      setIsBatchConfirmModalOpen(false);
      // Optional: final sync to be safe
      await fetchTickets(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchIssue = async (note: string) => {
    try {
      setLoading(true);
      for (const id of selectedIds) {
        const ticket = tickets.find(t => t.id === id);
        if (ticket && !ticket.tally_checked && ticket.rowIndex) {
          await handleStatusUpdate(ticket.rowIndex.toString(), { 
            trang_thai: 'issue' as const,
            ghi_chu: note
          });
        }
      }
      setSelectedIds([]);
      setIsBatchIssueModalOpen(false);
      await fetchTickets();
      alert('Đã báo lỗi hàng loạt thành công!');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi báo lỗi hàng loạt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 lg:pb-0 font-sans max-w-5xl mx-auto relative">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white px-4 py-2 text-[10px] font-bold flex items-center justify-center gap-2"
          >
            <WifiOff className="w-3.5 h-3.5" /> Mất kết nối internet
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kiểm định Tally</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Quản lý kiểm đếm hàng hóa tại hầm</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg mr-2">
              <button 
                onClick={() => setViewMode('card')}
                className={`p-1.5 px-3 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
              >
                Cards
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 px-3 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
              >
                Grid
              </button>
            </div>
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-blue-600 dark:text-blue-400 group relative"
              title="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </button>
            <button 
              onClick={() => fetchTickets()} 
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Đã chọn {selectedIds.length} xe
                </span>
              </div>
              <button 
                onClick={() => setIsBatchConfirmModalOpen(true)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                Xác nhận hàng loạt
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Tìm biển số hoặc số phiếu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 outline-none transition-all text-sm font-medium dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={() => setFilterHam('all')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-tight whitespace-nowrap transition-all border ${
                filterHam === 'all' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' 
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              Tất cả hầm
            </button>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button 
                key={n}
                onClick={() => setFilterHam(n)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-tight whitespace-nowrap transition-all border ${
                  filterHam === n 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Hầm {n}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Status Filter Tabs */}
      <div className="px-4 shrink-0">
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
          {(['pending', 'issue', 'checked'] as TallyStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusTab(status)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                statusTab === status 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {status === 'pending' ? 'Đang chờ' : status === 'issue' ? 'Có sự cố' : 'Hoàn tất'}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-auto px-4 space-y-4 pb-6 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <RotateCw className="w-8 h-8 text-slate-200 dark:text-slate-800 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Đang đồng bộ dữ liệu...</p>
          </div>
        )}
        
        {!loading && filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-300 dark:text-zinc-600">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Không có dữ liệu</h3>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-2 max-w-xs font-bold leading-relaxed">
              {statusTab === 'pending' 
                ? 'Hiện không có phiếu cân nào đang chờ kiểm đếm. Vui lòng kiểm tra lại bộ lọc hoặc nhập thêm phiếu mới.' 
                : 'Không có bản ghi nào phù hợp với bộ lọc hiện tại.'}
            </p>
            {statusTab === 'pending' && (
              <button 
                onClick={() => navigate('/tickets')}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg"
              >
                Đến Danh Sách Phiếu <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {viewMode === 'table' && !loading && filteredTickets.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      checked={selectedIds.length === filteredTickets.filter(t => !t.tally_checked).length && filteredTickets.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] cursor-pointer" onClick={() => requestSort('so_phieu')}>
                    <div className="flex items-center gap-1">
                      Số phiếu
                      {sortConfig.key === 'so_phieu' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] cursor-pointer" onClick={() => requestSort('bien_so_xe')}>
                    <div className="flex items-center gap-1">
                      Phương tiện
                      {sortConfig.key === 'bien_so_xe' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] cursor-pointer text-center" onClick={() => requestSort('ham_tau_assign')}>
                    <div className="flex items-center justify-center gap-1">
                      Hầm
                      {sortConfig.key === 'ham_tau_assign' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] cursor-pointer" onClick={() => requestSort('ca')}>
                    <div className="flex items-center gap-1">
                      Ca
                      {sortConfig.key === 'ca' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] cursor-pointer" onClick={() => requestSort('don_vi')}>
                    <div className="flex items-center gap-1">
                      Đơn vị
                      {sortConfig.key === 'don_vi' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] cursor-pointer" onClick={() => requestSort('bai_dam')}>
                    <div className="flex items-center gap-1">
                      Bãi Dam
                      {sortConfig.key === 'bai_dam' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] text-right cursor-pointer" onClick={() => requestSort('tl_hang_tan')}>
                    <div className="flex items-center justify-end gap-1">
                      Trọng lượng
                      {sortConfig.key === 'tl_hang_tan' && <span className="text-[10px] opacity-70">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] text-right">Thao tác</th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 shadow-inner">
                    {filteredTickets.map(ticket => (
                      <tr key={ticket.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(ticket.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          {!ticket.tally_checked && (
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-slate-900 dark:focus:ring-white cursor-pointer bg-white dark:bg-slate-800"
                              checked={selectedIds.includes(ticket.id)}
                              onChange={() => toggleSelection(ticket.id)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">#{ticket.so_phieu}</td>
                        <td className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase font-mono">{ticket.bien_so_xe}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-900 dark:bg-slate-700 text-white px-2 py-0.5 rounded text-[10px] font-black">{ticket.ham_tau_assign}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {(ticket.ca && typeof ticket.ca === 'string' && /^Ca [1234]$/i.test(ticket.ca)) 
                            ? ticket.ca.toUpperCase() 
                            : getShiftFromTime(ticket.thoi_gian).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[100px]">{ticket.don_vi || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight truncate max-w-[80px]">{ticket.bai_dam || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-blue-600 dark:text-blue-400">{formatNumber(ticket.tl_hang_tan, 2, 2)}</td>
                       <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!ticket.tally_checked ? (
                            <>
                              <button 
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setTallyNote(ticket.tally_note || '');
                                  setIsEditModalOpen(true);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Cập nhật"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => { setSelectedTicket(ticket); setIsConfirmModalOpen(true); }}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight hover:scale-105 transition-all shadow-sm"
                              >
                                Xác nhận
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">OK</span>
                            </div>
                          )}
                        </div>
                      </td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          </div>
        )}

        {viewMode === 'card' && filteredTickets.map((ticket) => (
          <motion.div
            key={ticket.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card group border-l-4 relative ${
              ticket.tally_checked ? 'border-l-emerald-500' : ticket.ghi_chu ? 'border-l-rose-500' : 'border-l-blue-500'
            } ${selectedIds.includes(ticket.id) ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`}
          >
            {!ticket.tally_checked && (
              <div className="absolute top-4 left-4 z-10">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  checked={selectedIds.includes(ticket.id)}
                  onChange={() => toggleSelection(ticket.id)}
                />
              </div>
            )}
            <div className={`p-5 ${!ticket.tally_checked ? 'pl-12' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      HẦM {ticket.ham_tau_assign}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">#{ticket.so_phieu}</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    {ticket.bien_so_xe}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(ticket.tl_hang_tan, 2, 2)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tấn hàng</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {(ticket.ca && typeof ticket.ca === 'string' && /^Ca [1234]$/i.test(ticket.ca)) 
                      ? ticket.ca.toUpperCase() 
                      : getShiftFromTime(ticket.thoi_gian).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{ticket.don_vi}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ship className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{ticket.bai_dam}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{ticket.ten_ban_can}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{ticket.nhan_vien_can}</span>
                </div>
              </div>

              {ticket.ghi_chu && (
                <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Nhân viên cân: <span className="font-bold text-slate-900 dark:text-white">{ticket.ghi_chu}</span></p>
                </div>
              )}

              <div className="flex gap-2">
                {!ticket.tally_checked ? (
                  <>
                    <button
                      onClick={() => {
                        const isStandardShift = (c: any) => c && typeof c === 'string' && /^Ca [1234]$/i.test(c);
                        setSelectedTicket({
                          ...ticket,
                          ca: isStandardShift(ticket.ca) ? ticket.ca : getShiftFromTime(ticket.thoi_gian),
                          bai_dam: ticket.bai_dam || (baiDamList[0] || 'Sao Vàng'),
                        });
                        setIsConfirmModalOpen(true);
                      }}
                      className="flex-[3] py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-tight shadow-lg shadow-slate-900/10 dark:shadow-white/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Xác nhận bốc xong
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setTallyNote(ticket.tally_note || '');
                        setIsEditModalOpen(true);
                      }}
                      className="flex-1 py-2.5 bg-white dark:bg-slate-900 text-blue-600 border border-blue-200 dark:border-blue-900/30 rounded-xl font-bold text-xs uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Cập nhật
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-col gap-1">
                    <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-tight border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Đã bốc xong • {ticket.checked_time?.split('T')[0] || new Date().toISOString().split('T')[0]}
                    </div>
                    {ticket.checked_by && (
                      <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        <UserCheck className="w-3 h-3" /> Kiểm bởi: {ticket.checked_by}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
          >
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-slate-800 dark:border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 dark:bg-slate-900/10 h-8 w-8 rounded-lg flex items-center justify-center font-black text-sm">
                  {selectedIds.length}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Đang chọn</p>
                  <p className="text-xs font-bold mt-0.5 opacity-70">phiếu chờ bốc</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsBatchIssueModalOpen(true)}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all"
                >
                  Cập nhật / Báo lỗi
                </button>
                <button 
                  onClick={() => setIsBatchConfirmModalOpen(true)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-tight hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Xác nhận bốc xong
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help / Onboarding Modal */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden z-10 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="relative p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <button 
                  onClick={() => setIsHelpModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                    <PackageCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Hướng dẫn Tally</h3>
                    <p className="text-slate-500 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Quick Onboarding Guide</p>
                  </div>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {[
                  {
                    step: 1,
                    title: "Tiếp nhận xe",
                    desc: "Đối chiếu biển số xe và số phiếu trực tiếp với tài xế tại hiện trường.",
                    icon: Truck,
                    color: "text-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-500/10",
                    border: "border-blue-100 dark:border-blue-900/20"
                  },
                  {
                    step: 2,
                    title: "Cập nhật thông tin",
                    desc: "Sử dụng nút 'Sửa' để thay đổi Hầm bốc hoặc ghi chú báo lỗi nếu có sai sót.",
                    icon: Pencil,
                    color: "text-amber-500",
                    bg: "bg-amber-50 dark:bg-amber-500/10",
                    border: "border-amber-100 dark:border-amber-900/20"
                  },
                  {
                    step: 3,
                    title: "Kiểm đếm (Tally)",
                    desc: "Xác nhận hàng bốc đúng hầm và đủ trọng lượng theo chỉ định.",
                    icon: Ship,
                    color: "text-indigo-500",
                    bg: "bg-indigo-50 dark:bg-indigo-500/10",
                    border: "border-indigo-100 dark:border-indigo-900/20"
                  },
                  {
                    step: 4,
                    title: "Xác nhận bốc xong",
                    desc: "Nhấn xác nhận để đóng phiếu và đồng bộ dữ liệu về trung tâm.",
                    icon: CheckCircle2,
                    color: "text-emerald-500",
                    bg: "bg-emerald-50 dark:bg-emerald-500/10",
                    border: "border-emerald-100 dark:border-emerald-900/20"
                  }
                ].map((s, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border ${s.bg} ${s.border} group hover:scale-[1.02] transition-transform shadow-sm`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center ${s.color} shrink-0`}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${s.bg} ${s.color} border ${s.border}`}>BƯỚC {s.step}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                <button 
                  onClick={() => setIsHelpModalOpen(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 dark:shadow-white/10"
                >
                  Bắt đầu làm việc <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Confirm Modal */}
      <AnimatePresence>
        {isBatchConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsBatchConfirmModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-8 z-10 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Xác nhận hàng loạt</h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Bạn có chắc chắn muốn xác nhận bốc xong cho <span className="font-black text-slate-900 dark:text-white underline">{selectedIds.length} xe</span> đã chọn?
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  disabled={batchActionLoading}
                  onClick={() => setIsBatchConfirmModalOpen(false)}
                  className="flex-1 py-3 font-bold text-xs uppercase tracking-tight text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  disabled={batchActionLoading}
                  onClick={handleBatchConfirm}
                  className="flex-[2] py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold uppercase text-xs tracking-tight shadow-lg shadow-slate-900/10 dark:shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {batchActionLoading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>Xác nhận {selectedIds.length} xe</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Issue Modal */}
      <AnimatePresence>
        {isBatchIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsBatchIssueModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-8 z-10 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Cập nhật hàng loạt</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Đang chọn {selectedIds.length} xe</p>
                  </div>
                </div>
                
                <textarea
                  id="batch-issue-note"
                  placeholder="Nhập ghi chú hoặc thông tin thay đổi chung cho các xe đã chọn..."
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 outline-none transition-all text-sm font-medium dark:text-white"
                />

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsBatchIssueModalOpen(false)}
                    className="flex-1 py-3.5 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={() => {
                      const note = (document.getElementById('batch-issue-note') as HTMLTextAreaElement).value;
                      handleBatchIssue(note);
                    }}
                    className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Lưu {selectedIds.length} xe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-8 z-10 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Xác nhận bốc xong</h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Kiểm tra và cập nhật thông tin thực tế cho <span className="font-bold text-slate-900 dark:text-white">{selectedTicket?.bien_so_xe}</span>
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 font-mono font-bold text-xl text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TL CÂN</p>
                    <p>{formatNumber(selectedTicket?.tl_hang_tan || 0, 2, 2)} T</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Số xe (BSX)</label>
                  <input 
                    type="text"
                    value={selectedTicket?.bien_so_xe || ''}
                    onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, bien_so_xe: e.target.value.toUpperCase() } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hầm bốc</label>
                  <select 
                    value={selectedTicket?.ham_tau_assign || 1}
                    onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, ham_tau_assign: parseInt(e.target.value) } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                  >
                    {[1,2,3,4,5,6].map(h => <option key={h} value={h}>Hầm {h}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ca làm việc</label>
                  <select 
                    value={selectedTicket?.ca || getShiftFromTime()}
                    onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, ca: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                  >
                    <option value="Ca 1">Ca 1 (06:00-12:00)</option>
                    <option value="Ca 2">Ca 2 (12:00-18:00)</option>
                    <option value="Ca 3">Ca 3 (18:00-00:00)</option>
                    <option value="Ca 4">Ca 4 (00:00-06:00)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bãi Dam (Kho)</label>
                  <select 
                    value={selectedTicket?.bai_dam || ''}
                    onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, bai_dam: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                  >
                    {baiDamList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tally Note</label>
                  <input 
                    type="text"
                    value={selectedTicket?.tally_note || ''}
                    onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, tally_note: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhân viên cân</label>
                  <input 
                    type="text"
                    value={selectedTicket?.ghi_chu || ''}
                    onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, ghi_chu: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 font-bold text-xs uppercase tracking-tight text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={onConfirmCheck}
                  disabled={actionLoading}
                  className="flex-[2] py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold uppercase text-xs tracking-tight shadow-lg shadow-slate-900/10 dark:shadow-white/10 disabled:opacity-50"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update/Edit/Issue Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 z-10 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Cập nhật thông tin</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">{selectedTicket?.bien_so_xe} • #{selectedTicket?.so_phieu}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thay đổi Hầm</label>
                    <select 
                      value={selectedTicket?.ham_tau_assign || 1}
                      onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, ham_tau_assign: parseInt(e.target.value) } : null)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                    >
                      {[1,2,3,4,5,6].map(h => <option key={h} value={h}>Hầm {h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trọng lượng (Tấn)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={selectedTicket?.tl_hang_tan || 0}
                      onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, tl_hang_tan: parseFloat(e.target.value) } : null)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú / Báo lỗi</label>
                  <textarea
                    placeholder="Nhập thông tin thực tế hoặc báo lỗi tại đây..."
                    value={tallyNote}
                    onChange={(e) => setTallyNote(e.target.value)}
                    className="w-full h-28 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 outline-none transition-all text-sm font-medium dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={actionLoading}
                    className="flex-1 py-3.5 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={onUpdateTicket}
                    disabled={actionLoading}
                    className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {actionLoading ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
