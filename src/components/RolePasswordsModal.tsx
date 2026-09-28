import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Crown,
  UserCog,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Save,
  RotateCcw,
  X,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { RestaurantRolePasswords } from '../types';

interface RolePasswordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolePasswordsModal: React.FC<RolePasswordsModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isPlatformOwner,
    activeShiftRole,
    rolePasswords,
    updateRolePasswords
  } = useData();

  const isOwner = isPlatformOwner || currentUser?.role === 'Owner' || activeShiftRole === 'owner';

  const [formData, setFormData] = useState<RestaurantRolePasswords>({
    ownerPassword: rolePasswords.ownerPassword || 'admin',
    managerPassword: rolePasswords.managerPassword || '1234',
    morningCashierPassword: rolePasswords.morningCashierPassword || '1111',
    eveningCashierPassword: rolePasswords.eveningCashierPassword || '2222'
  });

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({
    owner: false,
    manager: true,
    morning: true,
    evening: true
  });

  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleVisibility = (key: string) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetToDefault = (key: keyof RestaurantRolePasswords, defaultVal: string) => {
    setFormData(prev => ({ ...prev, [key]: defaultVal }));
    setStatusNotice({ message: `تمت استعادة القيمة الافتراضية (${defaultVal})، اضغط حفظ لتطبيقها`, type: 'success' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setStatusNotice({ message: 'عذراً! مالك المطعم فقط هو صاحب الصلاحية لتعيين وتغيير هذه الباسووردات.', type: 'error' });
      return;
    }

    if (!formData.ownerPassword?.trim()) {
      setStatusNotice({ message: 'يرجى كتابة كلمة مرور صالحة لحساب المالك', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusNotice(null);

    const result = updateRolePasswords(formData);
    setIsSaving(false);

    if (result.success) {
      setStatusNotice({ message: result.message, type: 'success' });
      setTimeout(() => {
        setStatusNotice(null);
        onClose();
      }, 1500);
    } else {
      setStatusNotice({ message: result.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 dir-rtl overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">إدارة كلمات مرور الأدوار والورديات</h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  صلاحية المالك فقط 🔒
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد كلمات المرور الخاصة بالمالك، المدير، كاشير الصباح وكاشير المساء
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Gate Notice */}
        {!isOwner ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">صلاحية محظورة</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              مالك المطعم فقط هو من يملك صلاحية وضع وتغيير كلمات مرور الأدوار (المدير، كاشير صباحي، كاشير مسائي). يرجى التبديل لحساب المالك لإجراء أي تعديل.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
            
            {/* Feedback alert */}
            {statusNotice && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                statusNotice.type === 'error'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              }`}>
                {statusNotice.type === 'error' ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{statusNotice.message}</span>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-300">أنت مسجل كمالك للمطعم: </span>
                يمكنك هنا تغيير كلمات المرور التي يستخدمها الموظفون عند تسجيل الدخول أو تبديل الوردية. احفظ التغييرات وسيتم تطبيقها فورياً على جميع الأجهزة.
              </div>
            </div>

            {/* 4 Password Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 1. Owner Password */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                    <Crown className="w-4 h-4" />
                    <span>1. كلمة مرور المالك (Owner)</span>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    كامل الصلاحيات
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={visiblePasswords.owner ? 'text' : 'password'}
                    value={formData.ownerPassword || ''}
                    onChange={e => setFormData({ ...formData, ownerPassword: e.target.value })}
                    placeholder="كلمة مرور المالك..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white rounded-xl py-2 px-3 pr-9 font-mono text-sm outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('owner')}
                    className="absolute left-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {visiblePasswords.owner ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">تستخدم لدخول حساب المالك والتحكم بكلمات المرور.</p>
              </div>

              {/* 2. Manager Password */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-sky-400/30 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-sky-400">
                    <UserCog className="w-4 h-4" />
                    <span>2. كلمة مرور المدير (Manager)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetToDefault('managerPassword', '1234')}
                    className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>افتراضي 1234</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={visiblePasswords.manager ? 'text' : 'password'}
                    value={formData.managerPassword || ''}
                    onChange={e => setFormData({ ...formData, managerPassword: e.target.value })}
                    placeholder="كلمة مرور المدير..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 text-white rounded-xl py-2 px-3 pr-9 font-mono text-sm outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('manager')}
                    className="absolute left-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {visiblePasswords.manager ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">تستخدم لمدير الصالة (مبيعات، مخزون، مشتريات، تقارير).</p>
              </div>

              {/* 3. Morning Cashier Password */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-400/30 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                    <Sun className="w-4 h-4" />
                    <span>3. كلمة مرور كاشير صباحي</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetToDefault('morningCashierPassword', '1111')}
                    className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>افتراضي 1111</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={visiblePasswords.morning ? 'text' : 'password'}
                    value={formData.morningCashierPassword || ''}
                    onChange={e => setFormData({ ...formData, morningCashierPassword: e.target.value })}
                    placeholder="كلمة مرور كاشير صباحي..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 text-white rounded-xl py-2 px-3 pr-9 font-mono text-sm outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('morning')}
                    className="absolute left-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {visiblePasswords.morning ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">تستخدم لكاشير الفترة الصباحية لدخول شاشة POS.</p>
              </div>

              {/* 4. Evening Cashier Password */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-400/30 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-400">
                    <Moon className="w-4 h-4" />
                    <span>4. كلمة مرور كاشير مسائي</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetToDefault('eveningCashierPassword', '2222')}
                    className="text-[10px] text-slate-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>افتراضي 2222</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={visiblePasswords.evening ? 'text' : 'password'}
                    value={formData.eveningCashierPassword || ''}
                    onChange={e => setFormData({ ...formData, eveningCashierPassword: e.target.value })}
                    placeholder="كلمة مرور كاشير مسائي..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 text-white rounded-xl py-2 px-3 pr-9 font-mono text-sm outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('evening')}
                    className="absolute left-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {visiblePasswords.evening ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">تستخدم لكاشير الفترة المسائية لدخول شاشة POS.</p>
              </div>

            </div>

            {/* Submit Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتطبيق كلمات المرور فوراً'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
