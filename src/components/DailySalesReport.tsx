import React, { useState, useMemo, useEffect } from 'react';
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
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  isOwnerOrManager?: boolean;
  triggerOpenOrdersAt?: number;
}

export const DailySalesReport: React.FC<DailySalesReportProps> = ({
  initialDate,
  selectedDate: controlledDate,
  onDateChange,
  isOwnerOrManager = true,
  triggerOpenOrdersAt = 0
}) => {
  const {
    currentRestaurant,
    currentBranch,
    orders,
    expenses,
    purchases,
    products,
    currentUser,
    isPlatformOwner,
    activeShiftRole
  } = useData();

  const toLocalDateKey = (isoOrDateStr: string): string => {
    if (!isoOrDateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDateStr)) return isoOrDateStr;
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr.split('T')[0];
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Selected date: defaults to local today YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [internalDate, setInternalDate] = useState<string>(controlledDate || initialDate || todayStr);
  const selectedDate = controlledDate !== undefined ? controlledDate : internalDate;

  const updateSelectedDate = (newDate: string) => {
    setInternalDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  // Shift Drawer Filter: 'all' | 'cashier_morning' | 'cashier_evening'
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | 'cashier_morning' | 'cashier_evening'>(() => {
    if (activeShiftRole === 'cashier_morning') return 'cashier_morning';
    if (activeShiftRole === 'cashier_evening') return 'cashier_evening';
    return 'all';
  });

  useEffect(() => {
    if (activeShiftRole === 'cashier_morning') {
      setSelectedShiftFilter('cashier_morning');
    } else if (activeShiftRole === 'cashier_evening') {
      setSelectedShiftFilter('cashier_evening');
    }
  }, [activeShiftRole]);

  // Helper to determine if an Order or Expense belongs to Morning or Evening shift
  const getRecordShift = (rec: { shiftRole?: string; createdAt?: string; date?: string }): 'cashier_morning' | 'cashier_evening' => {
    if (rec.shiftRole === 'cashier_morning') return 'cashier_morning';
    if (rec.shiftRole === 'cashier_evening') return 'cashier_evening';
    const ts = rec.createdAt || rec.date || '';
    const hour = ts ? new Date(ts).getHours() : 12;
    return (hour >= 6 && hour < 16) ? 'cashier_morning' : 'cashier_evening';
  };

  // Helper to get or set Opening Cash for a specific shift ('cashier_morning' | 'cashier_evening')
  const getShiftOpeningKey = (shift: 'cashier_morning' | 'cashier_evening') =>
    `mato_opening_cash_${currentRestaurant.id || 'curr'}_${selectedDate}_${shift}`;

  const [morningOpeningCash, setMorningOpeningCash] = useState<number>(0);
  const [eveningOpeningCash, setEveningOpeningCash] = useState<number>(0);

  useEffect(() => {
    try {
      const mSaved = localStorage.getItem(getShiftOpeningKey('cashier_morning'));
      const eSaved = localStorage.getItem(getShiftOpeningKey('cashier_evening'));
      setMorningOpeningCash(mSaved !== null ? Number(mSaved) : 0);
      setEveningOpeningCash(eSaved !== null ? Number(eSaved) : 0);
    } catch {
      setMorningOpeningCash(0);
      setEveningOpeningCash(0);
    }
  }, [currentRestaurant.id, selectedDate]);

  // Helper to get or set Owner Manual Final Cash Override/Adjustment for a specific shift
  const getShiftFinalOverrideKey = (shift: 'cashier_morning' | 'cashier_evening') =>
    `mato_final_cash_override_${currentRestaurant.id || 'curr'}_${selectedDate}_${shift}`;

  const [morningFinalOverride, setMorningFinalOverride] = useState<number | null>(null);
  const [eveningFinalOverride, setEveningFinalOverride] = useState<number | null>(null);
  const [editingFinalShift, setEditingFinalShift] = useState<'cashier_morning' | 'cashier_evening' | 'all' | null>(null);
  const [tempFinalCashVal, setTempFinalCashVal] = useState<string>('');

  useEffect(() => {
    try {
      const mFinal = localStorage.getItem(getShiftFinalOverrideKey('cashier_morning'));
      const eFinal = localStorage.getItem(getShiftFinalOverrideKey('cashier_evening'));
      setMorningFinalOverride(mFinal !== null && mFinal !== '' ? Number(mFinal) : null);
      setEveningFinalOverride(eFinal !== null && eFinal !== '' ? Number(eFinal) : null);
    } catch {
      setMorningFinalOverride(null);
      setEveningFinalOverride(null);
    }
  }, [currentRestaurant.id, selectedDate]);

  // Period Analytics Mode: 'day' | 'week' | 'month'
  const [reportPeriodMode, setReportPeriodMode] = useState<'day' | 'week' | 'month'>('day');

  const isRestaurantOwner = isPlatformOwner || currentUser?.role === 'Owner' || activeShiftRole === 'owner';

  const openingCash =
    selectedShiftFilter === 'cashier_morning'
      ? morningOpeningCash
      : selectedShiftFilter === 'cashier_evening'
      ? eveningOpeningCash
      : morningOpeningCash + eveningOpeningCash;

  const [isEditingOpeningCash, setIsEditingOpeningCash] = useState(false);
  const [tempOpeningCash, setTempOpeningCash] = useState('0');
  const [editingShiftFloat, setEditingShiftFloat] = useState<'cashier_morning' | 'cashier_evening' | null>(null);
  const [tempShiftFloatVal, setTempShiftFloatVal] = useState('0');

  // Actual Counted Cash for reconciliation
  const [actualCashCounted, setActualCashCounted] = useState<string>('');
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (triggerOpenOrdersAt > 0) {
      setShowOrdersList(true);
    }
  }, [triggerOpenOrdersAt]);

  const openShiftOrdersAndScroll = (shift: 'all' | 'cashier_morning' | 'cashier_evening') => {
    setSelectedShiftFilter(shift);
    setShowOrdersList(true);
    setTimeout(() => {
      const el = document.getElementById('shift-orders-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Quick Date Changers
  const setQuickDate = (type: 'today' | 'yesterday') => {
    if (type === 'today') {
      updateSelectedDate(todayStr);
    } else {
      updateSelectedDate(yesterdayStr);
    }
  };

  const stepDate = (daysDelta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + daysDelta);
    const nextStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    updateSelectedDate(nextStr);
  };

  const handleSaveOpeningCash = () => {
    const val = Number(tempOpeningCash) || 0;
    const targetShift = selectedShiftFilter === 'cashier_evening' ? 'cashier_evening' : 'cashier_morning';
    if (targetShift === 'cashier_morning') {
      setMorningOpeningCash(val);
    } else {
      setEveningOpeningCash(val);
    }
    try {
      localStorage.setItem(getShiftOpeningKey(targetShift), val.toString());
    } catch {}
    setIsEditingOpeningCash(false);
  };

  const handleSaveSpecificShiftFloat = (shift: 'cashier_morning' | 'cashier_evening') => {
    const val = Number(tempShiftFloatVal) || 0;
    if (shift === 'cashier_morning') {
      setMorningOpeningCash(val);
    } else {
      setEveningOpeningCash(val);
    }
    try {
      localStorage.setItem(getShiftOpeningKey(shift), val.toString());
    } catch {}
    setEditingShiftFloat(null);
  };

  const handleSaveFinalCashOverride = (shift: 'cashier_morning' | 'cashier_evening' | 'all') => {
    if (tempFinalCashVal.trim() === '' || isNaN(Number(tempFinalCashVal))) {
      setEditingFinalShift(null);
      return;
    }
    const val = Number(tempFinalCashVal);
    const targetShift = shift === 'all' ? (selectedShiftFilter === 'cashier_evening' ? 'cashier_evening' : 'cashier_morning') : shift;
    if (targetShift === 'cashier_morning') {
      setMorningFinalOverride(val);
    } else {
      setEveningFinalOverride(val);
    }
    try {
      localStorage.setItem(getShiftFinalOverrideKey(targetShift), val.toString());
    } catch {}
    setEditingFinalShift(null);
  };

  const handleClearFinalCashOverride = (shift: 'cashier_morning' | 'cashier_evening') => {
    if (shift === 'cashier_morning') {
      setMorningFinalOverride(null);
    } else {
      setEveningFinalOverride(null);
    }
    try {
      localStorage.removeItem(getShiftFinalOverrideKey(shift));
    } catch {}
    setEditingFinalShift(null);
  };

  // 1. Filter orders for selected date AND selected shift drawer (using local date)
  const allDayOrders = useMemo(() => {
    return orders.filter(o => toLocalDateKey(o.createdAt) === selectedDate && o.status === 'completed');
  }, [orders, selectedDate]);

  const dayOrders = useMemo(() => {
    if (selectedShiftFilter === 'all') return allDayOrders;
    return allDayOrders.filter(o => getRecordShift(o) === selectedShiftFilter);
  }, [allDayOrders, selectedShiftFilter]);

  // 2. Filter expenses for selected date AND selected shift drawer (using local date)
  const allDayExpenses = useMemo(() => {
    return expenses.filter(e => toLocalDateKey(e.date) === selectedDate);
  }, [expenses, selectedDate]);

  const dayExpenses = useMemo(() => {
    if (selectedShiftFilter === 'all') return allDayExpenses;
    return allDayExpenses.filter(e => getRecordShift(e) === selectedShiftFilter);
  }, [allDayExpenses, selectedShiftFilter]);

  // 3. Filter purchases (فواتير مشتريات المواد الأولية) for selected date AND selected shift drawer
  const allDayPurchases = useMemo(() => {
    return purchases.filter(p => toLocalDateKey(p.date) === selectedDate);
  }, [purchases, selectedDate]);

  const dayPurchases = useMemo(() => {
    if (selectedShiftFilter === 'all') return allDayPurchases;
    return allDayPurchases.filter(p => getRecordShift(p) === selectedShiftFilter);
  }, [allDayPurchases, selectedShiftFilter]);

  // Financial Metrics (Exclude internal staff meals from customer sales & gross profit)
  const customerDayOrders = useMemo(() => {
    return dayOrders.filter(o => o.paymentMethod !== 'staff_meal');
  }, [dayOrders]);

  const totalSales = useMemo(() => {
    return customerDayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }, [customerDayOrders]);

  const totalCost = useMemo(() => {
    return customerDayOrders.reduce((acc, o) => acc + (o.costAmount || 0), 0);
  }, [customerDayOrders]);

  const totalGrossProfit = useMemo(() => {
    return customerDayOrders.reduce((acc, o) => acc + (o.profitAmount || (o.totalAmount - (o.costAmount || 0))), 0);
  }, [customerDayOrders]);

  const orderCount = customerDayOrders.length;
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
        staffTotal += (o.costAmount || 0);
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
      staff: { total: staffTotal, count: staffCount, percent: 0 }
    };
  }, [dayOrders, totalSales]);

  // Expenses Breakdown
  const totalExpensesAmount = useMemo(() => {
    return dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [dayExpenses]);

  // Purchases Breakdown (فواتير شراء البضاعة والمواد الأولية)
  const totalPurchasesAmount = useMemo(() => {
    return dayPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  }, [dayPurchases]);

  const cashDrawerPurchasesAmount = useMemo(() => {
    return dayPurchases
      .filter(p => p.payFromCashDrawer !== false)
      .reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  }, [dayPurchases]);

  // Cash Expenses paid out of physical cash drawer (excluding internal kitchen staff meals which consume inventory, not cash)
  const cashDrawerExpensesAmount = useMemo(() => {
    return dayExpenses
      .filter(e => !e.id.startsWith('exp_staff_') && e.paymentMethod === 'cash')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [dayExpenses]);

  // Total Cash Outflow from Drawer (Expenses + Cash Purchases)
  const totalCashDrawerOutflow = useMemo(() => {
    return cashDrawerExpensesAmount + cashDrawerPurchasesAmount;
  }, [cashDrawerExpensesAmount, cashDrawerPurchasesAmount]);

  // Cash Treasury Calculations
  // Cash In: Opening float + Cash sales
  // Cash Out: Cash expenses + Cash purchases paid from cash drawer
  const calculatedExpectedCashInDrawer = useMemo(() => {
    return openingCash + paymentBreakdown.cash.total - totalCashDrawerOutflow;
  }, [openingCash, paymentBreakdown.cash.total, totalCashDrawerOutflow]);

  // Full Shift Cash Drawer Breakdown (Morning vs Evening Net Cash in Drawer)
  const shiftBreakdown = useMemo(() => {
    const calcShiftDrawer = (
      shift: 'cashier_morning' | 'cashier_evening',
      shiftFloat: number,
      overrideVal: number | null
    ) => {
      const sOrders = allDayOrders.filter(o => getRecordShift(o) === shift && o.paymentMethod !== 'staff_meal');
      const totalShiftSales = sOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      const cashSales = sOrders
        .filter(o => !o.paymentMethod || o.paymentMethod === 'cash')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      const cardSales = sOrders
        .filter(o => o.paymentMethod === 'card')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      const sExpenses = allDayExpenses.filter(
        e => getRecordShift(e) === shift && !e.id.startsWith('exp_staff_') && e.paymentMethod === 'cash'
      );
      const cashExpenses = sExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      const sPurchases = allDayPurchases.filter(
        p => getRecordShift(p) === shift && p.payFromCashDrawer !== false
      );
      const cashPurchases = sPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

      const netCashBeforeFloat = cashSales - cashExpenses - cashPurchases;
      const calculatedExpected = shiftFloat + netCashBeforeFloat;
      const expectedCashInDrawer = overrideVal !== null ? overrideVal : calculatedExpected;

      return {
        sales: totalShiftSales,
        orders: sOrders.length,
        cashSales,
        cardSales,
        cashExpenses,
        expensesCount: sExpenses.length,
        cashPurchases,
        purchasesCount: sPurchases.length,
        openingFloat: shiftFloat,
        netCashBeforeFloat,
        calculatedExpected,
        expectedCashInDrawer,
        isOverridden: overrideVal !== null
      };
    };

    const morning = calcShiftDrawer('cashier_morning', morningOpeningCash, morningFinalOverride);
    const evening = calcShiftDrawer('cashier_evening', eveningOpeningCash, eveningFinalOverride);

    return { morning, evening };
  }, [allDayOrders, allDayExpenses, allDayPurchases, morningOpeningCash, eveningOpeningCash, morningFinalOverride, eveningFinalOverride]);

  const expectedCashInDrawer = useMemo(() => {
    if (selectedShiftFilter === 'cashier_morning') {
      return shiftBreakdown.morning.expectedCashInDrawer;
    }
    if (selectedShiftFilter === 'cashier_evening') {
      return shiftBreakdown.evening.expectedCashInDrawer;
    }
    if (morningFinalOverride !== null || eveningFinalOverride !== null) {
      return shiftBreakdown.morning.expectedCashInDrawer + shiftBreakdown.evening.expectedCashInDrawer;
    }
    return calculatedExpectedCashInDrawer;
  }, [selectedShiftFilter, shiftBreakdown, morningFinalOverride, eveningFinalOverride, calculatedExpectedCashInDrawer]);

  const cashDiscrepancy = useMemo(() => {
    if (!actualCashCounted || isNaN(Number(actualCashCounted))) return null;
    const actual = Number(actualCashCounted);
    return actual - expectedCashInDrawer;
  }, [actualCashCounted, expectedCashInDrawer]);

  // Period Orders for Sold Products Table ('day' | 'week' | 'month')
  const periodAnalytics = useMemo(() => {
    const [selY, selM, selD] = selectedDate.split('-').map(Number);
    const selDateObj = new Date(selY, selM - 1, selD, 23, 59, 59);
    const weekStartObj = new Date(selY, selM - 1, selD - 6, 0, 0, 0);
    const monthPrefix = `${selY}-${String(selM).padStart(2, '0')}`;

    const filteredOrders = orders.filter(o => {
      if (o.status !== 'completed' || o.paymentMethod === 'staff_meal') return false;
      if (selectedShiftFilter !== 'all' && getRecordShift(o) !== selectedShiftFilter) return false;

      const dKey = toLocalDateKey(o.createdAt);
      if (reportPeriodMode === 'day') {
        return dKey === selectedDate;
      }
      if (reportPeriodMode === 'month') {
        return dKey.startsWith(monthPrefix);
      }
      // week (last 7 days ending on selectedDate)
      const [oy, om, od] = dKey.split('-').map(Number);
      const oDate = new Date(oy, om - 1, od, 12, 0, 0);
      return oDate >= weekStartObj && oDate <= selDateObj;
    });

    const map: Record<string, {
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    let periodTotalRevenue = 0;
    let periodTotalUnits = 0;

    filteredOrders.forEach(o => {
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
        periodTotalRevenue += it.total;
        periodTotalUnits += it.quantity;

        const prod = products.find(p => p.id === it.productId || p.name === it.productName);
        const unitCost = prod?.cost || (it.price * 0.45);
        const itemCost = unitCost * it.quantity;
        map[it.productName].cost += itemCost;
        map[it.productName].profit += (it.total - itemCost);
      });
    });

    const sortedItems = Object.values(map).sort((a, b) => b.quantity - a.quantity);
    const weekStartStr = `${weekStartObj.getFullYear()}-${String(weekStartObj.getMonth() + 1).padStart(2, '0')}-${String(weekStartObj.getDate()).padStart(2, '0')}`;

    return {
      items: sortedItems,
      ordersCount: filteredOrders.length,
      totalRevenue: periodTotalRevenue,
      totalUnits: periodTotalUnits,
      periodLabel:
        reportPeriodMode === 'day'
          ? `يوم ${selectedDate}`
          : reportPeriodMode === 'week'
          ? `آخر 7 أيام (${weekStartStr} إلى ${selectedDate})`
          : `شهر ${monthPrefix} بالكامل`
    };
  }, [orders, selectedDate, selectedShiftFilter, reportPeriodMode, products]);

  // Top Selling Products for current selected period
  const topProducts = periodAnalytics.items;

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

          {/* Date Picker Input with Prev/Next Day Arrows */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => stepDate(-1)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 font-black text-xs border border-slate-200 cursor-pointer"
              title="اليوم السابق"
            >
              ◀ اليوم السابق
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => updateSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 hover:border-amber-400 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-black outline-none cursor-pointer focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="button"
              onClick={() => stepDate(1)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 font-black text-xs border border-slate-200 cursor-pointer"
              title="اليوم التالي"
            >
              اليوم التالي ▶
            </button>
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

      {/* Shift Drawer Isolation Selector (فصل صندوق الكاشير الصباحي عن المسائي) */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Layers className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-extrabold text-amber-400">فصل صناديق الكاش حسب الوردية:</span>
          <span className="text-slate-300 text-[11px]">كل وردية لها عهدة افتتاحية، كاش مبيعات، ومصاريف مستقلة تماماً</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedShiftFilter('cashier_morning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              selectedShiftFilter === 'cashier_morning'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>☀️ صندوق الكاشير الصباحي</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedShiftFilter('cashier_evening')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              selectedShiftFilter === 'cashier_evening'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>🌙 صندوق الكاشير المسائي</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedShiftFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              selectedShiftFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>📊 إجمالي اليوم (الورديتين معاً)</span>
          </button>
        </div>
      </div>

      {/* 1.5 Side-by-Side Shift Cash Drawer Summary (صافي الكاش المتبقي بكل وردية بعد البيع والمشتريات والمصاريف) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl p-5 border-2 border-amber-400/40 shadow-lg text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-400">
                صافي الكاش المفروض تواجده في الدرج لكل وردية (الصباحية والمسائية)
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                حساب تلقائي مستقل لكل وردية: (المبيعات النقدية + عهدة الصندوق) − (مشتريات الكاش + مصاريف الكاش) = الصافي المفروض بالكاش
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-800 text-amber-300 px-3 py-1 rounded-xl border border-slate-700 self-start sm:self-center">
            تاريخ الجرد: {selectedDate}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Morning Shift Drawer Card */}
          <div
            onClick={() => setSelectedShiftFilter('cashier_morning')}
            className={`rounded-2xl p-4 border-2 transition-all cursor-pointer ${
              selectedShiftFilter === 'cashier_morning'
                ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-400/10'
                : 'bg-slate-800/70 border-slate-700 hover:border-amber-400/60'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-sm text-amber-300">☀️ كاش الوردية الصباحية</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{shiftBreakdown.morning.orders} فاتورة بيع مسجلة</span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openShiftOrdersAndScroll('cashier_morning');
                      }}
                      className="text-[10px] bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 font-black px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      📋 عرض فواتير الصباح
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1.5">
                  <span>المفروض فاضل بالكاش الصباحي:</span>
                  {isRestaurantOwner && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingFinalShift('cashier_morning');
                        setTempFinalCashVal(String(shiftBreakdown.morning.expectedCashInDrawer));
                      }}
                      className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-slate-950 font-black text-[10px] transition-colors cursor-pointer"
                    >
                      ✎ تعديل النهائي
                    </button>
                  )}
                </div>
                {editingFinalShift === 'cashier_morning' ? (
                  <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={tempFinalCashVal}
                      onChange={e => setTempFinalCashVal(e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-900 border border-amber-400 rounded text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveFinalCashOverride('cashier_morning')}
                      className="px-2 py-1 bg-amber-400 text-slate-950 font-black rounded text-[10px] cursor-pointer"
                    >
                      حفظ
                    </button>
                    {shiftBreakdown.morning.isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleClearFinalCashOverride('cashier_morning')}
                        className="px-1.5 py-1 bg-rose-600 text-white font-bold rounded text-[10px] cursor-pointer"
                        title="إعادة الحساب التلقائي"
                      >
                        تلقائي
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`text-xl font-black font-mono ${shiftBreakdown.morning.expectedCashInDrawer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {shiftBreakdown.morning.expectedCashInDrawer.toLocaleString()} <span className="text-xs text-amber-300">{currency}</span>
                    {shiftBreakdown.morning.isOverridden && (
                      <span className="block text-[9px] text-amber-400 font-bold">مُعدّل يدوياً من المالك</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/70">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>عهدة أول الوردية</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingShiftFloat('cashier_morning');
                      setTempShiftFloatVal(String(morningOpeningCash));
                    }}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    تعديل
                  </button>
                </div>
                {editingShiftFloat === 'cashier_morning' ? (
                  <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={tempShiftFloatVal}
                      onChange={e => setTempShiftFloatVal(e.target.value)}
                      className="w-full px-1.5 py-0.5 bg-slate-800 border border-amber-400 rounded text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveSpecificShiftFloat('cashier_morning')}
                      className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px]"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div className="font-black text-white font-mono text-xs mt-1">
                    {morningOpeningCash.toLocaleString()} {currency}
                  </div>
                )}
              </div>

              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
                <div className="text-emerald-300 font-bold">(+) مبيعات الكاش</div>
                <div className="font-black text-emerald-400 font-mono text-xs mt-1">
                  +{shiftBreakdown.morning.cashSales.toLocaleString()} {currency}
                </div>
              </div>

              <div className="bg-orange-950/40 p-2.5 rounded-xl border border-orange-700/40">
                <div className="text-orange-300 font-bold">(-) مشتريات البضاعة</div>
                <div className="font-black text-orange-400 font-mono text-xs mt-1">
                  -{shiftBreakdown.morning.cashPurchases.toLocaleString()} {currency}
                </div>
              </div>

              <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-700/40">
                <div className="text-rose-300 font-bold">(-) المصاريف النقدية</div>
                <div className="font-black text-rose-400 font-mono text-xs mt-1">
                  -{shiftBreakdown.morning.cashExpenses.toLocaleString()} {currency}
                </div>
              </div>
            </div>
          </div>

          {/* Evening Shift Drawer Card */}
          <div
            onClick={() => setSelectedShiftFilter('cashier_evening')}
            className={`rounded-2xl p-4 border-2 transition-all cursor-pointer ${
              selectedShiftFilter === 'cashier_evening'
                ? 'bg-indigo-950/50 border-indigo-400 shadow-md shadow-indigo-400/10'
                : 'bg-slate-800/70 border-slate-700 hover:border-indigo-400/60'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-sm text-indigo-300">🌙 كاش الوردية المسائية</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{shiftBreakdown.evening.orders} فاتورة بيع مسجلة</span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openShiftOrdersAndScroll('cashier_evening');
                      }}
                      className="text-[10px] bg-indigo-500/30 hover:bg-indigo-400 text-indigo-200 hover:text-slate-950 font-black px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      📋 عرض فواتير المساء
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1.5">
                  <span>المفروض فاضل بالكاش المسائي:</span>
                  {isRestaurantOwner && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingFinalShift('cashier_evening');
                        setTempFinalCashVal(String(shiftBreakdown.evening.expectedCashInDrawer));
                      }}
                      className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 hover:bg-indigo-400 hover:text-slate-950 font-black text-[10px] transition-colors cursor-pointer"
                    >
                      ✎ تعديل النهائي
                    </button>
                  )}
                </div>
                {editingFinalShift === 'cashier_evening' ? (
                  <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={tempFinalCashVal}
                      onChange={e => setTempFinalCashVal(e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-900 border border-indigo-400 rounded text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveFinalCashOverride('cashier_evening')}
                      className="px-2 py-1 bg-indigo-500 text-white font-black rounded text-[10px] cursor-pointer"
                    >
                      حفظ
                    </button>
                    {shiftBreakdown.evening.isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleClearFinalCashOverride('cashier_evening')}
                        className="px-1.5 py-1 bg-rose-600 text-white font-bold rounded text-[10px] cursor-pointer"
                        title="إعادة الحساب التلقائي"
                      >
                        تلقائي
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`text-xl font-black font-mono ${shiftBreakdown.evening.expectedCashInDrawer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {shiftBreakdown.evening.expectedCashInDrawer.toLocaleString()} <span className="text-xs text-indigo-300">{currency}</span>
                    {shiftBreakdown.evening.isOverridden && (
                      <span className="block text-[9px] text-indigo-300 font-bold">مُعدّل يدوياً من المالك</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/70">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>عهدة أول الوردية</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingShiftFloat('cashier_evening');
                      setTempShiftFloatVal(String(eveningOpeningCash));
                    }}
                    className="text-[10px] text-indigo-400 hover:underline font-bold"
                  >
                    تعديل
                  </button>
                </div>
                {editingShiftFloat === 'cashier_evening' ? (
                  <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={tempShiftFloatVal}
                      onChange={e => setTempShiftFloatVal(e.target.value)}
                      className="w-full px-1.5 py-0.5 bg-slate-800 border border-indigo-400 rounded text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveSpecificShiftFloat('cashier_evening')}
                      className="px-2 py-0.5 bg-indigo-500 text-white font-black rounded text-[10px]"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div className="font-black text-white font-mono text-xs mt-1">
                    {eveningOpeningCash.toLocaleString()} {currency}
                  </div>
                )}
              </div>

              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
                <div className="text-emerald-300 font-bold">(+) مبيعات الكاش</div>
                <div className="font-black text-emerald-400 font-mono text-xs mt-1">
                  +{shiftBreakdown.evening.cashSales.toLocaleString()} {currency}
                </div>
              </div>

              <div className="bg-orange-950/40 p-2.5 rounded-xl border border-orange-700/40">
                <div className="text-orange-300 font-bold">(-) مشتريات البضاعة</div>
                <div className="font-black text-orange-400 font-mono text-xs mt-1">
                  -{shiftBreakdown.evening.cashPurchases.toLocaleString()} {currency}
                </div>
              </div>

              <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-700/40">
                <div className="text-rose-300 font-bold">(-) المصاريف النقدية</div>
                <div className="font-black text-rose-400 font-mono text-xs mt-1">
                  -{shiftBreakdown.evening.cashExpenses.toLocaleString()} {currency}
                </div>
              </div>
            </div>
          </div>
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

        {/* Today's Expenses & Purchases */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-300/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold text-rose-900">إجمالي المصاريف والمشتريات</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {(totalExpensesAmount + totalPurchasesAmount).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-rose-800 pt-2 border-t border-rose-200/60 font-semibold">
            <span>مصاريف: <strong>{totalExpensesAmount.toLocaleString()}</strong> ({dayExpenses.length})</span>
            <span>مشتريات بضاعة: <strong>{totalPurchasesAmount.toLocaleString()}</strong> ({dayPurchases.length})</span>
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
          <div className={`text-2xl font-black tracking-tight ${expectedCashInDrawer < 0 ? 'text-rose-400' : 'text-white'}`}>
            {expectedCashInDrawer.toLocaleString()} <span className="text-xs font-normal text-amber-300">{currency}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-700/80 font-medium">
            <span>مبيعات نقد: <strong className="text-emerald-400 font-bold">+{paymentBreakdown.cash.total.toLocaleString()}</strong></span>
            <span>مصاريف ومشتريات: <strong className="text-rose-400 font-bold">-{totalCashDrawerOutflow.toLocaleString()}</strong></span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Opening Float */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-slate-700">1. عهدة الصندوق (الافتتاح)</span>
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
              <span className="font-bold text-emerald-800">2. المبيعات النقدية (+)</span>
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
              <span className="font-bold text-rose-800">3. المصاريف التشغيلية (-)</span>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-base font-black text-rose-600 mt-1">
              -{cashDrawerExpensesAmount.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{dayExpenses.length} بنود مصاريف وأجور</div>
          </div>

          {/* Cash Purchases Outflow */}
          <div className="bg-white p-3.5 rounded-xl border border-orange-200 bg-orange-50/30 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-orange-900">4. مشتريات المواد من الكاش (-)</span>
              <ShoppingBag className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-base font-black text-orange-700 mt-1">
              -{cashDrawerPurchasesAmount.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
            </div>
            <div className="text-[10px] text-slate-600 mt-1">{dayPurchases.filter(p => p.payFromCashDrawer !== false).length} فواتير شراء مدفوعة من الصندوق</div>
          </div>

          {/* Expected Final Drawer Balance */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="font-bold">5. الرصيد النهائي بالكاش (=)</span>
              {isRestaurantOwner ? (
                editingFinalShift === 'all' ? (
                  <button
                    type="button"
                    onClick={() => handleSaveFinalCashOverride('all')}
                    className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black cursor-pointer"
                  >
                    حفظ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempFinalCashVal(String(expectedCashInDrawer));
                      setEditingFinalShift('all');
                    }}
                    className="text-[10px] text-amber-400 hover:underline font-extrabold cursor-pointer"
                  >
                    ✎ تعديل النهائي
                  </button>
                )
              ) : (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              )}
            </div>
            {editingFinalShift === 'all' ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={tempFinalCashVal}
                  onChange={e => setTempFinalCashVal(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-800 border border-amber-400 rounded font-mono font-bold text-xs text-white"
                />
              </div>
            ) : (
              <div className={`text-base font-black mt-1 ${expectedCashInDrawer < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                {expectedCashInDrawer.toLocaleString()} <span className="text-[10px] text-slate-300">{currency}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">
              {(selectedShiftFilter === 'cashier_morning' && shiftBreakdown.morning.isOverridden) ||
              (selectedShiftFilter === 'cashier_evening' && shiftBreakdown.evening.isOverridden) ||
              (selectedShiftFilter === 'all' && (morningFinalOverride !== null || eveningFinalOverride !== null))
                ? 'مُعدّل يدوياً من مالك المطعم'
                : 'بعد خصم المصاريف والمشتريات'}
            </div>
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
              <div className="flex items-center justify-between text-amber-900 font-extrabold text-xs">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>الوردية الصباحية</span>
                </span>
                <span className="text-[10px] bg-amber-200/70 px-1.5 py-0.5 rounded">{shiftBreakdown.morning.orders} طلبات</span>
              </div>
              <div className="text-lg font-black text-slate-900 pt-1">
                {shiftBreakdown.morning.sales.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
              </div>
              <div className="text-[11px] text-emerald-800 font-black pt-1 border-t border-amber-200/60 flex justify-between">
                <span>فاضل بالكاش الصباحي:</span>
                <span>{shiftBreakdown.morning.expectedCashInDrawer.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Evening Shift */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
              <div className="flex items-center justify-between text-purple-900 font-extrabold text-xs">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-600" />
                  <span>الوردية المسائية</span>
                </span>
                <span className="text-[10px] bg-purple-200/70 px-1.5 py-0.5 rounded">{shiftBreakdown.evening.orders} طلبات</span>
              </div>
              <div className="text-lg font-black text-slate-900 pt-1">
                {shiftBreakdown.evening.sales.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
              </div>
              <div className="text-[11px] text-indigo-900 font-black pt-1 border-t border-purple-200/60 flex justify-between">
                <span>فاضل بالكاش المسائي:</span>
                <span>{shiftBreakdown.evening.expectedCashInDrawer.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            💡 يتم تصنيف الوردية تلقائياً حسب توقيت إنشاء الفاتورة من كاشير الصباح أو المساء.
          </div>
        </div>

      </div>

      {/* 5. Top Selling Products Table (اليوم / الأسبوع / الشهر) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                جرد كل ما تم بيعه ({periodAnalytics.periodLabel}) — ({topProducts.length} أصناف)
              </h3>
              <p className="text-xs text-slate-500">
                إجمالي القطع المباعة: <strong className="text-slate-900">{periodAnalytics.totalUnits} قطعة</strong> • إجمالي المبيعات: <strong className="text-emerald-700">{periodAnalytics.totalRevenue.toLocaleString()} {currency}</strong> ({periodAnalytics.ordersCount} فاتورة)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filter: Day / Week / Month */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setReportPeriodMode('day')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  reportPeriodMode === 'day'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 مبيعات اليوم
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodMode('week')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  reportPeriodMode === 'week'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📆 مبيعات الأسبوع (7 أيام)
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodMode('month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  reportPeriodMode === 'month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🗓️ مبيعات الشهر الكامل
              </button>
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
        </div>

        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            لا توجد مبيعات مسجلة في هذه الفترة ({periodAnalytics.periodLabel}) حتى الآن.
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
                {(showAllProducts || reportPeriodMode !== 'day' ? topProducts : topProducts.slice(0, 5)).map((item, idx) => {
                  const sharePercent = periodAnalytics.totalRevenue > 0 ? Math.round((item.revenue / periodAnalytics.totalRevenue) * 100) : 0;
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

      {/* 6. Orders List Collapse Toggle (Audit Trail per Shift) */}
      <div id="shift-orders-section" className="rounded-2xl border-2 border-amber-300/80 bg-white overflow-hidden scroll-mt-4 shadow-xs">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowOrdersList(!showOrdersList)}
            className="flex items-center gap-2 text-right cursor-pointer"
          >
            <Receipt className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-black text-xs sm:text-sm text-amber-300 flex items-center gap-2">
                <span>
                  سجل وتفاصيل الطلبات والفواتير (
                  {selectedShiftFilter === 'cashier_morning'
                    ? '☀️ الوردية الصباحية'
                    : selectedShiftFilter === 'cashier_evening'
                    ? '🌙 الوردية المسائية'
                    : '📊 جميع الورديات'}
                  )
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                  {dayOrders.length} فاتورة
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                عرض كل طلب بالتفصيل مع توقيته، الأصناف المباعة بداخله، والوردية التي أصدرته
              </p>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedShiftFilter('cashier_morning');
                setShowOrdersList(true);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                selectedShiftFilter === 'cashier_morning'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ☀️ طلبات الصباح ({allDayOrders.filter(o => getRecordShift(o) === 'cashier_morning').length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedShiftFilter('cashier_evening');
                setShowOrdersList(true);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                selectedShiftFilter === 'cashier_evening'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🌙 طلبات المساء ({allDayOrders.filter(o => getRecordShift(o) === 'cashier_evening').length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedShiftFilter('all');
                setShowOrdersList(true);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                selectedShiftFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📊 الكل ({allDayOrders.length})
            </button>

            <button
              type="button"
              onClick={() => setShowOrdersList(!showOrdersList)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{showOrdersList ? 'طيّ' : 'فتح'}</span>
              {showOrdersList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showOrdersList && (
          <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto border-t border-slate-200 bg-slate-50/40">
            {dayOrders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-bold">
                لا توجد فواتير مسجلة في هذه الوردية بتاريخ ({selectedDate})
              </div>
            ) : (
              <div className="space-y-2">
                {dayOrders.map(order => {
                  const orderShift = getRecordShift(order);
                  return (
                    <div key={order.id} className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all">
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm">فاتورة #{order.orderNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                            orderShift === 'cashier_morning'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          }`}>
                            {orderShift === 'cashier_morning' ? '☀️ الوردية الصباحية' : '🌙 الوردية المسائية'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            order.paymentMethod === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.paymentMethod === 'staff_meal'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.paymentMethod === 'cash'
                              ? '💵 نقداً (Cash)'
                              : order.paymentMethod === 'staff_meal'
                              ? '🍲 وجبة عمال'
                              : '💳 شبكة/بطاقة'}
                          </span>
                          {order.createdByName && (
                            <span className="text-[10px] text-slate-500 font-bold">
                              بواسطة: {order.createdByName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-700 font-bold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          {order.items.map(it => `${it.productName} × ${it.quantity}`).join(' ، ')}
                        </div>
                      </div>
                      <div className="text-left font-mono flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="font-black text-sm text-slate-900">
                          {order.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold">
                          🕒 {new Date(order.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  <span>(-) المصاريف والأجور النقدية:</span>
                  <span className="font-mono">-{cashDrawerExpensesAmount.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-orange-700 font-bold">
                  <span>(-) فواتير مشتريات المواد من الصندوق:</span>
                  <span className="font-mono">-{cashDrawerPurchasesAmount.toLocaleString()} {currency}</span>
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
