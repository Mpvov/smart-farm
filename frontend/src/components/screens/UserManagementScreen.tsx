import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { User } from '../../types';
import { Users, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch<{ data: User[] }>('/users');
      setUsers(res.data);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách người dùng');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ email, full_name: fullName, password, role }),
      });
      toast.success('Đã tạo người dùng mới thành công');
      setEmail('');
      setFullName('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <span>Quản lý Tài khoản & Phân quyền RBAC</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Kiểm soát truy cập phân định 2 nhóm vai trò: Quản trị viên (Admin) và Người vận hành (Operator)
        </p>
      </div>

      {/* Form tạo mới */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Thêm Người dùng / Cấp quyền Mới</span>
        </h3>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Họ và Tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="ten@smartfarm.vn"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Vai trò (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium"
            >
              <option value="OPERATOR">OPERATOR (Vận hành)</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
            >
              {loading ? 'Đang tạo...' : 'Tạo Tài khoản'}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách người dùng */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
              <th className="py-3 px-4">Họ và Tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Vai trò (Role)</th>
              <th className="py-3 px-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-semibold text-slate-200">{u.full_name}</td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{u.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Đang hoạt động
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
