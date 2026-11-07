import React, { useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { User } from '../../types';
import { Sprout, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const LoginScreen: React.FC = () => {
  const { setUser, setActiveScreen } = useFarmStore();
  const [email, setEmail] = useState('admin@smartfarm.vn');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { user: User; access_token: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(res.data.user);
      toast.success(`Chào mừng trở lại, ${res.data.user.full_name}!`);
      setActiveScreen('SCR-02');
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Smart Farm OS</h1>
          <p className="text-xs text-slate-400 mt-1">Hệ thống Quản lý Thiết bị Nông nghiệp Thông minh</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email tài khoản</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="ten@smartfarm.vn"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <div>Tài khoản demo:</div>
          <div>Admin: <code className="text-slate-300">admin@smartfarm.vn / admin123</code></div>
          <div>Operator: <code className="text-slate-300">operator@smartfarm.vn / operator123</code></div>
        </div>
      </div>
    </div>
  );
};
