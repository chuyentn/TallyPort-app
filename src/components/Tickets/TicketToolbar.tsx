import React from 'react';
import { Search, RotateCw, Download, Filter, FileSpreadsheet, Plus, X, FileText, CheckCircle2 } from 'lucide-react';

interface TicketToolbarProps {
  search: string;
  setSearch: (s: string) => void;
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;
  fetchTickets: () => void;
  loading: boolean;
  exportExcel: () => void;
  isColumnDropdownOpen: boolean;
  setIsColumnDropdownOpen: (open: boolean) => void;
  columnVisibility: Record<string, boolean>;
  toggleColumn: (col: string) => void;
  labels: Record<string, string>;
  totalRows: number;
  doneRows: number;
  openImportModal: () => void;
  openAddModal: () => void;
}

export function TicketToolbar({
  search, setSearch, startDate, setStartDate, endDate, setEndDate,
  fetchTickets, loading, exportExcel, isColumnDropdownOpen, setIsColumnDropdownOpen,
  columnVisibility, toggleColumn, labels, totalRows, doneRows,
  openImportModal, openAddModal
}: TicketToolbarProps) {
  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-3 px-6 rounded-xl border border-zinc-100 dark:border-slate-800 shadow-sm shrink-0 transition-colors">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-inherit tracking-tighter uppercase leading-none">
              Phiếu Cân (Grid)
            </h1>
            <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-[8px] mt-0.5">Snow Camellia V.52 • Data Explorer</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 flex-1 max-w-3xl relative group">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Anything (Excel Mode)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-lg text-[11px] font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all text-inherit"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-slate-950 border border-zinc-100 dark:border-slate-800 rounded-lg px-2 h-[34px]">
            <span className="text-[9px] font-black text-zinc-400 uppercase ml-1">Từ:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[10px] font-bold outline-none text-inherit cursor-pointer"
            />
            <div className="w-px h-3 bg-zinc-200 dark:bg-slate-800" />
            <span className="text-[9px] font-black text-zinc-400 uppercase">Đến:</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[10px] font-bold outline-none text-inherit cursor-pointer"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-slate-800 rounded text-zinc-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto text-inherit">
        <div className="flex items-center gap-2 pr-2 border-r border-zinc-100 dark:border-slate-800">
          <button 
            onClick={fetchTickets}
            className={`p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-lg text-zinc-400 dark:text-zinc-500 transition-all ${loading ? 'animate-spin text-[#1b9aaa]' : ''}`}
            title="Refresh Data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button 
            onClick={exportExcel}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 dark:hover:bg-slate-800 transition-all"
            title="Export to Excel"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className={`p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-lg text-zinc-400 dark:text-zinc-500 transition-all ${isColumnDropdownOpen ? 'bg-zinc-100 dark:bg-slate-800 text-[#1b9aaa]' : ''}`}
              title="Toggle Columns"
            >
              <Filter className="w-4 h-4" />
            </button>
            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-zinc-100 dark:border-slate-800 z-50 p-2 py-3 animate-slide-up max-h-[70vh] overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-2">Column Settings</p>
                <div className="space-y-1">
                  {Object.entries(columnVisibility).map(([key, isVisible]) => (
                    <button 
                      key={key}
                      onClick={() => toggleColumn(key)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${isVisible ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-slate-800' : 'text-zinc-300 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-slate-800 hover:text-zinc-500 dark:hover:text-zinc-400'}`}
                    >
                      <span>{labels[key] || key}</span>
                      {isVisible && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 border border-zinc-100 dark:border-slate-800 bg-zinc-50/30 dark:bg-slate-800/20 rounded-lg p-1.5 px-3">
           <div className="text-right">
              <p className="text-[7px] font-black text-zinc-400 uppercase leading-none">Rows</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{totalRows}</p>
           </div>
           <div className="w-px h-5 bg-zinc-200 dark:bg-slate-700" />
           <div className="text-right">
              <p className="text-[7px] font-black text-green-500 uppercase leading-none">Done</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{doneRows}</p>
           </div>
        </div>

        <div className="flex gap-1.5">
          <button 
            onClick={openImportModal}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> IMPORT
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-slate-900 border border-white/5 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-black transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> ADD NEW
          </button>
        </div>
      </div>
    </header>
  );
}
