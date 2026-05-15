import React from 'react';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { WeighingTicket } from '../../types';
import { formatNumber } from '../../lib/formatters';
import { User } from '../../types';

interface TicketTableProps {
  tickets: WeighingTicket[];
  columnVisibility: Record<string, boolean>;
  columnWidths: Record<string, number>;
  sortConfig: { key: keyof WeighingTicket | null; direction: 'asc' | 'desc' };
  requestSort: (key: keyof WeighingTicket) => void;
  Resizer: React.FC<{ column: string }>;
  user: User | null;
  openEdit: (ticket: WeighingTicket) => void;
  handleDelete: (ticket: WeighingTicket) => void;
  handleApprove: (ticket: WeighingTicket) => void;
}

export function TicketTable({
  tickets,
  columnVisibility,
  columnWidths,
  sortConfig,
  requestSort,
  Resizer,
  user,
  openEdit,
  handleDelete,
  handleApprove
}: TicketTableProps) {
  return (
    <div className="flex-1 overflow-auto border border-zinc-100 dark:border-slate-800 rounded-lg relative custom-scrollbar mt-2">
      <table className="excel-table min-w-max">
            <thead>
              <tr>
                {columnVisibility.stt && (
                  <th style={{ width: columnWidths.stt }} className="grid-header-cell group text-center bg-slate-900 dark:bg-black text-white">
                    STT <Resizer column="stt" />
                  </th>
                )}
                {columnVisibility.so_phieu && (
                  <th style={{ width: columnWidths.so_phieu }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('so_phieu')}>
                    <div className="flex items-center justify-between">
                      SO_PHIEU {sortConfig.key === 'so_phieu' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="so_phieu" />
                  </th>
                )}
                {columnVisibility.bien_so && (
                  <th style={{ width: columnWidths.bien_so }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('bien_so_xe')}>
                    <div className="flex items-center justify-between">
                      BIEN_SO {sortConfig.key === 'bien_so_xe' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="bien_so" />
                  </th>
                )}
                {columnVisibility.khach_hang && (
                  <th style={{ width: columnWidths.khach_hang }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('don_vi')}>
                    <div className="flex items-center justify-between">
                      KHACH_HANG {sortConfig.key === 'don_vi' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="khach_hang" />
                  </th>
                )}
                {columnVisibility.loai_hang && (
                  <th style={{ width: columnWidths.loai_hang }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('loai_xe')}>
                    <div className="flex items-center justify-between">
                      LOAI_HANG {sortConfig.key === 'loai_xe' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="loai_hang" />
                  </th>
                )}
                {columnVisibility.tl_can_lan_1 && (
                  <th style={{ width: columnWidths.tl_can_lan_1 }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('tl_can_lan_1')}>
                    <div className="flex items-center justify-between">
                      TL_CAN_LAN_1 {sortConfig.key === 'tl_can_lan_1' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="tl_can_lan_1" />
                  </th>
                )}
                {columnVisibility.tl_can_lan_2 && (
                  <th style={{ width: columnWidths.tl_can_lan_2 }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('tl_can_lan_2')}>
                    <div className="flex items-center justify-between">
                      TL_CAN_LAN_2 {sortConfig.key === 'tl_can_lan_2' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="tl_can_lan_2" />
                  </th>
                )}
                {columnVisibility.tru_bi && (
                  <th style={{ width: columnWidths.tru_bi }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('tru_bi')}>
                    <div className="flex items-center justify-between">
                      TRU_BI {sortConfig.key === 'tru_bi' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="tru_bi" />
                  </th>
                )}
                {columnVisibility.tl_hang && (
                  <th style={{ width: columnWidths.tl_hang }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('tl_hang_tan')}>
                    <div className="flex items-center justify-between">
                      TL_HANG {sortConfig.key === 'tl_hang_tan' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="tl_hang" />
                  </th>
                )}
                {columnVisibility.ngay_can_1 && (
                  <th style={{ width: columnWidths.ngay_can_1 }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('ngay_can_1')}>
                    <div className="flex items-center justify-between">
                      NGAY_CAN_1 {sortConfig.key === 'ngay_can_1' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="ngay_can_1" />
                  </th>
                )}
                {columnVisibility.gio_can_1 && (
                  <th style={{ width: columnWidths.gio_can_1 }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('gio_can_1')}>
                    <div className="flex items-center justify-between">
                      GIO_CAN_1 {sortConfig.key === 'gio_can_1' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="gio_can_1" />
                  </th>
                )}
                {columnVisibility.ngay_can_2 && (
                  <th style={{ width: columnWidths.ngay_can_2 }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('ngay_can_2')}>
                    <div className="flex items-center justify-between">
                      NGAY_CAN_2 {sortConfig.key === 'ngay_can_2' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="ngay_can_2" />
                  </th>
                )}
                {columnVisibility.gio_can_2 && (
                  <th style={{ width: columnWidths.gio_can_2 }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('gio_can_2')}>
                    <div className="flex items-center justify-between">
                      GIO_CAN_2 {sortConfig.key === 'gio_can_2' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="gio_can_2" />
                  </th>
                )}
                {columnVisibility.kho_hang && (
                  <th style={{ width: columnWidths.kho_hang }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('bai_dam')}>
                    <div className="flex items-center justify-between">
                      KHO_HANG {sortConfig.key === 'bai_dam' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="kho_hang" />
                  </th>
                )}
                {columnVisibility.ghi_chu && (
                  <th style={{ width: columnWidths.ghi_chu }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('ghi_chu')}>
                    <div className="flex items-center justify-between">
                      GHI_CHU {sortConfig.key === 'ghi_chu' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="ghi_chu" />
                  </th>
                )}
                {columnVisibility.ham_so && (
                  <th style={{ width: columnWidths.ham_so }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('ham_tau_assign')}>
                    <div className="flex items-center justify-between">
                      HAM_SO {sortConfig.key === 'ham_tau_assign' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="ham_so" />
                  </th>
                )}
                {columnVisibility.trang_thai && (
                  <th style={{ width: columnWidths.trang_thai }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('trang_thai')}>
                    <div className="flex items-center justify-between">
                      TRANG_THAI {sortConfig.key === 'trang_thai' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="trang_thai" />
                  </th>
                )}
                {columnVisibility.ten_nv && (
                  <th style={{ width: columnWidths.ten_nv }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('nhan_vien_can')}>
                    <div className="flex items-center justify-between">
                      TEN_NV {sortConfig.key === 'nhan_vien_can' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="ten_nv" />
                  </th>
                )}
                {columnVisibility.tai_khoan && (
                  <th style={{ width: columnWidths.tai_khoan }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('tai_khoan')}>
                    <div className="flex items-center justify-between">
                      TAI_KHOAN {sortConfig.key === 'tai_khoan' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="tai_khoan" />
                  </th>
                )}
                {columnVisibility.thoi_gian && (
                  <th style={{ width: columnWidths.thoi_gian }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('thoi_gian')}>
                    <div className="flex items-center justify-between">
                      THOI_GIAN {sortConfig.key === 'thoi_gian' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="thoi_gian" />
                  </th>
                )}
                {columnVisibility.ca && (
                  <th style={{ width: columnWidths.ca }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('ca')}>
                    <div className="flex items-center justify-between">
                      CA {sortConfig.key === 'ca' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="ca" />
                  </th>
                )}
                {columnVisibility.tally_note && (
                  <th style={{ width: columnWidths.tally_note }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('tally_note')}>
                    <div className="flex items-center justify-between">
                      TALLY_NOTE {sortConfig.key === 'tally_note' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="tally_note" />
                  </th>
                )}
                {columnVisibility.minh_chung && (
                  <th style={{ width: columnWidths.minh_chung }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('minh_chung')}>
                    <div className="flex items-center justify-between">
                      MINH_CHUNG {sortConfig.key === 'minh_chung' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="minh_chung" />
                  </th>
                )}
                {columnVisibility.checked_by && (
                  <th style={{ width: columnWidths.checked_by }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('checked_by')}>
                    <div className="flex items-center justify-between">
                      CHECKED_BY {sortConfig.key === 'checked_by' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="checked_by" />
                  </th>
                )}
                {columnVisibility.checked_time && (
                  <th style={{ width: columnWidths.checked_time }} className="grid-header-cell group bg-slate-900 dark:bg-black text-white cursor-pointer hover:bg-slate-800" onClick={() => requestSort('checked_time')}>
                    <div className="flex items-center justify-between">
                      CHECKED_TIME {sortConfig.key === 'checked_time' && <span className="ml-1 text-[10px] opacity-50">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                    <Resizer column="checked_time" />
                  </th>
                )}
                {columnVisibility.action && (
                  <th style={{ width: 150 }} className="grid-header-cell group text-right pr-6 bg-slate-900 dark:bg-black text-white">
                    Hành động <Resizer column="action" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, idx) => (
                <tr key={t.id} className="group">
                  {columnVisibility.stt && <td className="grid-cell text-center font-mono opacity-50">{idx + 1}</td>}
                  {columnVisibility.so_phieu && <td className="grid-cell font-mono">{t.so_phieu}</td>}
                  {columnVisibility.bien_so && (
                    <td className="grid-cell font-black text-inherit font-mono">
                      <div className="flex flex-col">
                        {t.bien_so_xe}
                      </div>
                    </td>
                  )}
                  {columnVisibility.khach_hang && (
                    <td className="grid-cell text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 truncate">
                      {t.don_vi || '—'}
                    </td>
                  )}
                  {columnVisibility.loai_hang && (
                    <td className="grid-cell uppercase">
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black mr-1.5 ${t.loai_xe === 'Xe thùng' ? 'bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-zinc-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                        {t.loai_xe}
                      </span>
                    </td>
                  )}
                  {columnVisibility.tl_can_lan_1 && <td className="grid-cell text-right font-mono">{formatNumber(Number(t.tl_can_lan_1) || 0, 2, 2)}</td>}
                  {columnVisibility.tl_can_lan_2 && <td className="grid-cell text-right font-mono">{formatNumber(Number(t.tl_can_lan_2) || 0, 2, 2)}</td>}
                  {columnVisibility.tru_bi && <td className="grid-cell text-right font-mono">{formatNumber(Number(t.tru_bi) || 0, 2, 2)}</td>}
                  {columnVisibility.tl_hang && <td className="grid-cell text-right font-mono text-zinc-500 dark:text-zinc-400">{formatNumber(t.tl_hang_tan || 0, 2, 2)}</td>}
                  {columnVisibility.ngay_can_1 && <td className="grid-cell">{t.ngay_can_1}</td>}
                  {columnVisibility.gio_can_1 && <td className="grid-cell font-mono">{t.gio_can_1}</td>}
                  {columnVisibility.ngay_can_2 && <td className="grid-cell">{t.ngay_can_2 || t.ngay}</td>}
                  {columnVisibility.gio_can_2 && <td className="grid-cell font-mono">{t.gio_can_2}</td>}
                  {columnVisibility.kho_hang && <td className="grid-cell truncate">{t.bai_dam}</td>}
                  {columnVisibility.ghi_chu && <td className="grid-cell truncate">{t.ghi_chu}</td>}
                  {columnVisibility.ham_so && (
                    <td className="grid-cell text-center">
                      <span className="bg-slate-900 dark:bg-emerald-600 text-white px-2 py-0.5 rounded font-black font-mono">
                        {t.ham_tau_assign}
                      </span>
                    </td>
                  )}
                  {columnVisibility.trang_thai && (
                    <td className="grid-cell">
                      <span className={`text-[8.5px] font-black uppercase tracking-widest ${t.tally_checked ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {t.trang_thai} {t.tally_checked ? '(Verified)' : ''}
                      </span>
                    </td>
                  )}
                  {columnVisibility.ten_nv && <td className="grid-cell truncate">{t.nhan_vien_can}</td>}
                  {columnVisibility.tai_khoan && <td className="grid-cell truncate">{t.tai_khoan}</td>}
                  {columnVisibility.thoi_gian && <td className="grid-cell font-mono">{t.thoi_gian}</td>}
                  {columnVisibility.ca && (
                    <td className="grid-cell">
                      {(t.ca && typeof t.ca === 'string' && /^Ca [1234]$/i.test(t.ca)) 
                        ? t.ca.toUpperCase() 
                        : (() => {
                            const d = t.thoi_gian ? new Date(t.thoi_gian) : new Date();
                            const hour = (!isNaN(d.getTime()) ? d : new Date()).getHours();
                            if (hour >= 6 && hour < 12) return 'CA 1';
                            if (hour >= 12 && hour < 18) return 'CA 2';
                            if (hour >= 18 && hour < 24) return 'CA 3';
                            return 'CA 4';
                          })()}
                    </td>
                  )}
                  {columnVisibility.tally_note && <td className="grid-cell truncate">{t.tally_note}</td>}
                  {columnVisibility.minh_chung && <td className="grid-cell truncate">{t.minh_chung}</td>}
                  {columnVisibility.checked_by && <td className="grid-cell truncate">{t.checked_by}</td>}
                  {columnVisibility.checked_time && <td className="grid-cell font-mono">{t.checked_time}</td>}
                  
                  {columnVisibility.action && (
                    <td className="grid-cell text-right p-0">
                      <div className="flex justify-end items-center h-full">
                        {t.trang_thai !== 'đã duyệt' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleApprove(t); }} 
                            className="h-full px-4 border-l border-zinc-50 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all group/btn flex items-center justify-center gap-2"
                            title="Duyệt sang Tally"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Duyệt</span>
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEdit(t); }} 
                          className="h-full px-4 border-l border-zinc-50 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(t); }} 
                            className="h-full px-4 border-l border-zinc-50 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {tickets.length < 20 && Array.from({ length: 20 - tickets.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-10">
                  {Object.entries(columnVisibility).filter(([_, v]) => v).map(([k]) => (
                    <td key={`empty-cell-${k}`} className="border-r border-b border-zinc-50/50 dark:border-slate-800/30"></td>
                  ))}
                  <td className="border-b border-zinc-50/50 dark:border-slate-800/30"></td>
                </tr>
              ))}
            </tbody>
          </table>
    </div>
  );
}
