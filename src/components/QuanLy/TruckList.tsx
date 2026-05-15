import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, Truck, Pencil, Trash2, CheckCircle2, AlertTriangle, Phone, User as UserIcon, Building2, FileSpreadsheet, Download, Upload, X, Info, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { dataService } from '../../services/dataService';
import { Truck as ITruck } from '../../types';
import { Modal } from '../Shared/Modal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  align?: 'left' | 'center' | 'right';
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'stt', label: 'STT', width: 60, visible: true, align: 'center' },
  { id: 'bien_so', label: 'Biển số', width: 150, visible: true },
  { id: 'don_vi', label: 'Đơn vị', width: 200, visible: true },
  { id: 'loai_xe', label: 'Loại xe', width: 120, visible: true, align: 'center' },
  { id: 'tai_xe', label: 'Tài xế', width: 150, visible: true },
  { id: 'phone', label: 'Điện thoại', width: 120, visible: true },
  { id: 'don_gia', label: 'Đơn giá', width: 120, visible: true, align: 'right' },
  { id: 'ghi_chu', label: 'Ghi chú', width: 150, visible: true },
  { id: 'trang_thai', label: 'Trạng thái', width: 120, visible: true, align: 'center' },
  { id: 'action', label: 'Action', width: 100, visible: true, align: 'right' },
];

