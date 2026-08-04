import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Boxes,
  Truck,
  ChefHat,
  Wallet,
  History,
  Sparkles,
  Users,
  Building2,
  ShieldCheck,
  Store,
  Lock
} from 'lucide-react';
import { useData } from '../context/DataContext';

export type ViewType =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'suppliers'
  | 'expenses'
  | 'recipes'
  | 'logs'
  | 'ai'
  | 'users'
  | 'sales';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { currentUser, isPlatformOwner, pendingUsersCount, pendingRestaurantRequestsCount } = useData();

  // Check permission by role
  const isAllowed = (view: ViewType) => {
    if (isPlatformOwner) return true; // Platform SuperAdmin has access to inspect all views

    const role = currentUser?.role;
    if (role === 'Owner' || role === 'Manager') {
      // Restaurant Owner & Manager have full access to all restaurant modules
      return ['dashboard', 'pos', 'products', 'inventory', 'suppliers', 'expenses', 'recipes', 'users', 'logs', 'ai'].includes(view);
    }
    if (role === 'Cashier') return ['pos', 'products', 'ai', 'dashboard'].includes(view);
    if (role === 'Inventory Manager') return ['inventory', 'suppliers', 'recipes', 'logs', 'ai', 'dashboard'].includes(view);
    return true;
  };

  const navItems: { id: ViewType; label: string; icon: React.FC<{ className?: string }>; badge?: string; countBadge?: number }[] = isPlatformOwner
    ? [
        {
          id: 'sales',
          label: 'إدارة حسابات المطاعم وتراخيص SaaS',
          icon: Store,
          badge: 'رئيسي',
          countBadge: pendingRestaurantRequestsCount > 0 ? pendingRestaurantRequestsCount : undefined
        },
        { id: 'dashboard', label: 'معاينة لوحة التحكم', icon: LayoutDashboard },
        { id: 'pos', label: 'نظام الكاشير (POS)', icon: ShoppingBag },
        { id: 'products', label: 'المنتجات والمنيو', icon: UtensilsCrossed },
        { id: 'inventory', label: 'المخزون والمواد', icon: Boxes },
        { id: 'suppliers', label: 'الموردون والشراء', icon: Truck },
        { id: 'expenses', label: 'المصاريف والأجور', icon: Wallet },
        { id: 'recipes', label: 'الوصفات والتكلفة', icon: ChefHat },
        { id: 'users', label: 'أمان حساب المالك الرئيسي', icon: Lock },
        { id: 'logs', label: 'سجل نشاط وأمان المنظومة', icon: History },
        { id: 'ai', label: 'مساعد MATO AI', icon: Sparkles, badge: 'ذكي' },
      ]
    : [
        { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
        { id: 'pos', label: 'نظام الكاشير (POS)', icon: ShoppingBag, badge: 'سريع' },
        { id: 'products', label: 'المنتجات والمنيو', icon: UtensilsCrossed },
        { id: 'inventory', label: 'المخزون والمواد', icon: Boxes },
        { id: 'suppliers', label: 'الموردون والشراء', icon: Truck },
        { id: 'expenses', label: 'المصاريف والأجور', icon: Wallet },
        { id: 'recipes', label: 'الوصفات والتكلفة', icon: ChefHat },
        {
          id: 'users',
          label: 'طاقم العمل والموافقات',
          icon: Users,
          countBadge: pendingUsersCount > 0 ? pendingUsersCount : undefined
        },
        { id: 'logs', label: 'سجل العمليات', icon: History },
        { id: 'ai', label: 'مساعد MATO AI', icon: Sparkles, badge: 'ذكي' },
      ];

  const getRoleDisplayName = () => {
    if (isPlatformOwner) return 'مالك المنظومة الرئيسي (Super Owner)';
    switch (currentUser?.role) {
      case 'Owner':
        return 'صاحب المطعم / المدير العام';
      case 'Manager':
        return 'مدير المطعم';
      case 'Cashier':
        return 'كاشير المبيعات';
      case 'Inventory Manager':
        return 'مدير المخزون والمشتريات';
      default:
        return currentUser?.role || 'مستخدم';
    }
  };

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-l border-slate-800 text-slate-300 flex-shrink-0">
      <div className="p-3 lg:p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
        
        <div className="hidden lg:block text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          {isPlatformOwner ? 'بوابة مالك المنظومة (SaaS)' : 'القائمة الرئيسية'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentView === item.id;
          const allowed = isAllowed(item.id);

          if (!allowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink ${
                active
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/10'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1">
                {item.countBadge !== undefined && item.countBadge > 0 && (
                  <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                    {item.countBadge} {isPlatformOwner ? 'طلبات' : 'جديد'}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-400/20 text-amber-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        <div className="hidden lg:block border-t border-slate-800/80 my-3 pt-3 px-3">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">صلاحية الحساب الحالي</div>
          <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate">{getRoleDisplayName()}</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
