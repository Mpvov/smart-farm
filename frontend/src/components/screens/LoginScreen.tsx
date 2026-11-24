import React, { useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { User } from '../../types';
import { Sprout, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const LoginScreen: React.FC = () => {
  const { setAuth } = useFarmStore();
  const [email, setEmail] = useState('admin@smartfarm.vn');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const loginWith = async (targetEmail: string, targetPassword: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { user: User; access_token: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      setAuth(res.data.user, res.data.access_token);
      toast.success(`Chào mừng trở lại, ${res.data.user.full_name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWith(email, password);
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

        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
          <div className="text-center text-xs text-slate-400">Đăng nhập nhanh theo vai trò (lấy Token thật):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => loginWith('admin@smartfarm.vn', 'admin123')}
              className="min-h-[48px] px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-xs font-semibold text-emerald-400 transition active:scale-[0.98]"
            >
              Đăng nhập nhanh Admin
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => loginWith('operator@smartfarm.vn', 'operator123')}
              className="min-h-[48px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 transition active:scale-[0.98]"
            >
              Đăng nhập nhanh Operator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
