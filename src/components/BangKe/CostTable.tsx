import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Download, Printer, Filter, CreditCard, ChevronDown, CheckCircle2, AlertCircle, Clock, Calendar, Truck, Building2 } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { WeighingTicket, Truck as ITruck } from '../../types';

import { formatNumber } from '../../lib/formatters';

interface GroupedData {
  company: string;
  tickets: WeighingTicket[];
  totalTonnage: number;
  totalTrips: number;
  totalAmount: number;
  status: 'Chưa thanh toán' | 'Đã đối chiếu' | 'Đã thanh toán';
}

export default function CostTable() {
  const [tickets, setTickets] = useState<WeighingTicket[]>([]);
  const [trucks, setTrucks] = useState<ITruck[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedHold, setSelectedHold] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 5000); // REFRESH 5S - REALTIME
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [t, tr] = await Promise.all([
        dataService.getBangKe(),
        dataService.getTrucks()
      ]);
      setTickets(t);
      setTrucks(tr);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const groupedData = useMemo(() => {
    // Only count tickets that are checked
    const checkedTickets = tickets.filter(t => t.trang_thai === 'checked' || t.tally_checked);
    
    const groups: Record<string, GroupedData> = {};

    checkedTickets.forEach(t => {
      const company = t.don_vi || 'Khác';
      if (!groups[company]) {
        groups[company] = {
          company,
          tickets: [],
          totalTonnage: 0,
          totalTrips: 0,
          totalAmount: 0,
          status: 'Chưa thanh toán'
        };
      }
      
      const price = t.don_gia || 0;
      const tonnageToCharge = t.tl_hang_tan;
      const amount = t.thanh_tien || (tonnageToCharge * price);
      
      groups[company].tickets.push(t);
      groups[company].totalTonnage += tonnageToCharge;
      groups[company].totalTrips += 1;
      groups[company].totalAmount += amount;
    });

    return Object.values(groups).filter(g => 
      selectedCompany === 'all' || g.company === selectedCompany
    );
  }, [tickets, trucks, selectedCompany]);

  const totalOverall = useMemo(() => {
    return groupedData.reduce((acc, g) => ({
      tonnage: acc.tonnage + g.totalTonnage,
      trips: acc.trips + g.totalTrips,
      amount: acc.amount + g.totalAmount
    }), { tonnage: 0, trips: 0, amount: 0 });
  }, [groupedData]);

  const handlePrint = () => {
    window.print();
  };

  const [columnWidths, setColumnWidths] = useState({
    date: 100,
    ticket: 120,
    plate: 150,
    tons: 100,
    amount: 150
  });

  const handleResize = (column: keyof typeof columnWidths, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(50, prev[column] + delta)
    }));
  };

  const Resizer = ({ column }: { column: keyof typeof columnWidths }) => {
    const onMouseDown = (e: React.MouseEvent) => {
      const startX = e.pageX;
      const onMouseMove = (moveEvent: MouseEvent) => handleResize(column, moveEvent.pageX - startX);
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    return <div className="resizer" onMouseDown={onMouseDown} />;
  };

  const [columnVisibility, setColumnVisibility] = useState({
    date: true,
    ticket: true,
    plate: true,
    tons: true,
    amount: true
  });

  const toggleColumn = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  return (
    <div className="max-w-full mx-auto flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-40px)] gap-4 print:h-auto print:block transition-all duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 px-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden shrink-0 transition-colors">
        <div className="flex items-center gap-8 flex-1">
          <div className="flex items-center gap-3 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Chi phí Logistics
              </h1>
              <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest mt-0.5">Đối soát và quản lý thanh toán</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 border-r border-slate-200 dark:border-slate-800 h-6 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Bộ lọc
            </div>
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 focus:outline-none border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-tight flex-1"
            >
              <option value="all">TẤT CẢ ĐƠN VỊ</option>
              {Array.from(new Set(tickets.map(t => t.don_vi))).filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-800">
            <button 
              onClick={handlePrint}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
              title="In báo cáo"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
              title="Xuất dữ liệu"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className={`p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${isColumnDropdownOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''}`}
                title="Cấu hình hiển thị"
              >
                <Filter className="w-4 h-4" />
              </button>
              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Hiển thị cột</p>
                  <div className="space-y-1">
                    {Object.entries(columnVisibility).map(([key, isVisible]) => (
                      <button 
                        key={key}
                        onClick={() => toggleColumn(key as keyof typeof columnVisibility)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isVisible ? 'text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-slate-800' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <span className="capitalize">{key === 'tons' ? 'Tấn khô' : key === 'plate' ? 'Biển số' : key === 'ticket' ? 'Số phiếu' : key === 'amount' ? 'Thành tiền' : 'Ngày/Ca'}</span>
                        {isVisible && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-tight shadow-md transition-all">
            <CreditCard className="w-3.5 h-3.5" /> KẾT CHUYỂN
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:grid-cols-3 shrink-0">
        <div className="bg-slate-950 dark:bg-slate-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group transition-colors">
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Tổng Thành Tiền (Qui Chuẩn)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono tracking-tight leading-none">{formatNumber(totalOverall.amount)}</p>
            <span className="text-[10px] font-bold opacity-30">VNĐ</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[9px] bg-white/10 w-fit px-2.5 py-1 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold tracking-tight">Dữ liệu từ {totalOverall.trips} chuyến xe</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tổng Trọng Lượng Khô</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight leading-none">{formatNumber(totalOverall.tonnage)}</p>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tấn</span>
          </div>
          <p className="mt-4 text-[10px] font-semibold text-emerald-600 leading-none">Giá TB: {formatNumber(totalOverall.amount / (totalOverall.tonnage || 1))} đ/tấn</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm opacity-50 grayscale transition-colors">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đã Quyết toán</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-slate-300 tracking-tight leading-none">0</p>
            <span className="text-[10px] font-bold text-slate-300 uppercase">đ</span>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-semibold leading-none">Chưa có giao dịch thanh toán</p>
        </div>
      </div>

      {/* Detailed Groups */}
      <div className="flex-1 overflow-auto space-y-4 custom-scrollbar print:overflow-visible">
        {groupedData.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-zinc-100 dark:border-slate-800 transition-colors">
            <CreditCard className="w-10 h-10 text-zinc-100 dark:text-slate-800 mx-auto mb-2" />
            <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Không có dữ liệu đối soát phù hợp</p>
          </div>
        )}

        {groupedData.map((group) => (
          <div key={group.company} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-zinc-100 dark:border-slate-800 overflow-hidden break-inside-avoid transition-colors">
            <div className="p-3 bg-zinc-50/50 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-[#0f4c75] dark:text-emerald-500">
                   <Building2 className="w-4 h-4" />
                </div>
                <div>
                                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{group.totalTrips} Chuyến • {formatNumber(group.totalTonnage, 2, 2)} Tấn Khô</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight leading-none mb-0.5 opacity-50">Tạm tính</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white font-mono leading-none">{formatNumber(group.totalAmount)} đ</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                  group.status === 'Đã thanh toán' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                }`}>
                  {group.status}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="excel-table min-w-[800px]">
                <thead>
                  <tr>
                    {columnVisibility.date && (
                      <th style={{ width: columnWidths.date }} className="grid-header-cell group bg-slate-900 text-white uppercase text-[10px] tracking-tight">
                        Ngày/Ca <Resizer column="date" />
                      </th>
                    )}
                    {columnVisibility.ticket && (
                      <th style={{ width: columnWidths.ticket }} className="grid-header-cell group bg-slate-900 text-white uppercase text-[10px] tracking-tight">
                        Số phiếu <Resizer column="ticket" />
                      </th>
                    )}
                    {columnVisibility.plate && (
                      <th style={{ width: columnWidths.plate }} className="grid-header-cell group bg-slate-900 text-white uppercase text-[10px] tracking-tight">
                        Biển số <Resizer column="plate" />
                      </th>
                    )}
                    {columnVisibility.tons && (
                      <th style={{ width: columnWidths.tons }} className="grid-header-cell group text-right bg-slate-900 text-white uppercase text-[10px] tracking-tight">
                        Tấn Khô <Resizer column="tons" />
                      </th>
                    )}
                    {columnVisibility.amount && (
                      <th style={{ width: columnWidths.amount }} className="grid-header-cell group text-right pr-6 bg-slate-900 text-white uppercase text-[10px] tracking-tight">
                        Thành tiền <Resizer column="amount" />
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="dark:bg-slate-900/50">
                  {group.tickets.map((t) => {
                    const price = trucks.find(tr => tr.bien_so === t.bien_so_xe)?.don_gia || 0;
                    const tons = t.tl_hang_tan;
                    return (
                      <tr key={t.id} className="group">
                        {columnVisibility.date && (
                          <td className="grid-cell pl-6">
                            <span className="font-bold text-slate-900 dark:text-zinc-200">{t.ngay.split('-').reverse().slice(0,2).join('/')}</span>
                            <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 tracking-tight font-medium uppercase">{t.ca}</span>
                          </td>
                        )}
                        {columnVisibility.ticket && <td className="grid-cell font-mono text-slate-400 dark:text-slate-500 pl-4">#{t.so_phieu}</td>}
                        {columnVisibility.plate && <td className="grid-cell font-bold text-slate-900 dark:text-white font-mono pl-4">{t.bien_so_xe}</td>}
                        {columnVisibility.tons && <td className="grid-cell text-right font-mono font-bold text-slate-700 dark:text-slate-300 pr-4">{formatNumber(tons, 2, 2)}</td>}
                        {columnVisibility.amount && (
                          <td className="grid-cell text-right pr-6 font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumber(tons * price)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {group.tickets.length < 5 && Array.from({ length: 5 - group.tickets.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-8">
                       {Object.entries(columnVisibility).filter(([_, v]) => v).map(([k]) => (
                          <td key={`empty-cell-${k}`} className="border-r border-b border-slate-50/50 dark:border-slate-800/30"></td>
                       ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                   <tr className="bg-slate-50/50 dark:bg-slate-950 transition-colors">
                      <td colSpan={Object.values(columnVisibility).filter(v => v).length - 2} className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cộng bảng kê {group.company}</td>
                      <td className="px-5 py-3 text-right font-bold font-mono text-slate-900 dark:text-white">{formatNumber(group.totalTonnage, 2, 2)} T</td>
                      <td className="px-5 py-3 text-right pr-6 font-bold font-mono text-emerald-600 dark:text-emerald-400 underline decoration-double underline-offset-4 decoration-current">{formatNumber(group.totalAmount)} đ</td>
                   </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Print Footer Details */}
      <div className="hidden print:block mt-12 px-8">
        <div className="grid grid-cols-3 gap-8 text-center text-sm font-bold">
          <div>
            <p className="mb-20">NGƯỜI LẬP BIỂU</p>
            <p className="uppercase">{MOCK_USERS.find(u => u.role === 'admin')?.full_name}</p>
          </div>
          <div>
            <p className="mb-20">ĐẠI DIỆN CẢNG</p>
            <p className="uppercase">XÁC NHẬN</p>
          </div>
          <div>
            <p className="mb-20">ĐẠI DIỆN ĐƠN VỊ</p>
            <p className="uppercase">KÝ TÊN</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_USERS = [
  { id: '1', username: 'admin', full_name: 'Quản trị viên', role: 'admin', is_active: true },
];
