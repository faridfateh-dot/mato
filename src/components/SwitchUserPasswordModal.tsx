import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { User } from '../types';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Crown,
  UserCog,
  Sun,
  Moon,
  Store,
  Delete,
  X,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface SwitchUserPasswordModalProps {
  targetUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export const SwitchUserPasswordModal: React.FC<SwitchUserPasswordModalProps> = ({
  targetUser,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { switchUserWithPassword, currentBranch } = useData();

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('يرجى إدخال كلمة المرور لإتمام التبديل');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = switchUserWithPassword(targetUser.id, passwordInput.trim());

    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess && result.user) {
          onSuccess(result.user);
        }
        onClose();
      }, 500);
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.message);
    }
  };

  const getRoleIcon = () => {
    if (targetUser.isPlatformOwner || targetUser.role === 'Owner') {
      return <Crown className="w-5 h-5 text-amber-400" />;
    }
    if (targetUser.role === 'Manager') {
      return <UserCog className="w-5 h-5 text-sky-400" />;
    }
    if (targetUser.shiftRole === 'cashier_evening') {
      return <Moon className="w-5 h-5 text-purple-400" />;
    }
    return <Sun className="w-5 h-5 text-emerald-400" />;
  };

  const getRoleBadgeStyle = () => {
    if (targetUser.isPlatformOwner || targetUser.role === 'Owner') {
      return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
    }
    if (targetUser.role === 'Manager') {
      return 'bg-sky-500/20 text-sky-300 border-sky-400/30';
    }
    if (targetUser.shiftRole === 'cashier_evening') {
      return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 dir-rtl overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">تأكيد كلمة المرور لتبديل المستخدم</h3>
              <p className="text-[11px] text-slate-400">حماية مشددة: لا يمكن التبديل إلا بكلمة المرور</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">

          {/* Target User Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-850 border border-slate-700 flex items-center justify-center font-black text-base text-white shadow-inner">
                {targetUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>{targetUser.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${getRoleBadgeStyle()}`}>
                    {getRoleIcon()}
                    <span>{targetUser.role === 'Cashier' ? (targetUser.shiftRole === 'cashier_evening' ? 'كاشير مسائي' : 'كاشير صباحي') : (targetUser.role === 'Owner' ? 'المالك' : targetUser.role === 'Manager' ? 'المدير' : targetUser.role)}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{targetUser.email || targetUser.phone}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Store className="w-3 h-3 text-amber-400" />
                    <span>{currentBranch?.name || 'الفرع الرئيسي'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>أدخل كلمة المرور الخاصة بهذا الحساب للتحقق والمتابعة</span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-bounce">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white rounded-2xl py-3 pr-10 pl-10 text-center font-mono text-base tracking-widest outline-none transition-all placeholder:text-slate-600 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3.5 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Touch Keypad */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold text-base border border-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-rose-400 font-bold text-xs border border-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold text-base border border-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 active:scale-95 transition-all cursor-pointer"
                title="مسح خانة"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !passwordInput.trim()}
                className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري التحقق...' : `تأكيد والتبديل إلى (${targetUser.name})`}</span>
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>

          {/* Quick Default Passwords Helper */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <div className="font-bold text-amber-300/90 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>كلمات المرور الافتراضية للأدوار:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-[9px] text-slate-300 pt-0.5">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">المالك: باسوورد الحساب</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">المدير: 1234</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">كاشير صباحي: 1111</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">كاشير مسائي: 2222</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
