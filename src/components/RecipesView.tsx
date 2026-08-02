import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  ChefHat,
  Plus,
  Trash2,
  Calculator,
  Percent,
  CircleDollarSign,
  CheckCircle,
  Lightbulb,
  Boxes
} from 'lucide-react';
import { Product, Ingredient, RecipeIngredientItem } from '../types';
import { convertQuantity, convertQuantityAdvanced, getCompatibleUnits, getUnitCategory, isKgUnit, isLiterUnit } from '../lib/unitUtils';

interface RecipesViewProps {
  initialProductId?: string;
}

export const RecipesView: React.FC<RecipesViewProps> = ({ initialProductId }) => {
  const {
    products,
    ingredients,
    recipes,
    currentRestaurant,
    saveRecipe,
    updateProduct
  } = useData();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id || '')
  );

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  const existingRecipe = recipes.find(r => r.productId === selectedProduct?.id);

  const [recipeItems, setRecipeItems] = useState<RecipeIngredientItem[]>([]);

  useEffect(() => {
    if (existingRecipe) {
      setRecipeItems(existingRecipe.items);
    } else {
      setRecipeItems([]);
    }
  }, [selectedProductId, existingRecipe]);

  const addIngredientToRecipe = () => {
    if (ingredients.length === 0) return;
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

    setRecipeItems([
      ...recipeItems,
      {
        ingredientId: firstIng.id,
        ingredientName: firstIng.name,
        unit: defaultUnit,
        quantity: defaultQty
      }
    ]);
  };

  const removeIngredientFromRecipe = (index: number) => {
    setRecipeItems(recipeItems.filter((_, idx) => idx !== index));
  };

  const updateRecipeItem = (index: number, field: keyof RecipeIngredientItem, value: any) => {
    setRecipeItems(recipeItems.map((item, idx) => {
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
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Live Calculations with Unit Conversion
  let calculatedCost = 0;
  recipeItems.forEach(item => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) {
      const baseQty = convertQuantityAdvanced(Number(item.quantity || 0), item.unit, ing.unit, ing);
      calculatedCost += baseQty * ing.costPerUnit;
    }
  });

  const sellingPrice = selectedProduct ? selectedProduct.price : 0;
  const profitAmount = sellingPrice - calculatedCost;
  const profitMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;
  const suggestedPrice = Math.round((calculatedCost * 1.5) / 1000) * 1000;

  const handleSaveRecipe = () => {
    if (!selectedProduct) return;
    saveRecipe(selectedProduct.id, recipeItems);
    alert(`تم حفظ ووصفة الصنف "${selectedProduct.name}" بنجاح!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-500" />
            <span>الوصفات وحساب التكلفة والهوامش (Recipes & Costing)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ربط الأصناف بالمكونات، حساب التكلفة التلقائي، واقتراح أسعار البيع المثالية لضمان الأرباح
          </p>
        </div>

        <button
          onClick={handleSaveRecipe}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>حفظ وتحديث الوصفة</span>
        </button>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Product Selector & Recipe Ingredients Builder (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Select Product Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <label className="block text-xs font-bold text-slate-700 mb-2">اختر الصنف من قائمة الطعام:</label>
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

          {/* Recipe Ingredients Builder */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">مكونات الوصفة الصنف: "{selectedProduct?.name}"</h2>
                <p className="text-xs text-slate-500">أضف المكونات والكميات المستخدمة لتحضير الصنف الموحد</p>
              </div>

              <button
                onClick={addIngredientToRecipe}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مكون جديد</span>
              </button>
            </div>

            {recipeItems.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-600">لا توجد مكونات مضافة لوصفة هذا الصنف بعد</div>
                <p className="text-[11px] text-slate-400">انقر فوق "إضافة مكون جديد" لربط الحبش، الجبنة، العجين، البن وغيرها...</p>
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
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">المادة الأولية</label>
                          <select
                            value={item.ingredientId}
                            onChange={e => updateRecipeItem(idx, 'ingredientId', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                          >
                            {ingredients.map(i => (
                              <option key={i.id} value={i.id}>
                                {i.name} ({i.unit}) {i.pieceWeight ? `[1 ${i.pieceUnitName || 'رأس'} ≈ ${i.pieceWeight}${i.pieceWeightUnit || 'غ'}]` : ''} - بسعر {i.costPerUnit.toLocaleString()} / {i.unit}
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

        {/* Right Column: Costing Summary & AI Price Suggestions (1 Col) */}
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
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-amber-400">
                    {sellingPrice.toLocaleString()} {currentRestaurant.currency}
                  </span>
                  <button
                    onClick={() => {
                      const newP = prompt('أدخل سعر البيع الجديد للصنف:', sellingPrice.toString());
                      if (newP !== null && !isNaN(Number(newP))) {
                        updateProduct(selectedProduct.id, { price: Number(newP) });
                      }
                    }}
                    className="text-[10px] underline text-slate-400 hover:text-white"
                  >
                    تعديل
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400">التكلفة التقديرية للمكونات:</span>
                <span className="text-base font-extrabold text-slate-200">
                  {Math.round(calculatedCost).toLocaleString()} {currentRestaurant.currency}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400">هامش الربح الصافي (%):</span>
                <span className={`text-base font-extrabold ${profitMargin >= 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400">مبلغ الربح لكل قطعة:</span>
                <span className="text-base font-black text-emerald-400">
                  {Math.round(profitAmount).toLocaleString()} {currentRestaurant.currency}
                </span>
              </div>

            </div>
          </div>

          {/* AI Price Recommendation Card */}
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>اقتراح MATO AI لسعر البيع</span>
            </div>

            <p className="text-xs text-amber-900/80 leading-relaxed">
              بناءً على التكلفة المحسوبة ({Math.round(calculatedCost).toLocaleString()} {currentRestaurant.currency}) وهامش ربح معتمد 50%، نوصي بسعر بيع:
            </p>

            <div className="text-xl font-black text-slate-900 dir-rtl">
              {suggestedPrice.toLocaleString()} <span className="text-xs font-normal text-slate-600">{currentRestaurant.currency}</span>
            </div>

            <button
              onClick={() => {
                if (selectedProduct) {
                  updateProduct(selectedProduct.id, { price: suggestedPrice });
                  alert(`تم تطبيق السعر المقترح (${suggestedPrice.toLocaleString()} ${currentRestaurant.currency}) للمنتج بنجاح!`);
                }
              }}
              className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              تطبيق السعر المقترح تلقائياً
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