export default function TruckList() {
  const [trucks, setTrucks] = useState<ITruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<ITruck | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem('truck_list_columns');
      if (!saved) return DEFAULT_COLUMNS;
      
      const parsed: ColumnConfig[] = JSON.parse(saved);
      // Merge with DEFAULT_COLUMNS to support new columns added in future updates
      const merged = DEFAULT_COLUMNS.map(defCol => {
        const savedCol = parsed.find(p => p.id === defCol.id);
        return savedCol ? { ...defCol, ...savedCol } : defCol;
      });
      
      // Preserve the order from the saved layout
      const ordered = parsed
        .filter(p => DEFAULT_COLUMNS.some(d => d.id === p.id))
        .map(p => {
          const defCol = merged.find(m => m.id === p.id)!;
          return defCol;
        });
      
      // Add any columns that are in DEFAULT but not in saved layout
      const final = [...ordered];
      DEFAULT_COLUMNS.forEach(defCol => {
        if (!final.some(f => f.id === defCol.id)) {
          final.push(defCol);
        }
      });
      
      return final;
    } catch (e) {
      console.error('Error loading column layout:', e);
      return DEFAULT_COLUMNS;
    }
  });

  useEffect(() => {
    localStorage.setItem('truck_list_columns', JSON.stringify(columns));
  }, [columns]);

  const resetColumns = () => {
    if (window.confirm('Khôi phục bố cục cột về mặc định?')) {
      setColumns(DEFAULT_COLUMNS);
    }
  };

  const [formData, setFormData] = useState<Partial<ITruck>>({
    bien_so: '',
    don_vi: '',
    loai_xe: 'Xe thùng',
    tai_xe: '',
    phone: '',
    don_gia: 0,
    ghi_chu: '',
    trang_thai: 'Active'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getTrucks();
      setTrucks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCompany]);

  const filteredTrucks = useMemo(() => {
    return trucks.filter(t => {
      const matchesSearch = (t.bien_so || '').toLowerCase().includes(search.toLowerCase()) ||
                           (t.tai_xe || '').toLowerCase().includes(search.toLowerCase()) ||
                           (t.don_vi || '').toLowerCase().includes(search.toLowerCase());
      const matchesCompany = filterCompany === 'all' || t.don_vi === filterCompany;
      return matchesSearch && matchesCompany;
    });
  }, [trucks, search, filterCompany]);

  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);

  const paginatedTrucks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrucks.slice(start, start + itemsPerPage);
  }, [filteredTrucks, currentPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrors([]);
    
    if (!editingTruck && trucks.find(t => t.bien_so === formData.bien_so)) {
      setSaveErrors(['Biển số xe đã tồn tại trong hệ thống!']);
      return;
    }

    try {
      if (editingTruck) {
        await dataService.updateTruck(editingTruck.bien_so, formData);
      } else {
        await dataService.createTruck(formData);
      }
      fetchData();
      closeModal();
    } catch (err) {
      console.error(err);
      setSaveErrors(['Có lỗi xảy ra khi lưu thông tin! Vui lòng thử lại.']);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "BIỂN SỐ": "77C-123.45",
        "ĐƠN VỊ": "CÔNG TY PHÚ AN",
        "LOẠI XE": "Xe thùng",
        "TÀI XẾ": "Nguyễn Văn A",
        "SỐ ĐIỆN THOẠI": "0912345678",
        "ĐƠN GIÁ": 150000,
        "GHI CHÚ": "Hợp đồng năm 2024"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Doi_Xe");
    XLSX.writeFile(wb, "Mau_Nhap_Doi_Xe.xlsx");
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      const errors: string[] = [];
      
      const validRows = data.map((row: any, index: number) => {
        const bienSo = row['BIỂN SỐ'] || row['BIỂN KIỂM SOÁT'];
        const donVi = row['ĐƠN VỊ'] || row['ĐƠN VỊ CHỦ QUẢN'];
        
        if (!bienSo) {
          errors.push(`Dòng ${index + 2}: Thiếu biển số xe`);
        }
        return {
          bien_so: String(bienSo || '').toUpperCase(),
          don_vi: String(donVi || '').toUpperCase(),
          loai_xe: row['LOẠI XE'] || row['LOAI XE'] || 'Xe thùng',
          tai_xe: row['TÀI XẾ'] || row['TAI XE'] || '',
          phone: String(row['SỐ ĐIỆN THOẠI'] || row['PHONE'] || row['ĐIỆN THOẠI'] || ''),
          don_gia: Number(row['ĐƠN GIÁ'] || row['DON GIA'] || row['ĐƠN GIÁ (đ/Tấn)']) || 0,
          ghi_chu: row['GHI CHÚ'] || row['GHI CHU'] || '',
          trang_thai: row['TRẠNG THÁI'] || row['TRANG THAI'] || 'Active'
        };
      });

      setImportErrors(errors);
      setImportPreview(validRows.filter(r => r.bien_so));
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    try {
      for (const truck of importPreview) {
        if (!trucks.find(t => t.bien_so === truck.bien_so)) {
          await dataService.createTruck(truck);
        }
      }
      fetchData();
      setIsImportModalOpen(false);
      setImportPreview([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const exportData = trucks.map((truck, index) => ({
      "STT": index + 1,
      "BIỂN SỐ": truck.bien_so,
      "ĐƠN VỊ": truck.don_vi,
      "LOẠI XE": truck.loai_xe,
      "TÀI XẾ": truck.tai_xe || "",
      "PHONE": truck.phone || "",
      "DON GIA": truck.don_gia,
      "GHI CHÚ": truck.ghi_chu || "",
      "TRẠNG THÁI": truck.trang_thai || "Active"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Xe");
    XLSX.writeFile(wb, `Danh_Sach_Xe_Logistics_${new Date().getTime()}.xlsx`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTruck(null);
    setSaveErrors([]);
    setFormData({
      bien_so: '',
      don_vi: '',
      loai_xe: 'Xe thùng',
      tai_xe: '',
      phone: '',
      don_gia: 0,
      ghi_chu: '',
      trang_thai: 'Active'
    });
  };

  const openEdit = (truck: ITruck) => {
    setEditingTruck(truck);
    setFormData(truck);
    setIsModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setTruckToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!truckToDelete) return;
    try {
      await dataService.deleteTruck(truckToDelete);
      fetchData();
      setIsDeleteModalOpen(false);
      setTruckToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa xe.');
    }
  };

  const handleResize = (columnId: string, delta: number) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, width: Math.max(40, col.width + delta) } : col
    ));
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const SortableHeader = ({ column }: { column: ColumnConfig }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: column.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      width: column.width,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : 0,
    };

    const onResizerMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      const startX = e.pageX;
      const startWidth = column.width;
      const onMouseMove = (moveEvent: MouseEvent) => handleResize(column.id, moveEvent.pageX - startX);
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    return (
      <th 
        ref={setNodeRef} 
        style={style} 
        className={`grid-header-cell group bg-slate-900 dark:bg-black text-white relative select-none uppercase tracking-tight text-[10px] font-bold ${column.id === 'stt' ? 'text-center' : column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right pr-6' : 'text-left pl-4'}`}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing w-full h-full flex items-center justify-between px-2">
          <span className="truncate">{column.label}</span>
        </div>
        <div 
          className="resizer absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500 transition-colors z-10" 
          onMouseDown={onResizerMouseDown} 
        />
      </th>
    );
  };

  const renderCell = (truck: ITruck, colId: string, idx: number) => {
    switch (colId) {
      case 'stt':
        return <td className="grid-cell text-center font-mono text-[11px] text-slate-400">{idx + 1}</td>;
      case 'bien_so':
        return <td className="grid-cell font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-mono pl-4">{truck.bien_so}</td>;
      case 'don_vi':
        return <td className="grid-cell font-bold text-slate-900 dark:text-white uppercase tracking-tight text-[11px] truncate pl-4">{truck.don_vi}</td>;
      case 'loai_xe':
        return (
          <td className="grid-cell text-center">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
              truck.loai_xe === 'Xe thùng' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {truck.loai_xe}
            </span>
          </td>
        );
      case 'tai_xe':
        return <td className="grid-cell font-semibold text-slate-700 dark:text-slate-300 pl-4">{truck.tai_xe || '—'}</td>;
      case 'phone':
        return <td className="grid-cell font-mono text-[11px] text-slate-500 dark:text-slate-400 pl-4">{truck.phone || '—'}</td>;
      case 'don_gia':
        return (
          <td className="grid-cell text-right font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 pr-6">
            {(truck.don_gia || 0).toLocaleString()}
          </td>
        );
      case 'ghi_chu':
        return <td className="grid-cell text-slate-500 dark:text-slate-400 pl-4">{truck.ghi_chu || '—'}</td>;
      case 'trang_thai':
        const status = truck.trang_thai || 'Active';
        return (
          <td className="grid-cell text-center">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
              status === 'Active' 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : status === 'Maintenance'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
            }`}>
              {status === 'Active' ? 'Hoạt động' : status === 'Maintenance' ? 'Bảo trì' : 'Ngừng'}
            </span>
          </td>
        );
      case 'action':
        return (
          <td className="grid-cell text-right pr-4">
            <div className="flex justify-end items-center gap-1.5">
              <button 
                onClick={() => openEdit(truck)} 
                className="w-7 h-7 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all shadow-sm"
                title="Chỉnh sửa"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleDelete(truck.bien_so)}
                className="w-7 h-7 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 transition-all shadow-sm"
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-full mx-auto flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-40px)] gap-4">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 px-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-colors">
        <div className="flex items-center gap-8 flex-1">
          <div className="flex items-center gap-3 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Danh sách đội xe
              </h1>
              <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest mt-0.5">Quản lý phương tiện vận hành</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm biển số, tài xế..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium outline-none border-transparent focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
            <select 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight"
            >
              <option value="all">Tất cả đơn vị</option>
              {Array.from(new Set(trucks.map(t => t.don_vi))).filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative">
              <button 
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className={`p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isColumnDropdownOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''}`}
                title="Cấu hình hiển thị"
              >
                <Filter className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {isColumnDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-3"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Hiển thị cột</p>
                    <div className="space-y-1">
                      {columns.map((col) => (
                        <button 
                          key={col.id}
                          onClick={() => toggleColumnVisibility(col.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${col.visible ? 'text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-slate-800' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <span className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${col.visible ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                             {col.label}
                          </span>
                          {col.visible && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={resetColumns}
                        className="w-full py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                      >
                        <RotateCw className="w-3 h-3" /> Khôi phục mặc định
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> NHẬP FILE
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" /> XUẤT FILE
              </button>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-tight shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> THÊM XE MỚI
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-100 dark:border-slate-800 shadow-sm p-2 flex flex-col flex-1 overflow-hidden transition-colors">
        <div className="lg:hidden flex flex-col gap-2 mb-2">
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
        </div>

        <div className="flex-1 overflow-auto border border-zinc-100 dark:border-slate-800 rounded-lg relative custom-scrollbar">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="excel-table min-w-max border-collapse">
              <thead>
                <tr>
                  <SortableContext 
                    items={columns.filter(c => c.visible).map(c => c.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {columns.filter(c => c.visible).map((col) => (
                      <SortableHeader key={col.id} column={col} />
                    ))}
                  </SortableContext>
                </tr>
              </thead>
              <tbody>
                {paginatedTrucks.map((t, idx) => (
                  <tr 
                    key={t.bien_so} 
                    className={`group transition-colors ${
                      t.loai_xe === 'Xe thùng' 
                        ? 'bg-blue-50/40 dark:bg-blue-950/20' 
                        : t.loai_xe === 'Container' 
                          ? 'bg-amber-50/40 dark:bg-amber-950/20' 
                          : ''
                    }`}
                  >
                    {columns.filter(c => c.visible).map((col) => (
                      <React.Fragment key={col.id}>
                        {renderCell(t, col.id, (currentPage - 1) * itemsPerPage + idx)}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
                {paginatedTrucks.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedTrucks.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10">
                    {columns.filter(c => c.visible).map((col) => (
                      <td key={`empty-cell-${col.id}`} style={{ width: col.width }} className="border-r border-b border-zinc-50/50 dark:border-slate-800/30"></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
        </div>

        <div className="bg-zinc-50 dark:bg-slate-950 border-t border-zinc-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] font-bold text-zinc-500 rounded-b-xl transition-colors">
           <div className="flex items-center gap-4">
              <span>Đội xe tìm thấy: <span className="text-zinc-800 dark:text-zinc-200">{filteredTrucks.length}</span></span>
              <span>Đơn vị chủ quản: <span className="text-zinc-800 dark:text-zinc-200">{Array.from(new Set(filteredTrucks.map(t => t.don_vi))).length}</span></span>
           </div>
           
           <div className="flex items-center gap-1.5">
             <button
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
               className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
             >
               <ChevronLeft className="w-4 h-4" />
             </button>
             <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 text-zinc-700 dark:text-zinc-300 font-mono">
               {currentPage} / {Math.max(1, totalPages)}
             </span>
             <button
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages || totalPages === 0}
               className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
             >
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>


      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingTruck ? 'Sửa thông tin xe' : 'Đăng ký xe mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {saveErrors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 space-y-2 relative">
              <button 
                type="button"
                onClick={() => setSaveErrors([])} 
                className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
                title="Tắt thông báo lỗi"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Lỗi:
              </p>
              <ul className="text-[10px] font-medium text-red-500 list-disc list-inside space-y-1">
                {saveErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Biển số *</label>
            <input 
              required
              placeholder="79C-12345"
              value={formData.bien_so}
              onChange={(e) => setFormData({...formData, bien_so: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Đơn vị chủ quản *</label>
            <input 
              required
              placeholder="Cty Phú An"
              value={formData.don_vi}
              onChange={(e) => setFormData({...formData, don_vi: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loại xe</label>
              <select 
                value={formData.loai_xe}
                onChange={(e) => setFormData({...formData, loai_xe: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
              >
                <option value="Xe thùng">Xe thùng</option>
                <option value="Container">Container</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Đơn giá</label>
              <input 
                type="number"
                value={formData.don_gia}
                onChange={(e) => setFormData({...formData, don_gia: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tài xế</label>
              <input 
                value={formData.tai_xe}
                onChange={(e) => setFormData({...formData, tai_xe: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Điện thoại</label>
              <input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ghi chú</label>
            <textarea 
              value={formData.ghi_chu}
              onChange={(e) => setFormData({...formData, ghi_chu: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-medium text-sm text-inherit"
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trạng thái vận hành</label>
            <select 
              value={formData.trang_thai}
              onChange={(e) => setFormData({...formData, trang_thai: e.target.value as any})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            >
              <option value="Active">Đang hoạt động</option>
              <option value="Maintenance">Đang bảo trì</option>
              <option value="Inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-emerald-700 dark:bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/10 active:scale-95 transition-all mt-4"
          >
            Lưu thông tin xe
          </button>
        </form>
      </Modal>
      {/* Import Modal */}
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => {
          setIsImportModalOpen(false);
          setImportPreview([]);
        }} 
        title="Nhập Danh Sách Xe từ Excel"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black text-blue-900 uppercase">Mẫu Nhập Liệu Xe</p>
                <p className="text-[10px] font-medium text-blue-600/70">Sử dụng mẫu này để quản lý dữ liệu đội xe Logistics</p>
              </div>
            </div>
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              <Download className="w-3.5 h-3.5" /> Tải Mẫu
            </button>
          </div>

          <div className="relative border-4 border-dashed border-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-100 transition-all bg-zinc-50/30">
            <Upload className="w-12 h-12 text-[#0f4c75] opacity-30" />
            <div className="space-y-1">
              <p className="font-black text-[#0f4c75]">Chọn tệp Excel danh sách xe</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Hỗ trợ .xlsx, .xls</p>
            </div>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {importErrors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 space-y-2 relative">
              <button 
                onClick={() => setImportErrors([])} 
                className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
                title="Tắt thông báo"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Phát hiện {importErrors.length} lỗi định dạng:
              </p>
              <ul className="text-[10px] font-medium text-red-500 list-disc list-inside space-y-1">
                {importErrors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dữ liệu hợp lệ ({importPreview.length} dòng)</h4>
                <button onClick={() => setImportPreview([])} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Xóa tất cả</button>
              </div>
              <div className="max-h-60 overflow-y-auto border border-zinc-100 rounded-2xl custom-scrollbar shadow-inner bg-zinc-50/50">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-white sticky top-0 border-b border-zinc-100">
                    <tr>
                      <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px]">Biển số</th>
                      <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px]">Chủ xe</th>
                      <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px] text-right">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100/50">
                    {importPreview.map((row, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="px-4 py-2.5 font-black text-zinc-900 font-mono tracking-tighter">{row.bien_so}</td>
                        <td className="px-4 py-2.5 font-bold text-zinc-500 uppercase truncate max-w-[150px]">{row.don_vi}</td>
                        <td className="px-4 py-2.5 font-mono font-black text-right text-[#1b9aaa] bg-teal-50/30">
                          {row.don_gia.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportPreview([]);
                  }}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 hover:text-zinc-600 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmImport}
                  className="flex-[2] py-4 bg-[#0f4c75] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-[#0a3a5a] transition-all"
                >
                  Xác nhận Nhập {importPreview.length} xe
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa xe"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loại bỏ phương tiện?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bạn có chắc chắn muốn xóa xe <span className="font-bold text-slate-900 dark:text-slate-200 font-mono">{truckToDelete}</span> khỏi hệ thống? 
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
      {isModalOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div className="bg-zinc-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-slide-up">
            <Info className="w-4 h-4 text-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-widest">Nhấn "Hủy bỏ" hoặc phím ESC để thoát</p>
          </div>
        </div>
      )}
    </div>
  );
}
