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
  Utensils
} from 'lucide-react';
import { Product } from '../types';

export const PosView: React.FC = () => {
  const {
    products,
    categories,
    createOrder,
    currentRestaurant,
    currentBranch,
    recipes
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'staff_meal'>('cash');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);

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
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const order = createOrder(cart, paymentMethod);
    setLastCompletedOrder(order);
    setCart([]);
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

        <div className="flex items-center gap-2">
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
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={!product.isAvailable}
                className={`p-3 bg-white rounded-2xl border text-right transition-all flex flex-col justify-between h-36 cursor-pointer hover:border-amber-400 hover:shadow-md ${
                  !product.isAvailable ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-900 text-xs line-clamp-2">{product.name}</div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{product.categoryName}</span>
                  <span className="font-black text-amber-600 text-xs">
                    {product.price.toLocaleString()} {currentRestaurant.currency}
                  </span>
                </div>
              </button>
            ))}
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
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.product.name}</div>
                      <div className="text-[10px] text-amber-600 font-bold">
                        {item.product.price.toLocaleString()} x {item.quantity} = {(item.product.price * item.quantity).toLocaleString()} {currentRestaurant.currency}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black px-2">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-amber-400 text-slate-950 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-rose-500 hover:bg-rose-100 rounded mr-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Controls */}
          {cart.length > 0 && (
            <div className="space-y-4 border-t border-slate-100 pt-3">
              
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
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  {paymentMethod === 'staff_meal' ? 'قيمة الوجبة (سعر القائمة):' : 'الإجمالي النهائي:'}
                </span>
                <span className="text-lg font-black text-amber-400">
                  {cartTotal.toLocaleString()} {currentRestaurant.currency}
                </span>
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

              {lastCompletedOrder.paymentMethod === 'staff_meal' ? (
                <p className="text-[10px] text-orange-800 bg-orange-50 p-2.5 rounded-xl text-center font-bold border border-orange-200">
                  ✓ تم خصم المواد من مخزون المطبخ آلياً وتسجيل التكلفة كمصروف بـ قسم (وجبات وأكل العمال).
                </p>
              ) : (
                <p className="text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center font-bold">
                  ✓ تم خصم المكونات المستهلكة تلقائياً من مخزون الفرع
                </p>
              )}

              <button
                onClick={() => setLastCompletedOrder(null)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إغلاق والعودة للكاشير
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
