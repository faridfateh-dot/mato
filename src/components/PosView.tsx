import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Printer,
  Sparkles,
  Utensils,
  Receipt,
  Sun,
  Moon,
  Clock,
  Tag,
  Percent,
  X
} from 'lucide-react';
import { Product } from '../types';

export const PosView: React.FC = () => {
  const {
    products,
    categories,
    createOrder,
    currentRestaurant,
    currentBranch,
    recipes,
    orders,
    activeShiftRole
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ product: Product; quantity: number; customUnitPrice?: number }[]>([]);
  const [editingDiscountProductId, setEditingDiscountProductId] = useState<string | null>(null);
  const [orderDiscountInput, setOrderDiscountInput] = useState<string>('');
  const [orderDiscountType, setOrderDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountNote, setDiscountNote] = useState<string>('');
  const [showOrderDiscountBox, setShowOrderDiscountBox] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'staff_meal'>('cash');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);
  const [showOrdersHistoryModal, setShowOrdersHistoryModal] = useState(false);
  const [historyShiftFilter, setHistoryShiftFilter] = useState<'all' | 'cashier_morning' | 'cashier_evening'>(() => {
    if (activeShiftRole === 'cashier_morning') return 'cashier_morning';
    if (activeShiftRole === 'cashier_evening') return 'cashier_evening';
    return 'all';
  });
  const [historyDateFilter, setHistoryDateFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mato_pos_auto_print_receipt') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAutoPrint = () => {
    const next = !autoPrintReceipt;
    setAutoPrintReceipt(next);
    try {
      localStorage.setItem('mato_pos_auto_print_receipt', String(next));
    } catch {}
  };

  const printThermalReceipt = (order: any) => {
    if (!order) return;
    const isStaff = order.paymentMethod === 'staff_meal';
    const paymentLabel =
      order.paymentMethod === 'cash'
        ? 'نقدي (Cash)'
        : order.paymentMethod === 'card'
        ? 'بطاقة (Card)'
        : 'وجبة عمال داخلية';

    const dateStr = new Date(order.createdAt).toLocaleDateString('ar-SY');
    const timeStr = new Date(order.createdAt).toLocaleTimeString('ar-SY', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const rowsHtml = (order.items || [])
      .map(
        (it: any) => {
          const hasItemDisc = it.originalPrice && it.originalPrice > it.price;
          return `
        <tr>
          <td style="padding: 5px 0; font-weight: 700; text-align: right; border-bottom: 1px dashed #cbd5e1;">
            ${it.productName}
            ${hasItemDisc ? `<div style="font-size: 10px; color: #475569;">(سعر أصلي: ${Number(it.originalPrice).toLocaleString()} - بعد الحسم: ${Number(it.price).toLocaleString()})</div>` : ''}
          </td>
          <td style="padding: 5px 0; font-weight: 700; text-align: center; border-bottom: 1px dashed #cbd5e1;">${it.quantity}</td>
          <td style="padding: 5px 0; font-weight: 800; text-align: left; border-bottom: 1px dashed #cbd5e1;">${Number(it.total || 0).toLocaleString()}</td>
        </tr>`;
        }
      )
      .join('');

    const hasTotalDiscount = !isStaff && Number(order.discountAmount || 0) > 0;
    const subtotalVal = Number(order.subtotalAmount || order.totalAmount || 0);
    const discountVal = Number(order.discountAmount || 0);

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة ${order.orderNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    body {
      font-family: 'Tahoma', 'Arial', sans-serif;
      width: 74mm;
      margin: 0 auto;
      padding: 4px;
      color: #000;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 18px;
      font-weight: 900;
      margin: 0;
    }
    .subtitle {
      font-size: 11px;
      margin: 2px 0;
      font-weight: 700;
    }
    .meta {
      font-size: 11px;
      margin-bottom: 8px;
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 8px;
    }
    th {
      border-bottom: 2px solid #000;
      padding: 4px 0;
      font-weight: 900;
    }
    .total-box {
      border-top: 2px solid #000;
      border-bottom: 2px dashed #000;
      padding: 6px 0;
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${currentRestaurant.name}</div>
    <div class="subtitle">${currentBranch.name}</div>
    ${currentBranch.phone ? `<div class="subtitle">هاتف: ${currentBranch.phone}</div>` : ''}
  </div>

  <div class="meta">
    <div class="meta-row"><span>رقم الفاتورة:</span><strong>${order.orderNumber}</strong></div>
    <div class="meta-row"><span>التاريخ والوقت:</span><span>${dateStr} - ${timeStr}</span></div>
    <div class="meta-row"><span>الكاشير:</span><span>${order.createdByName || 'الكاشير'}</span></div>
    <div class="meta-row"><span>طريقة الدفع:</span><strong>${paymentLabel}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: right;">الصنف</th>
        <th style="text-align: center;">العدد</th>
        <th style="text-align: left;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${hasTotalDiscount ? `
  <div style="border-top: 1px dashed #000; padding-top: 4px; font-size: 11px; font-weight: 700;">
    <div style="display: flex; justify-content: space-between; margin: 2px 0;">
      <span>المجموع قبل الحسم:</span>
      <span>${subtotalVal.toLocaleString()} ${currentRestaurant.currency}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 2px 0;">
      <span>قيمة الحسم ${order.discountNote ? `(${order.discountNote})` : ''}:</span>
      <span>- ${discountVal.toLocaleString()} ${currentRestaurant.currency}</span>
    </div>
  </div>
  ` : ''}

  <div class="total-box">
    <span>${isStaff ? 'تكلفة وجبة العمال:' : 'الصافي المطلوب:'}</span>
    <span>${Number(isStaff ? order.costAmount : order.totalAmount).toLocaleString()} ${currentRestaurant.currency}</span>
  </div>

  <div class="footer">
    شكراً لزيارتكم - صحتين وهنا!
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 250);
    }
  };

  const addToCart = (product: Product) => {
    if (!product.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number; customUnitPrice?: number }[]
    );
  };

  const setItemCustomPrice = (productId: string, newPrice: number | undefined) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (newPrice === undefined || isNaN(newPrice)) {
            const { customUnitPrice, ...rest } = item;
            return rest;
          }
          return { ...item, customUnitPrice: Math.max(0, Math.round(newPrice)) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    if (editingDiscountProductId === productId) {
      setEditingDiscountProductId(null);
    }
  };

  const cartOriginalSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartSubtotalAfterItemDiscounts = cart.reduce(
    (acc, item) => acc + (item.customUnitPrice !== undefined ? item.customUnitPrice : item.product.price) * item.quantity,
    0
  );
  const itemLevelDiscountsTotal = Math.max(0, cartOriginalSubtotal - cartSubtotalAfterItemDiscounts);

  const parsedOrderDiscountVal = Math.max(0, Number(orderDiscountInput) || 0);
  const computedOrderLevelDiscount =
    orderDiscountType === 'percent'
      ? Math.round((cartSubtotalAfterItemDiscounts * Math.min(100, parsedOrderDiscountVal)) / 100)
      : Math.min(cartSubtotalAfterItemDiscounts, parsedOrderDiscountVal);

  const totalDiscountAmount = itemLevelDiscountsTotal + computedOrderLevelDiscount;
  const cartTotal = Math.max(0, cartSubtotalAfterItemDiscounts - computedOrderLevelDiscount);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const order = createOrder(
      cart,
      paymentMethod,
      computedOrderLevelDiscount,
      discountNote.trim() || undefined
    );
    setLastCompletedOrder(order);
    setCart([]);
    setEditingDiscountProductId(null);
    setOrderDiscountInput('');
    setDiscountNote('');
    setShowOrderDiscountBox(false);
    if (autoPrintReceipt && paymentMethod !== 'staff_meal') {
      printThermalReceipt(order);
    }
  };

  const filteredProducts = products.filter(p =>
    selectedCategory === 'all' ? true : p.categoryId === selectedCategory || p.categoryName === selectedCategory
  );

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span>شاشة الكاشير السريعة (Point of Sale - POS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل الطلبات الفورية المباشرة وإعادة خصم المخزون والمواد الأولية آلياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOrdersHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>سجل الطلبات / الفواتير بالوردية ({orders.filter(o => o.status === 'completed').length}) 📋</span>
          </button>

          <button
            type="button"
            onClick={toggleAutoPrint}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
              autoPrintReceipt
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الفاتورة تلقائياً: {autoPrintReceipt ? 'مفعّلة ✓' : 'يدوية'}</span>
          </button>

          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
            الفرع النشط: {currentBranch.name}
          </span>
        </div>
      </div>

      {/* POS Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Menu Items Selector (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-amber-400 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              الكل ({products.length})
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-slate-900 text-amber-400 shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const linkedRecipe = recipes.find(r => r.productId === product.id);
              const hasRecipeItems = Boolean(linkedRecipe && linkedRecipe.items && linkedRecipe.items.length > 0);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={!product.isAvailable}
                  className={`p-3 bg-white rounded-2xl border text-right transition-all flex flex-col justify-between h-40 cursor-pointer hover:border-amber-400 hover:shadow-md ${
                    !product.isAvailable ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs line-clamp-2">{product.name}</div>
                    </div>
                    <div>
                      {hasRecipeItems ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span>✓ مربوط بـ {linkedRecipe!.items.length} مواد مخزون</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          <span>⚠️ بدون وصفة خصم</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[50%]">{product.categoryName}</span>
                    <span className="font-black text-amber-600 text-xs">
                      {product.price.toLocaleString()} {currentRestaurant.currency}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Right: Cart & Invoice Receipt (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>سلة الطلب الفوري</span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                >
                  تفريغ
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-200 mx-auto" />
                <div>السلة فارغة حالياً</div>
                <p className="text-[11px] text-slate-400">انقر فوق أي صنف في القائمة على اليسار لإضافته</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const effectivePrice = item.customUnitPrice !== undefined ? item.customUnitPrice : item.product.price;
                  const hasItemDiscount = effectivePrice < item.product.price;
                  const isEditingDisc = editingDiscountProductId === item.product.id;

                  return (
                    <div key={item.product.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.product.name}</span>
                            {hasItemDiscount && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">
                                حسم وجبة ✓
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold mt-0.5">
                            {hasItemDiscount ? (
                              <span className="flex items-center gap-1.5">
                                <span className="line-through text-slate-400">{item.product.price.toLocaleString()}</span>
                                <span className="text-emerald-700 font-black">{effectivePrice.toLocaleString()}</span>
                                <span className="text-amber-600">
                                  × {item.quantity} = {(effectivePrice * item.quantity).toLocaleString()} {currentRestaurant.currency}
                                </span>
                              </span>
                            ) : (
                              <span className="text-amber-600">
                                {item.product.price.toLocaleString()} × {item.quantity} = {(item.product.price * item.quantity).toLocaleString()} {currentRestaurant.currency}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingDiscountProductId(isEditingDisc ? null : item.product.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer ${
                              hasItemDiscount || isEditingDisc
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                            }`}
                            title="عمل حسم أو تعديل سعر هذه الوجبة"
                          >
                            <Tag className="w-3 h-3" />
                            <span>حسم</span>
                          </button>
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-black px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded bg-amber-400 text-slate-950 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded mr-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Per-Meal Discount Controls */}
                      {isEditingDisc && (
                        <div className="pt-2 border-t border-slate-200/80 bg-white p-2.5 rounded-lg space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-700">
                            <span>🏷️ تحديد حسم أو سعر جديد للوجبة ({item.product.name}):</span>
                            {hasItemDiscount && (
                              <button
                                type="button"
                                onClick={() => setItemCustomPrice(item.product.id, undefined)}
                                className="text-rose-600 hover:underline font-black cursor-pointer"
                              >
                                إلغاء الحسم ✕
                              </button>
                            )}
                          </div>

                          {/* Quick percentage chips */}
                          <div className="flex flex-wrap items-center gap-1">
                            {[10, 15, 20, 25, 50, 100].map(pct => {
                              const discounted = Math.round(item.product.price * (1 - pct / 100));
                              return (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setItemCustomPrice(item.product.id, discounted)}
                                  className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                                    effectivePrice === discounted
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-200'
                                  }`}
                                >
                                  {pct === 100 ? 'مجاناً 100%' : `حسم ${pct}%`}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom price or discount amount inputs */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold mb-0.5">السعر بعد الحسم للقطعة:</label>
                              <input
                                type="number"
                                value={effectivePrice}
                                onChange={e => setItemCustomPrice(item.product.id, Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded font-mono font-black text-xs text-emerald-700 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold mb-0.5">أو قيمة الحسم للقطعة:</label>
                              <input
                                type="number"
                                value={Math.max(0, item.product.price - effectivePrice)}
                                onChange={e => {
                                  const disc = Math.max(0, Number(e.target.value) || 0);
                                  setItemCustomPrice(item.product.id, Math.max(0, item.product.price - disc));
                                }}
                                placeholder="مثال: 5000"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 focus:border-amber-500 rounded font-mono font-black text-xs text-rose-600 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout Controls */}
          {cart.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              
              {/* Whole Order / Invoice Discount Toggle & Box */}
              {paymentMethod !== 'staff_meal' && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowOrderDiscountBox(!showOrderDiscountBox)}
                      className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>🏷️ حسم على الفاتورة / الوجبة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOrderDiscountBox(!showOrderDiscountBox)}
                      className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      {showOrderDiscountBox ? 'إخفاء' : '+ إضافة حسم'}
                    </button>
                  </div>

                  {showOrderDiscountBox && (
                    <div className="space-y-2 pt-1.5 border-t border-emerald-200/80 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setOrderDiscountType('amount')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                            orderDiscountType === 'amount'
                              ? 'bg-slate-900 text-amber-400'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          مبلغ ثابت ({currentRestaurant.currency})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderDiscountType('percent')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer ${
                            orderDiscountType === 'percent'
                              ? 'bg-slate-900 text-amber-400'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                          <span>نسبة مئوية (%)</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(orderDiscountType === 'percent' ? [5, 10, 15, 20, 25, 50] : [2000, 5000, 10000, 15000, 25000]).map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setOrderDiscountInput(String(val))}
                            className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                              Number(orderDiscountInput) === val
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {orderDiscountType === 'percent' ? `${val}%` : `${val.toLocaleString()}`}
                          </button>
                        ))}
                        {orderDiscountInput && (
                          <button
                            type="button"
                            onClick={() => setOrderDiscountInput('')}
                            className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 cursor-pointer"
                          >
                            تصفير ✕
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          value={orderDiscountInput}
                          onChange={e => setOrderDiscountInput(e.target.value)}
                          placeholder={orderDiscountType === 'percent' ? 'نسبة الحسم %' : 'قيمة الحسم...'}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-black text-xs text-slate-900 outline-none"
                        />
                        <input
                          type="text"
                          value={discountNote}
                          onChange={e => setDiscountNote(e.target.value)}
                          placeholder="سبب الحسم (اختياري)"
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">طريقة الدفع / التسجيل:</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'cash' ? 'bg-slate-900 text-amber-400 shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[10px]">نقداً (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'card' ? 'bg-slate-900 text-amber-400 shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[10px]">بطاقة (Card)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('staff_meal')}
                    className={`py-2 px-1 rounded-xl font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'staff_meal' ? 'bg-orange-600 text-white shadow ring-2 ring-orange-400' : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                    }`}
                    title="تسجيل الطلب كـ وجبة عمال تقتطع المخزون وتضاف للمصاريف آلياً"
                  >
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px]">أكل عمال 🍲</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'staff_meal' && (
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-[11px] text-orange-900 font-bold space-y-0.5">
                  <div className="flex items-center gap-1.5 font-black text-orange-950">
                    <Utensils className="w-3.5 h-3.5 text-orange-600" />
                    <span>تسجيل الطلب كـ وجبة عمال (أكل من المحل):</span>
                  </div>
                  <p className="text-[10px] text-orange-800 leading-tight">
                    سيتم خصم المكونات من مخزون المطبخ تلقائياً، وتسجيل تكلفة الوجبة كمصروف تشغيلي بـ قسم (وجبات وأكل العمال).
                  </p>
                </div>
              )}

              {/* Total & Confirm Button */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5">
                {totalDiscountAmount > 0 && paymentMethod !== 'staff_meal' && (
                  <div className="border-b border-slate-800 pb-1.5 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>المجموع قبل الحسم:</span>
                      <span className="line-through font-mono">{cartOriginalSubtotal.toLocaleString()} {currentRestaurant.currency}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>إجمالي الحسم الممنوح:</span>
                      <span className="font-mono">- {totalDiscountAmount.toLocaleString()} {currentRestaurant.currency}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    {paymentMethod === 'staff_meal' ? 'قيمة الوجبة (سعر القائمة):' : 'الصافي النهائي للدفع:'}
                  </span>
                  <span className="text-lg font-black text-amber-400">
                    {cartTotal.toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className={`w-full py-3 font-extrabold text-sm rounded-xl shadow-lg transition-all cursor-pointer ${
                  paymentMethod === 'staff_meal'
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                }`}
              >
                {paymentMethod === 'staff_meal' ? 'تأكيد وإصدار وجبة العمال (تسجيل المصروف) 🍲' : 'تأكيد الدفع وإصدار الطلب ⚡'}
              </button>

            </div>
          )}

        </div>

      </div>

      {/* Completed Order Modal Receipt */}
      {lastCompletedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className={`p-4 text-white text-center space-y-1 ${lastCompletedOrder.paymentMethod === 'staff_meal' ? 'bg-orange-600' : 'bg-emerald-600'}`}>
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <h2 className="font-extrabold text-base">
                {lastCompletedOrder.paymentMethod === 'staff_meal' ? 'تم تسجيل وجبة العمال بنجاح! 🍲' : 'تم إتمام الطلب بنجاح!'}
              </h2>
              <p className="text-[11px] opacity-90">{lastCompletedOrder.orderNumber}</p>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between text-slate-500 text-[11px] border-b border-slate-100 pb-2">
                <span>الفرع: {currentBranch.name}</span>
                <span>{new Date(lastCompletedOrder.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {lastCompletedOrder.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between font-medium text-slate-900">
                    <span>{it.productName} (x{it.quantity})</span>
                    <span className="font-bold">{it.total.toLocaleString()} {currentRestaurant.currency}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>{lastCompletedOrder.paymentMethod === 'staff_meal' ? 'تكلفة الوجبة المسجلة كمصروف:' : 'المبلغ الكلي المدفوع:'}</span>
                <span className={lastCompletedOrder.paymentMethod === 'staff_meal' ? 'text-orange-600' : 'text-amber-600'}>
                  {lastCompletedOrder.paymentMethod === 'staff_meal' ? lastCompletedOrder.costAmount.toLocaleString() : lastCompletedOrder.totalAmount.toLocaleString()} {currentRestaurant.currency}
                </span>
              </div>

              {lastCompletedOrder.depletedIngredients && lastCompletedOrder.depletedIngredients.length > 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                  <div className="text-[11px] font-black text-emerald-900 flex items-center justify-between">
                    <span>✓ المواد المخصومة تلقائياً من المخزون:</span>
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-950 px-1.5 py-0.5 rounded">
                      {lastCompletedOrder.depletedIngredients.length} مادة
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {lastCompletedOrder.depletedIngredients.map((dep: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[10px] bg-white/90 px-2 py-1 rounded-lg border border-emerald-100"
                      >
                        <span className="font-extrabold text-slate-800">{dep.ingredientName}</span>
                        <span className="font-black text-rose-600">
                          - {Number(dep.deductedRecipeQty).toLocaleString('en-US', { maximumFractionDigits: 3 })} {dep.recipeUnit}
                        </span>
                        <span className="text-slate-500 font-bold">
                          (المتبقي: {Number(dep.remainingStock).toLocaleString('en-US', { maximumFractionDigits: 4 })} {dep.baseUnit})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[10px] text-amber-900 font-bold text-center">
                  ⚠️ لم يتم خصم مواد أولية لأن الأصناف المباعة ليس لها وصفة مسجلة في قسم (الوصفات وحساب التكاليف).
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => printThermalReceipt(lastCompletedOrder)}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فاتورة الكاشير الحرارية (80mm) 🖨️</span>
                </button>

                <button
                  onClick={() => setLastCompletedOrder(null)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إغلاق والعودة للكاشير
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Orders History Modal */}
      {showOrdersHistoryModal && (() => {
        const toLocalKey = (isoStr: string) => {
          if (!isoStr) return '';
          const d = new Date(isoStr);
          if (isNaN(d.getTime())) return isoStr.split('T')[0];
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        const getOrderShift = (o: any): 'cashier_morning' | 'cashier_evening' => {
          if (o.shiftRole === 'cashier_morning') return 'cashier_morning';
          if (o.shiftRole === 'cashier_evening') return 'cashier_evening';
          const h = o.createdAt ? new Date(o.createdAt).getHours() : 12;
          return h >= 6 && h < 16 ? 'cashier_morning' : 'cashier_evening';
        };

        const dateOrders = orders.filter(o => o.status === 'completed' && toLocalKey(o.createdAt) === historyDateFilter);
        const filteredHistoryOrders = dateOrders.filter(o =>
          historyShiftFilter === 'all' ? true : getOrderShift(o) === historyShiftFilter
        );
        const morningCount = dateOrders.filter(o => getOrderShift(o) === 'cashier_morning').length;
        const eveningCount = dateOrders.filter(o => getOrderShift(o) === 'cashier_evening').length;
        const totalFilteredRevenue = filteredHistoryOrders
          .filter(o => o.paymentMethod !== 'staff_meal')
          .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[85vh]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="font-black text-sm text-amber-400">سجل الطلبات والفواتير حسب الوردية</h2>
                    <p className="text-[11px] text-slate-300">استعراض وطباعة جميع الطلبات المسجلة في الوردية الصباحية أو المسائية</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrdersHistoryModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHistoryShiftFilter('cashier_morning')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1 cursor-pointer ${
                      historyShiftFilter === 'cashier_morning'
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>☀️ الوردية الصباحية ({morningCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryShiftFilter('cashier_evening')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1 cursor-pointer ${
                      historyShiftFilter === 'cashier_evening'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>🌙 الوردية المسائية ({eveningCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryShiftFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer ${
                      historyShiftFilter === 'all'
                        ? 'bg-slate-900 text-amber-400 shadow'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    📊 الكل ({dateOrders.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={historyDateFilter}
                    onChange={e => setHistoryDateFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-black text-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/70 flex items-center justify-between font-bold text-slate-800">
                <span>عدد الطلبات المعروضة: <strong>{filteredHistoryOrders.length} طلب</strong></span>
                <span>إجمالي مبيعاتها: <strong className="text-emerald-700 font-black">{totalFilteredRevenue.toLocaleString()} {currentRestaurant.currency}</strong></span>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
                {filteredHistoryOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold">
                    لا توجد فواتير مسجلة في هذه الوردية بتاريخ {historyDateFilter}
                  </div>
                ) : (
                  filteredHistoryOrders.map(order => {
                    const shift = getOrderShift(order);
                    return (
                      <div key={order.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 font-extrabold text-slate-900">
                            <span className="font-mono text-sm">#{order.orderNumber}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              shift === 'cashier_morning'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}>
                              {shift === 'cashier_morning' ? '☀️ صباحية' : '🌙 مسائية'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              order.paymentMethod === 'cash'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentMethod === 'staff_meal'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.paymentMethod === 'cash' ? 'نقداً' : order.paymentMethod === 'staff_meal' ? 'وجبة عمال' : 'بطاقة'}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-700">
                            {order.items.map((it: any) => `${it.productName} × ${it.quantity}`).join(' ، ')}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                          <div className="font-black text-sm text-slate-900 font-mono">
                            {order.totalAmount.toLocaleString()} {currentRestaurant.currency}
                          </div>
                          <button
                            type="button"
                            onClick={() => printThermalReceipt(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
