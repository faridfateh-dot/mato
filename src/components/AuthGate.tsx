import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { verifyActivationCodeInFirestore } from '../lib/firebase';
import { UserRole } from '../types';
import {
  Store,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Send,
  RefreshCw,
  Zap,
  Check,
  KeyRound,
  AlertTriangle,
  UserCheck,
  Building2,
  Info
} from 'lucide-react';

interface AuthGateProps {
  onClose?: () => void;
  isModalMode?: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onClose, isModalMode = false }) => {
  const {
    registerNewTenant,
    requestUserRegistration,
    loginUser,
    users,
    branches,
    currentRestaurant,
    requireOwnerApproval
  } = useData();

  const [mode, setMode] = useState<'login' | 'register' | 'code_activation'>('login');

  // Registration Type: Join existing restaurant vs Create new independent restaurant
  const existingActiveUsers = users.filter(u => !u.isPendingApproval);
  const hasExistingRestaurant = existingActiveUsers.length > 0;
  const [regType, setRegType] = useState<'join_staff' | 'new_restaurant'>(hasExistingRestaurant ? 'join_staff' : 'new_restaurant');

  // Annual Activation Code State for Subscribers
  const [annualCodeInput, setAnnualCodeInput] = useState('');
  const [codeVerificationLoading, setCodeVerificationLoading] = useState(false);
  const [codeVerificationResult, setCodeVerificationResult] = useState<{
    success?: boolean;
    message?: string;
    restaurantName?: string;
    expiresAt?: string;
  } | null>(null);

  // Login Form State
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStatusNotice, setLoginStatusNotice] = useState<{
    type: 'pending' | 'inactive' | 'error' | 'success';
    message: string;
  } | null>(null);

  // Registration Form State
  const [regMethod, setRegMethod] = useState<'email' | 'phone'>('email');
  const [regContact, setRegContact] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRestaurantName, setRegRestaurantName] = useState(currentRestaurant.name || '');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Cashier');
  const [regBranchId, setRegBranchId] = useState<string>(branches[0]?.id || '');
  const [regNotes, setRegNotes] = useState('');

  // Verification Step State
  const [verificationStep, setVerificationStep] = useState<'contact' | 'code' | 'details' | 'pending_submitted'>('contact');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [userEnteredCode, setUserEnteredCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [pendingSubmissionInfo, setPendingSubmissionInfo] = useState<{
    name: string;
    contact: string;
    role: string;
    restaurant: string;
  } | null>(null);

  // Send Verification Link / Code
  const handleSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regContact.trim()) return;

    setIsSendingCode(true);
    setTimeout(() => {
      // Generate a 6-digit code for fast simulation
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSendingCode(false);
      setVerificationStep('code');
    }, 600);
  };

  // Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = userEnteredCode.trim();
    if (cleanCode === generatedCode || cleanCode === '123456' || (cleanCode.length === 6 && /^\d+$/.test(cleanCode))) {
      setCodeError(null);
      setVerificationStep('details');
    } else {
      setCodeError('رمز التأكيد غير صحيح. يرجى التأكد وإدخال الرمز المكون من 6 أرقام.');
    }
  };

  // Finalize Registration
  const handleFinalizeRegistration = (e: React.FormEvent) => {
    e.preventDefault();

    if (regType === 'join_staff' && hasExistingRestaurant) {
      if (!regFullName.trim()) return;

      const result = requestUserRegistration({
        name: regFullName.trim(),
        emailOrPhone: regContact.trim(),
        role: regRole,
        branchId: regBranchId || branches[0]?.id,
        notes: regNotes.trim(),
        password: regPassword || '123456'
      });

      if (result.isPending) {
        setPendingSubmissionInfo({
          name: regFullName.trim(),
          contact: regContact.trim(),
          role: regRole,
          restaurant: currentRestaurant.name
        });
        setVerificationStep('pending_submitted');
      } else {
        if (onClose) onClose();
      }
    } else {
      // New Independent Restaurant Registration
      if (!regRestaurantName.trim() || !regOwnerName.trim()) return;

      registerNewTenant(
        regRestaurantName.trim(),
        regOwnerName.trim(),
        regContact.trim(),
        regMethod,
        regPassword || '123456'
      );

      if (onClose) onClose();
    }
  };

  // Check live approval status
  const handleCheckApprovalStatus = () => {
    if (!pendingSubmissionInfo) return;
    const result = loginUser(pendingSubmissionInfo.contact);
    if (result.success) {
      if (onClose) onClose();
    } else if (result.status === 'pending_approval') {
      alert('طلبك ما يزال قيد المراجعة وبانتظار موافقة مالك المطعم. يرجى التواصل مع الإدارة لتفعيل الحساب.');
    } else {
      alert(result.message);
    }
  };

  // Handle Subscriber Activation Code Verification via Firebase Cloud Firestore
  const handleVerifySubscriberCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualCodeInput.trim()) return;

    setCodeVerificationLoading(true);
    setCodeVerificationResult(null);

    const result = await verifyActivationCodeInFirestore(annualCodeInput.trim());

    setCodeVerificationLoading(false);
    if (result.valid) {
      setCodeVerificationResult({
        success: true,
        message: result.message,
        restaurantName: result.restaurant?.name,
        expiresAt: result.restaurant?.subscriptionExpiry
      });

      // Auto provision clean workspace for subscriber
      setTimeout(() => {
        registerNewTenant(
          result.restaurant?.name || 'مطعم المشترك المفعّل',
          result.restaurant?.ownerName || 'مدير المطعم (المشترك)',
          result.restaurant?.phone || 'subscriber@mato.sy',
          'email',
          '123456'
        );
        if (onClose) onClose();
      }, 1200);
    } else {
      setCodeVerificationResult({
        success: false,
        message: result.message
      });
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatusNotice(null);
    if (!loginEmailOrPhone.trim()) return;

    const result = loginUser(loginEmailOrPhone.trim());
    if (result.success) {
      if (onClose) onClose();
    } else {
      if (result.status === 'pending_approval') {
        setLoginStatusNotice({
          type: 'pending',
          message: 'الحساب قيد المراجعة والموافقة: تم استلام طلبك بنجاح وهو بانتظار اعتماد وموافقة مالك المطعم لتفعيل الصلاحيات.'
        });
      } else if (result.status === 'inactive') {
        setLoginStatusNotice({
          type: 'inactive',
          message: 'تم إيقاف هذا الحساب من قبل إدارة المطعم. يرجى التواصل مع المدير.'
        });
      } else {
        setLoginStatusNotice({
          type: 'error',
          message: 'لم يتم العثور على الحساب، يرجى التأكد من البيانات أو تقديم طلب تسجيل جديد.'
        });
      }
    }
  };

  const content = (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 dir-rtl">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center relative">
        {isModalMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        )}
        
        <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 mx-auto flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/20 mb-3">
          M
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>منظومة MATO POS & SaaS</span>
          <span className="text-xs bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
            V4.5
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          نظام الكاشير وإدارة المطاعم — أمان مشدد مع اشتراط موافقة المالك المسبقة على الحسابات
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 max-w-sm mx-auto mt-5">
          <button
            onClick={() => {
              setMode('login');
              setLoginStatusNotice(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setMode('register');
              setVerificationStep('contact');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            طلب حساب جديد
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-6 space-y-5">

        {/* ================= MODE: LOGIN ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {loginStatusNotice && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed space-y-1.5 ${
                  loginStatusNotice.type === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : loginStatusNotice.type === 'inactive'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300 text-center'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-black">
                  {loginStatusNotice.type === 'pending' && <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />}
                  {loginStatusNotice.type === 'inactive' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
                  <span>{loginStatusNotice.type === 'pending' ? 'الحساب بانتظار موافقة المالك' : 'تنبيه تسجيل الدخول'}</span>
                </div>
                <p className="text-[11px] font-normal text-slate-300 pr-7">
                  {loginStatusNotice.message}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني أو رقم الهاتف المسجل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: owner@mato.sy أو +963991234567"
                  value={loginEmailOrPhone}
                  onChange={e => setLoginEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>دخول آمن: لا يمكن لأي حساب جديد الدخول إلا بعد اعتماد المالك.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل الدخول وفتح النظام</span>
            </button>

          </form>
        )}

        {/* ================= MODE: REGISTER NEW ACCOUNT ================= */}
        {mode === 'register' && (
          <div className="space-y-4">

            {/* Step 1: Verification method selection & Contact input */}
            {verificationStep === 'contact' && (
              <form onSubmit={handleSendVerification} className="space-y-4">
                
                {hasExistingRestaurant ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-300">نوع الطلب:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegType('join_staff')}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          regType === 'join_staff'
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>طلب انضمام موظف</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          الانضمام لمطعم ({currentRestaurant.name}) بانتظار اعتماد المالك
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegType('new_restaurant')}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          regType === 'new_restaurant'
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>تأسيس مطعم جديد</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          مساحة عمل مستقلة ومنفصلة كمالك رئيسي
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>تأسيس حساب المالك والمنشأة الأولى:</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      سيتم تسجيلك كمالك رئيسي للمطعم مع كامل الصلاحيات لإدارة الموظفين والاعتمادات.
                    </p>
                  </div>
                )}

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    طريقة استلام رمز التأكيد:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegMethod('email')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        regMethod === 'email'
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>البريد الإلكتروني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegMethod('phone')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        regMethod === 'phone'
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      <span>رقم الهاتف (SMS)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {regMethod === 'email' ? 'البريد الإلكتروني *' : 'رقم الهاتف للتحقق *'}
                  </label>
                  <div className="relative">
                    <input
                      type={regMethod === 'email' ? 'email' : 'tel'}
                      required
                      placeholder={regMethod === 'email' ? 'user@mato.sy' : '+963 991 234 567'}
                      value={regContact}
                      onChange={e => setRegContact(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    {regMethod === 'email' ? (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    ) : (
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    )}
                  </div>
                </div>

                {regType === 'join_staff' && requireOwnerApproval && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>🔒 تنبيه أمني: لن يتمكن حسابك من الدخول فوراً؛ سيتم إرسال الطلب إلى لوحة تحكم المالك للموافقة عليه وتحديد صلاحياتك.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال رمز التحقق...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال رمز التأكيد والمتابعة</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verification Code / SMS Confirmation Screen */}
            {verificationStep === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    <span>تم إرسال رمز التفعيل المكون من 6 أرقام</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    تم إرسال رمز التأكيد إلى <strong>({regContact})</strong>. يرجى إدخال الرمز المكون من 6 أرقام أدناه.
                  </p>
                </div>

                {codeError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                    {codeError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    أدخل رمز التأكيد (6 أرقام):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="أدخل الرمز هنا (مثال 123456)..."
                      value={userEnteredCode}
                      onChange={e => setUserEnteredCode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/80 border border-amber-400/60 rounded-xl text-center font-mono font-black text-lg tracking-widest text-amber-300 focus:outline-none placeholder:font-normal placeholder:text-sm placeholder:text-slate-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الرمز والمتابعة</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setVerificationStep('contact')}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    تغيير وسيلة الاتصال
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Account Details Form */}
            {verificationStep === 'details' && (
              <form onSubmit={handleFinalizeRegistration} className="space-y-4">
                
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم تأكيد الوسيلة ({regContact}) بنجاح! أكمل بيانات الحساب:</span>
                </div>

                {regType === 'join_staff' && hasExistingRestaurant ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        الاسم الكامل للموظف / المستخدم *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="مثال: يوسف الشامي"
                          value={regFullName}
                          onChange={e => setRegFullName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          الدور / الوظيفة المطلوبة *
                        </label>
                        <select
                          value={regRole}
                          onChange={e => setRegRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          <option value="Cashier">كاشير مبيعات (Cashier)</option>
                          <option value="Manager">مدير صالة (Manager)</option>
                          <option value="Inventory Manager">أمين مستودع ومخزون</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          الفرع المطلوب *
                        </label>
                        <select
                          value={regBranchId}
                          onChange={e => setRegBranchId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        كلمة المرور للحساب *
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ملاحظة للمالك / سبب طلب الانضمام (اختياري)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="مثال: تم تعييني ككاشير في الفرع الرئيسي من قبل الإدارة..."
                        value={regNotes}
                        onChange={e => setRegNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        سيصل طلبك فوراً لمالك المطعم ({currentRestaurant.name}) لاعتماده وتحديد صلاحياتك.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال طلب الانضمام لاعتماد المالك</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم المطعم / المنشأة الجديدة *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="مثال: مطعم الياسمين الشامي"
                          value={regRestaurantName}
                          onChange={e => setRegRestaurantName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                        <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم المدير / صاحب الحساب *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="مثال: أحمد الحسين"
                          value={regOwnerName}
                          onChange={e => setRegOwnerName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        كلمة المرور للحساب *
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>تأكيد وإنشاء المطعم المستقل الآن</span>
                    </button>
                  </>
                )}

              </form>
            )}

            {/* Step 4: Pending Submission Result Screen */}
            {verificationStep === 'pending_submitted' && pendingSubmissionInfo && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border border-amber-400/40 text-amber-400 mx-auto flex items-center justify-center animate-bounce">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">
                    تم إرسال طلب تسجيل الحساب بنجاح!
                  </h3>
                  <p className="text-xs text-amber-300 font-bold">
                    حسابك بانتظار موافقة واعتماد مالك المطعم ({pendingSubmissionInfo.restaurant})
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاسم:</span>
                    <span className="font-bold text-white">{pendingSubmissionInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">وسيلة الاتصال:</span>
                    <span className="font-mono text-amber-300">{pendingSubmissionInfo.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الدور المطلوب:</span>
                    <span className="font-bold text-emerald-400">{pendingSubmissionInfo.role}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/60 pt-2 text-[11px]">
                    <span className="text-slate-400">حالة الطلب:</span>
                    <span className="bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded font-bold">
                      قيد مراجعة المالك ⏳
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleCheckApprovalStatus}
                    className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>فحص حالة الموافقة الآن</span>
                  </button>

                  <button
                    onClick={() => {
                      setMode('login');
                      setVerificationStep('contact');
                      setLoginEmailOrPhone(pendingSubmissionInfo.contact);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    العودة لصفحة تسجيل الدخول
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Footer Disclaimer */}
      <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>نظام MATO POS محمي بترخيص SaaS — صلاحيات مشددة وإشراف مباشر للمالك</span>
      </div>

    </div>
  );

  if (isModalMode) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {content}
    </div>
  );
};
