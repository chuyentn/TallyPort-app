import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, FileSpreadsheet, Download, Pencil, Trash2, ArrowRight, AlertTriangle, CheckCircle2, Upload, X, PackageCheck, Info, FileText, RotateCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { dataService } from '../../services/dataService';
import { useAuthStore } from '../../stores/authStore';
import { WeighingTicket } from '../../types';
import { Modal } from '../Shared/Modal';
import { GlobalConfirmModal } from '../Shared/GlobalConfirmModal';
import { TicketFormModal } from './TicketFormModal';
import { TicketImportModal } from './TicketImportModal';
import { TicketToolbar } from './TicketToolbar';
import { TicketTable } from './TicketTable';
import { ApproveTicketModal } from './ApproveTicketModal';

import { formatNumber, formatPercent } from '../../lib/formatters';

export default function TicketList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<WeighingTicket[]>([]);
  const [successMessage, setSuccessMessage] = useState<{title: string, count: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<WeighingTicket | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof WeighingTicket | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  
  const getShiftFromTime = (timeStr?: string) => {
    const d = timeStr ? new Date(timeStr) : new Date();
    const validD = isNaN(d.getTime()) ? new Date() : d;
    const hour = validD.getHours();
    if (hour >= 6 && hour < 12) return 'Ca 1';
    if (hour >= 12 && hour < 18) return 'Ca 2';
    if (hour >= 18 && hour < 24) return 'Ca 3';
    return 'Ca 4';
  };

  const [formData, setFormData] = useState<Partial<WeighingTicket>>({
    so_phieu: '',
    ngay: new Date().toISOString().split('T')[0],
    ca: getShiftFromTime(),
    bien_so_xe: '',
    loai_xe: 'Xe thùng',
    don_vi: '',
    bai_dam: '',
    tl_hang_tan: 0,
    ham_tau_assign: 1,
    ten_ban_can: '',
    nhan_vien_can: '',
    trang_thai: 'pending',
    tally_checked: false
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  useEffect(() => {
    fetchTickets(false);
    const interval = setInterval(() => fetchTickets(true), 5000); // REFRESH 5S - REALTIME
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await dataService.getPhieuCan();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    let result = tickets.filter(t => {
      const matchSearch = t.bien_so_xe.toLowerCase().includes(search.toLowerCase()) || 
                          t.so_phieu.toLowerCase().includes(search.toLowerCase());
      const ticketDate = t.ngay;
      const matchStartDate = startDate ? ticketDate >= startDate : true;
      const matchEndDate = endDate ? ticketDate <= endDate : true;
      return matchSearch && matchStartDate && matchEndDate;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tickets, search, startDate, endDate, sortConfig]);

  const requestSort = (key: keyof WeighingTicket) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate duplicate
    if (!editingTicket && tickets.find(t => t.so_phieu === formData.so_phieu)) {
      setImportErrors(['Số phiếu đã tồn tại trong hệ thống!']);
      return;
    }

    const finalData = { ...formData };

    try {
      if (editingTicket) {
        await dataService.updateTicket(editingTicket.id, finalData, 'PHIEU_CAN');
      } else {
        await dataService.createTicket(finalData, 'PHIEU_CAN');
      }
      fetchTickets();
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (ticket: WeighingTicket) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Phiếu Cân',
      message: `Bạn có chắc chắn muốn xóa phiếu ${ticket.so_phieu}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await dataService.deleteTicket(ticket.id, 'PHIEU_CAN', ticket.rowIndex);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchTickets();
          setSuccessMessage({ title: 'Đã xóa phiếu thành công', count: 0 });
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    ticket: WeighingTicket | null;
  }>({ isOpen: false, ticket: null });

  const handleApprove = async (ticket: WeighingTicket) => {
    if (ticket.trang_thai === 'đã duyệt') {
      setConfirmModal({
        isOpen: true,
        title: 'Thông báo',
        message: 'Phiếu này đã được duyệt trước đó.',
        type: 'info',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setApproveModal({ isOpen: true, ticket });
  };

  const onConfirmApprove = async (updates: { ham_so: number, ca: string, checked_time: string, checked_by: string, thoi_gian: string }) => {
    const ticket = approveModal.ticket;
    if (!ticket || !ticket.rowIndex) {
      setApproveModal({ isOpen: false, ticket: null });
      return;
    }
    
    try {
      const finalUpdates = {
        ...updates,
        checked_by: user?.full_name || user?.username || 'Tally Assistant'
      };
      await dataService.approveTicket(ticket.rowIndex, finalUpdates);
      setApproveModal({ isOpen: false, ticket: null });
      fetchTickets();
      setSuccessMessage({ title: 'Duyệt phiếu thành công', count: 1 });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      // could show an error notice here
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingTicket(null);
    setFormData({
      so_phieu: '',
      ngay: new Date().toISOString().split('T')[0],
      ca: getShiftFromTime(),
      bien_so_xe: '',
      loai_xe: 'Xe thùng',
      don_vi: '',
      bai_dam: '',
      tl_hang_tan: 0,
      ham_tau_assign: 1,
      ten_ban_can: '',
      nhan_vien_can: '',
      trang_thai: 'pending',
      tally_checked: false
    });
  };

  const openEdit = (ticket: WeighingTicket) => {
    setEditingTicket(ticket);
    setFormData(ticket);
    setIsAddModalOpen(true);
  };

  const downloadTemplate = () => {
    const template = [
      {
        "STT": "1",
        "SO_PHIEU": "2429",
        "BIEN_SO": "47E 00446",
        "KHACH_HANG": "CÔNG TY VẬN TẢI A",
        "LOAI_HANG": "Dăm gỗ",
        "TL_CAN_LAN_1": "46.770",
        "TL_CAN_LAN_2": "23.440",
        "TRU_BI": "23.440",
        "TL_HANG": "23.330",
        "NGAY_CAN_1": "27/03/2026",
        "GIO_CAN_1": "01:50:38",
        "NGAY_CAN_2": "27/03/2026",
        "GIO_CAN_2": "02:04:22",
        "KHO_HANG": "Sao Vàng",
        "GHI_CHU": "",
        "HAM_SO": 1,
        "TRANG_THAI": "pending",
        "TEN_NV": "Nguyễn Văn A",
        "TAI_KHOAN": "nguyenvana",
        "THOI_GIAN": "2026-03-27T02:04:22",
        "CA": "Ngày",
        "TALLY_NOTE": "",
        "MINH_CHUNG": "",
        "CHECKED_BY": "",
        "CHECKED_TIME": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Phieu_Can");
    XLSX.writeFile(wb, "Mau_Nhap_Phieu_Can.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      
      const errors: string[] = [];
      const validRows = data.map((row: any, index) => {
        const errorsInRow = [];
        const so_phieu = row['SO_PHIEU'] || row['so_phieu'];
        const bien_so = row['BIEN_SO'] || row['bien_so'];

        if (!so_phieu) errorsInRow.push('Thiếu SO_PHIEU');
        if (!bien_so) errorsInRow.push('Thiếu BIEN_SO');
        if (errorsInRow.length > 0) {
          errors.push(`Dòng ${index + 2}: ${errorsInRow.join(', ')}`);
          return null;
        }

        const parseNum = (val: string | number) => {
          if (!val) return 0;
          return Number(String(val).replace(/,/g, '')) || 0;
        };

        const tl_hang = parseNum(row['TL_HANG'] || row['tl_hang'] || row['Tịnh']);

        // Helper to extract date
        let ngayCan = row['NGAY_CAN_2'] || row['ngay_can_2'] || row['ngay_can_1'] || new Date().toISOString().split('T')[0];
        
        return {
          id: row['STT'] || row['id'] ? String(row['STT'] || row['id']) : `T${Date.now()}-${index}`,
          ngay: String(ngayCan),
          so_phieu: String(so_phieu),
          bien_so_xe: String(bien_so).toUpperCase().trim(),
          loai_xe: String(row['LOAI_HANG'] || row['loai_hang'] || row['Phân loại'] || 'Xe thùng'),
          don_vi: String(row['KHACH_HANG'] || row['khach_hang'] || row['Chủ quản'] || ''),
          
          tl_can_lan_1: row['TL_CAN_LAN_1'] || '',
          tl_can_lan_2: row['TL_CAN_LAN_2'] || '',
          tru_bi: row['TRU_BI'] || '',
          tl_hang_tan: tl_hang,
          
          ngay_can_1: row['NGAY_CAN_1'] || '',
          gio_can_1: row['GIO_CAN_1'] || '',
          ngay_can_2: String(ngayCan),
          gio_can_2: row['GIO_CAN_2'] || '',
          
          bai_dam: row['KHO_HANG'] || row['kho_hang'] || 'Sao Vàng',
          ghi_chu: row['GHI_CHU'] || row['ghi_chu'] || '',
          
          ham_tau_assign: parseNum(row['HAM_SO'] || row['ham_so'] || 1) || 1,
          trang_thai: String(row['TRANG_THAI'] || row['trang_thai'] || 'pending'),
          
          ten_ban_can: '',
          nhan_vien_can: row['TEN_NV'] || row['ten_nv'] || '',
          
          thoi_gian: row['THOI_GIAN'] || row['thoi_gian'] || new Date().toISOString(),
          ca: row['CA'] || row['ca'] || getShiftFromTime(row['THOI_GIAN'] || row['thoi_gian']),
          tally_note: row['TALLY_NOTE'] || row['tally_note'] || '',
          minh_chung: row['MINH_CHUNG'] || '',
          checked_by: row['CHECKED_BY'] || '',
          checked_time: row['CHECKED_TIME'] || '',
          tally_checked: false,
          
          sourceSheet: 'PHIEU_CAN'
        };
      }).filter(r => r !== null);

      setImportPreview(validRows as WeighingTicket[]);
      setImportErrors(errors);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset
  };

  const confirmImport = async () => {
    try {
      const ticketsToCreate = importPreview.filter(
        ticket => !tickets.find(t => t.so_phieu === ticket.so_phieu)
      );

      if (ticketsToCreate.length > 0) {
        if (typeof dataService.createTicketsBatch === 'function') {
          await dataService.createTicketsBatch(ticketsToCreate);
        } else {
          // Fallback if batch doesn't exist
          for (const ticket of ticketsToCreate) {
             await dataService.createTicket(ticket);
          }
        }
      }
      
      fetchTickets();
      setIsImportModalOpen(false);
      setSuccessMessage({ title: 'Nhập dữ liệu thành công', count: ticketsToCreate.length });
      setImportPreview([]);
      setImportErrors([]);
    } catch (err) {
      console.error(err);
    }
  };

  const exportExcel = () => {
    const defaultExport = tickets.map((t, idx) => ({
      "STT": idx + 1,
      "SO_PHIEU": t.so_phieu || "",
      "BIEN_SO": t.bien_so_xe || "",
      "KHACH_HANG": t.don_vi || "",
      "LOAI_HANG": t.loai_xe || "",
      "TL_CAN_LAN_1": t.tl_can_lan_1 || "",
      "TL_CAN_LAN_2": t.tl_can_lan_2 || "",
      "TRU_BI": t.tru_bi || "",
      "TL_HANG": t.tl_hang_tan || 0,
      "NGAY_CAN_1": t.ngay_can_1 || "",
      "GIO_CAN_1": t.gio_can_1 || "",
      "NGAY_CAN_2": t.ngay_can_2 || t.ngay || "",
      "GIO_CAN_2": t.gio_can_2 || "",
      "KHO_HANG": t.bai_dam || "",
      "GHI_CHU": t.ghi_chu || "",
      "HAM_SO": t.ham_tau_assign || 1,
      "TRANG_THAI": t.trang_thai || "",
      "TEN_NV": t.nhan_vien_can || "",
      "TAI_KHOAN": t.tai_khoan || "",
      "THOI_GIAN": t.thoi_gian || "",
      "CA": t.ca || "",
      "TALLY_NOTE": t.tally_note || "",
      "MINH_CHUNG": t.minh_chung || "",
      "CHECKED_BY": t.checked_by || "",
      "CHECKED_TIME": t.checked_time || ""
    }));
    const ws = XLSX.utils.json_to_sheet(defaultExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách phiếu");
    XLSX.writeFile(wb, "DanhSachPhieuCan.xlsx");
  };

  const DEFAULT_COLUMN_WIDTHS = {
    stt: 60,
    so_phieu: 100,
    bien_so: 120,
    khach_hang: 180,
    loai_hang: 100,
    tl_can_lan_1: 100,
    tl_can_lan_2: 100,
    tru_bi: 100,
    tl_hang: 100,
    ngay_can_1: 100,
    gio_can_1: 80,
    ngay_can_2: 100,
    gio_can_2: 80,
    kho_hang: 120,
    ghi_chu: 150,
    ham_so: 80,
    trang_thai: 120,
    ten_nv: 120,
    tai_khoan: 100,
    thoi_gian: 120,
    ca: 80,
    tally_note: 150,
    minh_chung: 150,
    checked_by: 120,
    checked_time: 120,
    action: 150
  };

  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('tallyport_ticket_widths');
    if (saved) {
      try {
        return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_COLUMN_WIDTHS;
      }
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  useEffect(() => {
    localStorage.setItem('tallyport_ticket_widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const handleResize = (column: keyof typeof columnWidths, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(50, prev[column] + delta)
    }));
  };

  const Resizer = ({ column }: { column: keyof typeof columnWidths }) => {
    const onMouseDown = (e: React.MouseEvent) => {
      const startX = e.pageX;
      const startWidth = columnWidths[column];
      
      const onMouseMove = (moveEvent: MouseEvent) => {
        handleResize(column, moveEvent.pageX - startX);
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    return <div className="resizer" onMouseDown={onMouseDown} />;
  };

  const DEFAULT_COLUMN_VISIBILITY = {
    stt: true,
    so_phieu: true,
    bien_so: true,
    khach_hang: false,
    loai_hang: false,
    tl_can_lan_1: false,
    tl_can_lan_2: false,
    tru_bi: false,
    tl_hang: true,
    ngay_can_1: true,
    gio_can_1: true,
    ngay_can_2: false,
    gio_can_2: false,
    kho_hang: true,
    ghi_chu: true,
    ham_so: true,
    trang_thai: true,
    ten_nv: false,
    tai_khoan: false,
    thoi_gian: false,
    ca: false,
    tally_note: false,
    minh_chung: false,
    checked_by: false,
    checked_time: false,
    action: true
  };

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('tallyport_ticket_columns');
    if (saved) {
      try {
        return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem('tallyport_ticket_columns', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const toggleColumn = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  return (
    <div className="max-w-full mx-auto flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-40px)] gap-4">
      <TicketToolbar 
        search={search}
        setSearch={setSearch}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        fetchTickets={() => fetchTickets(false)}
        loading={loading}
        exportExcel={exportExcel}
        isColumnDropdownOpen={isColumnDropdownOpen}
        setIsColumnDropdownOpen={setIsColumnDropdownOpen}
        columnVisibility={columnVisibility}
        toggleColumn={toggleColumn as any}
        labels={{
          stt: 'STT',
          so_phieu: 'Số phiếu',
          bien_so: 'Biển số',
          khach_hang: 'Khách hàng',
          loai_hang: 'Loại hàng',
          tl_can_lan_1: 'TL Cân 1',
          tl_can_lan_2: 'TL Cân 2',
          tru_bi: 'Trừ bì',
          tl_hang: 'TL Hàng',
          ngay_can_1: 'Ngày cân 1',
          gio_can_1: 'Giờ cân 1',
          ngay_can_2: 'Ngày cân 2',
          gio_can_2: 'Giờ cân 2',
          kho_hang: 'Kho hàng',
          ghi_chu: 'Ghi chú',
          ham_so: 'Hầm',
          trang_thai: 'Trạng thái',
          ten_nv: 'Tên NV',
          tai_khoan: 'Tài khoản',
          thoi_gian: 'Thời gian',
          ca: 'Ca',
          tally_note: 'Tally Note',
          minh_chung: 'Minh chứng',
          checked_by: 'Checked By',
          checked_time: 'Checked Time',
          action: 'Hành động'
        }}
        totalRows={tickets.length}
        doneRows={tickets.filter(t => t.tally_checked).length}
        openImportModal={() => setIsImportModalOpen(true)}
        openAddModal={() => setIsAddModalOpen(true)}
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-100 dark:border-slate-800 shadow-sm p-2 flex flex-col flex-1 overflow-hidden relative">
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
            >
              <div className="bg-slate-900 dark:bg-emerald-950 border border-emerald-500/30 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{successMessage.title}</p>
                    <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest">Đã sẵn sàng {successMessage.count} phiếu để kiểm tally</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/tally')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Đến Tally <ArrowRight className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setSuccessMessage(null)}
                    className="p-2 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile Search & Filters - only shows on small screens */}
        <div className="lg:hidden space-y-2 mb-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-lg text-xs font-bold outline-none text-inherit"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold text-zinc-400 uppercase px-1">Từ ngày</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-lg text-[10px] font-bold outline-none text-inherit"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold text-zinc-400 uppercase px-1">Đến ngày</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-lg text-[10px] font-bold outline-none text-inherit"
              />
            </div>
          </div>
        </div>

        <TicketTable 
            tickets={filteredTickets}
            columnVisibility={columnVisibility}
            columnWidths={columnWidths}
            sortConfig={sortConfig}
            requestSort={requestSort}
            Resizer={Resizer}
            user={user}
            openEdit={(ticket) => { setEditingTicket(ticket); setFormData(ticket); setIsAddModalOpen(true); }}
            handleDelete={handleDelete}
            handleApprove={handleApprove}
          />

        {/* Grid Footer Statistics */}
        <div className="bg-zinc-50 dark:bg-slate-950 border-t border-zinc-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] font-bold text-zinc-500 rounded-b-xl shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE: Connected to System Hub</span>
            </div>
            <div className="w-px h-3 bg-zinc-200 dark:bg-slate-800" />
            <div className="flex gap-4">
              <span>Đang chờ (Pending): <span className="text-amber-600 dark:text-amber-500 font-black">{tickets.filter(t => t.trang_thai !== 'đã duyệt').length} Xe</span> | <span className="text-amber-600 dark:text-amber-500 font-black">{formatNumber(tickets.filter(t => t.trang_thai !== 'đã duyệt').reduce((sum, t) => sum + (t.tl_hang_tan || 0), 0))} (T)</span></span>
              <span>Đã kiểm (Checked): <span className="text-emerald-600 dark:text-emerald-400 font-black">{tickets.filter(t => t.trang_thai === 'đã duyệt').length} Xe</span> | <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatNumber(tickets.filter(t => t.trang_thai === 'đã duyệt').reduce((sum, t) => sum + (t.tl_hang_tan || 0), 0))} (T)</span></span>
            </div>
          </div>
          <div>
            Page 1 of {Math.ceil(tickets.length / 50) || 1} • {filteredTickets.length} Rows filtered
          </div>
        </div>
      </div>


      {/* Global Confirmation Modal */}
      <GlobalConfirmModal 
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      <ApproveTicketModal 
        isOpen={approveModal.isOpen}
        ticket={approveModal.ticket}
        onClose={() => setApproveModal({ isOpen: false, ticket: null })}
        onConfirm={onConfirmApprove}
      />

      <TicketFormModal 
        isOpen={isAddModalOpen}
        onClose={closeModal}
        editingTicket={editingTicket}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
      />

      <TicketImportModal 
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportPreview([]);
          setImportErrors([]);
        }}
        importErrors={importErrors}
        setImportErrors={setImportErrors}
        importPreview={importPreview}
        setImportPreview={setImportPreview}
        handleFileUpload={handleFileUpload}
        downloadTemplate={downloadTemplate}
        confirmImport={confirmImport}
      />
    </div>
  );
}
