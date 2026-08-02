import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ExpenseCategory, Expense } from '../types';
import {
  Wallet,
  Plus,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  UserCheck,
  Flame,
  Zap,
  Sparkles,
  Receipt,
  Tag,
  CreditCard,
  Building,
  Wrench,
  Package,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  Utensils,
  Pencil,
  Scan
} from 'lucide-react';
import { InvoiceScannerModal } from './InvoiceScannerModal';

export const ExpensesView: React.FC = () => {
  const { currentRestaurant, expenses, addExpense, updateExpense, deleteExpense, clearAllExpenses, currentUser } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceScanner, setShowInvoiceScanner] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'wages' as ExpenseCategory,
    amount: '',
    recipientOrWorker: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setForm({
      title: '',
      category: 'wages',
      amount: '',
      recipientOrWorker: '',
      paymentMethod: 'cash',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleEditClick = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({
      title: exp.title,
      category: exp.category,
      amount: exp.amount.toString(),
      recipientOrWorker: exp.recipientOrWorker || '',
      paymentMethod: exp.paymentMethod || 'cash',
      notes: exp.notes || '',
      date: exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  // Preset Fast-Add Helper
  const applyPreset = (presetTitle: string, category: ExpenseCategory, defaultAmount?: number, recipient?: string) => {
    setEditingExpense(null);
    setForm({
      title: presetTitle,
      category,
      amount: defaultAmount ? defaultAmount.toString() : '',
      recipientOrWorker: recipient || '',
      paymentMethod: 'cash',
      notes: 'تسجيل سريع من الأزرار الجاهزة',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || Number(form.amount) <= 0) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        notes: form.notes,
        recipientOrWorker: form.recipientOrWorker,
        paymentMethod: form.paymentMethod,
        date: form.date ? new Date(form.date).toISOString() : editingExpense.date
      });
      triggerNotify(`تم تعديل المصروف "${form.title}" بنجاح!`);
    } else {
      addExpense(
        form.title,
        form.category,
        Number(form.amount),
        form.notes,
        form.recipientOrWorker,
        form.paymentMethod,
        form.date ? new Date(form.date).toISOString() : undefined
      );
      triggerNotify(`تم تسجيل المصروف "${form.title}" بقيمة ${Number(form.amount).toLocaleString()} ${currentRestaurant.currency} بنجاح!`);
    }

    setShowModal(false);
    setEditingExpense(null);
    setForm({
      title: '',
      category: 'wages',
      amount: '',
      recipientOrWorker: '',
      paymentMethod: 'cash',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter(e => e.date.startsWith(todayStr));
  const todayTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const wagesTotal = expenses.filter(e => e.category === 'wages').reduce((acc, e) => acc + e.amount, 0);
  const utilitiesTotal = expenses.filter(e => e.category === 'utilities').reduce((acc, e) => acc + e.amount, 0);
  const suppliesTotal = expenses.filter(e => e.category === 'supplies').reduce((acc, e) => acc + e.amount, 0);
  const staffMealsTotal = expenses.filter(e => e.category === 'staff_meals').reduce((acc, e) => acc + e.amount, 0);
  const grandTotal = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Filtered Expenses List
  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.recipientOrWorker && e.recipientOrWorker.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: ExpenseCategory) => {
    switch (category) {
      case 'wages':
        return { label: 'أجور ورواتب عمال', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: UserCheck };
      case 'utilities':
        return { label: 'غاز وكهرباء وماء', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Zap };
      case 'supplies':
        return { label: 'محارم ومستلزمات', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Package };
      case 'rent':
        return { label: 'إيجار العقار', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Building };
      case 'maintenance':
        return { label: 'صيانة وإصلاحات', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Wrench };
      case 'staff_meals':
        return { label: 'وجبات وأكل العمال', color: 'bg-orange-50 text-orange-800 border-orange-200', icon: Utensils };
      default:
        return { label: 'مصاريف أخرى', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Tag };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-amber-400 px-5 py-3 rounded-2xl shadow-2xl border border-amber-400/30 flex items-center gap-3 animate-bounce text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
              إدارة المصاريف والتشغيل
            </span>
            <span className="text-slate-400 text-xs">سهولة التكلفة اليومية</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>أجور العمال والمصاريف التشغيلية</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            سجّل أجور عمال الصالة والمطبخ، أسطوانات الغاز، فواتير الكهرباء والمحارم والمستلزمات بسهولة تامة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInvoiceScanner(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-400/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Scan className="w-5 h-5 text-slate-950" />
            <span>📸 مسح فاتورة بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>إضافة مصروف / أجر جديد</span>
          </button>
        </div>
      </div>

      {/* Fast Presets Section (إضافات إدخال سريعة بضغطة زر) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">إضافة سريعة بنقرة واحدة (أكثر المصاريف شيوعاً)</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">تعبئة نموذج تلقائي مريح</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => applyPreset('أجر عامل صالة / مطبخ (يومية)', 'wages', 50000, 'عامل الصالة')}
            className="p-3 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-xs mb-1">
              <UserCheck className="w-4 h-4" />
              <span>أجور عمال</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-blue-900">+ تسجيل أجر عامل</span>
          </button>

          <button
            onClick={() => applyPreset('تعبئة أسطوانة غاز للمطبخ', 'utilities', 85000, 'مورد الغاز')}
            className="p-3 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-amber-700 font-extrabold text-xs mb-1">
              <Flame className="w-4 h-4" />
              <span>غاز المطبخ</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-amber-900">+ أسطوانة غاز</span>
          </button>

          <button
            onClick={() => applyPreset('فاتورة كهرباء / اشتراك مولدة', 'utilities', 120000, 'شركة الكهرباء')}
            className="p-3 bg-yellow-50/70 hover:bg-yellow-100/80 border border-yellow-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-yellow-800 font-extrabold text-xs mb-1">
              <Zap className="w-4 h-4" />
              <span>كهرباء / مولد</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-yellow-950">+ فاتورة كهرباء</span>
          </button>

          <button
            onClick={() => applyPreset('شراء محارم وورقيات صالة', 'supplies', 35000, 'محل المستلزمات')}
            className="p-3 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs mb-1">
              <Receipt className="w-4 h-4" />
              <span>محارم وورقيات</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-emerald-900">+ علب محارم</span>
          </button>

          <button
            onClick={() => applyPreset('شراء مواد منظفات وتعقيم', 'supplies', 25000, 'مورد المنظفات')}
            className="p-3 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-teal-700 font-extrabold text-xs mb-1">
              <Package className="w-4 h-4" />
              <span>مواد نظافة</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-teal-900">+ منظفات وتعقيم</span>
          </button>

          <button
            onClick={() => applyPreset('صيانة معدات أو أدوات طارئة', 'maintenance', 40000, 'فني الصيانة')}
            className="p-3 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs mb-1">
              <Wrench className="w-4 h-4" />
              <span>صيانة طارئة</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-rose-900">+ إصلاح ومستلزمات</span>
          </button>

          <button
            onClick={() => applyPreset('وجبة طعام للعمال من أطباق المحل', 'staff_meals', 30000, 'طاقم العمل والعمال')}
            className="p-3 bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200 rounded-xl text-right transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-orange-800 font-extrabold text-xs mb-1">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>أكل وجبات العمال</span>
            </div>
            <span className="text-[11px] text-slate-600 block group-hover:text-orange-950">+ وجبة عمال من المحل</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">مصاريف اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {todayTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            مجموع {todayExpenses.length} عمليات اليوم
          </div>
        </div>

        {/* Wages Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">أجور ورواتب العمال</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {wagesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="text-[11px] text-blue-600 mt-1 font-semibold">
            عمال الصالة والمطبخ
          </div>
        </div>

        {/* Utilities (Gas & Electricity) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">الغاز والكهرباء والماء</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {utilitiesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-semibold">
            طاقة وتشغيل المطبخ
          </div>
        </div>

        {/* Supplies Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">المحارم والاستهلاكات</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {suppliesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currentRestaurant.currency}</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
            ورقيات ومستلزمات النظافة
          </div>
        </div>

      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'all', label: 'كافة المصاريف', count: expenses.length },
            { id: 'wages', label: '👷 أجور عمال', count: expenses.filter(e => e.category === 'wages').length },
            { id: 'utilities', label: '⚡ غاز وكهرباء', count: expenses.filter(e => e.category === 'utilities').length },
            { id: 'supplies', label: '🧻 محارم ومستلزمات', count: expenses.filter(e => e.category === 'supplies').length },
            { id: 'rent', label: '🏢 إيجار', count: expenses.filter(e => e.category === 'rent').length },
            { id: 'maintenance', label: '🛠️ صيانة', count: expenses.filter(e => e.category === 'maintenance').length },
            { id: 'staff_meals', label: '🍲 أكل وجبات العمال', count: expenses.filter(e => e.category === 'staff_meals').length },
            { id: 'other', label: '📦 أخرى', count: expenses.filter(e => e.category === 'other').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === tab.id ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالعنوان، العامل أو البيان..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

      </div>

      {/* Expenses Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">سجل المصاريف والأجور المسجلة</h2>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-bold">
              الإجمالي المعروض: {filteredExpenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()} {currentRestaurant.currency}
            </span>

            {expenses.length > 0 && (
              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-colors cursor-pointer"
                title="مسح كامل سجل المصاريف والأجور"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>مسح جميع المصاريف</span>
              </button>
            )}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Wallet className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-600">لا توجد مصاريف أو أجور مسجلة في هذه الفئة</p>
            <p className="text-xs text-slate-400">يمكنك الضغط على أزرار الإضافة السريعة أعلاه أو زر "إضافة مصروف جديد"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">فئة المصروف</th>
                  <th className="p-3.5">بيان المصروف / البند</th>
                  <th className="p-3.5">العامل / المستلم</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">بواسطة</th>
                  <th className="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map(item => {
                  const badge = getCategoryBadge(item.category);
                  const Icon = badge.icon;
                  const dateObj = new Date(item.date);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? item.date
                    : dateObj.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-slate-500 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 w-fit ${badge.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-extrabold text-slate-900">
                        <div>{item.title}</div>
                        {item.notes && <div className="text-[11px] text-slate-400 font-normal mt-0.5">{item.notes}</div>}
                      </td>

                      <td className="p-3.5 text-slate-700 font-bold whitespace-nowrap">
                        {item.recipientOrWorker ? (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                            <span>{item.recipientOrWorker}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px]">
                          {item.paymentMethod === 'cash' ? 'نقدي (كاش)' : item.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}
                        </span>
                      </td>

                      <td className="p-3.5 font-black text-amber-600 text-sm whitespace-nowrap">
                        {item.amount.toLocaleString()} {currentRestaurant.currency}
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.createdByName}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="px-2.5 py-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="تعديل المصروف"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-500" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="مسح المصروف"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>مسح</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding Expense */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs my-auto max-h-[88vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف / أجر عامل'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingExpense ? 'قم بتعديل وتحديث بيانات المصروف' : 'سجل التكاليف التشغيلية لتنظيم الأرباح بدقة'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 pb-20">
              
              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">فئة المصروف *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold text-slate-900"
                >
                  <option value="wages">👷 أجور ورواتب عمال (صالة / مطبخ / توصيل)</option>
                  <option value="utilities">⚡ غاز المطبخ، كهرباء واشتراك مولد، ماء</option>
                  <option value="supplies">🧻 محارم وورقيات، منظفات ومستلزمات صالة</option>
                  <option value="rent">🏢 إيجار العقار والمكان</option>
                  <option value="maintenance">🛠️ صيانة وإصلاح أدوات ومعدات</option>
                  <option value="staff_meals">🍲 وجبات وأكل العمال (طعام موظفين من وجبات المحل)</option>
                  <option value="other">📦 مصاريف ونثريات أخرى</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان أو بيان المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أجر العامل أحمد، عبوة غاز، علب محارم رول..."
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                />
              </div>

              {/* Amount & Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ الإجمالي * ({currentRestaurant.currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="مثال: 50000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-extrabold text-amber-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم العامل / المستلم (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: أحمد عامل الصالة، شركة الغاز"
                    value={form.recipientOrWorker}
                    onChange={e => setForm({ ...form, recipientOrWorker: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                  />
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                  >
                    <option value="cash">نقدي (كاش الصندوق)</option>
                    <option value="card">بطاقة ائتمان / مدى</option>
                    <option value="bank">تحويل بنكي / شيك</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ المصروف</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات أو توضيح</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات تفصيلية إذا لزم الأمر..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl shadow-md shadow-amber-400/20"
                >
                  {editingExpense ? 'حفظ التعديلات ✏️' : 'حفظ المصروف الآن 💾'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal for Single Expense Deletion Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">تأكيد مسح المصروف فردياً؟</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                هل أنت أوافق على حذف المصروف التالية بياناته؟
              </p>
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-right space-y-1 text-xs">
                <div className="font-extrabold text-slate-900">{itemToDelete.title}</div>
                <div className="text-amber-600 font-black text-sm">
                  {itemToDelete.amount.toLocaleString()} {currentRestaurant.currency}
                </div>
                {itemToDelete.recipientOrWorker && (
                  <div className="text-slate-500 text-[11px]">
                    المستلم / العامل: {itemToDelete.recipientOrWorker}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  deleteExpense(itemToDelete.id);
                  triggerNotify(`تم مسح المصروف "${itemToDelete.title}" بنجاح`);
                  setItemToDelete(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/20 text-xs cursor-pointer"
              >
                مسح المصروف الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Clear All Expenses Confirmation */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">تأكيد مسح جميع المصاريف؟</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                سيتم مسح كافة سجلات المصاريف والأجور التشغيلية المعتمدة ({expenses.length} عملية) نهائياً. لا يمكن التراجع عن هذه الخطوة.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 text-xs"
              >
                تراجع وإلغاء
              </button>
              <button
                onClick={() => {
                  clearAllExpenses();
                  setShowClearConfirmModal(false);
                  triggerNotify('تم مسح جميع سجلات المصاريف والأجور بنجاح');
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/20 text-xs cursor-pointer"
              >
                نعم، إفراغ المسح الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Scanner Modal */}
      <InvoiceScannerModal
        isOpen={showInvoiceScanner}
        onClose={() => setShowInvoiceScanner(false)}
      />

    </div>
  );
};
