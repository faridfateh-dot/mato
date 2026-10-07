import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Truck,
  Plus,
  ShoppingBag,
  Phone,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Boxes,
  Trash2,
  Scan,
  Sparkles,
  Sun,
  Moon,
  Store,
  Layers,
  Pencil,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Supplier, ShiftRoleType, Purchase } from '../types';
import { getCompatibleUnits, convertQuantity, convertCostPerUnit, convertQuantityAdvanced, convertCostPerUnitAdvanced } from '../lib/unitUtils';
import { InvoiceScannerModal } from './InvoiceScannerModal';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    purchases,
    ingredients,
    currentRestaurant,
    currentUser,
    activeShiftRole,
    addSupplier,
    deleteSupplier,
    recordPurchase,
    updatePurchase,
    deletePurchase
  } = useData();

  const currentShiftRole = activeShiftRole || currentUser.shiftRole || (currentUser.role === 'owner' ? 'owner' : 'cashier_morning');
  const isOwnerOnly = currentShiftRole === 'owner' && currentUser.role === 'owner';

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showInvoiceScanner, setShowInvoiceScanner] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | 'cashier_morning' | 'cashier_evening'>('all');

  // Helper to determine shift of a purchase record
  const getPurchaseShift = (pur: { shiftRole?: string; date?: string }): 'cashier_morning' | 'cashier_evening' => {
    if (pur.shiftRole === 'cashier_morning') return 'cashier_morning';
    if (pur.shiftRole === 'cashier_evening') return 'cashier_evening';
    const hour = pur.date ? new Date(pur.date).getHours() : 12;
    return (hour >= 6 && hour < 16) ? 'cashier_morning' : 'cashier_evening';
  };

  const filteredPurchases = purchases.filter(pur => {
    if (selectedShiftFilter === 'all') return true;
    return getPurchaseShift(pur) === selectedShiftFilter;
  });

  const morningPurchasesTotal = purchases
    .filter(p => getPurchaseShift(p) === 'cashier_morning')
    .reduce((acc, p) => acc + p.totalAmount, 0);

  const eveningPurchasesTotal = purchases
    .filter(p => getPurchaseShift(p) === 'cashier_evening')
    .reduce((acc, p) => acc + p.totalAmount, 0);

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    notes: ''
  });

  // Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    ingredientId: '',
    quantity: '',
    unit: '',
    costPerUnit: '',
    shiftRole: (activeShiftRole === 'cashier_morning' || activeShiftRole === 'cashier_evening' ? activeShiftRole : 'cashier_morning') as ShiftRoleType,
    payFromCashDrawer: true
  });

  const handleOpenNewPurchaseModal = () => {
    setEditingPurchase(null);
    setPurchaseForm({
      supplierId: '',
      ingredientId: '',
      quantity: '',
      unit: '',
      costPerUnit: '',
      shiftRole: (activeShiftRole === 'cashier_morning' || activeShiftRole === 'cashier_evening' ? activeShiftRole : 'cashier_morning') as ShiftRoleType,
      payFromCashDrawer: true
    });
    setShowPurchaseModal(true);
  };

  const handleOpenEditPurchase = (pur: Purchase) => {
    if (!isOwnerOnly) return;
    const firstItem = pur.items[0];
    setEditingPurchase(pur);
    setPurchaseForm({
      supplierId: pur.supplierId === 'sup_direct_market' ? '' : pur.supplierId,
      ingredientId: firstItem ? firstItem.ingredientId : '',
      quantity: firstItem ? firstItem.quantity.toString() : '',
      unit: firstItem ? firstItem.unit : '',
      costPerUnit: firstItem ? firstItem.costPerUnit.toString() : '',
      shiftRole: getPurchaseShift(pur),
      payFromCashDrawer: true
    });
    setShowPurchaseModal(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return;

    addSupplier({
      name: supplierForm.name,
      companyName: supplierForm.companyName,
      phone: supplierForm.phone,
      notes: supplierForm.notes
    });

    setShowSupplierModal(false);
    setSupplierForm({ name: '', companyName: '', phone: '', notes: '' });
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === purchaseForm.ingredientId);

    if (!ing || !purchaseForm.quantity || !purchaseForm.costPerUnit) return;

    const sup = suppliers.find(s => s.id === purchaseForm.supplierId);
    const finalSupplierId = sup ? sup.id : 'sup_direct_market';
    const finalSupplierName = sup ? sup.name : '🛒 شراء مباشر من السوق (نقدي)';

    if (editingPurchase && isOwnerOnly) {
      updatePurchase(editingPurchase.id, {
        supplierId: finalSupplierId,
        supplierName: finalSupplierName,
        items: [
          {
            ingredientId: ing.id,
            ingredientName: ing.name,
            quantity: Number(purchaseForm.quantity),
            unit: purchaseForm.unit || ing.unit,
            costPerUnit: Number(purchaseForm.costPerUnit)
          }
        ],
        shiftRole: purchaseForm.shiftRole
      });
    } else {
      recordPurchase(
        finalSupplierId,
        finalSupplierName,
        [
          {
            ingredientId: ing.id,
            ingredientName: ing.name,
            quantity: Number(purchaseForm.quantity),
            unit: purchaseForm.unit || ing.unit,
            costPerUnit: Number(purchaseForm.costPerUnit)
          }
        ],
        purchaseForm.shiftRole
      );
    }

    setShowPurchaseModal(false);
    setEditingPurchase(null);
    setPurchaseForm({
      supplierId: '',
      ingredientId: '',
      quantity: '',
      unit: '',
      costPerUnit: '',
      shiftRole: (activeShiftRole === 'cashier_morning' || activeShiftRole === 'cashier_evening' ? activeShiftRole : 'cashier_morning') as ShiftRoleType,
      payFromCashDrawer: true
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <span>الموردون وعمليات الشراء (Suppliers & Purchasing)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ربط فواتير التوريد بالموردين وتحديث المخزون والأسعار التكلفة تلقائياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInvoiceScanner(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4 text-slate-950" />
            <span>📸 مسح فاتورة بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>

          <button
            onClick={handleOpenNewPurchaseModal}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>تسجيل فاتورة شراء</span>
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-amber-500" />
          <span>دليل الموردين المعتمدين ({suppliers.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-xs">لا يوجد موردون مسجلون بعد</p>
              <p className="text-[11px] mt-0.5">اضغط على زر "إضافة مورد جديد" لإضافة بيانات الموردين وفواتير الشراء.</p>
            </div>
          ) : (
            suppliers.map(sup => (
              <div key={sup.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 relative group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{sup.name}</span>
                    {sup.companyName && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        {sup.companyName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSupplierToDelete(sup)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="مسح المورد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {sup.phone && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 dir-ltr justify-end">
                    <span>{sup.phone}</span>
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}

                {sup.notes && (
                  <p className="text-[11px] text-slate-500 italic border-t border-slate-200/50 pt-2 mt-2">
                    "{sup.notes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Purchases History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>سجل فواتير التوريد والشراء حسب الوردية</span>
          </div>

          {/* Shift Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSelectedShiftFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                selectedShiftFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>الكل ({purchases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedShiftFilter('cashier_morning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                selectedShiftFilter === 'cashier_morning'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>☀️ مشتريات الصباح ({morningPurchasesTotal.toLocaleString()} {currentRestaurant.currency})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedShiftFilter('cashier_evening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                selectedShiftFilter === 'cashier_evening'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>🌙 مشتريات المساء ({eveningPurchasesTotal.toLocaleString()} {currentRestaurant.currency})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">رقم الفاتورة</th>
                <th className="p-3.5">الوردية / الكاشير</th>
                <th className="p-3.5">المورد / الجهة</th>
                <th className="p-3.5">المادة المشتراة والكمية</th>
                <th className="p-3.5">تاريخ الفاتورة</th>
                <th className="p-3.5 text-left">المبلغ الإجمالي</th>
                <th className="p-3.5 text-center">إدارة وتعديل (للمالك حصراً)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد فواتير شراء مسجلة في هذه الوردية بعد
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(pur => {
                  const purShift = getPurchaseShift(pur);
                  return (
                    <tr key={pur.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 font-mono">{pur.id}</td>
                      <td className="p-3.5">
                        {purShift === 'cashier_morning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <Sun className="w-3 h-3 text-amber-600" />
                            <span>☀️ وردية الصباح ({pur.createdByName})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
                            <Moon className="w-3 h-3 text-indigo-600" />
                            <span>🌙 وردية المساء ({pur.createdByName})</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{pur.supplierName}</td>
                      <td className="p-3.5">
                        {pur.items.map((it, idx) => (
                          <div key={idx} className="text-xs font-semibold text-slate-900">
                            • {it.ingredientName}: {it.quantity} {it.unit} بسعر {it.costPerUnit.toLocaleString()} {currentRestaurant.currency} / الوحدة
                          </div>
                        ))}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(pur.date).toLocaleDateString('ar-SY')} {new Date(pur.date).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-left font-black text-amber-600 text-sm">
                        {pur.totalAmount.toLocaleString()} {currentRestaurant.currency}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isOwnerOnly ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPurchase(pur)}
                              className="px-2.5 py-1.5 text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex items-center gap-1 text-[11px] font-extrabold cursor-pointer"
                              title="تعديل الفاتورة وتحديث المخزون (للمالك حصراً)"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-500" />
                              <span>تعديل</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurchaseToDelete(pur)}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1 text-[11px] font-extrabold cursor-pointer"
                              title="حذف الفاتورة واسترجاع الكمية من المخزون (للمالك حصراً)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>مسح</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200/80" title="التعديل والمسح متاح من حساب المالك حصراً">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>للمالك حصراً</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Supplier */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[88vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>إضافة مورد جديد</span>
              </h2>
              <button onClick={() => setShowSupplierModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all">✕</button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-20">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المورد الشخصي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المورد أبو أحمد"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الشركة / المؤسسة</label>
                <input
                  type="text"
                  placeholder="شركة الشام للحوم واللحوم المجمدة..."
                  value={supplierForm.companyName}
                  onChange={e => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف والتواصل</label>
                <input
                  type="text"
                  placeholder="+963 944 123 456"
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات والتوريدات المعتمدة</label>
                <textarea
                  rows={2}
                  placeholder="التخصص والمنتجات المعتمدة..."
                  value={supplierForm.notes}
                  onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-amber-400 font-extrabold shadow-md cursor-pointer"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record or Edit Purchase */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[88vh] flex flex-col">
            <div className={`p-4 sm:p-5 flex items-center justify-between shrink-0 ${editingPurchase ? 'bg-slate-900 text-amber-400' : 'bg-amber-400 text-slate-950'}`}>
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                {editingPurchase ? <Pencil className="w-4 h-4 text-amber-400" /> : <ShoppingBag className="w-4 h-4 fill-slate-950" />}
                <span>{editingPurchase ? `تعديل فاتورة شراء (${editingPurchase.id}) - صلاحية المالك` : 'تسجيل فاتورة شراء جديدة'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setEditingPurchase(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-current flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-20">
              {/* Shift Selector for Purchase */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                <label className="block font-extrabold text-amber-400 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>الوردية التي قامت بالشراء (تحديد تلقائي حسب الكاشير أو اختيار يدوي):</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, shiftRole: 'cashier_morning' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      purchaseForm.shiftRole === 'cashier_morning'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>☀️ وردية الصباح</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, shiftRole: 'cashier_evening' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      purchaseForm.shiftRole === 'cashier_evening'
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>🌙 وردية المساء</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد / جهة الشراء (اختياري - غير إجباري)</label>
                <select
                  value={purchaseForm.supplierId}
                  onChange={e => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                >
                  <option value="">🛒 شراء مباشر من السوق / سوبرماركت (بدون مورد محدد)</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.companyName || 'مستقل'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المادة الأولية المشتراة *</label>
                <select
                  required
                  value={purchaseForm.ingredientId}
                  onChange={e => {
                    const ing = ingredients.find(i => i.id === e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      ingredientId: e.target.value,
                      unit: ing ? ing.unit : '',
                      costPerUnit: ing ? ing.costPerUnit.toString() : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                >
                  <option value="">-- اختر المادة من المخزون --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (وحدة المخزون: {i.unit})</option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedIng = ingredients.find(i => i.id === purchaseForm.ingredientId);
                const compatibleUnits = selectedIng ? getCompatibleUnits(selectedIng.unit, selectedIng) : [];

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">الكمية المشتراة *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="مثال: 500 أو 10"
                          value={purchaseForm.quantity}
                          onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">وحدة الشراء *</label>
                        <select
                          value={purchaseForm.unit || (selectedIng ? selectedIng.unit : '')}
                          onChange={e => {
                            const newUnit = e.target.value;
                            const oldUnit = purchaseForm.unit || (selectedIng ? selectedIng.unit : '');
                            let newCost = Number(purchaseForm.costPerUnit || 0);
                            if (oldUnit && newUnit && newCost > 0 && selectedIng) {
                              newCost = convertCostPerUnitAdvanced(newCost, oldUnit, newUnit, selectedIng);
                            }
                            setPurchaseForm({
                              ...purchaseForm,
                              unit: newUnit,
                              costPerUnit: newCost > 0 ? Math.round(newCost * 100) / 100 + '' : purchaseForm.costPerUnit
                            });
                          }}
                          className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold text-amber-950"
                        >
                          {compatibleUnits.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">السعر لكل وحدة شراء *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="السعر"
                          value={purchaseForm.costPerUnit}
                          onChange={e => setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 font-bold"
                        />
                      </div>
                    </div>

                    {purchaseForm.quantity && purchaseForm.costPerUnit && selectedIng && (
                      <div className="p-3.5 bg-slate-900 text-white rounded-xl font-bold space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between text-amber-400">
                          <span className="text-xs">إجمالي فاتورة الشراء:</span>
                          <span className="text-sm font-black">
                            {(Number(purchaseForm.quantity) * Number(purchaseForm.costPerUnit)).toLocaleString()} {currentRestaurant.currency}
                          </span>
                        </div>
                        {(purchaseForm.unit || selectedIng.unit) !== selectedIng.unit && (
                          <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span>تحويل تلقائي للمخزون الأساسي ({selectedIng.unit}):</span>
                            <span className="font-extrabold text-emerald-400">
                              + {convertQuantityAdvanced(Number(purchaseForm.quantity), purchaseForm.unit || selectedIng.unit, selectedIng.unit, selectedIng).toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedIng.unit}
                              {' '} (بسعر {convertCostPerUnitAdvanced(Number(purchaseForm.costPerUnit), purchaseForm.unit || selectedIng.unit, selectedIng.unit, selectedIng).toLocaleString()} {currentRestaurant.currency} / {selectedIng.unit})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setEditingPurchase(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold shadow-md cursor-pointer"
                >
                  {editingPurchase ? 'حفظ التعديلات وتحديث المخزون' : 'حفظ الفاتورة وتحديث المخزون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Purchase (Owner Only) */}
      {purchaseToDelete && isOwnerOnly && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>تأكيد حذف فاتورة الشراء</span>
              </h2>
              <button onClick={() => setPurchaseToDelete(null)} className="text-white/80 hover:text-white font-bold text-base">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-slate-700 text-xs font-medium leading-relaxed">
                هل أنت متأكد من حذف فاتورة الشراء رقم <strong className="text-slate-900 font-extrabold font-mono">{purchaseToDelete.id}</strong> بقيمة <strong className="text-rose-600 font-extrabold">{purchaseToDelete.totalAmount.toLocaleString()} {currentRestaurant.currency}</strong>؟
              </p>
              <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-semibold">
                ⚠️ تنبيه: عند حذف الفاتورة سيتم خصم الكمية المشتراة تلقائياً من رصيد المخزون الحالي لضمان دقة الجرد.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deletePurchase(purchaseToDelete.id);
                    setPurchaseToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm cursor-pointer"
                >
                  نعم، حذف الفاتورة وتعديل المخزون
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Supplier */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>تأكيد مسح المورد</span>
              </h2>
              <button onClick={() => setSupplierToDelete(null)} className="text-white/80 hover:text-white font-bold text-base">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-slate-700 text-xs font-medium leading-relaxed">
                هل أنت تأكد من رغبتك في مسح المورد <strong className="text-slate-900 font-extrabold">{supplierToDelete.name}</strong> ({supplierToDelete.companyName || 'لا توجد شركة'})؟
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                ملاحظة: سجل فواتير التوريد المباشرة المحفوظة مسبقاً لن تتم إزالتها لحفظ السجلات المالية وتاريخ المخزون.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSupplierToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteSupplier(supplierToDelete.id);
                    setSupplierToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm cursor-pointer"
                >
                  نعم، مسح المورد
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
