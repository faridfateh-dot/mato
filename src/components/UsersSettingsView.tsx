import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Users,
  Shield,
  Plus,
  Building2,
  Store,
  CheckCircle,
  AlertCircle,
  Trash2,
  Search,
  UserCheck,
  UserX,
  UserPlus,
  Sparkles,
  Info,
  Pencil
} from 'lucide-react';
import { UserRole, User, Branch } from '../types';

export const UsersSettingsView: React.FC = () => {
  const {
    currentRestaurant,
    branches,
    users,
    addUser,
    deleteUser,
    toggleUserActive,
    addBranch,
    updateBranch,
    deleteBranch,
    updateUserRole,
    currentUser
  } = useData();

  const [showUserModal, setShowUserModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // User Form
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Cashier' as UserRole,
    branchId: branches[0]?.id || ''
  });

  // Branch Form
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: ''
  });

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      triggerNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    addUser({
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      role: userForm.role,
      branchId: userForm.branchId || branches[0]?.id,
      isActive: true
    });

    triggerNotification(`تمت إضافة الموظف "${userForm.name}" بنجاح!`);
    setShowUserModal(false);
    setUserForm({ name: '', email: '', role: 'Cashier', branchId: branches[0]?.id || '' });
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) return;

    if (editingBranch) {
      updateBranch(editingBranch.id, {
        name: branchForm.name.trim(),
        address: branchForm.address.trim(),
        phone: branchForm.phone.trim()
      });
      triggerNotification(`تم تعديل بيانات الفرع "${branchForm.name}" بنجاح!`);
    } else {
      addBranch(branchForm.name.trim(), branchForm.address.trim(), branchForm.phone.trim());
      triggerNotification(`تم إنشاء الفرع الجديد "${branchForm.name}" بنجاح!`);
    }

    setShowBranchModal(false);
    setEditingBranch(null);
    setBranchForm({ name: '', address: '', phone: '' });
  };

  const confirmDeleteBranch = () => {
    if (!branchToDelete) return;

    const success = deleteBranch(branchToDelete.id);
    if (success) {
      triggerNotification(`تم مسح الفرع "${branchToDelete.name}" بنجاح.`);
    } else {
      triggerNotification('لا يمكن مسح هذا الفرع لأنه الفرع الوحيد المتبقي للمطعم!', 'error');
    }
    setBranchToDelete(null);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser.id && users.length <= 1) {
      triggerNotification('لا يمكن مسح المالك أو المستخدم الوحيد للنظام!', 'error');
      setUserToDelete(null);
      return;
    }

    const success = deleteUser(userToDelete.id);
    if (success) {
      triggerNotification(`تم مسح المستخدم "${userToDelete.name}" من النظام.`);
    } else {
      triggerNotification('تعذر مسح المستخدم.', 'error');
    }
    setUserToDelete(null);
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Owner':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Manager':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Cashier':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Inventory Manager':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold text-white transition-all ${
            notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>إدارة الموظفين، المستخدمين والصلاحيات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            سهولة تامة في إضافة موظفين جدد، تحديد الأدوار، تعديل الصلاحيات، ومسح الحسابات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBranchModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فرع جديد</span>
          </button>

          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* AI Quick Voice / Text Tip Box */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-800 space-y-1">
          <p className="font-extrabold text-amber-950">💡 نصيحة ذكية - الإضافة والمسح عبر المساعد الذكي:</p>
          <p className="text-slate-700">
            يمكنك أيضاً كتابة أمر مباشر للمساعد الذكي لإضافة موظف أو مسحه فوراً! مثل:
            <span className="font-mono text-amber-900 font-bold mr-1">"أضف كاشير جديد اسمه سامر العلي وبريده samer@mato.sy"</span> أو 
            <span className="font-mono text-amber-900 font-bold mr-1">"احذف المستخدم سامر العلي"</span>
          </p>
        </div>
      </div>

      {/* Tenant Info & Branches Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tenant Details */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-amber-400/20 text-amber-400 font-bold px-2 py-0.5 rounded">
              مطعم Multi-Tenant معزول
            </span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-lg font-black text-amber-400">{currentRestaurant.name}</h2>
          <p className="text-xs text-slate-400">
            العملة الرئيسية: <span className="font-bold text-white">{currentRestaurant.currency}</span> | تاريخ التأسيس: {new Date(currentRestaurant.createdAt).toLocaleDateString('ar-SY')}
          </p>
        </div>

        {/* Branches */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              فروع المطعم المسجلة ({branches.length})
            </span>
            <button
              onClick={() => {
                setEditingBranch(null);
                setBranchForm({ name: '', address: '', phone: '' });
                setShowBranchModal(true);
              }}
              className="flex items-center gap-1.5 text-xs bg-slate-900 text-amber-400 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فرع جديد</span>
            </button>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {branches.map(b => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-slate-300 transition-all">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="truncate">{b.name}</span>
                    {b.isMain && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                        الرئيسي
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 truncate">{b.address || 'العنوان غير محدد'}</div>
                  {b.phone && <div className="text-slate-400 text-[10px] font-mono mt-0.5">{b.phone}</div>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingBranch(b);
                      setBranchForm({ name: b.name, address: b.address || '', phone: b.phone || '' });
                      setShowBranchModal(true);
                    }}
                    title="تعديل بيانات الفرع"
                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBranchToDelete(b)}
                    title="مسح الفرع"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Users List Card & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs space-y-0">
        
        {/* Table Toolbar & Search Filter */}
        <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>قائمة المستخدمين والموظفين المعتمدين ({filteredUsers.length} من {users.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث باسم أو بريد الموظف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pr-8 pl-3 py-1.5 bg-slate-800 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 w-48 sm:w-60"
              />
            </div>

            {/* Role Filter Selector */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">جميع الأدوار</option>
              <option value="Owner">المالك (Owner)</option>
              <option value="Manager">المدير (Manager)</option>
              <option value="Cashier">الكاشير (Cashier)</option>
              <option value="Inventory Manager">مدير المخزون</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">البريد الإلكتروني</th>
                <th className="p-3.5">الفرع المخصص</th>
                <th className="p-3.5">الدور والدورات</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">تغيير الصلاحية</th>
                <th className="p-3.5 text-center">إجراء (مسح)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا يوجد موظفون يطابقون خيارات البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const branch = branches.find(b => b.id === u.branchId);
                  const isSelf = currentUser && currentUser.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {u.name.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                  أنت (الحالي)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">تاريخ الانضمام: {new Date(u.createdAt).toLocaleDateString('ar-SY')}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">{u.email}</td>

                      {/* Branch */}
                      <td className="p-3.5 text-slate-700 font-bold">{branch?.name || 'جميع الفروع'}</td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getRoleBadgeStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status Active Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            toggleUserActive(u.id);
                            triggerNotification(`تم تغيير حالة حساب ${u.name} بنجاح.`);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {u.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          <span>{u.isActive ? 'نشط' : 'معطل'}</span>
                        </button>
                      </td>

                      {/* Role Switcher */}
                      <td className="p-3.5 text-center">
                        <select
                          value={u.role}
                          onChange={e => {
                            updateUserRole(u.id, e.target.value as UserRole);
                            triggerNotification(`تم تحديث دور الموظف ${u.name} إلى ${e.target.value}`);
                          }}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-400 cursor-pointer"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Manager">Manager</option>
                          <option value="Cashier">Cashier</option>
                          <option value="Inventory Manager">Inventory Manager</option>
                        </select>
                      </td>

                      {/* Delete User Button */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setUserToDelete(u)}
                          title="مسح حساب المستخدم"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Explanation Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>جدول توزيع صلاحيات الأدوار في MATO SaaS</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="font-extrabold text-amber-900">1. المالك (Owner)</div>
            <p className="text-[11px] text-amber-950/80">كامل الصلاحيات المطلقة: إدارة الفروع، إضافة الموظفين، التحليلات المالية، والمساعد الذكي.</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
            <div className="font-extrabold text-blue-900">2. المدير (Manager)</div>
            <p className="text-[11px] text-blue-950/80">إدارة القائمة والمخزون، تسجيل المشتريات، متابعة المبيعات اليومية والأرباح.</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="font-extrabold text-emerald-900">3. الكاشير (Cashier)</div>
            <p className="text-[11px] text-emerald-950/80">تسجيل الطلبات الفورية بـ POS، عرض القائمة، استلام الدفعات النقدية والبطاقات.</p>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
            <div className="font-extrabold text-purple-900">4. مدير المخزون (Inventory)</div>
            <p className="text-[11px] text-purple-950/80">إدارة المواد الأولية، تسجيل المشتريات والهدر، تحديث كميات المستودع والوصفات.</p>
          </div>
        </div>
      </div>

      {/* Modal: Add User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>إضافة موظف / مستخدم جديد</span>
              </h2>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سامر العلي..."
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  placeholder="samer@mato.sy"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 dir-ltr text-right text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدور والصلاحية</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold text-xs"
                  >
                    <option value="Cashier">Cashier (كاشير)</option>
                    <option value="Manager">Manager (مدير فرع)</option>
                    <option value="Inventory Manager">Inventory Manager (مخزون)</option>
                    <option value="Owner">Owner (مالك)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفرع المخصص</label>
                  <select
                    value={userForm.branchId}
                    onChange={e => setUserForm({ ...userForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold text-xs"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md cursor-pointer"
                >
                  حفظ إضافة الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Branch */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                <span>{editingBranch ? `تعديل بيانات الفرع: ${editingBranch.name}` : 'إضافة فرع جديد للمطعم'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowBranchModal(false);
                  setEditingBranch(null);
                }}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الفرع *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فرع مشروع دمر..."
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان والموقع</label>
                <input
                  type="text"
                  placeholder="دمشق، شارع..."
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">هاتف الفرع</label>
                <input
                  type="text"
                  placeholder="+963 11 123 4567"
                  value={branchForm.phone}
                  onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 dir-ltr text-right text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBranchModal(false);
                    setEditingBranch(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold shadow-md cursor-pointer"
                >
                  {editingBranch ? 'حفظ التعديلات' : 'حفظ الفرع الجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Delete Branch */}
      {branchToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>تأكيد مسح الفرع</span>
            </div>

            <div className="p-5 space-y-3 text-slate-800">
              <p className="text-xs leading-relaxed font-semibold">
                هل أنت تأكد من رغبتك بمسح الفرع <strong className="text-slate-900 underline">{branchToDelete.name}</strong>؟
              </p>
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                ⚠️ تنبيه: سيتم إعادة تعيين الموظفين المرتبطين بهذا الفرع تلقائياً إلى الفرع الرئيسي المتبقي.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setBranchToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteBranch}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  تأكيد المسح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>تأكيد مسح حساب الموظف</span>
            </div>

            <div className="p-5 space-y-3 text-slate-800">
              <p className="text-xs leading-relaxed font-semibold">
                هل أنت تأكد من رغبتك بمسح حساب الموظف <strong className="text-slate-900 underline">{userToDelete.name}</strong> ({userToDelete.email})؟
              </p>
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                ⚠️ تنبيه: لن يتمكن هذا الموظف من تسجيل الدخول للنظام بعد المسح.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  تأكيد المسح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
