import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  ChefHat,
  Plus,
  Trash2,
  Calculator,
  CheckCircle,
  Lightbulb,
  Boxes,
  Flame,
  Sparkles,
  PackagePlus,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import { Ingredient, RecipeIngredientItem } from '../types';
import { convertQuantityAdvanced, getCompatibleUnits, getUnitCategory, parseNumericInput } from '../lib/unitUtils';

interface RecipesViewProps {
  initialProductId?: string;
}

const PREP_UNITS = [
  'كيلوغرام (كغ)',
  'غرام (غ)',
  'لتر (L)',
  'مليلتر (مل)',
  'قطعة / حبة',
  'علبة / عبوة'
];

export const RecipesView: React.FC<RecipesViewProps> = ({ initialProductId }) => {
  const {
    products,
    ingredients,
    recipes,
    expenses,
    orders,
    currentRestaurant,
    saveRecipe,
    updateProduct,
    addIngredient,
    updateIngredient,
    updateIngredientStock
  } = useData();

  // Active Mode: 'menu_recipes' (وصفات أصناف المنيو) | 'prep_recipes' (المواد المصنّعة / التحضيرات مثل الجرانولا)
  const [activeTab, setActiveTab] = useState<'menu_recipes' | 'prep_recipes'>('menu_recipes');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ============================================================================
  // TAB 1: MENU PRODUCT RECIPES STATE
  // ============================================================================
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id || '')
  );

  // Sync selectedProductId when products load if empty or invalid
  useEffect(() => {
    if (products.length > 0 && (!selectedProductId || !products.some(p => p.id === selectedProductId))) {
      setSelectedProductId(initialProductId || products[0].id);
    }
  }, [products, selectedProductId, initialProductId]);

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];
  const existingRecipe = recipes.find(r => r.productId === selectedProduct?.id);
  const [recipeItems, setRecipeItems] = useState<RecipeIngredientItem[]>([]);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState<string>('');

  useEffect(() => {
    if (existingRecipe) {
      setRecipeItems(existingRecipe.items);
    } else {
      setRecipeItems([]);
    }
  }, [selectedProduct?.id, existingRecipe?.updatedAt, existingRecipe?.items?.length]);

  const addIngredientToRecipe = () => {
    if (ingredients.length === 0 || !selectedProduct) return;
    const firstIng = ingredients[0];
    const cat = getUnitCategory(firstIng.unit);
    let defaultUnit = firstIng.unit;
    let defaultQty = 1;

    if (cat === 'weight') {
      defaultUnit = 'غرام (غ)';
      defaultQty = 100;
    } else if (cat === 'volume') {
      defaultUnit = 'مليلتر (مل)';
      defaultQty = 50;
    }

    const nextItems = [
      ...recipeItems,
      {
        ingredientId: firstIng.id,
        ingredientName: firstIng.name,
        unit: defaultUnit,
        quantity: defaultQty
      }
    ];
    setRecipeItems(nextItems);
    saveRecipe(selectedProduct.id, nextItems);
  };

  const removeIngredientFromRecipe = (index: number) => {
    const nextItems = recipeItems.filter((_, idx) => idx !== index);
    setRecipeItems(nextItems);
    if (selectedProduct) {
      saveRecipe(selectedProduct.id, nextItems);
    }
  };

  const updateRecipeItem = (index: number, field: keyof RecipeIngredientItem, value: any) => {
    const nextItems = recipeItems.map((item, idx) => {
      if (idx === index) {
        if (field === 'ingredientId') {
          const ing = ingredients.find(i => i.id === value);
          let newUnit = item.unit;
          let newQty = item.quantity;
          if (ing) {
            const cat = getUnitCategory(ing.unit);
            if (cat === 'weight' && !item.unit.includes('غ') && !item.unit.includes('كغ')) {
              newUnit = 'غرام (غ)';
              newQty = 100;
            } else if (cat === 'volume' && !item.unit.includes('مل') && !item.unit.includes('لتر')) {
              newUnit = 'مليلتر (مل)';
              newQty = 50;
            } else if (cat === 'count') {
              newUnit = ing.unit;
            }
          }
          return {
            ...item,
            ingredientId: value,
            ingredientName: ing ? ing.name : item.ingredientName,
            unit: newUnit,
            quantity: newQty
          };
        }
        if (field === 'quantity') {
          return { ...item, quantity: value === '' ? ('' as any) : parseNumericInput(value) };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setRecipeItems(nextItems);
    if (selectedProduct) {
      const sanitizedItems = nextItems.map(it => ({
        ...it,
        quantity: parseNumericInput(it.quantity)
      }));
      saveRecipe(selectedProduct.id, sanitizedItems);
    }
  };

  // Live Calculations with Unit Conversion for Menu Product
  let calculatedCost = 0;
  recipeItems.forEach(item => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) {
      const baseQty = convertQuantityAdvanced(Number(item.quantity || 0), item.unit, ing.unit, ing);
      calculatedCost += baseQty * ing.costPerUnit;
    }
  });

  // Operating Expenses (Overhead) Allocation for Suggested Selling Price
  const [includeOverheadInPricing, setIncludeOverheadInPricing] = useState<boolean>(true);
  const [overheadPercent, setOverheadPercent] = useState<number>(20); // 20% default operating expenses (rent, wages, electricity, gas)
  const [targetMarkupPercent, setTargetMarkupPercent] = useState<number>(50); // 50% net profit markup

  // Calculate historical real overhead ratio from recorded expenses vs sales if available
  const totalRecordedSales = orders
    .filter(o => o.status === 'completed' && o.paymentMethod !== 'staff_meal')
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalRecordedExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const actualExpenseToSalesPercent =
    totalRecordedSales > 0 ? Math.min(80, Math.round((totalRecordedExpenses / totalRecordedSales) * 100)) : null;

  const overheadCostPerUnit = includeOverheadInPricing ? calculatedCost * (overheadPercent / 100) : 0;
  const fullUnitCost = calculatedCost + overheadCostPerUnit;

  const sellingPrice = selectedProduct ? selectedProduct.price : 0;
  const profitAmount = sellingPrice - fullUnitCost;
  const profitMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;

  const rawSuggested = fullUnitCost * (1 + targetMarkupPercent / 100);
  const suggestedPrice =
    rawSuggested >= 1000
      ? Math.round(rawSuggested / 1000) * 1000
      : Math.round(rawSuggested);

  const handleSaveRecipe = () => {
    if (!selectedProduct) return;
    saveRecipe(selectedProduct.id, recipeItems);
    showToast(`تم حفظ وصفة الصنف "${selectedProduct.name}" بنجاح!`);
  };

  // ============================================================================
  // TAB 2: MANUFACTURED / PREP ITEMS (المواد المصنّعة مثل الجرانولا والصوصات)
  // ============================================================================
  const manufacturedIngredients = ingredients.filter(i => i.isManufactured);
  const rawIngredientsForPrep = ingredients; // Can use any raw material

  const [selectedPrepId, setSelectedPrepId] = useState<string>('new');
  const [prepName, setPrepName] = useState<string>('');
  const [prepUnit, setPrepUnit] = useState<string>('كيلوغرام (كغ)');
  const [prepBatchYield, setPrepBatchYield] = useState<number>(5);
  const [prepMinStock, setPrepMinStock] = useState<number>(1);
  const [prepItems, setPrepItems] = useState<RecipeIngredientItem[]>([]);
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);

  useEffect(() => {
    if (selectedPrepId === 'new') {
      setPrepName('');
      setPrepUnit('كيلوغرام (كغ)');
      setPrepBatchYield(5);
      setPrepMinStock(1);
      setPrepItems([]);
    } else {
      const found = ingredients.find(i => i.id === selectedPrepId);
      if (found) {
        setPrepName(found.name);
        setPrepUnit(found.unit);
        setPrepBatchYield(found.batchYieldQuantity || 1);
        setPrepMinStock(found.minStockThreshold || 1);
        setPrepItems(found.subRecipeItems || []);
      }
    }
  }, [selectedPrepId]);

  const addRawToPrep = () => {
    const availableRaw = rawIngredientsForPrep.filter(i => i.id !== selectedPrepId);
    if (availableRaw.length === 0) return;
    const firstIng = availableRaw[0];
    const cat = getUnitCategory(firstIng.unit);
    let defaultUnit = firstIng.unit;
    let defaultQty = 1;

    if (cat === 'weight') {
      defaultUnit = 'غرام (غ)';
      defaultQty = 500;
    } else if (cat === 'volume') {
      defaultUnit = 'مليلتر (مل)';
      defaultQty = 250;
    }

    setPrepItems([
      ...prepItems,
      {
        ingredientId: firstIng.id,
        ingredientName: firstIng.name,
        unit: defaultUnit,
        quantity: defaultQty
      }
    ]);
  };

  const removeRawFromPrep = (index: number) => {
    setPrepItems(prepItems.filter((_, idx) => idx !== index));
  };

  const updatePrepItem = (index: number, field: keyof RecipeIngredientItem, value: any) => {
    setPrepItems(prepItems.map((item, idx) => {
      if (idx === index) {
        if (field === 'ingredientId') {
          const ing = ingredients.find(i => i.id === value);
          let newUnit = item.unit;
          let newQty = item.quantity;
          if (ing) {
            const cat = getUnitCategory(ing.unit);
            if (cat === 'weight' && !item.unit.includes('غ') && !item.unit.includes('كغ')) {
              newUnit = 'غرام (غ)';
              newQty = 500;
            } else if (cat === 'volume' && !item.unit.includes('مل') && !item.unit.includes('لتر')) {
              newUnit = 'مليلتر (مل)';
              newQty = 250;
            } else if (cat === 'count') {
              newUnit = ing.unit;
            }
          }
          return {
            ...item,
            ingredientId: value,
            ingredientName: ing ? ing.name : item.ingredientName,
            unit: newUnit,
            quantity: newQty
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Calculate Batch Cost & Unit Cost for Manufactured Ingredient
  let totalBatchCost = 0;
  prepItems.forEach(item => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) {
      const baseQty = convertQuantityAdvanced(Number(item.quantity || 0), item.unit, ing.unit, ing);
      totalBatchCost += baseQty * ing.costPerUnit;
    }
  });

  const safeYield = Number(prepBatchYield) > 0 ? Number(prepBatchYield) : 1;
  const prepCostPerUnit = Math.round(totalBatchCost / safeYield);

  const handleSavePrepIngredient = () => {
    if (!prepName.trim()) {
      showToast('يرجى إدخال اسم المادة المصنّعة (مثل: جرانولا محضرة)');
      return;
    }

    if (selectedPrepId === 'new') {
      const created = addIngredient({
        name: prepName.trim(),
        category: 'other',
        unit: prepUnit,
        currentStock: 0,
        minStockThreshold: Number(prepMinStock) || 1,
        costPerUnit: prepCostPerUnit,
        isManufactured: true,
        batchYieldQuantity: safeYield,
        subRecipeItems: prepItems
      });
      setSelectedPrepId(created.id);
      showToast(`تم إنشاء المادة المصنّعة "${created.name}" بتكلفة ${prepCostPerUnit.toLocaleString()} ${currentRestaurant.currency} / ${prepUnit} وإضافتها للمخزون!`);
    } else {
      updateIngredient(selectedPrepId, {
        name: prepName.trim(),
        unit: prepUnit,
        minStockThreshold: Number(prepMinStock) || 1,
        costPerUnit: prepCostPerUnit,
        isManufactured: true,
        batchYieldQuantity: safeYield,
        subRecipeItems: prepItems
      });
      showToast(`تم تحديث وصفة وتكلفة "${prepName.trim()}" بنجاح!`);
    }
  };

  const handleProduceBatch = () => {
    if (selectedPrepId === 'new') {
      showToast('احفظ المادة المصنّعة أولاً قبل تسجيل إنتاج طبخة للمخزون');
      return;
    }
    const targetPrep = ingredients.find(i => i.id === selectedPrepId);
    if (!targetPrep) return;

    const batches = Number(batchMultiplier) > 0 ? Number(batchMultiplier) : 1;
    const producedQty = safeYield * batches;

    // 1. Deduct raw materials from inventory
    prepItems.forEach(item => {
      const rawIng = ingredients.find(i => i.id === item.ingredientId);
      if (rawIng) {
        const baseQtyPerBatch = convertQuantityAdvanced(Number(item.quantity || 0), item.unit, rawIng.unit, rawIng);
        const totalToDeduct = baseQtyPerBatch * batches;
        const newRawStock = Math.max(0, Number((rawIng.currentStock - totalToDeduct).toFixed(4)));
        updateIngredientStock(rawIng.id, newRawStock, `استهلاك لتحضير طبخة (${prepName})`);
      }
    });

    // 2. Add produced quantity to the manufactured ingredient stock & update its unit cost
    const newPrepStock = Number((targetPrep.currentStock + producedQty).toFixed(4));
    updateIngredient(targetPrep.id, {
      costPerUnit: prepCostPerUnit,
      batchYieldQuantity: safeYield,
      subRecipeItems: prepItems
    });
    updateIngredientStock(targetPrep.id, newPrepStock, `إنتاج طبخة داخلية (${batches} طبخة = +${producedQty} ${prepUnit})`);

    showToast(`تم طبخ وإنتاج +${producedQty} ${prepUnit} من "${prepName}" وخصم المكونات الأولية من المستودع بنجاح!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-300 hover:text-white text-[11px]">إغلاق</button>
        </div>
      )}

      {/* Header & Mode Switcher Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-500" />
            <span>الوصفات، المواد المصنّعة، وحساب التكلفة (Recipes & Sub-Recipes)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ركّب خلطاتك التحضيرية (مثل الجرانولا والصوصات) واربطها بوجبات المنيو لحساب التكلفة والربح بدقة 100%
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('menu_recipes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'menu_recipes'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>وصفات أصناف المنيو</span>
          </button>

          <button
            onClick={() => setActiveTab('prep_recipes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'prep_recipes'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>المواد المصنّعة / الطبخات التحضيرية (كالجرانولا)</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: MENU PRODUCT RECIPES
         ===================================================================== */}
      {activeTab === 'menu_recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product Selector & Recipe Ingredients Builder (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select Product Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-2">اختر الصنف (الوجبة النهائية) من قائمة الطعام:</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-sm text-slate-900 focus:ring-2 focus:ring-amber-400"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.categoryName}) - السعر الحالي: {p.price.toLocaleString()} {currentRestaurant.currency}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveRecipe}
                className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer shrink-0"
              >
                <CheckCircle className="w-4 h-4" />
                <span>حفظ وتحديث الوصفة</span>
              </button>
            </div>

            {/* Recipe Ingredients Builder */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">مكونات وجبة: "{selectedProduct?.name}"</h2>
                  <p className="text-xs text-slate-500">يمكنك إضافة مواد أولية عادية (كالحليب والفواكه والعلبة) أو مواد مصنّعة جاهزة (كالجرانولا المحضرة)</p>
                </div>

                <button
                  onClick={addIngredientToRecipe}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مكون للوجبة</span>
                </button>
              </div>

              {recipeItems.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600">لا توجد مكونات مضافة لوصفة هذا الصنف بعد</div>
                  <p className="text-[11px] text-slate-400">انقر فوق "إضافة مكون للوجبة" لربط المواد الأولية أو المواد المصنّعة (مثل الجرانولا، الحليب، الفواكه، العلبة)...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recipeItems.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const baseQty = ing ? convertQuantityAdvanced(Number(item.quantity || 0), item.unit, ing.unit, ing) : Number(item.quantity || 0);
                    const lineCost = (ing ? ing.costPerUnit : 0) * baseQty;
                    const compatibleUnits = ing ? getCompatibleUnits(ing.unit, ing) : [{ value: item.unit, label: item.unit }];

                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          {/* Ingredient Selector */}
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">المادة (أولية أو مصنّعة)</label>
                            <select
                              value={item.ingredientId}
                              onChange={e => updateRecipeItem(idx, 'ingredientId', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                            >
                              {ingredients.map(i => (
                                <option key={i.id} value={i.id}>
                                  {i.isManufactured ? '🥣 [مادة مصنّعة] ' : ''}{i.name} ({i.unit}) - بسعر {i.costPerUnit.toLocaleString()} / {i.unit}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div className="w-full sm:w-28">
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">الكمية بالوصفة</label>
                            <input
                              type="number"
                              step="any"
                              value={item.quantity}
                              onChange={e => updateRecipeItem(idx, 'quantity', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                            />
                          </div>

                          {/* Unit Selector */}
                          <div className="w-full sm:w-36">
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">وحدة القياس</label>
                            <select
                              value={item.unit}
                              onChange={e => updateRecipeItem(idx, 'unit', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-950 font-bold rounded-lg text-xs"
                            >
                              {compatibleUnits.map(u => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Cost Display & Conversion Note */}
                          <div className="w-full sm:w-36 text-left sm:text-right">
                            <span className="block text-[10px] text-slate-400 font-bold">تكلفة المكون</span>
                            <span className="font-extrabold text-slate-900 text-xs block">
                              {Math.round(lineCost).toLocaleString()} {currentRestaurant.currency}
                            </span>
                            {ing && item.unit !== ing.unit && (
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                (= {baseQty.toLocaleString(undefined, { maximumFractionDigits: 4 })} {ing.unit})
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => removeIngredientFromRecipe(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg self-end sm:self-center cursor-pointer"
                            title="حذف المكون"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {ing && ing.isManufactured && (
                          <div className="px-2.5 py-1 bg-amber-100/80 border border-amber-300 rounded-lg text-[11px] text-amber-950 flex items-center justify-between font-bold">
                            <span>🥣 مادة مصنّعة داخلياً بالمطعم (محسوبة التكلفة تلقائياً من مكونات طبختها)</span>
                            <button
                              onClick={() => {
                                setSelectedPrepId(ing.id);
                                setActiveTab('prep_recipes');
                              }}
                              className="underline text-amber-900 hover:text-black text-[10px] cursor-pointer"
                            >
                              عرض/تعديل مكونات الطبخة
                            </button>
                          </div>
                        )}

                        {ing && ing.pieceWeight && ing.pieceWeight > 0 && (
                          <div className="px-2.5 py-1 bg-amber-100/70 border border-amber-200 rounded-lg text-[11px] text-amber-950 flex items-center justify-between font-bold">
                            <span>🥬 مادة معيارية بالقطعة: 1 {ing.pieceUnitName || 'رأس'} ≈ {ing.pieceWeight} {ing.pieceWeightUnit || 'غرام'}</span>
                            <span className="text-[10px] text-amber-800">يمكنك تحديد الكمية بالغرامات أو بالقطعة/الرأس مباشرة</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Costing Summary & Price Suggestions (1 Col) */}
          <div className="space-y-4">
            {/* Summary Box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold flex items-center gap-2 text-amber-400">
                <Calculator className="w-5 h-5" />
                <span>ملخص التكلفة وهامش الربح</span>
              </h2>

              <div className="space-y-3 text-xs divide-y divide-slate-800">
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">سعر البيع الحالي:</span>
                  {isEditingPrice ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={e => setTempPrice(e.target.value)}
                        className="w-24 px-2 py-1 bg-slate-800 border border-amber-400 rounded text-white font-bold text-xs"
                      />
                      <button
                        onClick={() => {
                          if (selectedProduct && !isNaN(Number(tempPrice)) && Number(tempPrice) >= 0) {
                            updateProduct(selectedProduct.id, { price: Number(tempPrice) });
                            setIsEditingPrice(false);
                            showToast('تم تحديث سعر البيع بنجاح');
                          }
                        }}
                        className="px-2 py-1 bg-amber-400 text-slate-950 rounded font-bold text-[10px]"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-amber-400">
                        {sellingPrice.toLocaleString()} {currentRestaurant.currency}
                      </span>
                      <button
                        onClick={() => {
                          setTempPrice(sellingPrice.toString());
                          setIsEditingPrice(true);
                        }}
                        className="text-[10px] underline text-slate-400 hover:text-white cursor-pointer"
                      >
                        تعديل
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">تكلفة المواد الخام للقطعة:</span>
                  <span className="text-base font-extrabold text-slate-200">
                    {Math.round(calculatedCost).toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>

                {includeOverheadInPricing && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-amber-300/90">حصة المصاريف التشغيلية ({overheadPercent}%):</span>
                    <span className="text-sm font-extrabold text-amber-300">
                      +{Math.round(overheadCostPerUnit).toLocaleString()} {currentRestaurant.currency}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-300 font-bold">التكلفة الكلية للقطعة (مع المصاريف):</span>
                  <span className="text-base font-black text-white">
                    {Math.round(fullUnitCost).toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">هامش الربح الصافي (%):</span>
                  <span className={`text-base font-extrabold ${profitMargin >= 30 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profitMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">صافي ربح القطعة (بعد المصاريف):</span>
                  <span className="text-base font-black text-emerald-400">
                    {Math.round(profitAmount).toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Recommendation Card */}
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>اقتراح السعر المثالي للبيع (شامل المصاريف)</span>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeOverheadInPricing}
                    onChange={e => setIncludeOverheadInPricing(e.target.checked)}
                    className="rounded accent-amber-600 cursor-pointer"
                  />
                  <span>احتساب المصاريف الباقية</span>
                </label>
              </div>

              {/* Overhead & Profit Margin Controls */}
              <div className="bg-white/90 border border-amber-200/80 rounded-xl p-3 space-y-2.5 text-xs">
                {includeOverheadInPricing && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>نسبة تحميل المصاريف الباقية (أجور، غاز، كهرباء، إيجار):</span>
                      <span className="font-mono font-black text-amber-700">{overheadPercent}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={overheadPercent}
                        onChange={e => setOverheadPercent(Number(e.target.value))}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      {actualExpenseToSalesPercent !== null && (
                        <button
                          type="button"
                          onClick={() => setOverheadPercent(actualExpenseToSalesPercent)}
                          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold cursor-pointer shrink-0"
                          title="تطبيق نسبة مصاريفك الفعلية المسجلة إلى المبيعات"
                        >
                          نسبتك الفعلية ({actualExpenseToSalesPercent}%)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>نسبة الربح الصافي المطلوبة فوق التكلفة الكلية:</span>
                    <span className="font-mono font-black text-emerald-700">+{targetMarkupPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={targetMarkupPercent}
                    onChange={e => setTargetMarkupPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              <p className="text-xs text-amber-900/90 leading-relaxed">
                بناءً على تكلفة المواد (<b>{Math.round(calculatedCost).toLocaleString()}</b>)
                {includeOverheadInPricing ? (
                  <> + حصة المصاريف التشغيلية (<b>{Math.round(overheadCostPerUnit).toLocaleString()}</b>)</>
                ) : null}{' '}
                + ربح صافي (<b>{targetMarkupPercent}%</b>)، نوصي بسعر بيع للقطعة:
              </p>

              <div className="text-2xl font-black text-slate-900 dir-rtl">
                {suggestedPrice.toLocaleString()} <span className="text-xs font-normal text-slate-600">{currentRestaurant.currency}</span>
              </div>

              <button
                onClick={() => {
                  if (selectedProduct) {
                    updateProduct(selectedProduct.id, { price: suggestedPrice });
                    showToast(`تم تطبيق السعر المقترح (${suggestedPrice.toLocaleString()} ${currentRestaurant.currency}) للمنتج بنجاح!`);
                  }
                }}
                className="w-full mt-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                تطبيق السعر المقترح تلقائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MANUFACTURED / PREP ITEMS (المواد المصنّعة مثل الجرانولا)
         ===================================================================== */}
      {activeTab === 'prep_recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Prep Builder */}
          <div className="lg:col-span-2 space-y-4">
            {/* Guide Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 space-y-1">
                <div className="font-extrabold">كيف تعمل المواد المصنّعة (مثل طبخة الجرانولا أو الصوصات الخاصة)؟</div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  1️⃣ حدد اسم الخلطة/المادة المصنّعة (مثلاً: <b>جرانولا محضرة</b>) والوزن الصافي الذي تنتجه الطبخة الواحدة (مثلاً <b>5 كغ</b>).<br />
                  2️⃣ أضف مكونات الطبخة (شوفان + عسل + فانيلا + مكسرات)، وسيحسب النظام <b>تكلفة الكيلو أو الغرام الواحد تلقائياً</b>.<br />
                  3️⃣ ستظهر "جرانولا محضرة" فوراً في قسم المواد لتستخدمها داخل وصفة الوجبة النهائية مع الحليب والفواكه والعلبة!
                </p>
              </div>
            </div>

            {/* Select or Create Prep Ingredient */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر مادة مصنّعة سابقة أو أنشئ مادة مصنّعة جديدة:</label>
                  <select
                    value={selectedPrepId}
                    onChange={e => setSelectedPrepId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-sm text-slate-900"
                  >
                    <option value="new">➕ إنشاء مادة مصنّعة / طبخة تحضيرية جديدة (مثل: جرانولا محضرة)</option>
                    {manufacturedIngredients.map(m => (
                      <option key={m.id} value={m.id}>
                        🥣 {m.name} (الرصيد الحالي: {m.currentStock} {m.unit} - التكلفة: {m.costPerUnit.toLocaleString()} {currentRestaurant.currency}/{m.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prep Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المادة المصنّعة / الخلطة:</label>
                  <input
                    type="text"
                    placeholder="مثال: جرانولا محضرة، صوص ثوم..."
                    value={prepName}
                    onChange={e => setPrepName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية الصافية الناتجة من الطبخة:</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={prepBatchYield}
                    onChange={e => setPrepBatchYield(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-amber-50/60 border border-amber-300 rounded-xl font-extrabold text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة قياس المادة الناتجة:</label>
                  <select
                    value={prepUnit}
                    onChange={e => setPrepUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                  >
                    {PREP_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Raw Materials in Batch */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    مكونات الطبخة الواحدة (لإنتاج {prepBatchYield} {prepUnit} من {prepName || 'المادة المصنّعة'})
                  </h2>
                  <p className="text-xs text-slate-500">أضف المقادير الأولية الداخلة في الطبخة (مثلاً: شوفان، عسل، فانيلا، مكسرات)</p>
                </div>

                <button
                  onClick={addRawToPrep}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مادة أولية للطبخة</span>
                </button>
              </div>

              {prepItems.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600">لم تُضف مكونات الطبخة بعد</div>
                  <p className="text-[11px] text-slate-400">اضغط على "إضافة مادة أولية للطبخة" لإدخال الشوفان، العسل، الفانيلا، المكسرات وغيرها...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prepItems.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const baseQty = ing ? convertQuantityAdvanced(Number(item.quantity || 0), item.unit, ing.unit, ing) : Number(item.quantity || 0);
                    const lineCost = (ing ? ing.costPerUnit : 0) * baseQty;
                    const compatibleUnits = ing ? getCompatibleUnits(ing.unit, ing) : [{ value: item.unit, label: item.unit }];

                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">المادة الأولية من المستودع</label>
                          <select
                            value={item.ingredientId}
                            onChange={e => updatePrepItem(idx, 'ingredientId', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                          >
                            {rawIngredientsForPrep
                              .filter(i => i.id !== selectedPrepId)
                              .map(i => (
                                <option key={i.id} value={i.id}>
                                  {i.name} (متوفر: {i.currentStock} {i.unit}) - السعر: {i.costPerUnit.toLocaleString()} / {i.unit}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">الكمية في الطبخة</label>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={e => updatePrepItem(idx, 'quantity', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                          />
                        </div>

                        <div className="w-full sm:w-36">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">الوحدة</label>
                          <select
                            value={item.unit}
                            onChange={e => updatePrepItem(idx, 'unit', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-950 font-bold rounded-lg text-xs"
                          >
                            {compatibleUnits.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full sm:w-32 text-left sm:text-right">
                          <span className="block text-[10px] text-slate-400 font-bold">تكلفة المقدار</span>
                          <span className="font-extrabold text-slate-900 text-xs block">
                            {Math.round(lineCost).toLocaleString()} {currentRestaurant.currency}
                          </span>
                        </div>

                        <button
                          onClick={() => removeRawFromPrep(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg self-end sm:self-center cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Batch Costing & Stock Production */}
          <div className="space-y-4">
            {/* Batch Costing Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold flex items-center gap-2 text-amber-400">
                <Calculator className="w-5 h-5" />
                <span>حاسبة تكلفة الطبخة التحضيرية</span>
              </h2>

              <div className="space-y-3 text-xs divide-y divide-slate-800">
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">إجمالي تكلفة الطبخة كاملة:</span>
                  <span className="text-base font-extrabold text-slate-200">
                    {Math.round(totalBatchCost).toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">الكمية الناتجة من الطبخة:</span>
                  <span className="text-sm font-bold text-amber-300">
                    {safeYield} {prepUnit}
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-slate-300 font-bold">تكلفة الـ 1 {prepUnit} الصافي:</span>
                  <span className="text-lg font-black text-emerald-400">
                    {prepCostPerUnit.toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>

                {prepUnit === 'كيلوغرام (كغ)' && (
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>تكلفة كل 100 غرام (للوجبات):</span>
                    <span className="font-bold text-amber-400">
                      {Math.round(prepCostPerUnit / 10).toLocaleString()} {currentRestaurant.currency}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSavePrepIngredient}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{selectedPrepId === 'new' ? 'حفظ واعتماد المادة المصنّعة في المخزون' : 'حفظ تعديلات المادة المصنّعة'}</span>
              </button>
            </div>

            {/* Produce Batch Card (Deduct Raw & Add Manufactured Stock) */}
            {selectedPrepId !== 'new' && (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
                  <PackagePlus className="w-5 h-5 text-emerald-600" />
                  <span>طبخ / إنتاج دفعة جديدة للمخزون</span>
                </div>

                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  عند تحضير طبخة جديدة في المطبخ، اضغط هنا ليقوم النظام <b>بخصم الشوفان والعسل والمكسرات</b> من المستودع، <b>وإضافة الجرانولا الجاهزة</b> إلى رصيد المستودع تلقائياً:
                </p>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-emerald-950">عدد الطبخات المحضرة:</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={batchMultiplier}
                    onChange={e => setBatchMultiplier(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-extrabold text-xs text-slate-900 text-center"
                  />
                  <span className="text-xs font-bold text-emerald-800">
                    (= +{Number((safeYield * (Number(batchMultiplier) || 1)).toFixed(2))} {prepUnit})
                  </span>
                </div>

                <button
                  onClick={handleProduceBatch}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  <span>إنتاج الطبخة وخصم المواد الأولية الآن</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
