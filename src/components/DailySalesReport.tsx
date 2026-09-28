import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Order, OrderItem, Expense } from '../types';
import {
  Calendar,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  Coins,
  Receipt,
  Printer,
  Sparkles,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Scale,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Utensils,
  Sun,
  Moon,
  Store,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface DailySalesReportProps {
  initialDate?: string;
  isOwnerOrManager?: boolean;
}

export const DailySalesReport: React.FC<DailySalesReportProps> = ({
  initialDate,
  isOwnerOrManager = true
}) => {
  const {
    currentRestaurant,
    currentBranch,
    orders,
    expenses,
    products,
    currentUser,
    isPlatformOwner
  } = useData();

  // Selected date: defaults to today YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);

  // Opening Cash in Drawer (stored in localStorage per restaurant and date)
  const openingCashKey = `mato_opening_cash_${currentRestaurant.id || 'curr'}_${selectedDate}`;
  const [openingCash, setOpeningCash] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(openingCashKey);
      return saved !== null ? Number(saved) : 50000; // default 50k
    } catch {
      return 50000;
    }
  });

  const [isEditingOpeningCash, setIsEditingOpeningCash] = useState(false);
  const [tempOpeningCash, setTempOpeningCash] = useState(openingCash.toString());

  // Actual Counted Cash for reconciliation
  const [actualCashCounted, setActualCashCounted] = useState<string>('');
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Quick Date Changers
  const setQuickDate = (type: 'today' | 'yesterday') => {
    if (type === 'today') {
      setSelectedDate(todayStr);
    } else {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      setSelectedDate(y.toISOString().split('T')[0]);
    }
  };

  const handleSaveOpeningCash = () => {
    const val = Number(tempOpeningCash) || 0;
    setOpeningCash(val);
    try {
      localStorage.setItem(openingCashKey, val.toString());
    } catch {}
    setIsEditingOpeningCash(false);
  };

  // 1. Filter orders for selected date
  const dayOrders = useMemo(() => {
    return orders.filter(o => o.createdAt.startsWith(selectedDate) && o.status === 'completed');
  }, [orders, selectedDate]);

  // 2. Filter expenses for selected date
  const dayExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedDate));
  }, [expenses, selectedDate]);

  // Financial Metrics
  const totalSales = useMemo(() => {
    return dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }, [dayOrders]);

  const totalCost = useMemo(() => {
    return dayOrders.reduce((acc, o) => acc + (o.costAmount || 0), 0);
  }, [dayOrders]);

  const totalGrossProfit = useMemo(() => {
    return dayOrders.reduce((acc, o) => acc + (o.profitAmount || (o.totalAmount - (o.costAmount || 0))), 0);
  }, [dayOrders]);

  const orderCount = dayOrders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;
  const profitMarginPercent = totalSales > 0 ? Math.round((totalGrossProfit / totalSales) * 100) : 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let cashTotal = 0;
    let cashCount = 0;
    let cardTotal = 0;
    let cardCount = 0;
    let staffTotal = 0;
    let staffCount = 0;

    dayOrders.forEach(o => {
      if (o.paymentMethod === 'cash') {
        cashTotal += o.totalAmount;
        cashCount++;
      } else if (o.paymentMethod === 'card') {
        cardTotal += o.totalAmount;
        cardCount++;
      } else if (o.paymentMethod === 'staff_meal') {
        staffTotal += o.totalAmount;
        staffCount++;
      } else {
        // Default to cash if unspecified
        cashTotal += o.totalAmount;
        cashCount++;
      }
    });

    return {
      cash: { total: cashTotal, count: cashCount, percent: totalSales > 0 ? Math.round((cashTotal / totalSales) * 100) : 0 },
      card: { total: cardTotal, count: cardCount, percent: totalSales > 0 ? Math.round((cardTotal / totalSales) * 100) : 0 },
      staff: { total: staffTotal, count: staffCount, percent: totalSales > 0 ? Math.round((staffTotal / totalSales) * 100) : 0 }
    };
  }, [dayOrders, totalSales]);

  // Expenses Breakdown
  const totalExpensesAmount = useMemo(() => {
    return dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [dayExpenses]);

  // Cash Treasury Calculations
  // Cash In: Opening float + Cash sales
  // Cash Out: Expenses paid from cash drawer
  const expectedCashInDrawer = useMemo(() => {
    return Math.max(0, openingCash + paymentBreakdown.cash.total - totalExpensesAmount);
  }, [openingCash, paymentBreakdown.cash.total, totalExpensesAmount]);

  const cashDiscrepancy = useMemo(() => {
    if (!actualCashCounted || isNaN(Number(actualCashCounted))) return null;
    const actual = Number(actualCashCounted);
    return actual - expectedCashInDrawer;
  }, [actualCashCounted, expectedCashInDrawer]);

  // Shift Breakdown (Morning: 06:00 - 16:00, Evening: 16:00 - 04:00)
  const shiftBreakdown = useMemo(() => {
    let morningSales = 0;
    let morningOrders = 0;
    let eveningSales = 0;
    let eveningOrders = 0;

    dayOrders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      if (hour >= 6 && hour < 16) {
        morningSales += o.totalAmount;
        morningOrders++;
      } else {
        eveningSales += o.totalAmount;
        eveningOrders++;
      }
    });

    return {
      morning: { sales: morningSales, orders: morningOrders },
      evening: { sales: eveningSales, orders: eveningOrders }
    };
  }, [dayOrders]);

  // Top Selling Products for this Day
  const topProducts = useMemo(() => {
    const map: Record<string, {
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    dayOrders.forEach(o => {
      o.items.forEach(it => {
        if (!map[it.productName]) {
          map[it.productName] = {
            productId: it.productId,
            productName: it.productName,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0
          };
        }
        map[it.productName].quantity += it.quantity;
        map[it.productName].revenue += it.total;

        // Find product cost if available
        const prod = products.find(p => p.id === it.productId || p.name === it.productName);
        const unitCost = prod?.cost || (it.price * 0.45);
        const itemCost = unitCost * it.quantity;
        map[it.productName].cost += itemCost;
        map[it.productName].profit += (it.total - itemCost);
      });
    });

    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [dayOrders, products]);

  const currency = currentRestaurant.currency || 'ل.س';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-right dir-rtl space-y-6 p-5 sm:p-7">
      
      {/* 1. Header Toolbar with Date Filter & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                تقرير المبيعات اليومي المفصل وحالة الخزينة
              </h2>
              <span className="bg-amber-400/20 text-amber-900 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                Z-Report
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>متابعة تفصيلية للأداء المالي، مقبوضات الدفع، حركة النقد، والأصناف الأكثر طلباً</span>
              <span>•</span>
              <span className="font-bold text-slate-700">{currentBranch?.name || 'الفرع الرئيسي'}</span>
            </p>
          </div>
        </div>

        {/* Date Selector and Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Chips */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setQuickDate('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDate === todayStr ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setQuickDate('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDate !== todayStr ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أمس / تاريخ آخر
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 hover:border-amber-400 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer shadow-xs focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Print Z-Report Modal Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs shadow-md transition-all cursor-pointer"
            title="معاينة وطباعة تقرير المبيعات اليومي والإغلاق المالي"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الإغلاق (Z-Report)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold text-amber-900">إجمالي مبيعات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {totalSales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-amber-200/60 font-medium">
            <span>عدد الفواتير: <strong className="text-slate-900 font-bold">{orderCount}</strong></span>
            <span>متوسط الفاتورة: <strong className="text-slate-900 font-bold">{avgOrderValue.toLocaleString()} {currency}</strong></span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold text-emerald-900">الربح الإجمالي التقديري</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {totalGrossProfit.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 pt-2 border-t border-emerald-200/60 font-semibold">
            <span>هامش الربح: <strong className="font-bold">{profitMarginPercent}%</strong></span>
            <span>تكلفة المواد: <strong className="text-slate-600 font-mono">{totalCost.toLocaleString()} {currency}</strong></span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-300/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold text-rose-900">مصاريف ومسحوبات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {totalExpensesAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-rose-700 pt-2 border-t border-rose-200/60 font-medium">
            <span>عدد المصاريف: <strong>{dayExpenses.length}</strong></span>
            <span>صافي الدخل: <strong className="font-bold">{Math.max(0, totalGrossProfit - totalExpensesAmount).toLocaleString()} {currency}</strong></span>
          </div>
        </div>

        {/* Expected Net Cash in Drawer */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold text-amber-400">الرصيد الفعلي المتوقع بالخزينة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {expectedCashInDrawer.toLocaleString()} <span className="text-xs font-normal text-amber-300">{currency}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-700/80 font-medium">
            <span>نقد المبيعات: <strong className="text-emerald-400 font-bold">+{paymentBreakdown.cash.total.toLocaleString()}</strong></span>
            <span>المصاريف: <strong className="text-rose-400 font-bold">-{totalExpensesAmount.toLocaleString()}</strong></span>
          </div>
        </div>

      </div>

      {/* 3. Treasury Status & Cash Drawer Reconciliation Card (حالة الخزينة ومطابقة الصندوق) */}
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>حالة الخزينة النقدية ومطابقة عهدة الصندوق</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  سيولة ممتازة
                </span>
              </h3>
              <p className="text-xs text-slate-500">حركة النقد الورقي بالدرج ومطابقة الكاش الفعلي عند استلام وتسليم الورديات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReconciliation(!showReconciliation)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>{showReconciliation ? 'إخفاء حاسبة المطابقة' : 'جرد الصندوق ومطابقة العجز/الفائض'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Drawer Cash Flow Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Opening Float */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-slate-700">1. عهدة الصندوق (رصيد الافتتاح)</span>
              {isEditingOpeningCash ? (
                <button
                  onClick={handleSaveOpeningCash}
                  className="text-[10px] text-emerald-700 hover:underline font-bold"
                >
                  حفظ
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTempOpeningCash(openingCash.toString());
                    setIsEditingOpeningCash(true);
                  }}
                  className="text-[10px] text-amber-600 hover:underline font-bold"
                >
                  تعديل
                </button>
              )}
            </div>
            {isEditingOpeningCash ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={tempOpeningCash}
                  onChange={(e) => setTempOpeningCash(e.target.value)}
                  className="w-full px-2 py-1 bg-amber-50 border border-amber-300 rounded font-mono font-bold text-xs"
                />
              </div>
            ) : (
              <div className="text-base font-black text-slate-900 mt-1">
                {openingCash.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">الرصيد المبدئي لبداية الوردية</div>
          </div>

          {/* Cash Sales Inflow */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-emerald-800">2. مقبوضات المبيعات النقدية (+)</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-black text-emerald-700 mt-1">
              +{paymentBreakdown.cash.total.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">من إجمالي {paymentBreakdown.cash.count} فواتير نقدية</div>
          </div>

          {/* Cash Expenses Outflow */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-rose-800">3. المصاريف والمسحوبات (-)</span>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-base font-black text-rose-600 mt-1">
              -{totalExpensesAmount.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{dayExpenses.length} بنود مصاريف مدفوعة</div>
          </div>

          {/* Expected Final Drawer Balance */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="font-bold">4. الرصيد الدفتري المطلوب (=)</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base font-black text-amber-400 mt-1">
              {expectedCashInDrawer.toLocaleString()} <span className="text-[10px] text-slate-300">{currency}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">المبلغ المفترض تواجده فعلياً بالخزينة</div>
          </div>

        </div>

        {/* Reconciliation Interactive Calculator */}
        {showReconciliation && (
          <div className="p-4 rounded-xl bg-white border border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-600" />
                <span>حاسبة مطابقة الكاش الفعلي بالدرج:</span>
              </span>
              <span className="text-[11px] text-slate-500">قم بعدّ النقود الموجودة في الدرج وأدخل المبلغ لمقارنته فوراً</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المبلغ الفعلي المعدود بالدرج:</label>
                <div className="relative">
                  <input
                    type="number"
                    value={actualCashCounted}
                    onChange={(e) => setActualCashCounted(e.target.value)}
                    placeholder="مثال: 185000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-amber-400 rounded-lg font-mono font-bold text-xs outline-none"
                  />
                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold">{currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المبلغ الدفتري المطلوب بالدرج:</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg font-mono font-black text-xs text-slate-800 border border-slate-200">
                  {expectedCashInDrawer.toLocaleString()} {currency}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">حالة المطابقة والفارق:</label>
                {cashDiscrepancy === null ? (
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-400 border border-slate-200">
                    بانتظار إدخال المبلغ الفعلي...
                  </div>
                ) : cashDiscrepancy === 0 ? (
                  <div className="px-3 py-2 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مطابقة تامة 100% (لا يوجد عجز أو زيادة)</span>
                  </div>
                ) : cashDiscrepancy > 0 ? (
                  <div className="px-3 py-2 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>فائض نقدي بالدرج: +{cashDiscrepancy.toLocaleString()} {currency}</span>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>عجز نقدي بالصندوق: {cashDiscrepancy.toLocaleString()} {currency}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. Payment Methods & Shifts Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <h3 className="font-extrabold text-sm text-slate-900">طرق الدفع ومصادر المبيعات</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">إجمالي: {totalSales.toLocaleString()} {currency}</span>
          </div>

          <div className="space-y-3">
            {/* Cash */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>دفع نقدي (Cash)</span>
                  <span className="text-[10px] text-slate-500 font-normal">({paymentBreakdown.cash.count} طلبات)</span>
                </span>
                <span>{paymentBreakdown.cash.total.toLocaleString()} {currency} ({paymentBreakdown.cash.percent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentBreakdown.cash.percent}%` }}
                />
              </div>
            </div>

            {/* Card / Electronic */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>شبكة / دفع إلكتروني (Card / POS)</span>
                  <span className="text-[10px] text-slate-500 font-normal">({paymentBreakdown.card.count} طلبات)</span>
                </span>
                <span>{paymentBreakdown.card.total.toLocaleString()} {currency} ({paymentBreakdown.card.percent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentBreakdown.card.percent}%` }}
                />
              </div>
            </div>

            {/* Staff Meal / Other */}
            {paymentBreakdown.staff.total > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-purple-600" />
                    <span>وجبات وضيافة عمال (Staff Meal)</span>
                    <span className="text-[10px] text-slate-500 font-normal">({paymentBreakdown.staff.count} طلبات)</span>
                  </span>
                  <span>{paymentBreakdown.staff.total.toLocaleString()} {currency} ({paymentBreakdown.staff.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${paymentBreakdown.staff.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shifts Distribution (Morning vs Evening) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-extrabold text-sm text-slate-900">توزيع المبيعات حسب الورديات</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">صباحي ومسائي</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Morning Shift */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>الوردية الصباحية</span>
              </div>
              <div className="text-lg font-black text-slate-900 pt-1">
                {shiftBreakdown.morning.sales.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {shiftBreakdown.morning.orders} طلبات مكتملة
              </div>
            </div>

            {/* Evening Shift */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs">
                <Moon className="w-4 h-4 text-purple-600" />
                <span>الوردية المسائية</span>
              </div>
              <div className="text-lg font-black text-slate-900 pt-1">
                {shiftBreakdown.evening.sales.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {shiftBreakdown.evening.orders} طلبات مكتملة
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            💡 يتم تصنيف الوردية تلقائياً حسب توقيت إنشاء الفاتورة من كاشير الصباح أو المساء.
          </div>
        </div>

      </div>

      {/* 5. Top Selling Products Table for this Day */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                أكثر المنتجات مبيعاً لليوم ({topProducts.length} أصناف)
              </h3>
              <p className="text-xs text-slate-500">ترتيب المنتجات حسب الكمية المباعة، الإيراد المحقق، وهامش الربحية</p>
            </div>
          </div>

          {topProducts.length > 5 && (
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllProducts ? 'عرض أهم 5 فقط' : `عرض الكل (${topProducts.length})`}</span>
              {showAllProducts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            لا توجد مبيعات مسجلة في هذا التاريخ حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">اسم المنتج / الوجبة</th>
                  <th className="py-3 px-3 text-center">الكمية المباعة</th>
                  <th className="py-3 px-3">إجمالي الإيراد</th>
                  <th className="py-3 px-3">المساهمة في المبيعات</th>
                  <th className="py-3 px-3">الربح التقديري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(showAllProducts ? topProducts : topProducts.slice(0, 5)).map((item, idx) => {
                  const sharePercent = totalSales > 0 ? Math.round((item.revenue / totalSales) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                          idx === 1 ? 'bg-slate-200 text-slate-800' :
                          idx === 2 ? 'bg-amber-100 text-amber-900' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {item.productName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-slate-900">
                        {item.quantity} <span className="text-[10px] text-slate-500 font-normal">قطعة</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-slate-900">
                        {item.revenue.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{currency}</span>
                      </td>
                      <td className="py-3 px-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.min(100, sharePercent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-8">{sharePercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        +{item.profit.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{currency}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Orders List Collapse Toggle (Optional Audit Trail) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setShowOrdersList(!showOrdersList)}
          className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer text-xs font-bold text-slate-800"
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>سجل وتفاصيل فواتير اليوم بالكامل ({dayOrders.length} فاتورة)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>{showOrdersList ? 'إخفاء الفواتير' : 'عرض الفواتير'}</span>
            {showOrdersList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showOrdersList && (
          <div className="p-4 space-y-2 max-h-72 overflow-y-auto border-t border-slate-200">
            {dayOrders.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">لا توجد فواتير بعد لهذا اليوم</div>
            ) : (
              <div className="space-y-2">
                {dayOrders.map(order => (
                  <div key={order.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <span>فاتورة #{order.orderNumber}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                          order.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.paymentMethod === 'cash' ? 'نقداً' : 'شبكة/بطاقة'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {order.items.map(it => `${it.productName} (${it.quantity})`).join('، ')}
                      </div>
                    </div>
                    <div className="text-left font-mono">
                      <div className="font-black text-slate-900">{order.totalAmount.toLocaleString()} {currency}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Printable Z-Report Modal (جاهز للطباعة الفورية على الورق) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Top Actions */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>معاينة تقرير الإغلاق المالي (Z-Report)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الآن</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-6 text-xs text-slate-800 space-y-4 max-h-[80vh] overflow-y-auto font-sans print:p-0 print:m-0">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <div className="text-base font-black text-slate-900">{currentRestaurant.name}</div>
                <div className="text-slate-500 font-bold">{currentBranch?.name || 'الفرع الرئيسي'}</div>
                <div className="font-mono text-[11px] text-slate-500">تقرير الإغلاق المالي اليومي Z-REPORT</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  التاريخ: {selectedDate} | وقت الاستخراج: {new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Sales Summary */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-sm">
                  <span>إجمالي المبيعات اليومية:</span>
                  <span className="font-mono">{totalSales.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>عدد الطلبات المعتمدة:</span>
                  <span className="font-mono">{orderCount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>متوسط قيمة الفاتورة:</span>
                  <span className="font-mono">{avgOrderValue.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>إجمالي الربح التقديري:</span>
                  <span className="font-mono">+{totalGrossProfit.toLocaleString()} {currency}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                <div className="font-black text-slate-900">مقبوضات طرق الدفع:</div>
                <div className="flex justify-between text-slate-700">
                  <span>• نقداً (Cash):</span>
                  <span className="font-mono font-bold">{paymentBreakdown.cash.total.toLocaleString()} {currency} ({paymentBreakdown.cash.count} فواتير)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>• شبكة / بطاقة (Card):</span>
                  <span className="font-mono font-bold">{paymentBreakdown.card.total.toLocaleString()} {currency} ({paymentBreakdown.card.count} فواتير)</span>
                </div>
                {paymentBreakdown.staff.total > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>• وجبات عمال (Staff):</span>
                    <span className="font-mono font-bold">{paymentBreakdown.staff.total.toLocaleString()} {currency}</span>
                  </div>
                )}
              </div>

              {/* Treasury Reconciliation */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                <div className="font-black text-slate-900">حركة الخزينة وعُهدة الصندوق:</div>
                <div className="flex justify-between text-slate-600">
                  <span>رصيد الافتتاح:</span>
                  <span className="font-mono">{openingCash.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>(+) مقبوضات المبيعات النقدية:</span>
                  <span className="font-mono">+{paymentBreakdown.cash.total.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>(-) المصاريف والمسحوبات:</span>
                  <span className="font-mono">-{totalExpensesAmount.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-200">
                  <span>(=) الرصيد المتوقع بالخزينة:</span>
                  <span className="font-mono text-sm">{expectedCashInDrawer.toLocaleString()} {currency}</span>
                </div>
                {actualCashCounted && (
                  <div className="flex justify-between text-slate-900 font-bold pt-1">
                    <span>المبلغ الفعلي المعدود:</span>
                    <span className="font-mono">{Number(actualCashCounted).toLocaleString()} {currency}</span>
                  </div>
                )}
                {cashDiscrepancy !== null && (
                  <div className={`flex justify-between font-bold pt-1 ${cashDiscrepancy === 0 ? 'text-emerald-700' : cashDiscrepancy > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                    <span>الفارق (عجز / فائض):</span>
                    <span className="font-mono">{cashDiscrepancy > 0 ? `+${cashDiscrepancy.toLocaleString()}` : cashDiscrepancy.toLocaleString()} {currency}</span>
                  </div>
                )}
              </div>

              {/* Top 3 Products */}
              {topProducts.length > 0 && (
                <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                  <div className="font-black text-slate-900">أكثر 3 منتجات مبيعاً اليوم:</div>
                  {topProducts.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex justify-between text-slate-700 text-[11px]">
                      <span>#{i + 1} {p.productName} ({p.quantity} قطعة)</span>
                      <span className="font-mono">{p.revenue.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-2">
                  <div>توقيع الكاشير / المستلم</div>
                  <div className="font-bold text-slate-700 mt-1">{currentUser?.name || 'الكاشير'}</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div>اعتماد المدير / المالك</div>
                  <div className="font-bold text-slate-700 mt-1">مدير المطعم</div>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-3">
                نظام MATO POS لإدارة المطاعم ونقاط البيع الذكية © 2026
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
