import React from 'react';
import { Modal } from '../Shared/Modal';
import { WeighingTicket } from '../../types';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTicket: WeighingTicket | null;
  formData: Partial<WeighingTicket>;
  setFormData: (data: Partial<WeighingTicket>) => void;
  onSave: (e: React.FormEvent) => void;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  editingTicket,
  formData,
  setFormData,
  onSave
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingTicket ? 'Sửa Phiếu Cân' : 'Thêm Phiếu Cân Mới'}
    >
      <form onSubmit={onSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Số phiếu & Biển số */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Số phiếu *</label>
            <input 
              required
              value={formData.so_phieu}
              onChange={(e) => setFormData({...formData, so_phieu: e.target.value})}
              placeholder="VD: PC001"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Biển số xe *</label>
            <input 
              required
              value={formData.bien_so_xe}
              onChange={(e) => setFormData({...formData, bien_so_xe: e.target.value.toUpperCase()})}
              placeholder="77C-12345"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit uppercase"
            />
          </div>
        </div>

        {/* Khách Hàng (Đơn vị) & Kho Hàng (Bãi Dăm) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Khách hàng / Đơn vị</label>
            <input 
              value={formData.don_vi}
              onChange={(e) => setFormData({...formData, don_vi: e.target.value})}
              placeholder="VD: Sao Vàng"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kho Hàng</label>
            <input 
              value={formData.bai_dam || ''}
              onChange={(e) => setFormData({...formData, bai_dam: e.target.value})}
              placeholder="VD: Kho A"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
        </div>

        {/* Phân loại & Ca */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phân loại hàng / xe</label>
            <select 
              value={formData.loai_xe}
              onChange={(e) => setFormData({...formData, loai_xe: e.target.value})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            >
              <option value="Dăm gỗ">Dăm gỗ</option>
              <option value="Nông sản">Nông sản</option>
              <option value="Xe thùng">Xe thùng</option>
              <option value="Xe container">Xe container</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ca làm việc</label>
            <select 
              value={formData.ca}
              onChange={(e) => setFormData({...formData, ca: e.target.value})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            >
              <option value="Ca 1">Ca 1 (06:00 - 12:00)</option>
              <option value="Ca 2">Ca 2 (12:00 - 18:00)</option>
              <option value="Ca 3">Ca 3 (18:00 - 24:00)</option>
              <option value="Ca 4">Ca 4 (00:00 - 06:00)</option>
            </select>
          </div>
        </div>

        {/* Chi tiết cân */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">TL Cân Lần 1 (T)</label>
            <input 
              type="number"
              step="0.001"
              value={formData.tl_can_lan_1 || ''}
              onChange={(e) => setFormData({...formData, tl_can_lan_1: e.target.value ? Number(e.target.value) : ''})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-mono font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">TL Cân Lần 2 (T)</label>
            <input 
              type="number"
              step="0.001"
              value={formData.tl_can_lan_2 || ''}
              onChange={(e) => setFormData({...formData, tl_can_lan_2: e.target.value ? Number(e.target.value) : ''})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-mono font-bold text-sm text-inherit"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trừ Bì (T)</label>
            <input 
              type="number"
              step="0.001"
              value={formData.tru_bi || ''}
              onChange={(e) => setFormData({...formData, tru_bi: e.target.value ? Number(e.target.value) : ''})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-mono font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Trọng lượng Hàng (Net) *</label>
            <input 
              type="number"
              step="0.001"
              required
              value={formData.tl_hang_tan}
              onChange={(e) => setFormData({...formData, tl_hang_tan: Number(e.target.value)})}
              className="w-full px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl focus:border-emerald-500 focus:outline-none font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 transition-colors"
            />
          </div>
        </div>

        {/* Thời gian cân */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ngày Cân 1</label>
            <input 
              type="date"
              value={formData.ngay_can_1 || ''}
              onChange={(e) => setFormData({...formData, ngay_can_1: e.target.value})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Giờ Cân 1</label>
            <input 
              type="time"
              value={formData.gio_can_1 || ''}
              onChange={(e) => setFormData({...formData, gio_can_1: e.target.value})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ngày Cân 2 *</label>
            <input 
              required
              type="date"
              value={formData.ngay_can_2 || formData.ngay || ''}
              onChange={(e) => setFormData({
                ...formData, 
                ngay_can_2: e.target.value,
                ngay: e.target.value // backward comp
              })}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Giờ Cân 2</label>
            <input 
              type="time"
              value={formData.gio_can_2 || ''}
              onChange={(e) => setFormData({...formData, gio_can_2: e.target.value})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
        </div>

        {/* Khác */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hầm Số</label>
            <select 
              value={formData.ham_tau_assign}
              onChange={(e) => setFormData({...formData, ham_tau_assign: Number(e.target.value)})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            >
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>Hầm {n}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trạng thái</label>
            <select 
              value={formData.trang_thai}
              onChange={(e) => setFormData({...formData, trang_thai: e.target.value as any})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            >
              <option value="pending">Chờ kiểm</option>
              <option value="checked">Đã kiểm</option>
              <option value="cancelled">Hủy bỏ</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ghi Chú</label>
            <input 
              value={formData.ghi_chu || ''}
              onChange={(e) => setFormData({...formData, ghi_chu: e.target.value})}
              placeholder="Ghi chú phiếu"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nhân viên cân</label>
            <input 
              value={formData.nhan_vien_can || ''}
              onChange={(e) => setFormData({...formData, nhan_vien_can: e.target.value})}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-sm text-inherit"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4 sticky bottom-0"
        >
          {editingTicket ? 'Cập Nhật Phiếu' : 'Lưu Phiếu Mới'}
        </button>
      </form>
    </Modal>
  );
};
