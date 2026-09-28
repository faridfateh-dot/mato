import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ShiftRoleType } from '../types';
import {
  Crown,
  UserCog,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Delete,
  Store,
  Sparkles,
  KeyRound
} from 'lucide-react';

interface RoleSelectionGateProps {
  onSuccess?: () => void;
}

interface RoleCardConfig {
  id: ShiftRoleType;
  titleAr: string;
  badgeAr: string;
  descAr: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
}

export const RoleSelectionGate: React.FC<RoleSelectionGateProps> = ({ onSuccess }) => {
  const {
    currentRestaurant,
    currentBranch,
    selectShiftRole,
    logoutUser,
    rolePasswords
  } = useData();

  const [selectedRole, setSelectedRole] = useState<ShiftRoleType | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rolesList: RoleCardConfig[] = [
    {
      id: 'owner',
      titleAr: 'المالك (Owner)',
      badgeAr: 'صاحب المنشأة • كامل الصلاحيات',
      descAr: 'التحكم الشامل بكافة أقسام النظام، التقارير المالية، وتعيين كلمات مرور الأدوار والورديات.',
      icon: <Crown className="w-8 h-8 text-amber-400" />,
      bgGradient: 'from-amber-500/20 via-slate-900 to-amber-950/40',
      borderColor: 'border-amber-400/50 hover:border-amber-400',
      glowColor: 'hover:shadow-amber-500/20',
      textColor: 'text-amber-400'
    },
    {
      id: 'manager',
      titleAr: 'المدير (Manager)',
      badgeAr: 'إدارة الصالة والعمليات',
      descAr: 'إدارة نقاط البيع، المخزون، المشتريات، المصاريف اليومية، والتقارير التشغيلية المعتمدة.',
      icon: <UserCog className="w-8 h-8 text-sky-400" />,
      bgGradient: 'from-sky-500/20 via-slate-900 to-slate-950',
      borderColor: 'border-sky-400/40 hover:border-sky-400',
      glowColor: 'hover:shadow-sky-500/20',
      textColor: 'text-sky-400'
    },
    {
      id: 'cashier_morning',
      titleAr: 'كاشير صباحي (Morning)',
      badgeAr: 'الوردية الصباحية ☀️',
      descAr: 'نقطة البيع السريعة POS، استقبال طلبات الزبائن، إنشاء الفواتير وإغلاق صندوق الصباح.',
      icon: <Sun className="w-8 h-8 text-emerald-400" />,
      bgGradient: 'from-emerald-500/20 via-slate-900 to-slate-950',
      borderColor: 'border-emerald-400/40 hover:border-emerald-400',
      glowColor: 'hover:shadow-emerald-500/20',
      textColor: 'text-emerald-400'
    },
    {
      id: 'cashier_evening',
      titleAr: 'كاشير مسائي (Evening)',
      badgeAr: 'الوردية المسائية 🌙',
      descAr: 'نقطة البيع السريعة POS، استلام وردية المساء، إنشاء الفواتير وإغلاق الصندوق اليومي.',
      icon: <Moon className="w-8 h-8 text-purple-400" />,
      bgGradient: 'from-purple-500/20 via-slate-900 to-slate-950',
      borderColor: 'border-purple-400/40 hover:border-purple-400',
      glowColor: 'hover:shadow-purple-500/20',
      textColor: 'text-purple-400'
    }
  ];

  const handleSelectCard = (roleId: ShiftRoleType) => {
    setSelectedRole(roleId);
    setPasswordInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleKeypadPress = (val: string) => {
    setPasswordInput(prev => prev + val);
    setErrorMessage(null);
  };

  const handleKeypadBackspace = () => {
    setPasswordInput(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleKeypadClear = () => {
    setPasswordInput('');
    setErrorMessage(null);
  };

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRole) return;
    if (!passwordInput.trim()) {
      setErrorMessage('يرجى إدخال كلمة المرور للمتابعة');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = selectShiftRole(selectedRole, passwordInput.trim());
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
      }, 400);
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.message);
    }
  };

  const activeCardInfo = rolesList.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 dir-rtl relative overflow-x-hidden selection:bg-amber-400 selection:text-slate-950">
      
      {/* Decorative Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-400/20">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white">MATO POS</span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                بوابة الأدوار والورديات
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-slate-200">{currentRestaurant?.name || 'المطعم'}</span>
              <span>•</span>
              <span className="text-slate-400">{currentBranch?.name || 'الفرع الرئيسي'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => logoutUser()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors text-xs font-bold cursor-pointer"
          title="تسجيل الخروج من حساب المنشأة بالكامل"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">تسجيل خروج المنشأة</span>
        </button>
      </header>

      {/* Center Work Area */}
      <main className="max-w-5xl mx-auto w-full my-auto py-8 z-10 space-y-8">
        
        {/* Title & Introduction */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs px-4 py-1.5 rounded-full font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>اختر الحساب أو الوردية لبدء العمل في النظام</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            من الذي يستخدم الكاشير / النظام الآن؟
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            لكل دور ووردية كلمة مرور خاصة بها. <span className="text-amber-400 font-bold">المالك فقط</span> هو المخول بوضع وتغيير هذه الباسووردات من لوحة التحكم.
          </p>
        </div>

        {/* The 4 Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rolesList.map(role => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => handleSelectCard(role.id)}
                className={`relative rounded-3xl p-5 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-lg ${
                  isSelected
                    ? `${role.borderColor} bg-gradient-to-b ${role.bgGradient} ring-4 ring-amber-400/20 scale-[1.02]`
                    : `border-slate-800 bg-slate-900/90 hover:bg-slate-800/80 ${role.borderColor} ${role.glowColor}`
                }`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>محدد للمتابعة</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                      {role.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300">
                      {role.badgeAr}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-base font-black ${role.textColor}`}>
                      {role.titleAr}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {role.descAr}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className={isSelected ? 'text-white' : 'text-slate-500'}>
                    {isSelected ? 'أدخل كلمة المرور ⬇' : 'اضغط للاختيار'}
                  </span>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Role Password Prompt Box */}
        {selectedRole && activeCardInfo && (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  {activeCardInfo.icon}
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <span>دخول: {activeCardInfo.titleAr}</span>
                  </h3>
                  <p className="text-xs text-slate-400">أدخل كلمة المرور أو رقم PIN المخصص لهذا الدور</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
              >
                تغيير الدور
              </button>
            </div>

            {/* Error / Success Toast Messages */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-shake">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>{errorMessage}</div>
                  <div className="text-[11px] text-rose-400 font-normal">
                    تذكير: وضع وتعديل كلمة المرور يتم حصرياً من قِبل مالك المطعم.
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="أدخل كلمة المرور / PIN..."
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white rounded-2xl py-3.5 pr-11 pl-11 text-center font-mono text-lg tracking-widest outline-none transition-all placeholder:text-slate-600 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute right-3.5 top-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-4 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Touch Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold text-lg border border-slate-800 active:scale-95 transition-all cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="py-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-rose-400 font-bold text-xs border border-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  مسح الكل
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold text-lg border border-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 active:scale-95 transition-all cursor-pointer"
                  title="مسح خانة"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !passwordInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري التحقق...' : `دخول النظام بدور (${activeCardInfo.titleAr}) ➔`}</span>
              </button>
            </form>

            {/* Quick First-Time Helper Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-right space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>كلمات المرور الافتراضية للبدء (يمكن للمالك تغييرها بأي وقت):</span>
              </div>
              <div className="font-mono text-[10px] text-slate-300 flex flex-wrap gap-2 pt-0.5">
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">المالك: باسوورد الحساب</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">المدير: 1234</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">كاشير صباحي: 1111</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">كاشير مسائي: 2222</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Notice */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 py-3 border-t border-slate-900 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>حماية مشددة: مالك المطعم فقط هو صاحب الصلاحية لتعيين وتغيير كلمات مرور الأدوار والورديات.</span>
        </div>
        <div>
          منظومة MATO POS الذكية لإدارة المطاعم © 2026
        </div>
      </footer>

    </div>
  );
};
