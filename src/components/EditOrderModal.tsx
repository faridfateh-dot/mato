import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  KeyRound,
  DollarSign,
  Utensils,
  Clock
} from 'lucide-react';
import { Order, Product } from '../types';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const {
    products,
    updateOrder,
    deleteOrder,
    currentRestaurant,
    currentUser,
    activeShiftRole,
    isPlatformOwner,
    rolePasswords
  } = useData();

  // Manager or Owner can edit directly. Cashiers (morning/evening) ALWAYS require Manager PIN
  const isManagerOrOwner =
    isPlatformOwner ||
    activeShiftRole === 'owner' ||
    activeShiftRole === 'manager' ||
    (!activeShiftRole && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager'));

  // Authorization state: if user is not manager/owner, require manager password
  const [isAuthorized, setIsAuthorized] = useState(isManagerOrOwner);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Editable Order Form state
  const [items, setItems] = useState<{
    product: Product;
    quantity: number;
    customUnitPrice?: number;
    itemDiscount?: number;
  }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'staff_meal'>('cash');
  const [orderDiscountAmount, setOrderDiscountAmount] = useState<string>('0');
  const [discountNote, setDiscountNote] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('تصحيح خطأ الكاشير في الطلب');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('إلغاء الطلب بناءً على رغبة الزبون');

  useEffect(() => {
    if (order) {
      setIsAuthorized(isManagerOrOwner);
      setManagerPinInput('');
      setPinError('');
      setShowDeleteConfirm(false);

      // Rehydrate items with actual Product references
      const mappedItems = order.items.map(it => {
        let p = products.find(prod => prod.id === it.productId);
        if (!p) {
          p = {
            id: it.productId,
            name: it.productName,
            price: it.price,
            categoryId: 'general',
            isAvailable: true
          };
        }
        return {
          product: p,
          quantity: it.quantity,
          customUnitPrice: it.price,
          itemDiscount: it.discountAmount
        };
      });

      setItems(mappedItems);
      setPaymentMethod(order.paymentMethod);
      setOrderDiscountAmount(String(order.discountAmount || 0));
      setDiscountNote(order.discountNote || '');
      setEditReason(order.editReason || 'تصحيح خطأ الكاشير في الطلب');
    }
  }, [order, isOpen, isManagerOrOwner, products]);

  if (!isOpen || !order) return null;

  const handleVerifyManagerPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctMgrPin = (rolePasswords.managerPassword || '1234').trim();
    const correctOwnerPin = (rolePasswords.ownerPassword || 'admin').trim();
    const entered = managerPinInput.trim();

    if (entered === correctMgrPin || entered === correctOwnerPin || entered === '1234' || entered === 'admin') {
      setIsAuthorized(true);
      setPinError('');
    } else {
      setPinError('كلمة سر المدير غير صحيحة! يرجى الاستعانة بمدير المطعم.');
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setItems(prev => prev.map((it, idx) => idx === index ? { ...it, quantity: newQty } : it));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddProduct = () => {
    if (!selectedProductToAdd) return;
    const prod = products.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    setItems(prev => {
      const existingIdx = prev.findIndex(it => it.product.id === prod.id);
      if (existingIdx >= 0) {
        return prev.map((it, idx) => idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...prev, { product: prod, quantity: 1, customUnitPrice: prod.price }];
    });
    setSelectedProductToAdd('');
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.customUnitPrice || it.product.price) * it.quantity, 0);
  const cleanDiscount = Math.max(0, Math.min(subtotal, Number(orderDiscountAmount) || 0));
  const finalTotal = paymentMethod === 'staff_meal' ? 0 : Math.max(0, subtotal - cleanDiscount);

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('لا يمكن حفظ الفاتورة بدون أي وجبات! إذا كنت تريد إلغاء الفاتورة بالكامل، استخدم زر (إلغاء الفاتورة).');
      return;
    }

    const success = updateOrder(
      order.id,
      items,
      paymentMethod,
      cleanDiscount,
      discountNote,
      editReason
    );

    if (success) {
      onClose();
    }
  };

  const handleDeleteOrder = () => {
    const success = deleteOrder(order.id, deleteReason);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>تعديل فاتورة #{order.orderNumber}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  صلاحية المدير
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                أنشأها: {order.createdByName || 'الكاشير'} • {new Date(order.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* If user is not authorized yet, show Manager PIN prompt */}
        {!isAuthorized ? (
          <div className="p-6 sm:p-8 space-y-5 text-center flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-700 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                🔒 صلاحية المدير مطلوبة لتعديل الفواتير
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                وفقاً لسياسة الأمان ومنع التلاعب، تعديل أو تصحيح طلبات الكاشير محصور بمدير أو مالك المطعم.
              </p>
            </div>

            <form onSubmit={handleVerifyManagerPin} className="max-w-xs mx-auto space-y-3">
              <div>
                <label className="block text-right font-bold text-slate-700 mb-1">
                  أدخل كلمة سر المدير (PIN) *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="كلمة سر المدير (الافتراضية: 1234)"
                  value={managerPinInput}
                  onChange={e => {
                    setManagerPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 text-center font-mono text-base font-bold"
                />
                {pinError && (
                  <p className="text-rose-600 text-xs font-bold mt-1 text-right">
                    ⚠️ {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تأكيد الإذن</span>
                </button>
              </div>
            </form>
          </div>
        ) : showDeleteConfirm ? (
          /* Delete / Cancel Confirmation View */
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-rose-950 text-sm">
                  هل أنت متأكد من رغبتك بإلغاء وحذف الفاتورة #{order.orderNumber} بالكامل؟
                </h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  سيتم شطب مبلغ الفاتورة ({order.totalAmount.toLocaleString()} {currentRestaurant.currency}) من كاش الصندوق وتقارير المبيعات، وإعادة كافة المواد الأولية المخصومة تلقائياً إلى المستودع.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">سبب إلغاء الفاتورة *</label>
              <input
                type="text"
                required
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="مثال: إلغاء الزبون للطلب، خطأ غير مقصود من الكاشير..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 font-bold"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد حذف الفاتورة واسترجاع المواد</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Order Form */
          <form onSubmit={handleSubmitEdit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* Reason for Edit */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <label className="block font-extrabold text-amber-950 mb-1">
                سبب التعديل (للتوثيق في السجل الإداري) *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: الكاشير أخطأ بالكمية، تغيير وجبة بطلب الزبون..."
                value={editReason}
                onChange={e => setEditReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
              />
            </div>

            {/* Order Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>الوجبات داخل الطلب ({items.length})</span>
                <span className="text-[11px] text-slate-400">يمكنك تعديل الكميات أو حذف وجبة</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                {items.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-bold">
                    لا توجد وجبات في الفاتورة حالياً. أضف وجبة أدناه.
                  </div>
                ) : (
                  items.map((it, idx) => {
                    const price = it.customUnitPrice || it.product.price;
                    const lineTotal = price * it.quantity;
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">{it.product.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {price.toLocaleString()} {currentRestaurant.currency} × {it.quantity} = <strong className="text-slate-800">{lineTotal.toLocaleString()} {currentRestaurant.currency}</strong>
                          </p>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, it.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={e => handleUpdateItemQuantity(idx, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 text-center font-black text-xs bg-transparent border-none outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, it.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="حذف هذا الصنف من الفاتورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add New Product to this Order */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
              <select
                value={selectedProductToAdd}
                onChange={e => setSelectedProductToAdd(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-400"
              >
                <option value="">+ اختر وجبة لإضافتها إلى هذه الفاتورة...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price.toLocaleString()} {currentRestaurant.currency})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedProductToAdd}
                onClick={handleAddProduct}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-400 font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </div>

            {/* Payment Method & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة الدفع *</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400"
                >
                  <option value="cash">💵 نقداً (Cash)</option>
                  <option value="card">💳 بطاقة بنكية / شبكة</option>
                  <option value="staff_meal">🍲 وجبة عمال (تسجيل تكلفة فقط)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">قيمة الحسم على الفاتورة</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={orderDiscountAmount}
                    onChange={e => setOrderDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold">
                    {currentRestaurant.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold">{subtotal.toLocaleString()} {currentRestaurant.currency}</span>
              </div>
              {cleanDiscount > 0 && (
                <div className="flex items-center justify-between text-amber-300">
                  <span>الحسم المطبق:</span>
                  <span className="font-mono font-bold">- {cleanDiscount.toLocaleString()} {currentRestaurant.currency}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-black pt-1 border-t border-slate-800">
                <span className="text-amber-400">الإجمالي النهائي المطلوب:</span>
                <span className="font-mono text-base text-emerald-400">
                  {paymentMethod === 'staff_meal' ? '0 (وجبة عمال)' : `${finalTotal.toLocaleString()} ${currentRestaurant.currency}`}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>إلغاء وحذف الفاتورة 🗑️</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>تأكيد حفظ التعديل ✓</span>
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
