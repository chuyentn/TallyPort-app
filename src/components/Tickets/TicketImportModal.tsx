import React from 'react';
import { Modal } from '../Shared/Modal';
import { FileSpreadsheet, Upload, Download, X, AlertTriangle } from 'lucide-react';
import { formatNumber } from '../../lib/formatters';
import { WeighingTicket } from '../../types';

interface TicketImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importErrors: string[];
  setImportErrors: (errors: string[]) => void;
  importPreview: any[];
  setImportPreview: (preview: any[]) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadTemplate: () => void;
  confirmImport: () => void;
}

export const TicketImportModal: React.FC<TicketImportModalProps> = ({
  isOpen,
  onClose,
  importErrors,
  setImportErrors,
  importPreview,
  setImportPreview,
  handleFileUpload,
  downloadTemplate,
  confirmImport
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nhập Phiếu Cân từ Excel"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-blue-900 uppercase">Mẫu Nhập Liệu Chuẩn</p>
              <p className="text-[10px] font-medium text-blue-600/70">Vui lòng sử dụng mẫu này để đảm bảo tính toán chính xác</p>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <Download className="w-3.5 h-3.5" /> Tải Mẫu
          </button>
        </div>

        <div className="relative border-4 border-dashed border-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-teal-100 highlight-within:border-teal-500 transition-all bg-zinc-50/30">
          <Upload className="w-12 h-12 text-[#1b9aaa] opacity-30" />
          <div className="space-y-1">
            <p className="font-black text-[#0f4c75]">Chọn tệp Excel để tải lên</p>
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
              title="Tắt thông báo lỗi"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Phát hiện {importErrors.length} lỗi định dạng:
            </p>
            <ul className="text-[10px] font-medium text-red-500 list-disc list-inside space-y-1">
              {importErrors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
              {importErrors.length > 5 && <li className="font-black">...và {importErrors.length - 5} lỗi khác</li>}
            </ul>
          </div>
        )}

        {importPreview.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dữ liệu hợp lệ ({importPreview.length} dòng)</h4>
              <button 
                onClick={() => {
                  setImportPreview([]);
                  setImportErrors([]);
                }} 
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto border border-zinc-100 rounded-2xl custom-scrollbar shadow-inner bg-zinc-50/50">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white sticky top-0 border-b border-zinc-100">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px]">Số phiếu</th>
                    <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px]">Biển số</th>
                    <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px]">Tiêu chuẩn</th>
                    <th className="px-4 py-3 font-black uppercase text-zinc-400 text-[9px] text-right">Tấn (Net)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/50">
                  {importPreview.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-white transition-colors">
                      <td className="px-4 py-2.5 font-bold text-zinc-500">{row.so_phieu}</td>
                      <td className="px-4 py-2.5 font-black text-zinc-900 font-mono tracking-tighter">{row.bien_so_xe}</td>
                      <td className="px-4 py-2.5">
                         <span className="bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">{row.ca}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-black text-right text-[#1b9aaa] bg-teal-50/30">{formatNumber(row.tl_hang_tan, 3, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-100 text-zinc-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 hover:text-zinc-600 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmImport}
                className="flex-[2] py-4 bg-[#1b9aaa] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-100 hover:bg-[#157a88] transition-all"
              >
                Xác nhận Nhập {importPreview.length} phiếu
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
