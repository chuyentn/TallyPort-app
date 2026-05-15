import React, { useState } from 'react';
import { Anchor, User as UserIcon, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Emergency Fallback
      if (username === 'admin' && password === 'admin') {
        const adminUser = {
          id: 'MASTER-ADMIN',
          username: 'admin',
          full_name: 'Quản Trị Viên (Khẩn Cấp)',
          role: 'admin' as const,
          email: 'admin@tallyport.com'
        };
        login('fallback-token', adminUser);
        navigate('/');
        return;
      }

      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        const { user } = response.data;
        login('real-gsheets-token', user);
        
        // Redirect according to role
        if (user.role === 'tally_staff') {
          navigate('/tally');
        } else {
          navigate('/');
        }
      } else {
        setError(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể kết nối máy chủ';
      setError(`${msg} (Vui lòng liên hệ Admin IT)`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d1b2a] relative overflow-hidden">
      {/* Wave pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 100 C 20 60, 40 60, 60 100 S 100 140, 120 100" stroke="white" fill="transparent" strokeWidth="2" strokeDasharray="5,5" />
          <path d="M0 200 C 30 160, 60 160, 90 200 S 150 240, 180 200" stroke="white" fill="transparent" strokeWidth="2" strokeDasharray="5,5" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        <div className="p-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0f4c75] text-white rounded-2xl mb-4 shadow-lg">
            <Anchor className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f4c75]">TallyPort</h1>
          <p className="text-zinc-500 font-medium">Hệ Thống Quản Lý Bốc Hàng Tàu</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Tên đăng nhập</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white text-zinc-900 border-2 border-zinc-100 rounded-xl focus:border-[#0f4c75] focus:outline-none transition-colors font-medium"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white text-zinc-900 border-2 border-zinc-100 rounded-xl focus:border-[#0f4c75] focus:outline-none transition-colors font-medium"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-[#0f4c75] focus:ring-[#0f4c75]" />
              <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-[#0f4c75] to-[#1b9aaa] text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đăng Nhập'
            )}
          </button>
          
          <div className="pt-2 text-center">
            <p className="text-xs text-zinc-400">
              * Sự cố kết nối? Sử dụng <span className="font-bold">admin / admin</span> để vào chế độ khẩn cấp.
            </p>
          </div>
        </form>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400">© 2026 Wood Chip Export Logistics | SNOW CAMELLIA V.52</p>
        </div>
      </motion.div>
    </div>
  );
}
