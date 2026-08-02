import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Search,
  Trash2,
  Edit3,
  History,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Scale,
  Package,
  Droplet,
  Info,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
  AlertOctagon,
  PieChart,
  Lightbulb,
  FileSpreadsheet,
  Tag,
  Calculator,
  RefreshCw,
  FileCheck,
  CheckSquare,
  Scan
} from 'lucide-react';
import { Ingredient, RawMaterialCategory } from '../types';
import { getCompatibleUnits, convertQuantity } from '../lib/unitUtils';
import { InvoiceScannerModal } from './InvoiceScannerModal';

export const InventoryView: React.FC = () => {
  const {
    ingredients,
    rawMaterialCategories,
    stockMovements,
    currentRestaurant,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    updateIngredientStock,
    recordWaste,
    addRawMaterialCategory,
    deleteRawMaterialCategory,
    getDashboardStats
  } = useData();

  const stats = getDashboardStats();
  const { wasteAnalytics, expenseAlerts } = stats;

  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<'all' | 'weight' | 'piece' | 'liquid'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RawMaterialCategory>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', icon: '🏷️' });
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showInvoiceScanner, setShowInvoiceScanner] = useState(false);
  const [showAutoAuditModal, setShowAutoAuditModal] = useState(false);
  const [auditCounts, setAuditCounts] = useState<Record<string, string>>({});
  const [auditNotes, setAuditNotes] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleOpenAutoAuditModal = () => {
    const initial: Record<string, string> = {};
    ingredients.forEach(i => {
      initial[i.id] = i.currentStock.toString();
    });
    setAuditCounts(initial);
    setAuditNotes('');
    setShowAutoAuditModal(true);
  };

  const getAutoAuditSummary = () => {
    let totalWastedItems = 0;
    let totalWasteCost = 0;
    let totalSurplusItems = 0;
    let totalMatchedItems = 0;

    ingredients.forEach(ing => {
      const theoretical = ing.currentStock;
      const actualStr = auditCounts[ing.id];
      const actual = actualStr !== undefined && actualStr !== '' ? Number(actualStr) : theoretical;
      if (isNaN(actual)) return;

      const diff = theoretical - actual;
      if (diff > 0.0001) {
        totalWastedItems++;
        totalWasteCost += diff * ing.costPerUnit;
      } else if (diff < -0.0001) {
        totalSurplusItems++;
      } else {
        totalMatchedItems++;
      }
    });

    return { totalWastedItems, totalWasteCost, totalSurplusItems, totalMatchedItems };
  };

  const handleApplyAutoAudit = () => {
    let wastedCount = 0;
    let totalWasteValue = 0;
    let updatedCount = 0;

    ingredients.forEach(ing => {
      const theoretical = ing.currentStock;
      const actualStr = auditCounts[ing.id];
      if (actualStr === undefined || actualStr === '') return;
      const actual = Number(actualStr);
      if (isNaN(actual)) return;

      const diff = theoretical - actual;
      if (diff > 0.0001) {
        recordWaste(ing.id, diff, ing.unit, `هدر غير مسجل (مكتشف تلقائياً بالجرد الفعلي) ${auditNotes ? `- ${auditNotes}` : ''}`);
        wastedCount++;
        totalWasteValue += diff * ing.costPerUnit;
      } else if (diff < -0.0001) {
        updateIngredientStock(ing.id, actual, `تسوية فارق جرد زائد ${auditNotes ? `- ${auditNotes}` : ''}`);
        updatedCount++;
      }
    });

    setShowAutoAuditModal(false);
    if (wastedCount > 0) {
      triggerNotification(`تم احتساب وتسجيل الهدر التلقائي لـ ${wastedCount} مواد بقيمة خاسرة ${Math.round(totalWasteValue).toLocaleString()} ${currentRestaurant.currency}!`);
    } else {
      triggerNotification(`تم اعتماد نتائج الجرد الفعلي بنجاح. المخزون الفعلي مطابق للمحسوب 100%!`);
    }
  };

  // Form State
  const [ingForm, setIngForm] = useState({
    name: '',
    category: 'produce' as RawMaterialCategory,
    unitType: 'kg' as 'kg' | 'g' | 'piece' | 'liter' | 'ml' | 'custom',
    customUnit: '',
    currentStock: '',
    minStockThreshold: '',
    costPerUnit: '',
    hasPieceWeight: false,
    pieceWeight: '',
    pieceWeightUnit: 'غرام (غ)',
    pieceUnitName: 'رأس'
  });

  // Waste Form
  const [wasteForm, setWasteForm] = useState({
    ingredientId: '',
    quantity: '',
    unit: '',
    reason: 'تلف صلاحية'
  });

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingIngredient(null);
    setIngForm({
      name: '',
      category: 'produce',
      unitType: 'kg',
      customUnit: '',
      currentStock: '',
      minStockThreshold: '5',
      costPerUnit: '',
      hasPieceWeight: false,
      pieceWeight: '',
      pieceWeightUnit: 'غرام (غ)',
      pieceUnitName: 'رأس'
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (ing: Ingredient) => {
    setEditingIngredient(ing);

    let unitType: 'kg' | 'g' | 'piece' | 'liter' | 'ml' | 'custom' = 'custom';
    let customUnit = '';

    if (ing.unit === 'kg' || ing.unit === 'كيلوغرام' || ing.unit === 'كغ') unitType = 'kg';
    else if (ing.unit === 'g' || ing.unit === 'غرام' || ing.unit === 'غ') unitType = 'g';
    else if (ing.unit === 'piece' || ing.unit === 'قطعة') unitType = 'piece';
    else if (ing.unit === 'liter' || ing.unit === 'لتر') unitType = 'liter';
    else if (ing.unit === 'ml' || ing.unit === 'مليلتر' || ing.unit === 'مل') unitType = 'ml';
    else {
      unitType = 'custom';
      customUnit = ing.unit;
    }

    setIngForm({
      name: ing.name,
      category: ing.category || 'other',
      unitType,
      customUnit,
      currentStock: ing.currentStock.toString(),
      minStockThreshold: ing.minStockThreshold.toString(),
      costPerUnit: ing.costPerUnit.toString(),
      hasPieceWeight: Boolean(ing.pieceWeight && ing.pieceWeight > 0),
      pieceWeight: ing.pieceWeight ? ing.pieceWeight.toString() : '',
      pieceWeightUnit: ing.pieceWeightUnit || 'غرام (غ)',
      pieceUnitName: ing.pieceUnitName || 'رأس'
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingForm.name.trim()) {
      triggerNotification('يرجى كتابة اسم المادة الأولية', 'error');
      return;
    }

    // Determine final unit string
    let finalUnit = ingForm.unitType as string;
    if (ingForm.unitType === 'custom') {
      finalUnit = ingForm.customUnit.trim() || 'وحدة';
    } else if (ingForm.unitType === 'kg') {
      finalUnit = 'كيلوغرام (كغ)';
    } else if (ingForm.unitType === 'g') {
      finalUnit = 'غرام (غ)';
    } else if (ingForm.unitType === 'piece') {
      finalUnit = 'قطعة';
    } else if (ingForm.unitType === 'liter') {
      finalUnit = 'لتر';
    } else if (ingForm.unitType === 'ml') {
      finalUnit = 'مليلتر (مل)';
    }

    const currentStockNum = Number(ingForm.currentStock || 0);
    const minStockNum = Number(ingForm.minStockThreshold || 0);
    const costNum = Number(ingForm.costPerUnit || 0);

    const pieceWeightNum = ingForm.hasPieceWeight && Number(ingForm.pieceWeight) > 0 ? Number(ingForm.pieceWeight) : undefined;
    const pieceWeightUnitVal = ingForm.hasPieceWeight ? ingForm.pieceWeightUnit : undefined;
    const pieceUnitNameVal = ingForm.hasPieceWeight ? (ingForm.pieceUnitName.trim() || 'رأس') : undefined;

    if (editingIngredient) {
      updateIngredient(editingIngredient.id, {
        name: ingForm.name.trim(),
        category: ingForm.category,
        unit: finalUnit,
        currentStock: currentStockNum,
        minStockThreshold: minStockNum,
        costPerUnit: costNum,
        pieceWeight: pieceWeightNum,
        pieceWeightUnit: pieceWeightUnitVal,
        pieceUnitName: pieceUnitNameVal
      });
      triggerNotification(`تم تحديث بيانات المادة "${ingForm.name}" بنجاح!`);
    } else {
      addIngredient({
        name: ingForm.name.trim(),
        category: ingForm.category,
        unit: finalUnit,
        currentStock: currentStockNum,
        minStockThreshold: minStockNum,
        costPerUnit: costNum,
        pieceWeight: pieceWeightNum,
        pieceWeightUnit: pieceWeightUnitVal,
        pieceUnitName: pieceUnitNameVal
      });
      triggerNotification(`تم إضافة المادة الأولية الجديدة "${ingForm.name}" بنجاح!`);
    }

    setShowAddModal(false);
    setEditingIngredient(null);
  };

  const confirmDeleteIngredient = () => {
    if (!ingredientToDelete) return;

    const success = deleteIngredient(ingredientToDelete.id);
    if (success) {
      triggerNotification(`تم مسح المادة "${ingredientToDelete.name}" من المخزون.`);
    } else {
      triggerNotification('تعذر مسح هذه المادة.', 'error');
    }
    setIngredientToDelete(null);
  };

  const handleWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === wasteForm.ingredientId);
    if (!ing || !wasteForm.quantity) return;

    const chosenUnit = wasteForm.unit || ing.unit;
    recordWaste(ing.id, Number(wasteForm.quantity), chosenUnit, wasteForm.reason);
    triggerNotification(`تم تسجيل هدر ${wasteForm.quantity} ${chosenUnit} من ${ing.name}`);
    setShowWasteModal(false);
    setWasteForm({ ingredientId: '', quantity: '', unit: '', reason: 'تلف صلاحية' });
  };

  // Unit category helper
  const getUnitTypeCategory = (unitStr: string) => {
    const u = unitStr.toLowerCase();
    if (u.includes('كغ') || u.includes('كيلو') || u.includes('kg') || u.includes('غرام') || u.includes('غ') || u.includes('g')) return 'weight';
    if (u.includes('قطعة') || u.includes('piece') || u.includes('عدد')) return 'piece';
    if (u.includes('لتر') || u.includes('liter') || u.includes('مل') || u.includes('ml')) return 'liquid';
    return 'custom';
  };

  // Category Badge helper
  const getRawCategoryBadge = (cat?: RawMaterialCategory) => {
    const found = rawMaterialCategories.find(c => c.id === cat || c.name === cat);
    if (found) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs">
          <span>{found.icon || '🏷️'} {found.name}</span>
        </span>
      );
    }
    switch (cat) {
      case 'produce':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <span>🥗 خضروات وفواكه</span>
          </span>
        );
      case 'canned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
            <span>🥫 معلبات</span>
          </span>
        );
      case 'meats':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-200">
            <span>🥩 لحومات</span>
          </span>
        );
      case 'cheeses':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-yellow-100 text-yellow-900 border border-yellow-300">
            <span>🧀 أجبان وألبان</span>
          </span>
        );
      case 'packaging':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
            <span>🛍️ تغليف ومستلزمات</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{cat ? `📦 ${cat}` : '📦 أخرى'}</span>
          </span>
        );
    }
  };

  // Filter logic
  const filteredIngredients = ingredients.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const unitCat = getUnitTypeCategory(i.unit);
    const matchesUnit = unitFilter === 'all' || (unitFilter === 'weight' && unitCat === 'weight') || (unitFilter === 'piece' && unitCat === 'piece') || (unitFilter === 'liquid' && unitCat === 'liquid');

    const itemCat = i.category || 'other';
    const matchesCategory = categoryFilter === 'all' || itemCat === categoryFilter || (rawMaterialCategories.find(c => c.id === categoryFilter)?.name === itemCat);

    return matchesSearch && matchesUnit && matchesCategory;
  });

  const handleAddRawCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatForm.name.trim()) return;
    const added = addRawMaterialCategory(newCatForm.name, newCatForm.icon);
    triggerNotification(`تم إضافة تصنيف المادة الأولية "${added.name}" بنجاح!`);
    setShowCategoryModal(false);
    setIngForm(prev => ({ ...prev, category: added.id as RawMaterialCategory }));
    setNewCatForm({ name: '', icon: '🏷️' });
  };

  // Get badge rendering for units
  const getUnitBadge = (unitStr: string) => {
    const cat = getUnitTypeCategory(unitStr);

    if (cat === 'weight') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
          <Scale className="w-3 h-3 text-blue-600" />
          <span>{unitStr}</span>
        </span>
      );
    }
    if (cat === 'piece') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
          <Package className="w-3 h-3 text-amber-600" />
          <span>{unitStr}</span>
        </span>
      );
    }
    if (cat === 'liquid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-100 text-cyan-900 border border-cyan-200">
          <Droplet className="w-3 h-3 text-cyan-600" />
          <span>{unitStr}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
        <Boxes className="w-3 h-3 text-purple-600" />
        <span>{unitStr}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Notification Toast */}
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

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-500" />
            <span>إدارة المخزون والمواد الأولية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل وإدارة كميات المواد بالقطعة، الكيلوغرام، الغرام، السوائل أو الوحدات المخصصة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInvoiceScanner(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4 text-slate-950" />
            <span>📸 مسح فاتورة ذكي</span>
          </button>

          <button
            onClick={handleOpenAutoAuditModal}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>حساب وتسجيل الهدر (الجرد)</span>
          </button>

          <button
            onClick={() => setShowWasteModal(true)}
            className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>تسجيل هدر يدوي</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>إضافة مادة أولية جديدة</span>
          </button>
        </div>
      </div>

      {/* Quick AI Tip Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl border border-slate-700 flex items-start gap-3 shadow-sm">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-amber-300">💡 نصيحة ذكية - التمييز الدقيق بين القطعة والوزن:</p>
          <p className="text-slate-300 leading-relaxed">
            يمكنك اختيار الوحدة المناسبة بكل مادة: <strong className="text-white">بالقطعة</strong> (مثل خبز البرغر والبيض والعبوات)، أو <strong className="text-white">بالكيلوغرام / الغرام</strong> (مثل اللحوم والأجبان والبهارات)، أو <strong className="text-white">بالسوائل</strong> (مثل الحليب والزيت)!
            <br />
            كما يمكنك كتابة أي أمر صوتي أو كتابي للمساعد الذكي مثل: <span className="text-amber-300 font-mono font-bold">"أضف مادة جبنة موازريلا 10 كغ بسعر 80000 للكيلو"</span> أو <span className="text-amber-300 font-mono font-bold">"أضف مادة خبز برغر 150 قطعة"</span>
          </p>
        </div>
      </div>

      {/* Waste & Excessive Expense Analytics & Alerts Hub */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>تقرير تحليل وتنبيهات الهدر والمصاريف الزائدة</span>
                {expenseAlerts.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-[11px] font-black animate-pulse">
                    {expenseAlerts.length} تنبيهات مفعلة
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">حساب الخسائر المالية من التلف ومراقبة أسباب التكاليف المرتفعة</p>
            </div>
          </div>

          <button
            onClick={() => setShowWasteModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer shrink-0"
          >
            <TrendingDown className="w-4 h-4" />
            <span>تسجيل هدر جديد فوراً</span>
          </button>
        </div>

        {/* Top Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Total Lost Value */}
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80">
            <span className="text-[11px] font-bold text-rose-800 block mb-1">إجمالي الخسارة المالية بالهدر</span>
            <div className="text-xl font-black text-rose-600">
              {wasteAnalytics.totalWasteCost.toLocaleString()} <span className="text-xs font-normal text-slate-600">{currentRestaurant.currency}</span>
            </div>
            <p className="text-[10px] text-rose-700 font-medium mt-1">تراكمي المحسوب من أسعار التكلفة للمواد</p>
          </div>

          {/* Card 2: Waste Incidents */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-600 block mb-1">عدد حالات الهدر المسجلة</span>
            <div className="text-xl font-black text-slate-900">
              {wasteAnalytics.wasteCount} <span className="text-xs font-normal text-slate-500">حالات</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">مسجلة تلقائياً عبر الفوارق والجرد أو يدوياً</p>
          </div>

          {/* Card 3: Highest Wasted Category */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-900 block mb-1">أكثر مادة هدرت مالياً</span>
            <div className="text-base font-extrabold text-amber-950 truncate">
              {wasteAnalytics.topWastedIngredients[0]?.ingredientName || 'لا يوجد هدر مسجل'}
            </div>
            <p className="text-[10px] text-amber-800 font-bold mt-1 truncate">
              {wasteAnalytics.topWastedIngredients[0]
                ? `${wasteAnalytics.topWastedIngredients[0].totalQuantity} ${wasteAnalytics.topWastedIngredients[0].unit} (${wasteAnalytics.topWastedIngredients[0].totalCost.toLocaleString()} ${currentRestaurant.currency})`
                : 'المخزون محمي وممتاز'}
            </p>
          </div>

          {/* Card 4: Automatic Waste Reconciliation Launcher */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-4 rounded-xl shadow-sm border border-amber-400 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-black block mb-0.5 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                <span>حساب واكتشاف الهدر تلقائياً</span>
              </span>
              <p className="text-[10px] font-extrabold leading-tight text-slate-900">
                مقارنة الجرد الفعلي بالمحسوب واكتشاف الفوارق كـ "هدر تلقائي"
              </p>
            </div>
            <button
              onClick={handleOpenAutoAuditModal}
              className="mt-2 text-xs font-black bg-slate-950 hover:bg-slate-900 text-amber-400 px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بدء حاسبة الجرد والهدر</span>
            </button>
          </div>

        </div>

        {/* Breakdown & Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          
          {/* Top Wasted Ingredients Breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>أكثر المواد هدرأ وتكلفة</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">مرتبة حس التكلفة الكلية</span>
            </h3>

            {wasteAnalytics.topWastedIngredients.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4">لم يتم تسجيل أي هدر بعد 🎉</p>
            ) : (
              <div className="space-y-2.5">
                {wasteAnalytics.topWastedIngredients.map((item, idx) => {
                  const maxCost = wasteAnalytics.topWastedIngredients[0]?.totalCost || 1;
                  const pct = Math.round((item.totalCost / maxCost) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{item.ingredientName} ({item.totalQuantity} {item.unit})</span>
                        <span className="text-rose-600 font-extrabold">{item.totalCost.toLocaleString()} {currentRestaurant.currency}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waste Reasons Distribution & Active Expense Warnings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>تنبيهات وتوصيات خفض المصاريف الزائدة</span>
            </h3>

            {expenseAlerts.length === 0 ? (
              <div className="p-3 bg-emerald-100/60 text-emerald-900 rounded-lg text-xs font-bold">
                جميع الوصفات والمخزون في أفضل حالات الكفاءة والتكاليف مضبوطة!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {expenseAlerts.map(alert => (
                  <div key={alert.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{alert.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 font-black rounded">
                        {alert.type === 'low_margin' ? 'هامش ضئيل' : 'هدر/مخزون'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{alert.description}</p>
                    <p className="text-[11px] text-amber-800 font-bold bg-amber-50 p-1.5 rounded border border-amber-100">
                      💡 {alert.actionableRecommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* Row 1: Raw Material Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          <span className="text-[11px] font-extrabold text-slate-500 shrink-0 ml-1">التصنيف:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكل ({ingredients.length})
          </button>

          {rawMaterialCategories.map(cat => {
            const count = ingredients.filter(i => i.category === cat.id || i.category === cat.name).length;
            const isSelected = categoryFilter === cat.id || categoryFilter === cat.name;

            return (
              <div key={cat.id} className="relative group inline-flex items-center shrink-0">
                <button
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold ring-2 ring-amber-400/50'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80'
                  }`}
                >
                  <span>{cat.icon || '🏷️'} {cat.name}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>

                {cat.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRawMaterialCategory(cat.id);
                      if (categoryFilter === cat.id) setCategoryFilter('all');
                      triggerNotification(`تم مسح التصنيف "${cat.name}"`);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity mr-1 p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="مسح التصنيف"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-dashed border-amber-300 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>إضافة تصنيف آخر</span>
          </button>
        </div>

        {/* Row 2: Unit Filter & Search Field */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Unit Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-extrabold text-slate-500 shrink-0 ml-1">نوع الوحدة:</span>
            <button
              onClick={() => setUnitFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                unitFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            
            <button
              onClick={() => setUnitFilter('piece')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                unitFilter === 'piece'
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>قطع</span>
            </button>

            <button
              onClick={() => setUnitFilter('weight')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                unitFilter === 'weight'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
              }`}
            >
              <Scale className="w-3 h-3" />
              <span>أوزان (كغ/غ)</span>
            </button>

            <button
              onClick={() => setUnitFilter('liquid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                unitFilter === 'liquid'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100'
              }`}
            >
              <Droplet className="w-3 h-3" />
              <span>سوائل (لتر/مل)</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث باسم المادة الأولية..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

      </div>

      {/* Ingredients Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">اسم المادة الأولية</th>
                <th className="p-3.5">تصنيف المادة</th>
                <th className="p-3.5">وحدة القياس المعتمدة</th>
                <th className="p-3.5">الكمية المتوفرة</th>
                <th className="p-3.5">حد تنبيه النقص</th>
                <th className="p-3.5">تكلفة الوحدة</th>
                <th className="p-3.5">القيمة المالية الكلية</th>
                <th className="p-3.5">حالة التوفر</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <p className="font-bold mb-1">لا توجد مواد أولية تطابق البحث والتصنيف الحالي</p>
                    <p className="text-[11px]">اضغط على زر "إضافة مادة أولية جديدة" لتسجيل مكونات الوجبات والمشروبات.</p>
                  </td>
                </tr>
              ) : (
                filteredIngredients.map(ing => {
                  const isLow = ing.currentStock <= ing.minStockThreshold;
                  const totalValue = ing.currentStock * ing.costPerUnit;

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">{ing.name}</div>
                        {ing.pieceWeight && ing.pieceWeight > 0 && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md mt-1 font-bold">
                            <Scale className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>1 {ing.pieceUnitName || 'رأس'} ≈ {ing.pieceWeight} {ing.pieceWeightUnit || 'غرام'}</span>
                          </div>
                        )}
                      </td>

                      {/* Raw Material Category Badge */}
                      <td className="p-3.5">
                        {getRawCategoryBadge(ing.category)}
                      </td>

                      {/* Unit Badge */}
                      <td className="p-3.5">
                        {getUnitBadge(ing.unit)}
                      </td>

                      {/* Current Stock */}
                      <td className="p-3.5">
                        <span className="font-black text-sm text-slate-900">
                          {ing.currentStock.toLocaleString()}
                        </span>{' '}
                        <span className="text-[11px] font-bold text-slate-500">{ing.unit}</span>
                      </td>

                      {/* Threshold */}
                      <td className="p-3.5 text-slate-500 font-medium">
                        {ing.minStockThreshold} {ing.unit}
                      </td>

                      {/* Cost per unit */}
                      <td className="p-3.5 font-bold text-amber-700">
                        {ing.costPerUnit.toLocaleString()} {currentRestaurant.currency} / {ing.unit}
                      </td>

                      {/* Total Value */}
                      <td className="p-3.5 font-extrabold text-slate-900">
                        {totalValue.toLocaleString()} {currentRestaurant.currency}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>منخفض (اطلب توريد)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>متوفر بنجاح</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock adjustment button */}
                          <button
                            onClick={() => {
                              const newQty = prompt(`تعديل الكمية الحالية لـ (${ing.name}):`, ing.currentStock.toString());
                              if (newQty !== null && !isNaN(Number(newQty))) {
                                updateIngredientStock(ing.id, Number(newQty), 'تعديل مباشر من جدولة المخزون');
                                triggerNotification(`تم تعديل مخزون ${ing.name} إلى ${newQty} ${ing.unit}`);
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            title="تعديل سريع للكمية"
                          >
                            تعديل الكمية
                          </button>

                          {/* Full Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(ing)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                            title="تعديل بيانات المادة والوحدة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setIngredientToDelete(ing)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="مسح المادة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements History Timeline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-amber-500" />
          <span>سجل حركة المخزون وحسابات الاستهلاك</span>
        </h2>

        <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
          {stockMovements.length === 0 ? (
            <p className="text-slate-400 text-center py-4">لا توجد حرية حركة مسجلة بالمخزون بعد.</p>
          ) : (
            stockMovements.slice(0, 8).map(m => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{m.ingredientName}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-600">{m.reason}</span>
                  <span className="text-slate-400 text-[10px] block mt-0.5">
                    بواسطة {m.createdByName} في {new Date(m.date).toLocaleString('ar-SY')}
                  </span>
                </div>
                <div>
                  {m.type === 'purchase' && (
                    <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      + {m.quantity} {m.unit} (شراء)
                    </span>
                  )}
                  {m.type === 'waste' && (
                    <span className="font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                      - {m.quantity} {m.unit} (هدر)
                    </span>
                  )}
                  {m.type === 'sale' && (
                    <span className="font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                      - {m.quantity} {m.unit} (استهلاك طلب)
                    </span>
                  )}
                  {m.type === 'adjustment' && (
                    <span className="font-black text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">
                      {m.quantity} {m.unit} (تعديل كمية)
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Add or Edit Ingredient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[88vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                <span>{editingIngredient ? `تعديل المادة: ${editingIngredient.name}` : 'إضافة مادة أولية جديدة'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIngredient(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-24">
              
              {/* Ingredient Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">اسم المادة الأولية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طماطم طازجة، لحم بقر مفروم، جبنة موزاريلا، تونا علب..."
                  value={ingForm.name}
                  onChange={e => setIngForm({ ...ingForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs font-bold"
                />
              </div>

              {/* Raw Material Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>تصنيف المادة الأولية *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>تصنيف جديد</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {rawMaterialCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setIngForm({ ...ingForm, category: cat.id as RawMaterialCategory })}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        ingForm.category === cat.id
                          ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/50 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                        <span>{cat.icon || '🏷️'} {cat.name}</span>
                        {ingForm.category === cat.id && <CheckCircle className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit Selection Visual Cards */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">اختر طريقة قياس المادة (وحدة المادة) *</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  
                  {/* Option 1: Piece */}
                  <button
                    type="button"
                    onClick={() => setIngForm({ ...ingForm, unitType: 'piece' })}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      ingForm.unitType === 'piece'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-amber-950">📦 بالقطعة</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1 rounded">Piece</span>
                    </div>
                    <p className="text-[10px] text-slate-500">خبز، بيض، علب، أكياس</p>
                  </button>

                  {/* Option 2: Kg */}
                  <button
                    type="button"
                    onClick={() => setIngForm({ ...ingForm, unitType: 'kg' })}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      ingForm.unitType === 'kg'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-blue-950">⚖️ بالكيلوغرام</span>
                      <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-1 rounded">كغ (kg)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">لحوم، أجبان، بن، طحين</p>
                  </button>

                  {/* Option 3: Gram */}
                  <button
                    type="button"
                    onClick={() => setIngForm({ ...ingForm, unitType: 'g' })}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      ingForm.unitType === 'g'
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-purple-950">🧪 بالغرام</span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-1 rounded">غ (g)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">بهارات، خميرة، زعفران</p>
                  </button>

                  {/* Option 4: Liter */}
                  <button
                    type="button"
                    onClick={() => setIngForm({ ...ingForm, unitType: 'liter' })}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      ingForm.unitType === 'liter'
                        ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-cyan-950">🥛 باللتر</span>
                      <span className="text-[10px] bg-cyan-200 text-cyan-900 font-bold px-1 rounded">Liter</span>
                    </div>
                    <p className="text-[10px] text-slate-500">حليب، زيت طهي، عصائر</p>
                  </button>

                  {/* Option 5: Ml */}
                  <button
                    type="button"
                    onClick={() => setIngForm({ ...ingForm, unitType: 'ml' })}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      ingForm.unitType === 'ml'
                        ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-teal-950">💧 بالمليلتر</span>
                      <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-1 rounded">ml</span>
                    </div>
                    <p className="text-[10px] text-slate-500">سيروب، معطرات، خلاصة</p>
                  </button>

                  {/* Option 6: Custom */}
                  <button
                    type="button"
                    onClick={() => setIngForm({ ...ingForm, unitType: 'custom' })}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      ingForm.unitType === 'custom'
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-emerald-950">✏️ وحدة مخصصة</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1 rounded">أخرى</span>
                    </div>
                    <p className="text-[10px] text-slate-500">كيس، كرتونة، طرد، صينية</p>
                  </button>

                </div>

                {/* Custom Unit Input Field if Selected */}
                {ingForm.unitType === 'custom' && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسم الوحدة المخصصة (مثال: كيس 25 كغ، كرتونة 12 علبة، صينية)..."
                      value={ingForm.customUnit}
                      onChange={e => setIngForm({ ...ingForm, customUnit: e.target.value })}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-400 font-bold text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Quantities & Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية المتوفرة حالياً بالمخزون</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="مثال: 10"
                    value={ingForm.currentStock}
                    onChange={e => setIngForm({ ...ingForm, currentStock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حد تنبيه النقص (الأدنى)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="مثال: 5"
                    value={ingForm.minStockThreshold}
                    onChange={e => setIngForm({ ...ingForm, minStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  تكلفة الوحدة التقديرية ({currentRestaurant.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="مثال: 120000"
                  value={ingForm.costPerUnit}
                  onChange={e => setIngForm({ ...ingForm, costPerUnit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs font-bold"
                />
              </div>

              {/* Piece to Weight Conversion Section */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-xs text-amber-950">
                    <input
                      type="checkbox"
                      checked={ingForm.hasPieceWeight}
                      onChange={e => setIngForm({ ...ingForm, hasPieceWeight: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <span>🥬 ربط شراء القطعة/الرأس بوزن تقريبي (مثال: شراء الخس بالرأس واستخدامه بالغرام في الوصفة)</span>
                  </label>
                </div>

                {ingForm.hasPieceWeight && (
                  <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">مسمى القطعة / الرأس</label>
                      <input
                        type="text"
                        placeholder="مثال: رأس، حبة، قطعة"
                        value={ingForm.pieceUnitName}
                        onChange={e => setIngForm({ ...ingForm, pieceUnitName: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">الوزن التقريبي لكل 1 {ingForm.pieceUnitName || 'رأس'}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="مثال: 500"
                        value={ingForm.pieceWeight}
                        onChange={e => setIngForm({ ...ingForm, pieceWeight: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">وحدة وزن القطعة</label>
                      <select
                        value={ingForm.pieceWeightUnit}
                        onChange={e => setIngForm({ ...ingForm, pieceWeightUnit: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="غرام (غ)">غرام (غ)</option>
                        <option value="كيلوغرام (كغ)">كيلوغرام (كغ)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Calculator Preview Box */}
              {Number(ingForm.costPerUnit || 0) > 0 && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-950 font-medium">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>حساب التكلفة التقديرية:</span>
                  </div>
                  <div className="font-mono font-extrabold text-amber-900">
                    {ingForm.unitType === 'kg' && `${(Number(ingForm.costPerUnit) / 1000).toLocaleString()} ${currentRestaurant.currency} / غرام`}
                    {ingForm.unitType === 'g' && `${(Number(ingForm.costPerUnit) * 1000).toLocaleString()} ${currentRestaurant.currency} / كغ`}
                    {ingForm.unitType === 'liter' && `${(Number(ingForm.costPerUnit) / 1000).toLocaleString()} ${currentRestaurant.currency} / مل`}
                    {ingForm.unitType === 'piece' && `${Number(ingForm.costPerUnit).toLocaleString()} ${currentRestaurant.currency} / قطعة`}
                    {ingForm.unitType === 'custom' && `${Number(ingForm.costPerUnit).toLocaleString()} ${currentRestaurant.currency} / ${ingForm.customUnit || 'وحدة'}`}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingIngredient(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md cursor-pointer"
                >
                  {editingIngredient ? 'حفظ تعديلات المادة' : 'حفظ إضافة المادة'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Delete Ingredient */}
      {ingredientToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>تأكيد مسح المادة الأولية</span>
            </div>

            <div className="p-5 space-y-3 text-slate-800">
              <p className="text-xs leading-relaxed font-semibold">
                هل أنت تأكد من رغبتك بمسح المادة الأولية <strong className="text-slate-900 underline">{ingredientToDelete.name}</strong> من المخزون؟
              </p>
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                ⚠️ تنبيه: سيتم حذف هذه المادة بشكل نهائي من المخزون.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIngredientToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteIngredient}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  تأكيد المسح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Waste */}
      {showWasteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[88vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-rose-900 text-white flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-300" />
                <span>تسجيل هدر أو تلف مخزون</span>
              </h2>
              <button onClick={() => setShowWasteModal(false)} className="w-8 h-8 rounded-full bg-rose-800 hover:bg-rose-700 text-rose-200 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleWasteSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-24">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المادة الأولية *</label>
                <select
                  required
                  value={wasteForm.ingredientId}
                  onChange={e => {
                    const ing = ingredients.find(i => i.id === e.target.value);
                    setWasteForm({
                      ...wasteForm,
                      ingredientId: e.target.value,
                      unit: ing ? ing.unit : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 font-bold"
                >
                  <option value="">-- اختر المادة --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (المتوفر حالياً: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedIng = ingredients.find(i => i.id === wasteForm.ingredientId);
                const compatibleUnits = selectedIng ? getCompatibleUnits(selectedIng.unit) : [];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الكمية المهدورة *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="مثال: 250 أو 1.5"
                        value={wasteForm.quantity}
                        onChange={e => setWasteForm({ ...wasteForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">وحدة القياس *</label>
                      <select
                        value={wasteForm.unit || (selectedIng ? selectedIng.unit : '')}
                        onChange={e => setWasteForm({ ...wasteForm, unit: e.target.value })}
                        className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-400 font-bold text-rose-950"
                      >
                        {compatibleUnits.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الهدر</label>
                <input
                  type="text"
                  placeholder="مثال: تلف انتهاء صلاحية، كسر أواني..."
                  value={wasteForm.reason}
                  onChange={e => setWasteForm({ ...wasteForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  تأكيد خصم الهدر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Raw Material Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>إضافة تصنيف جديد للمواد الأولية</span>
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white font-bold text-base cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddRawCategorySubmit} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">اسم التصنيف الجديد *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زيوت ومشروبات، بهارات وتوابل، صوصات ومقبلات..."
                  value={newCatForm.name}
                  onChange={e => setNewCatForm({ ...newCatForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">رمز التصنيف (Emoji / أيقونة)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="مثال: 🫒 أو 🧂 أو 🥤"
                    value={newCatForm.icon}
                    onChange={e => setNewCatForm({ ...newCatForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs font-bold"
                  />
                  <div className="flex gap-1 shrink-0">
                    {['🫒', '🧂', '🥤', '🍞', '📦'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatForm({ ...newCatForm, icon: emoji })}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-sm cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold shadow-md hover:bg-amber-300 cursor-pointer"
                >
                  حفظ التصنيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Automatic Inventory Audit & Waste Calculator */}
      {showAutoAuditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-2 text-white">
                    <span>حاسبة واكتشاف الهدر التلقائي عبر الجرد الفعلي</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    أدخل الكميات المتوفرة فعلياً بالمستودع وسيقوم النظام باحتساب الفوارق كـ "هدر غير مسجل" وخصمها تلقائياً
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAutoAuditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Realtime Live Audit Summary Bar */}
            {(() => {
              const summary = getAutoAuditSummary();
              return (
                <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-slate-500 block">إجمالي المواد بالمخزون</span>
                    <span className="text-base font-black text-slate-900">{ingredients.length} مادة</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 block">الهدر التلقائي المكتشف</span>
                    <span className="text-base font-black text-rose-600">
                      {summary.totalWastedItems} مواد
                    </span>
                  </div>

                  <div className="bg-rose-100/70 p-3 rounded-xl border border-rose-300">
                    <span className="text-[10px] font-bold text-rose-900 block">قيمة الخسارة من الهدر الفعلي</span>
                    <span className="text-base font-black text-rose-700">
                      {Math.round(summary.totalWasteCost).toLocaleString()} {currentRestaurant.currency}
                    </span>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 block">المواد المطابقة أو الزائدة</span>
                    <span className="text-base font-black text-emerald-700">
                      {summary.totalMatchedItems} مطابقة / {summary.totalSurplusItems} زيادة
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Actions Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    ingredients.forEach(i => reset[i.id] = i.currentStock.toString());
                    setAuditCounts(reset);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>إعادة الضبط للمخزون المحسوب</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const zeros: Record<string, string> = {};
                    ingredients.forEach(i => zeros[i.id] = '0');
                    setAuditCounts(zeros);
                  }}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                >
                  صفر جميع الكميات
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-bold">
                💡 النظام يحسب: الفارق = (المخزون المحسوب - المخزون الفعلي)
              </span>
            </div>

            {/* Scrollable Audit List Table */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                <div className="bg-slate-900 text-white p-3 font-extrabold grid grid-cols-12 gap-2 text-xs">
                  <div className="col-span-4">المادة الأولية</div>
                  <div className="col-span-2 text-center">المخزون المحسوب (دفترياً)</div>
                  <div className="col-span-3 text-center">الكمية الفعلية الموجودة</div>
                  <div className="col-span-3 text-left">نتيجة الفارق والتكلفة التلقائية</div>
                </div>

                {ingredients.map(ing => {
                  const theoretical = ing.currentStock;
                  const actualStr = auditCounts[ing.id];
                  const actual = actualStr !== undefined && actualStr !== '' ? Number(actualStr) : theoretical;
                  const diff = theoretical - (isNaN(actual) ? theoretical : actual);
                  const isWasted = diff > 0.0001;
                  const isSurplus = diff < -0.0001;
                  const wasteCost = isWasted ? diff * ing.costPerUnit : 0;

                  return (
                    <div
                      key={ing.id}
                      className={`p-3 grid grid-cols-12 gap-2 items-center transition-colors text-xs font-bold ${
                        isWasted ? 'bg-rose-50/50 hover:bg-rose-50' : isSurplus ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Ingredient Name */}
                      <div className="col-span-4">
                        <div className="font-extrabold text-slate-900 text-sm">{ing.name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">
                          الوحدة: {ing.unit} | التكلفة: {ing.costPerUnit.toLocaleString()} {currentRestaurant.currency} / {ing.unit}
                        </div>
                      </div>

                      {/* Theoretical Stock */}
                      <div className="col-span-2 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-900 rounded-lg font-black text-xs">
                          {theoretical.toLocaleString()} {ing.unit}
                        </span>
                      </div>

                      {/* Actual Stock Input */}
                      <div className="col-span-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={auditCounts[ing.id] ?? ''}
                            onChange={e => setAuditCounts({ ...auditCounts, [ing.id]: e.target.value })}
                            placeholder={theoretical.toString()}
                            className="w-28 px-3 py-1.5 bg-white border border-amber-400 rounded-xl font-black text-center text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
                          />
                          <span className="text-slate-500 font-bold text-xs">{ing.unit}</span>
                        </div>
                      </div>

                      {/* Discrepancy & Waste Calculation */}
                      <div className="col-span-3 text-left">
                        {isWasted ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md font-black text-[11px]">
                              <span>🔴 هدر غير مسجل: {diff.toLocaleString(undefined, { maximumFractionDigits: 4 })} {ing.unit}</span>
                            </span>
                            <span className="block text-[11px] font-extrabold text-rose-600">
                              خسارة: {Math.round(wasteCost).toLocaleString()} {currentRestaurant.currency}
                            </span>
                          </div>
                        ) : isSurplus ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md font-black text-[11px]">
                            <span>🟢 زيادة بالمخزون: {Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 4 })} {ing.unit}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-bold text-[11px]">
                            <span>✨ مطابق 100%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات تسوية الجرد والهدر (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: جرد نهاية الأسبوع، فحص عينات الشيف، فحص الصلاحية..."
                  value={auditNotes}
                  onChange={e => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 font-bold">
                عند النقر على الحفظ، سيتم تحديث رصيد المواد بالمستودع وتسجيل أي فارق نقصان كـ "هدر كلي مكتشف" بالتقرير المالي تلقائياً.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowAutoAuditModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleApplyAutoAudit}
                  className="w-1/2 sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>اعتماد الجرد وتسجيل الهدر التلقائي</span>
                </button>
              </div>
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
