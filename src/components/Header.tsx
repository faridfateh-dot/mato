import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Utensils,
  Store,
  User as UserIcon,
  Bell,
  Sparkles,
  ChevronDown,
  Shield,
  Plus,
  LogOut,
  ShoppingBag,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  HardDrive,
  Info,
  CheckCircle2,
  Users,
  Lock,
  ShieldCheck,
  History
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenAiChat?: () => void;
  onOpenAIChat?: () => void;
  onNavigate?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenAiChat, onOpenAIChat, onNavigate }) => {
  const handleOpenAi = () => {
    if (onOpenAiChat) onOpenAiChat();
    else if (onOpenAIChat) onOpenAIChat();
  };
  const {
    currentRestaurant,
    currentBranch,
    currentUser,
    branches,
    users,
    setCurrentBranch,
    setCurrentUser,
    addBranch,
    ingredients,
    getDashboardStats,
    isOnline,
    pendingOfflineCount,
    triggerOfflineSync,
    toggleOfflineSimulation,
    isSimulatedOffline,
    logoutUser,
    systemRegistrations,
    pendingRestaurantRequestsCount,
    firestoreRestaurants
  } = useData();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({ name: '', address: '', phone: '' });
  const [headerSuccessMsg, setHeaderSuccessMsg] = useState<string | null>(null);

  const stats = getDashboardStats();
  const lowStockCount = stats.lowStockIngredients.length;
  const isOwner = currentUser?.role === 'Owner';

  const handleCreateBranchHeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) return;
    addBranch(newBranchForm.name.trim(), newBranchForm.address.trim(), newBranchForm.phone.trim());
    setHeaderSuccessMsg(`تم إنشاء الفرع / المطعم الجديد "${newBranchForm.name.trim()}" بنجاح وتفعيله!`);
    setShowNewBranchModal(false);
    setNewBranchForm({ name: '', address: '', phone: '' });
    setTimeout(() => setHeaderSuccessMsg(null), 4000);
  };

  const roleColors: Record<UserRole, string> = {
    Owner: 'bg-amber-100 text-amber-800 border-amber-300',
    Manager: 'bg-blue-100 text-blue-800 border-blue-300',
    Cashier: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Inventory Manager': 'bg-purple-100 text-purple-800 border-purple-300',
  };

  const roleLabels: Record<UserRole, string> = {
    Owner: 'المالك العام للمنظومة (Super Owner)',
    Manager: 'المدير (Manager)',
    Cashier: 'كاشير (Cashier)',
    'Inventory Manager': 'مدير المخزون (Inventory)',
  };

  return (
    <>
      {/* Success Toast */}
      {headerSuccessMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{headerSuccessMsg}</span>
        </div>
      )}

      {/* Slim Top Banner for Offline Mode */}
      {(!isOnline || isSimulatedOffline) && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-bold text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2 shadow-inner z-[60]">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>⚡ أنت تعمل في **وضع دون إنترنت (Offline Mode)** — جميع المبيعات والبيانات تحفظ محلياً في جهازك بأمان 100%</span>
          <button
            onClick={() => setShowOfflineModal(true)}
            className="underline text-slate-950 hover:text-white transition-colors mr-2 bg-slate-950/10 px-2 py-0.5 rounded"
          >
            عرض حالة الحفظ والمزامنة 📊
          </button>
        </div>
      )}

      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left / Brand Section */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => onNavigate && onNavigate(isOwner ? 'sales' : 'dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl tracking-wider shadow-lg shadow-amber-400/20">
                M
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl text-white tracking-tight">MATO</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    {isOwner ? 'لوحة المالك العام' : 'SaaS'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                  {isOwner ? 'إدارة حسابات وتراخيص المطاعم المسجلة' : currentRestaurant.name}
                </p>
              </div>
            </div>

            {/* Branch Switcher (Only shown for restaurant internal staff/managers, NOT for Platform Owner) */}
            {!isOwner && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowBranchMenu(!showBranchMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition-colors"
                >
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium truncate max-w-[130px]">{currentBranch.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showBranchMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-1 z-[100] max-h-[75vh] overflow-y-auto">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-700/60 flex items-center justify-between">
                      <span>اختر الفرع / المطعم الحالي</span>
                      <button
                        onClick={() => {
                          setShowBranchMenu(false);
                          setShowNewBranchModal(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>جديد</span>
                      </button>
                    </div>
                    {branches.map(b => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setCurrentBranch(b);
                          setShowBranchMenu(false);
                        }}
                        className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/50 transition-colors ${
                          b.id === currentBranch.id ? 'text-amber-400 font-semibold bg-slate-700/30' : 'text-slate-200'
                        }`}
                      >
                        <span>{b.name}</span>
                        {b.isMain && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">الرئيسي</span>
                        )}
                      </button>
                    ))}

                    <div className="p-1.5 border-t border-slate-700/60 mt-1">
                      <button
                        onClick={() => {
                          setShowBranchMenu(false);
                          setShowNewBranchModal(true);
                        }}
                        className="w-full text-center py-1.5 px-3 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-all shadow cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إنشاء مطعم / فرع جديد</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right / Actions & Profile */}
          <div className="flex items-center gap-3">

            {/* Offline Status Badge */}
            <button
              onClick={() => setShowOfflineModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title="حالة الاتصال والعمل بدون إنترنت"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">أوفلاين جاهز (متصل)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>دون إنترنت (أوفلاين)</span>
                </>
              )}
            </button>

            {/* AI Quick Button (for non-owner) */}
            {!isOwner && (
              <button
                onClick={handleOpenAi}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 hover:brightness-105 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span className="hidden sm:inline">مساعد MATO AI</span>
              </button>
            )}

            {/* Owner Quick Button for Registered Restaurants & Subscriptions */}
            {isOwner && (
              <button
                onClick={() => onNavigate && onNavigate('sales')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer"
                title="إدارة حسابات المطاعم المسجلة"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">المطاعم المسجلة</span>
                {pendingRestaurantRequestsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingRestaurantRequestsCount} طلب جديد
                  </span>
                )}
              </button>
            )}

          {/* Notifications Bell (for operational roles) */}
          {!isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 relative transition-colors cursor-pointer"
                title="تنبيهات المخزون"
              >
                <Bell className="w-4 h-4" />
                {lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 sm:right-0 mt-2 w-72 sm:w-80 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-[100] max-h-[75vh] overflow-y-auto text-slate-200">
                  <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between text-xs font-bold">
                    <span>تنبيهات المخزون المنخفض</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">{lowStockCount} تنبيهات</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/50">
                    {lowStockCount === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        جميع المواد الأولية بالمخزون متوفرة بجميع الفروع ✅
                      </div>
                    ) : (
                      stats.lowStockIngredients.map(ing => (
                        <div key={ing.id} className="p-3 hover:bg-slate-700/40 text-xs">
                          <div className="font-semibold text-rose-300">{ing.name}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            المتبقي: <span className="font-bold text-white">{ing.currentStock} {ing.unit}</span> (الحد الأدنى: {ing.minStockThreshold} {ing.unit})
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs border border-amber-300">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-right hidden lg:block">
                <div className="font-bold text-slate-100 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-amber-400">{isOwner ? 'المالك الرئيسي' : currentUser.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-[100] max-h-[75vh] overflow-y-auto text-slate-200">
                <div className="px-3 py-1.5 border-b border-slate-700">
                  <div className="font-bold text-xs text-slate-100">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                    <Shield className="w-3 h-3" />
                    <span>{roleLabels[currentUser.role]}</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-1 mt-1 px-2 flex flex-col gap-1">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          if (onNavigate) onNavigate('sales');
                        }}
                        className="w-full text-right px-2 py-1.5 text-xs text-amber-400 hover:bg-slate-700/40 rounded flex items-center gap-2 font-bold cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>إدارة حسابات المطاعم المسجلة</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          if (onNavigate) onNavigate('users');
                        }}
                        className="w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700/40 rounded flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>أمان وكلمة مرور المالك</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          if (onNavigate) onNavigate('logs');
                        }}
                        className="w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700/40 rounded flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-amber-400" />
                        <span>سجل نشاط المنظومة والأمان</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {currentUser.role === 'Manager' && (
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            if (onNavigate) onNavigate('users');
                          }}
                          className="w-full text-right px-2 py-1.5 text-xs text-amber-400 hover:bg-slate-700/40 rounded flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>إدارة موظفي المطعم</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setShowNewBranchModal(true);
                        }}
                        className="w-full text-right px-2 py-1.5 text-xs text-amber-400 hover:bg-slate-700/40 rounded flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إنشاء فرع جديد للمطعم</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logoutUser();
                    }}
                    className="w-full text-right px-2 py-1.5 text-xs text-rose-400 hover:bg-slate-700/40 rounded flex items-center gap-2 cursor-pointer font-bold border-t border-slate-700/60 mt-1 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج الآمن</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>

      {/* Offline Status & Local Database Sync Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">العمل من دون إنترنت (Offline System)</h3>
                  <p className="text-xs text-slate-400">حالة قاعدة البيانات المحلية ومزامنة الأوفلاين</p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Feature Explanation Banner */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Database className="w-4 h-4" />
                  <span>ميزة الإصرار والاستقلالية عن الإنترنت (Local-First PWA):</span>
                </div>
                <p className="leading-relaxed">
                  نظام **MATO POS** مصمم للعمل **100% دون حاجة لاتصال بالإنترنت**. يتم حفظ الفواتير، المخزون، الوصفات، والمصاريف تلقائياً في ذاكرة الجهاز المحلية ذات السرعة الفائقة.
                </p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                    <span>حالة الاتصال بالشبكة:</span>
                  </div>
                  <div className="font-bold text-sm">
                    {isOnline ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        ● متصل بالسحابة (Online)
                      </span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1">
                        ⚡ وضع أوفلاين (Offline)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>عمليات بانتظار المزامنة:</span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {pendingOfflineCount > 0 ? (
                      <span className="text-amber-400">{pendingOfflineCount} عمليات محليّة</span>
                    ) : (
                      <span className="text-emerald-400">محدث ومزامن بالكامل ✅</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Local Storage details */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>نوع الذاكرة المحلية:</span>
                  <span className="font-semibold text-slate-200">LocalStorage & PWA Cache</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>المطبخ والكاشير:</span>
                  <span className="font-semibold text-emerald-400">جاهز للطباعة والعمل 100% بدون إنترنت</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>محاكاة وضع الأوفلاين:</span>
                  <span className="font-semibold text-amber-300">{isSimulatedOffline ? 'نشط (مفعل يدوياً)' : 'غير مفعل'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    triggerOfflineSync();
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>مزامنة فورية للبيانات المحفوظة</span>
                </button>

                <button
                  onClick={toggleOfflineSimulation}
                  className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                    isSimulatedOffline
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <WifiOff className="w-4 h-4" />
                  <span>{isSimulatedOffline ? 'إيقاف محاكاة الأوفلاين' : 'اختبار وضع بدون إنترنت'}</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowOfflineModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Restaurant / Branch */}
      {showNewBranchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">إنشاء مطعم / فرع جديد</h3>
                  <p className="text-xs text-slate-400">إضافة كيان جديد ونشط للنظام تلقائياً</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewBranchModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranchHeader} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم المطعم / الفرع الجديد *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم بيت الشاورما - فرع المالكي"
                  value={newBranchForm.name}
                  onChange={e => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">العنوان والموقع</label>
                <input
                  type="text"
                  placeholder="دمشق، حي المالكي..."
                  value={newBranchForm.address}
                  onChange={e => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم هاتف الكاشير / الإدارة</label>
                <input
                  type="text"
                  placeholder="+963 11 333 4455"
                  value={newBranchForm.phone}
                  onChange={e => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 text-right dir-ltr"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] leading-relaxed">
                ✨ بمجرد النقر على "إنشاء وتفعيل الآن"، سيتم إنشاء الفرع والتبديل إليه فوراً في واجهة النظام.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-lg shadow-amber-400/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء وتفعيل الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Account Switcher & Logout */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">تسجيل الخروج وتبديل الحساب</h3>
                  <p className="text-xs text-slate-400">التحكم بالمستخدمين النشطين وإدارة الدخول للمنظومة</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              
              {/* Currently Active User Box */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{currentUser.name}</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{currentUser.email}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logoutUser();
                    setShowAuthModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل خروج الآن</span>
                </button>
              </div>

              {/* Quick Switch Accounts List */}
              <div className="space-y-2">
                <div className="font-bold text-slate-300 flex items-center justify-between">
                  <span>اختر حساباً آخر للتبديل السريع إليه:</span>
                  <span className="text-[10px] text-slate-400">{users.length} حسابات مسجلة</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowAuthModal(false);
                        setHeaderSuccessMsg(`تم تسجيل الدخول بحساب: ${u.name} (${u.role})`);
                        setTimeout(() => setHeaderSuccessMsg(null), 4000);
                      }}
                      className={`w-full p-3 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                        u.id === currentUser.id
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 bg-slate-900/50 px-2 py-1 rounded border border-slate-700">
                        {u.role}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Action Footer */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setShowNewBranchModal(true);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء مطعم / فرع جديد</span>
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    onOpenAuth?.('register');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>إدارة المستخدمين وإضافة موظف</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
