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
  History,
  UserCheck,
  UserX,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Trash2,
  CheckCheck,
  Key,
  Clock,
  Phone,
  Mail,
  Volume2,
  Sparkle
} from 'lucide-react';
import { UserRole } from '../types';
import { playNotificationChime } from '../lib/notificationSound';

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
    isPlatformOwner,
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
    isCloudSynced,
    lastCloudSyncTime,
    syncCloudNow,
    logoutUser,
    systemRegistrations,
    pendingRestaurantRequestsCount,
    firestoreRestaurants,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteInAppNotification,
    clearAllNotifications,
    approveRequestFromNotification,
    rejectRequestFromNotification,
    activeRealtimeAlert,
    dismissRealtimeAlert
  } = useData();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'users' | 'subscriptions' | 'stock'>('all');
  const [approvalRoles, setApprovalRoles] = useState<Record<string, UserRole>>({});
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({ name: '', address: '', phone: '' });
  const [headerSuccessMsg, setHeaderSuccessMsg] = useState<string | null>(null);

  const stats = getDashboardStats();
  const lowStockCount = stats.lowStockIngredients.length;
  const isOwner = isPlatformOwner;

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
    Owner: isPlatformOwner ? 'المالك العام للمنظومة (Super Owner)' : 'صاحب المطعم / المدير العام',
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

      {/* Real-time In-App Notification Alert Banner */}
      {activeRealtimeAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[350] w-[95%] max-w-lg bg-slate-900/95 border-2 border-amber-400 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400">{activeRealtimeAlert.title}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">تنبيه فوري ⚡</span>
              </div>
              <p className="text-xs text-slate-200 mt-1">{activeRealtimeAlert.message}</p>
              {activeRealtimeAlert.status === 'pending' && (
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      approveRequestFromNotification(activeRealtimeAlert.id);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow cursor-pointer transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>موافقة فورية وتفعيل</span>
                  </button>
                  <button
                    onClick={() => {
                      rejectRequestFromNotification(activeRealtimeAlert.id);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow cursor-pointer transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>رفض</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={dismissRealtimeAlert}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
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

            {/* Cloud Sync Status Badge */}
            <button
              onClick={() => setShowOfflineModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isCloudSynced
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title="حالة المزامنة السحابية عبر الأجهزة (Cloud Sync)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {isCloudSynced ? 'سحابي متزامن ⚡' : 'جاري المزامنة...'}
              </span>
            </button>

            {/* Offline Status Badge */}
            <button
              onClick={() => setShowOfflineModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isOnline
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title="حالة الاتصال والعمل بدون إنترنت"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>أوفلاين</span>
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

          {/* Comprehensive Realtime In-App Notifications Center (For Owner & Managers) */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 relative transition-colors cursor-pointer flex items-center justify-center"
              title="مركز الإشعارات والتنبيهات الفورية"
            >
              <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'text-amber-400' : 'text-slate-300'}`} />
              {(unreadNotificationsCount > 0 || (!isOwner && lowStockCount > 0)) && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse border-2 border-slate-900 shadow-md">
                  {unreadNotificationsCount + (!isOwner ? lowStockCount : 0)}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-[100] max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
                {/* Popover Header */}
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">تنبيهات طلبات الموظفين</h4>
                      <p className="text-[10px] text-slate-400">
                        {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} طلبات معلقة بانتظار الاعتماد` : 'لا توجد طلبات موظفين جديدة'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playNotificationChime()}
                      title="تجربة صوت التنبيه 🔔"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsAsRead()}
                        title="تحديد الكل كمقروء"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearAllNotifications()}
                        title="مسح جميع الإشعارات"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs - Staff requests only */}
                <div className="flex items-center gap-1 px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] overflow-x-auto">
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                      notifFilter === 'all' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    الكل ({notifications.length + (!isOwner ? lowStockCount : 0)})
                  </button>
                  <button
                    onClick={() => setNotifFilter('users')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                      notifFilter === 'users' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    طلبات الموظفين ({notifications.filter(n => n.type === 'user_registration').length})
                  </button>
                  {!isOwner && lowStockCount > 0 && (
                    <button
                      onClick={() => setNotifFilter('stock')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                        notifFilter === 'stock' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      المخزون ({lowStockCount})
                    </button>
                  )}
                  <button
                    onClick={() => setNotifFilter('unread')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                      notifFilter === 'unread' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    غير مقروء ({unreadNotificationsCount})
                  </button>
                </div>

                {/* Notifications Scrollable List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 max-h-[60vh] p-2 space-y-2">
                  {/* Stock alerts injection if operational role */}
                  {!isOwner && (notifFilter === 'all' || notifFilter === 'stock') && lowStockCount > 0 && (
                    <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>تنبيه مخزون منخفض ({lowStockCount} أصناف)</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            if (onNavigate) onNavigate('inventory');
                          }}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          عرض المخزون ←
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {stats.lowStockIngredients.slice(0, 3).map(ing => (
                          <div key={ing.id} className="text-[11px] bg-slate-900/70 p-1.5 rounded flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{ing.name}</span>
                            <span className="text-rose-400 font-bold">{ing.currentStock} / {ing.minStockThreshold} {ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtered In-App Notifications */}
                  {(() => {
                    const filtered = notifications.filter(n => {
                      if (notifFilter === 'unread') return !n.isRead;
                      if (notifFilter === 'users') return n.type === 'user_registration';
                      if (notifFilter === 'subscriptions') return n.type === 'subscription_request';
                      if (notifFilter === 'stock') return n.type === 'stock_alert';
                      return true;
                    });

                    if (filtered.length === 0 && (!lowStockCount || isOwner || notifFilter === 'users' || notifFilter === 'subscriptions')) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
                          <p>لا توجد إشعارات أو طلبات مطابقة حالياً.</p>
                        </div>
                      );
                    }

                    return filtered.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3 rounded-xl border transition-all text-xs space-y-2.5 ${
                          !notif.isRead
                            ? 'bg-slate-800/90 border-amber-400/30 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 opacity-90'
                        }`}
                      >
                        {/* Top info row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              notif.type === 'user_registration'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : notif.type === 'subscription_request'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {notif.type === 'user_registration' && <UserCheck className="w-3.5 h-3.5" />}
                              {notif.type === 'subscription_request' && <Store className="w-3.5 h-3.5" />}
                              {notif.type === 'system' && <Sparkles className="w-3.5 h-3.5" />}
                              {notif.type === 'stock_alert' && <AlertTriangle className="w-3.5 h-3.5" />}
                              {notif.type === 'security' && <Lock className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{notif.title}</span>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(notif.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteInAppNotification(notif.id);
                            }}
                            title="مسح الإشعار"
                            className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Notification Message */}
                        <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                          {notif.message}
                        </p>

                        {/* Extra Entity Details (for user registration or restaurant subscription) */}
                        {notif.entityData && (
                          <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded-lg space-y-1 border border-slate-800/80">
                            {notif.entityData.name && (
                              <div className="flex items-center justify-between">
                                <span>الاسم:</span>
                                <span className="font-semibold text-white">{notif.entityData.name}</span>
                              </div>
                            )}
                            {notif.entityData.restaurantName && (
                              <div className="flex items-center justify-between">
                                <span>المطعم:</span>
                                <span className="font-semibold text-amber-300">{notif.entityData.restaurantName}</span>
                              </div>
                            )}
                            {notif.entityData.emailOrPhone && (
                              <div className="flex items-center justify-between">
                                <span>بيانات التواصل:</span>
                                <span className="font-mono text-slate-200" dir="ltr">{notif.entityData.emailOrPhone}</span>
                              </div>
                            )}
                            {notif.entityData.role && (
                              <div className="flex items-center justify-between">
                                <span>الدور المطلوب:</span>
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">{notif.entityData.role}</span>
                              </div>
                            )}
                            {notif.entityData.notes && (
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                                <span className="font-bold text-slate-300">ملاحظات: </span>
                                {notif.entityData.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Direct Action Buttons for Pending Requests */}
                        {notif.status === 'pending' && (
                          <div className="pt-1 flex flex-col gap-2">
                            {/* Role selector dropdown if user registration */}
                            {notif.type === 'user_registration' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">تعيين الدور:</span>
                                <select
                                  value={approvalRoles[notif.id] || notif.entityData?.role || 'Cashier'}
                                  onChange={(e) => {
                                    setApprovalRoles(prev => ({ ...prev, [notif.id]: e.target.value as UserRole }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-slate-950 border border-slate-700 text-white text-[11px] rounded-lg px-2 py-1 focus:ring-1 focus:ring-amber-400 outline-none w-full"
                                >
                                  <option value="Cashier">كاشير (Cashier)</option>
                                  <option value="Manager">مدير فرع (Manager)</option>
                                  <option value="Inventory Manager">مدير مخزون (Inventory)</option>
                                </select>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const roleToAssign = approvalRoles[notif.id] || notif.entityData?.role || 'Cashier';
                                  approveRequestFromNotification(notif.id, roleToAssign);
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{notif.type === 'subscription_request' ? 'اعتماد وتوليد الكود' : 'قبول واعتماد الحساب'}</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectRequestFromNotification(notif.id, 'تم رفض الطلب بواسطة المسؤول');
                                }}
                                className="bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow cursor-pointer transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status badges if already handled */}
                        {notif.status === 'approved' && (
                          <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 py-1 px-2 rounded-md flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تمت الموافقة والاعتماد بنجاح</span>
                          </div>
                        )}
                        {notif.status === 'rejected' && (
                          <div className="text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 py-1 px-2 rounded-md flex items-center justify-center gap-1">
                            <UserX className="w-3.5 h-3.5" />
                            <span>تم رفض هذا الطلب</span>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* Footer Quick Links */}
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      if (onNavigate) onNavigate('users');
                    }}
                    className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>فتح جدول موظفي المطعم والطلبات المعلقة ←</span>
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>

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
                      {(currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            if (onNavigate) onNavigate('users');
                          }}
                          className="w-full text-right px-2 py-1.5 text-xs text-amber-400 hover:bg-slate-700/40 rounded flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>إدارة موظفي وصلاحيات المطعم</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setShowNewBranchModal(true);
                        }}
                        className="w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700/40 rounded flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
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
              
              {/* Cloud Sync Status Banner */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Database className="w-4 h-4" />
                    <span>المزامنة السحابية المباشرة (Cloud Sync):</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isCloudSynced ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  }`}>
                    {isCloudSynced ? 'متزامن مع السحابة ✅' : 'جاري التحديث...'}
                  </span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  جميع تعديلات الوجبات، الأصناف، الأسعار، المواد الأولية، الفواتير والمصاريف يتم حفظها ومزامنتها لحظياً عبر قاعدة بيانات **Firebase Firestore** السحابية لتظهر وتتطابق فوراً على الموبايل، اللابتوب، والشاشات الأخرى.
                </p>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/60">
                  <span>آخر مزامنة سحابية:</span>
                  <span className="font-mono text-slate-300">{new Date(lastCloudSyncTime).toLocaleTimeString('ar-SY')}</span>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                    <span>الاتصال بالشبكة:</span>
                  </div>
                  <div className="font-bold text-sm">
                    {isOnline ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        ● متصل بالسحابة
                      </span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1">
                        ⚡ وضع أوفلاين
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>المزامنة عبر الأجهزة:</span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    <span className="text-emerald-400">سحابي نشط (Multi-Device)</span>
                  </div>
                </div>
              </div>

              {/* Local Storage details */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>المطعم النشط:</span>
                  <span className="font-semibold text-amber-300">{currentRestaurant.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>الحفظ الاحتياطي المحلي:</span>
                  <span className="font-semibold text-slate-200">LocalStorage & PWA Cache</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>المطبخ والكاشير:</span>
                  <span className="font-semibold text-emerald-400">جاهز للعمل حتى في حال انقطاع الإنترنت</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  onClick={async () => {
                    await syncCloudNow();
                    triggerOfflineSync();
                    setHeaderSuccessMsg('تمت المزامنة السحابية الفورية لكافة بيانات وأصناف المطعم بنجاح!');
                    setTimeout(() => setHeaderSuccessMsg(null), 3000);
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>مزامنة سحابية فورية الآن ⚡</span>
                </button>

                <button
                  onClick={toggleOfflineSimulation}
                  className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${
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
