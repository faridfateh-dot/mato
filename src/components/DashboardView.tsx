import React from 'react';
import { useData } from '../context/DataContext';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CircleDollarSign,
  PieChart,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
  Clock,
  Layers,
  AlertOctagon,
  Lightbulb,
  ShieldAlert,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardViewProps {
  onNavigateView: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateView }) => {
  const { currentRestaurant, getDashboardStats, orders } = useData();
  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
              لوحة التحليلات المباشرة
            </span>
            <span className="text-slate-400 text-xs">تحديث فوري</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">
            مرحباً بك في {currentRestaurant.name} 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            ملخص الأداء اليومي والمبيعات ومراقبة الهدر والمصاريف بالفروع
          </p>
        </div>

        <button
          onClick={() => onNavigateView('ai')}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>اسأل MATO AI المساعد الذكي</span>
        </button>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Today Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold text-slate-600">مبيعات اليوم</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {stats.todaySales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-semibold gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% اليوم</span>
          </div>
        </div>

        {/* Order Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold text-slate-600">عدد الطلبات</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {stats.orderCount} <span className="text-xs font-normal text-slate-500">طلب</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-blue-600 font-semibold gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>نشاط ممتاز</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold text-slate-600">متوسط قيمة الطلب</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {stats.avgOrderValue.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500 font-medium gap-1">
            <span>معدل المبيعات</span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold text-slate-600">ربح الوجبات التقديري</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 tracking-tight">
            {stats.estimatedProfit.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-700 font-semibold gap-1">
            <span>قبل المصاريف</span>
          </div>
        </div>

        {/* Today Expenses KPI Card */}
        <div
          onClick={() => onNavigateView('expenses')}
          className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-900">مصاريف اليوم والأجور</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900 tracking-tight">
            {stats.todayExpenses.toLocaleString()} <span className="text-xs font-normal text-amber-800">{currentRestaurant.currency}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-amber-700 font-bold gap-1">
            <span>+ إضافة / عرض المصاريف</span>
          </div>
        </div>

        {/* Total Waste Losses KPI Card */}
        <div
          onClick={() => onNavigateView('inventory')}
          className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-900">تكلفة الهدر المسجلة</span>
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 tracking-tight">
            {stats.wasteAnalytics.totalWasteCost.toLocaleString()} <span className="text-xs font-normal text-rose-900">{currentRestaurant.currency}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-rose-700 font-bold gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{stats.wasteAnalytics.wasteCount} عمليات هدر</span>
          </div>
        </div>

      </div>

      {/* Waste & Excessive Expense Alert Banner Hub */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>تنبيهات الهدر والمصاريف الزائدة</span>
                {stats.expenseAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black animate-pulse">
                    {stats.expenseAlerts.length} تنبيهات فورية
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">كشف ذكي للمواد التالفة، الوصفات ذات التكلفة المرتفعة والمخاطر المالية</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateView('inventory')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>إدارة وتأكيد الهدر</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.expenseAlerts.length === 0 ? (
          <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>ممتاز! لا توجد تنبيهات هدر أو مصاريف زايدة حالياً. التكاليف وهامش الربح ضمن الحدود الممتازة.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.expenseAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                  alert.severity === 'high'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : alert.type === 'low_margin'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-sm flex items-center gap-1.5">
                      {alert.type === 'waste_high' && <TrendingDown className="w-4 h-4 text-rose-600" />}
                      {alert.type === 'low_margin' && <PieChart className="w-4 h-4 text-amber-600" />}
                      {alert.type === 'low_stock' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{alert.title}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      alert.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {alert.severity === 'high' ? 'حرج' : 'تنبيه'}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed mb-3">{alert.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 bg-white/60 p-2.5 rounded-lg flex items-start gap-2 text-[11px] font-medium text-slate-800">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>نصيحة العلاج:</strong> {alert.actionableRecommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Split: Chart & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">مبيعات الأيام الـ 7 الأخيرة</h2>
              <p className="text-xs text-slate-500">حجم المبيعات بالعملة المحلية ({currentRestaurant.currency})</p>
            </div>
            <button
              onClick={() => onNavigateView('pos')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>فتح الكاشير</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`${value?.toLocaleString()} ${currentRestaurant.currency}`, 'المبيعات']}
                  labelFormatter={(label) => `اليوم: ${label}`}
                />
                <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">المواد منخفضة المخزون</h2>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">
                {stats.lowStockIngredients.length} تنبيهات
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">تنبيهات نقص المواد الأولية للطلب الفوري من الموردين</p>

            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {stats.lowStockIngredients.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-medium">
                  المخزون متوفر وفي حالة ممتازة 👍
                </div>
              ) : (
                stats.lowStockIngredients.map(ing => (
                  <div key={ing.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{ing.name}</div>
                      <div className="text-[11px] text-slate-500">
                        الحد الأدنى: {ing.minStockThreshold} {ing.unit}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-rose-600">{ing.currentStock} {ing.unit}</div>
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">منخفض</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateView('inventory')}
            className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>إدارة المخزون والتوريد</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Lower Section: Top Selling Products & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">المنتجات الأكثر مبيعاً</h2>
            <button
              onClick={() => onNavigateView('products')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>إدارة قائمة الطعام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.topSellingProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">لا توجد طلبات بعد</div>
            ) : (
              stats.topSellingProducts.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-800 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{item.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-black text-slate-900">{item.quantity} قطعة</div>
                    <div className="text-[10px] text-slate-500">{item.revenue.toLocaleString()} {currentRestaurant.currency}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions & Audit Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">آخر العمليات والتغييرات</h2>
            <button
              onClick={() => onNavigateView('logs')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>عرض سجل العمليات الكامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentActivities.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-bold text-slate-700">{log.userName} ({log.userRole})</span>
                  <span className="text-[10px]">{new Date(log.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-medium text-slate-900">{log.description}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
