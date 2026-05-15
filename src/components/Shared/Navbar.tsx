import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  Users, 
  LogOut, 
  Bell, 
  Menu, 
  Anchor, 
  Truck, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon,
  CircleDot,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../stores/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const primaryItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tổng Quan', roles: ['admin', 'supervisor', 'tally_staff'] },
    { to: '/tickets', icon: FileText, label: 'Phiếu Cân', roles: ['admin', 'supervisor'] },
    { to: '/tally', icon: CheckSquare, label: 'KIỂM TALLY', roles: ['admin', 'supervisor', 'tally_staff'] },
    { to: '/costs', icon: BarChart3, label: 'Bảng Kê', roles: ['admin', 'supervisor'] },
  ];

  const systemItems = [
    { to: '/trucks', icon: Truck, label: 'Danh Mục Xe', roles: ['admin', 'supervisor'] },
    { to: '/settings', icon: Settings, label: 'Cài Đặt', roles: ['admin', 'supervisor'] },
    { to: '/admin', icon: Users, label: 'Quản Trị', roles: ['admin'] },
  ];

  const filteredPrimary = primaryItems.filter(item => item.roles.includes(user?.role || ''));
  const filteredSystem = systemItems.filter(item => item.roles.includes(user?.role || ''));

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[55]"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="lg:hidden fixed bottom-20 left-4 right-4 bg-white dark:bg-slate-900 rounded-3xl p-6 z-[60] shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Chức năng khác</p>
                <button onClick={() => setIsMoreMenuOpen(false)} className="text-slate-400 text-xs font-bold">Đóng</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredSystem.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={({ isActive }) => `flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${isActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="hidden lg:flex flex-col bg-[#020617] text-white h-screen relative z-40 border-r border-slate-800/50"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors z-50 border border-slate-700"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Logo Section */}
        <div className={`p-6 mb-2 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <Anchor className="w-5 h-5 text-slate-900" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-bold text-lg tracking-tight text-white px-1">TallyPort</h1>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-1">Port Management</span>
            </motion.div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
              <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 transition-colors"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center mb-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-slate-800 text-slate-400 transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          )}
          {filteredPrimary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
              {isCollapsed && <div className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-50">{item.label}</div>}
            </NavLink>
          ))}
        </div>

        {/* System Section - Move to bottom area, separate from main nav */}
        <div className="px-3 pb-2 space-y-1">
          {filteredSystem.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0 opacity-70" />
              {!isCollapsed && <span className="text-xs">{item.label}</span>}
              {isCollapsed && <div className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-50">{item.label}</div>}
            </NavLink>
          ))}
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 mb-2">
               <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                 {user?.full_name?.[0] || 'U'}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-tight">{user?.role}</p>
               </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold">
                 {user?.full_name?.[0] || 'U'}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4.5 h-4.5" />
            {!isCollapsed && <span className="text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden bg-[#020617] text-white p-4 flex items-center justify-between z-50 sticky top-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Anchor className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">SNOW CAMELLIA</h2>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">V.52 Voyage</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-slate-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-xs font-bold">
            {user?.full_name?.[0] || 'U'}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-2 pb-safe z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] rounded-t-3xl">
        {filteredPrimary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${
                isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTabMobile"
                    className="absolute -top-1 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full"
                  />
                )}
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {filteredSystem.length > 0 && (
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${isMoreMenuOpen ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Thêm</span>
          </button>
        )}
      </nav>
    </>
  );
}
