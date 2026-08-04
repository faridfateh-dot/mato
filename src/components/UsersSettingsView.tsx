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
  Pencil,
  Clock,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Filter,
  UserCog,
  KeyRound,
  Lock,
  Key
} from 'lucide-react';
import { UserRole, User, Branch } from '../types';

export const UsersSettingsView: React.FC = () => {
  const {
    currentRestaurant,
    branches,
    users,
    pendingUsers,
    pendingUsersCount,
    requireOwnerApproval,
    setRequireOwnerApproval,
    addUser,
    approveUser,
    rejectUser,
    deleteUser,
    toggleUserActive,
    addBranch,
    updateBranch,
    deleteBranch,
    updateUserRole,
    updateUserPassword,
    currentUser
  } = useData();

  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'owner_security' | 'branches'>('approved');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReject, setUserToReject] = useState<User | null>(null);
  const [userForPasswordChange, setUserForPasswordChange] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Owner Self-Password Change form state
  const [ownerNewPass, setOwnerNewPass] = useState('');
  const [ownerConfirmPass, setOwnerConfirmPass] = useState('');

  // Approval Customization State for each pending user
  const [pendingUserEdits, setPendingUserEdits] = useState<Record<string, { role: UserRole; branchId: string }>>({});

  // User Form (Owner direct add)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: 'admin',
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
      password: userForm.password || 'admin',
      role: userForm.role,
      branchId: userForm.branchId || branches[0]?.id,
      isActive: true,
      isPendingApproval: false
    });

    triggerNotification(`تمت إضافة الموظف المعتمد "${userForm.name}" وتعيين كلمة المرور بنجاح!`);
    setShowUserModal(false);
    setUserForm({ name: '', email: '', password: 'admin', role: 'Cashier', branchId: branches[0]?.id || '' });
  };

  const handleApprove = (user: User) => {
    const edit = pendingUserEdits[user.id];
    const assignedRole = edit?.role || user.requestedRole || user.role || 'Cashier';
    const assignedBranchId = edit?.branchId || user.branchId || branches[0]?.id;

    approveUser(user.id, assignedRole, assignedBranchId);
    triggerNotification(`تمت الموافقة وتفعيل حساب "${user.name}" بدور (${assignedRole}) بنجاح!`);
  };

  const handleConfirmReject = () => {
    if (!userToReject) return;
    rejectUser(userToReject.id, 'تم الرفض بواسطة مالك المطعم');
    triggerNotification(`تم رفض طلب انضمام "${userToReject.name}".`);
    setUserToReject(null);
  };

  const handleSaveUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordChange) return;
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 3) {
      triggerNotification('كلمة المرور يجب أن تكون 3 أحرف أو أرقام على الأقل', 'error');
      return;
    }

    const res = updateUserPassword(userForPasswordChange.id, newPasswordInput.trim());
    if (res.success) {
      triggerNotification(`تم تحديث كلمة المرور للمستخدم (${userForPasswordChange.name}) بنجاح!`);
      setUserForPasswordChange(null);
      setNewPasswordInput('');
    } else {
      triggerNotification(res.message, 'error');
    }
  };

  const handleUpdateOwnerPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = ownerNewPass.trim();
    if (!cleanPass || cleanPass.length < 3) {
      triggerNotification('يرجى كتابة كلمة مرور مكونة من 3 خانات على الأقل', 'error');
      return;
    }

    if (cleanPass !== ownerConfirmPass.trim()) {
      triggerNotification('كلمة المرور وتأكيد كلمة المرور غير متطابقتين!', 'error');
      return;
    }

    const res = updateUserPassword(currentUser.id, cleanPass);
    if (res.success) {
      triggerNotification('🔒 تم تحديث كلمة مرور حساب المالك وتأمينه بنجاح!');
      setOwnerNewPass('');
      setOwnerConfirmPass('');
    } else {
      triggerNotification(res.message, 'error');
    }
  };

  // Dedicated view when the current logged-in user is the SaaS Platform Owner
  if (currentUser?.role === 'Owner') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
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

        {/* Owner Account & Security Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>حساب المالك الرئيسي للمنظومة (Super Owner)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span>أمان وحساب المالك (فريد)</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                هذا الحساب مخصص للإشراف العام وإدارة وتفعيل حسابات وتراخيص المطاعم المسجلة في منظومة MATO SaaS.
              </p>
            </div>

            <button
              onClick={() => {
                window.location.hash = '#/sales';
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Store className="w-4 h-4" />
              <span>إدارة حسابات المطاعم المسجلة ➔</span>
            </button>
          </div>
        </div>

        {/* Owner Details & Password Update Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span>بيانات حساب المالك الرئيسي</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">الاسم الكامل:</span>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">البريد الإلكتروني:</span>
                <span className="font-mono font-bold text-slate-900">{currentUser.email}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">الصلاحية:</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                  مالك المنظومة الرئيسي (Super Owner)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">نطاق الفروع:</span>
                <span className="text-slate-900 font-bold text-[11px] bg-slate-200/80 px-2 py-0.5 rounded">
                  بدون فروع محددة (إشراف شامل على كامل المنظومة)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">حالة الحساب والمراجعة:</span>
                <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ✓ معتمد ومفعل تلقائياً (لا يحتاج مراجعة)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">الترخيص وكود التفعيل:</span>
                <span className="text-amber-700 font-bold text-[11px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  ★ وصول دائم مدى الحياة (لا يحتاج كود تفعيل)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">قاعدة البيانات:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  ● Firestore السحابية متصلة
                </span>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>تغيير وتأمين كلمة مرور المالك</span>
            </h2>
            <form onSubmit={handleUpdateOwnerPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={ownerNewPass}
                  onChange={(e) => setOwnerNewPass(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={ownerConfirmPass}
                  onChange={(e) => setOwnerConfirmPass(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>حفظ وتحديث كلمة المرور</span>
              </button>
            </form>
          </div>
        </div>

        {/* Quick Nav to Registered Restaurants */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/30 text-amber-900 flex items-center justify-center font-black">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">إدارة حسابات وتراخيص المطاعم المسجلة لدي</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                يمكنك مراجعة طلبات المطاعم الجديدة، تفعيل أو تعليق التراخيص السنوية، وتصدير أو استيراد البيانات.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.location.hash = '#/sales';
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
          >
            فتح لوحة المطاعم المسجلة
          </button>
        </div>
      </div>
    );
  }

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

  // Filter approved users (not pending)
  const approvedUsers = users.filter(u => !u.isPendingApproval);

  const filteredApprovedUsers = approvedUsers.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm));
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
            <span>إدارة الموظفين، الموافقات والصلاحيات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            التحكم الكامل في الحسابات، مراجعة واعتماد طلبات الانضمام، وتحديد صلاحيات الفروع
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBranchModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فرع</span>
          </button>

          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف معتمد</span>
          </button>
        </div>
      </div>

      {/* Security & Owner Approval Toggle Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">
                  نظام حماية الحسابات (شرط موافقة المالك المسبقة)
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${requireOwnerApproval ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                  {requireOwnerApproval ? 'الموافقة المسبقة مفعلة 🔒' : 'تسجيل تلقائي مباشر ⚠️'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                عند تفعيل هذا الخيار، لن يتمكن أي موظف أو كاشير جديد من الدخول إلى النظام إلا بعد مراجعتك لطلبه والموافقة عليه يدوياً من هذه اللوحة.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const nextVal = !requireOwnerApproval;
              setRequireOwnerApproval(nextVal);
              triggerNotification(nextVal ? 'تم تفعيل شرط موافقة المالك على الحسابات الجديدة' : 'تم تعطيل شرط موافقة المالك');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              requireOwnerApproval
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
            }`}
          >
            {requireOwnerApproval ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            <span>{requireOwnerApproval ? 'مفعل (الحسابات مشروطة بموافقتك)' : 'تفعيل شرط موافقة المالك'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-slate-900 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span>الموظفون المعتمدون ({approvedUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'pending'
              ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>طلبات الانضمام بانتظار الموافقة</span>
          {pendingUsersCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('owner_security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'owner_security'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-900" />
          <span>🔒 أمان وكلمة مرور المالك</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'branches'
              ? 'bg-slate-900 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4 text-blue-500" />
          <span>الفروع المسجلة ({branches.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PENDING APPROVAL REQUESTS ================= */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-0.5">
              <p className="font-extrabold">مراجعة وتفعيل طلبات التسجيل المعلقة:</p>
              <p className="text-amber-900">
                الموظفون أدناه قاموا بتقديم طلب انضمام لمطعمك. يمكنك تعديل الدور الوظيفي والفرع المخصص لهم قبل الضغط على "موافقة وتفعيل الحساب".
              </p>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">لا توجد طلبات انضمام معلقة حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                جميع المستخدمين في النظام معتمدون، أو لم يتقدم موظفون جدد بطلبات تسجيل حتى الآن.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => {
                const edit = pendingUserEdits[u.id] || {
                  role: u.requestedRole || u.role || 'Cashier',
                  branchId: u.branchId || branches[0]?.id
                };

                return (
                  <div key={u.id} className="bg-white rounded-2xl border border-amber-300 shadow-md p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-400" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
                          {u.name.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <span>{u.name}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                              طلب معلق ⏳
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email || u.phone}</div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 text-left">
                        {u.requestedAt ? new Date(u.requestedAt).toLocaleString('ar-SY', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'حديثاً'}
                      </div>
                    </div>

                    {u.approvalNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">رسالة الموظف: </span>
                        {u.approvalNotes}
                      </div>
                    )}

                    {/* Role and Branch Assignment Controls before Approval */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">تحديد الدور:</label>
                        <select
                          value={edit.role}
                          onChange={e => {
                            setPendingUserEdits(prev => ({
                              ...prev,
                              [u.id]: {
                                ...edit,
                                role: e.target.value as UserRole
                              }
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-amber-400 cursor-pointer"
                        >
                          <option value="Cashier">كاشير مبيعات (Cashier)</option>
                          <option value="Manager">مدير صالة (Manager)</option>
                          <option value="Inventory Manager">أمين مستودع ومخزون</option>
                          <option value="Owner">مالك مشارك (Owner)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">الفرع المخصص:</label>
                        <select
                          value={edit.branchId}
                          onChange={e => {
                            setPendingUserEdits(prev => ({
                              ...prev,
                              [u.id]: {
                                ...edit,
                                branchId: e.target.value
                              }
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-amber-400 cursor-pointer"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(u)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>موافقة وتفعيل الحساب</span>
                      </button>

                      <button
                        onClick={() => setUserToReject(u)}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="حذف ورفض طلب التسجيل"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف الطلب</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: APPROVED USERS LIST ================= */}
      {activeTab === 'approved' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs space-y-0">
          
          {/* Table Toolbar & Search Filter */}
          <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>قائمة المستخدمين والموظفين المعتمدين ({filteredApprovedUsers.length} من {approvedUsers.length})</span>
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
                  <th className="p-3.5">البريد الإلكتروني / الهاتف</th>
                  <th className="p-3.5">الفرع المخصص</th>
                  <th className="p-3.5">الدور والصلاحيات</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">كلمة المرور</th>
                  <th className="p-3.5 text-center">تغيير الصلاحية</th>
                  <th className="p-3.5 text-center">إجراء (مسح)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredApprovedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      لا يوجد موظفون معتمدون يطابقون خيارات البحث الحالية.
                    </td>
                  </tr>
                ) : (
                  filteredApprovedUsers.map(u => {
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
                              <div className="text-[10px] text-slate-400">تاريخ التفعيل: {new Date(u.createdAt).toLocaleDateString('ar-SY')}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email / Phone */}
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">{u.email || u.phone}</td>

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

                        {/* Password Reset Button */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setUserForPasswordChange(u);
                              setNewPasswordInput('');
                            }}
                            title="تعيين أو تغيير كلمة المرور"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>تعديل</span>
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
      )}

      {/* ================= TAB: OWNER ACCOUNT SECURITY & PASSWORD ================= */}
      {activeTab === 'owner_security' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-xl space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">تأمين حساب المالك وكلمة المرور الرئيسية</h2>
                  <p className="text-xs text-slate-400">حساب المالك محصن بالكامل، وهو المرجع الوحيد لاعتماد وإدارة حسابات المنظومة.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>اسم المالك المسجل:</span>
                  <span className="font-bold text-amber-400">{currentUser.name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>البريد الإلكتروني الأساسي:</span>
                  <span className="font-mono text-white font-bold">{currentUser.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>صلاحية الحساب:</span>
                  <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-black text-[10px]">مالك المنظومة (Owner)</span>
                </div>
              </div>

              {/* Password Change Form for Owner */}
              <form onSubmit={handleUpdateOwnerPassword} className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  <span>تغيير كلمة مرور المالك لمنع أي شخص آخر من الدخول:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور الجديدة *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="أدخل كلمة مرور جديدة قوية..."
                        value={ownerNewPass}
                        onChange={e => setOwnerNewPass(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl focus:border-amber-400 text-xs dir-ltr text-right"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="أعد كتابة كلمة المرور..."
                        value={ownerConfirmPass}
                        onChange={e => setOwnerConfirmPass(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl focus:border-amber-400 text-xs dir-ltr text-right"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>حفظ وتأكيد كلمة مرور المالك</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BRANCHES MANAGEMENT ================= */}
      {activeTab === 'branches' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              <span>فروع المطعم المسجلة ({branches.length})</span>
            </h2>
            <button
              onClick={() => {
                setEditingBranch(null);
                setBranchForm({ name: '', address: '', phone: '' });
                setShowBranchModal(true);
              }}
              className="flex items-center gap-1.5 text-xs bg-slate-900 text-amber-400 font-bold px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {branches.map(b => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-slate-300 transition-all">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="truncate">{b.name}</span>
                    {b.isMain && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                        الرئيسي
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1 truncate">{b.address || 'العنوان غير محدد'}</div>
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
      )}

      {/* Permissions Matrix Explanation Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>جدول توزيع صلاحيات الأدوار في منظومة MATO SaaS</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="font-extrabold text-amber-900">1. المالك (Owner)</div>
            <p className="text-[11px] text-amber-950/80">الموافقة على الحسابات، إدارة الفروع، إضافة الموظفين، التحليلات المالية، والمساعد الذكي.</p>
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

      {/* Modal: Add User Directly */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>إضافة موظف معتمد مباشرة</span>
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
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني أو الهاتف *</label>
                <input
                  type="text"
                  required
                  placeholder="samer@mato.sy أو +963991234567"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 dir-ltr text-right text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الابتدائية للحساب *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="أدخل كلمة مرور الموظف..."
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 dir-ltr text-right text-xs font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
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

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                ✅ الحساب المضاف من قبل المالك يكون معتمداً ومحمياً بكلمة المرور ونشطاً فوراً.
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
                  حفظ وتفعيل الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change / Reset Password for User */}
      {userForPasswordChange && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>تغيير كلمة المرور: {userForPasswordChange.name}</span>
              </h2>
              <button
                onClick={() => {
                  setUserForPasswordChange(null);
                  setNewPasswordInput('');
                }}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserPassword} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                <div className="font-bold text-slate-900">بيانات الحساب:</div>
                <div className="text-slate-600 font-mono text-[11px]">{userForPasswordChange.email || userForPasswordChange.phone}</div>
                <div className="text-[11px] text-amber-700 font-bold">الدور: {userForPasswordChange.role}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="أدخل كلمة المرور الجديدة..."
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 dir-ltr text-right text-xs font-mono font-bold"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  سيتمكن هذا الموظف من تسجيل الدخول باستخدام كلمة المرور هذه فوراً.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserForPasswordChange(null);
                    setNewPasswordInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md cursor-pointer"
                >
                  تحديث كلمة المرور
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

      {/* Modal: Confirmation Delete/Reject Request */}
      {userToReject && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center gap-2 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>حذف طلب تسجيل الموظف</span>
            </div>

            <div className="p-5 space-y-3 text-slate-800">
              <p className="text-xs leading-relaxed font-semibold">
                هل أنت متأكد من رغبتك بحذف طلب التسجيل المقدم من <strong className="text-slate-900 underline">{userToReject.name}</strong> ({userToReject.email || userToReject.phone})؟
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                سيتم مسح هذا الطلب نهائياً من قائمة الانتظار ولن يتمكن صاحب الطلب من الدخول للنظام.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setUserToReject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد الحذف النهائي</span>
                </button>
              </div>
            </div>
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
                هل أنت تأكد من رغبتك بمسح حساب الموظف <strong className="text-slate-900 underline">{userToDelete.name}</strong> ({userToDelete.email || userToDelete.phone})؟
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

