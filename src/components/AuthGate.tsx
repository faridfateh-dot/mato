import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { verifyActivationCodeInFirestore, PLATFORM_OWNER_CONTACT, normalizeArabicNumerals } from '../lib/firebase';
import { UserRole, SaaSPlanType } from '../types';
import {
  readFromClipboard,
  extractActivationCodeFromText,
  copyToClipboard,
  buildSubscriptionRequestNotification
} from '../lib/whatsappShare';
import { WhatsAppShareModal } from './WhatsAppShareModal';
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
  Building2,
  MessageCircle,
  Key,
  MapPin,
  HelpCircle,
  Eye,
  EyeOff,
  Clipboard,
  Copy
} from 'lucide-react';

interface AuthGateProps {
  onClose?: () => void;
  isModalMode?: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onClose, isModalMode = false }) => {
  const {
    registerNewTenant,
    requestUserRegistration,
    requestRestaurantSubscription,
    approveRestaurantSubscription,
    activateRestaurantWithCode,
    loginUser,
    users,
    branches,
    currentRestaurant,
    requireOwnerApproval,
    ownerContact
  } = useData();

  const [activeTab, setActiveTab] = useState<'login' | 'register_restaurant' | 'activate_code'>('login');

  // Login State
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStatusNotice, setLoginStatusNotice] = useState<{
    type: 'pending' | 'inactive' | 'error' | 'success';
    message: string;
  } | null>(null);

  // Inline Activation in Login Notice State
  const [showInlineActivation, setShowInlineActivation] = useState(false);
  const [inlineActivationCode, setInlineActivationCode] = useState('');
  const [isActivatingInline, setIsActivatingInline] = useState(false);
  const [inlineActivationError, setInlineActivationError] = useState<string | null>(null);

  // Restaurant Registration Form State (Fast 1-Step)
  const [restName, setRestName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [restPhone, setRestPhone] = useState('');
  const [restEmail, setRestEmail] = useState('');
  const [restCity, setRestCity] = useState('دمشق');
  const [restPlanType, setRestPlanType] = useState<SaaSPlanType>('professional');
  const [restPassword, setRestPassword] = useState('');
  const [restNotes, setRestNotes] = useState('');
  const [isSubmittingRest, setIsSubmittingRest] = useState(false);
  const [restSubmittedSuccess, setRestSubmittedSuccess] = useState<{
    requestId: string;
    restaurantName: string;
    ownerName: string;
    phone: string;
    password?: string;
  } | null>(null);

  // Annual Code Activation State
  const [annualCodeInput, setAnnualCodeInput] = useState('');
  const [codeVerificationLoading, setCodeVerificationLoading] = useState(false);
  const [pastedStatus, setPastedStatus] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [codeVerificationResult, setCodeVerificationResult] = useState<{
    success?: boolean;
    message?: string;
    restaurantName?: string;
    expiresAt?: string;
  } | null>(null);

  const handlePasteCode = async () => {
    const text = await readFromClipboard();
    if (!text) {
      setPastedStatus('يرجى نسخ الكود أولاً أو كتابته يدوياً.');
      setTimeout(() => setPastedStatus(null), 3000);
      return;
    }
    const extracted = extractActivationCodeFromText(text);
    if (extracted) {
      setAnnualCodeInput(extracted);
      setPastedStatus(`تم استخراج ولصق الكود بنجاح: ${extracted}`);
    } else {
      setAnnualCodeInput(text.trim().toUpperCase());
      setPastedStatus('تم لصق النص من الحافظة!');
    }
    setTimeout(() => setPastedStatus(null), 3000);
  };

  // Quick Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatusNotice(null);
    const cleanUser = normalizeArabicNumerals(loginEmailOrPhone).trim();
    const cleanPass = normalizeArabicNumerals(loginPassword).trim();
    if (!cleanUser) return;

    setIsLoggingIn(true);
    try {
      const result = await loginUser(cleanUser, cleanPass || loginPassword.trim());
      if (result.success) {
        if (onClose) onClose();
      } else {
        if (result.status === 'pending_approval') {
          setLoginStatusNotice({
            type: 'pending',
            message: 'الحساب قيد المراجعة والموافقة: تم استلام طلبك بنجاح وهو بانتظار اعتماد وموافقة مالك المنظومة لتفعيل الصلاحيات.'
          });
        } else if (result.status === 'inactive') {
          setLoginStatusNotice({
            type: 'inactive',
            message: 'تم إيقاف هذا الحساب من قبل إدارة المنظومة. يرجى التواصل مع المدير المسؤول.'
          });
        } else if (result.status === 'wrong_password') {
          setLoginStatusNotice({
            type: 'error',
            message: result.message || 'كلمة المرور غير صحيحة! يرجى إدخال كلمة المرور الصحيحة للحساب.'
          });
        } else {
          setLoginStatusNotice({
            type: 'error',
            message: result.message || 'لم يتم العثور على الحساب، يرجى التأكد من البريد الإلكتروني أو رقم الهاتف، أو تقديم طلب تسجيل مطعم جديد.'
          });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginStatusNotice({
        type: 'error',
        message: 'حدث خطأ أثناء محاولة تسجيل الدخول. يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Inline Activation Submit Handler (from pending login alert)
  const handleInlineCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineActivationCode.trim()) return;

    setIsActivatingInline(true);
    setInlineActivationError(null);
    try {
      const res = await activateRestaurantWithCode(inlineActivationCode.trim(), loginEmailOrPhone.trim());
      if (res.success) {
        setLoginStatusNotice({
          type: 'success',
          message: res.message
        });
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      } else {
        setInlineActivationError(res.message);
      }
    } catch (err) {
      console.error('Inline activation error:', err);
      setInlineActivationError('حدث خطأ أثناء محاولة تفعيل الكود.');
    } finally {
      setIsActivatingInline(false);
    }
  };

  // 1-Step Restaurant Registration Handler
  const handleRegisterRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restName.trim() || !ownerName.trim() || !restPhone.trim()) return;

    setIsSubmittingRest(true);
    const pwd = restPassword.trim() || '123456';

    try {
      const res = requestRestaurantSubscription({
        restaurantName: restName.trim(),
        ownerName: ownerName.trim(),
        phone: restPhone.trim(),
        email: restEmail.trim(),
        password: pwd,
        city: restCity,
        branchesCount: 1,
        planType: restPlanType,
        notes: restNotes.trim() ? `${restNotes.trim()} | كلمة المرور: ${pwd}` : `كلمة المرور: ${pwd}`
      });

      setRestSubmittedSuccess({
        requestId: res.requestId,
        restaurantName: restName.trim(),
        ownerName: ownerName.trim(),
        phone: restPhone.trim(),
        password: pwd
      });
    } catch (err) {
      console.error('Restaurant registration error:', err);
    } finally {
      setIsSubmittingRest(false);
    }
  };

  // Annual Code Activation Handler
  const handleVerifySubscriberCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualCodeInput.trim()) return;

    setCodeVerificationLoading(true);
    setCodeVerificationResult(null);

    try {
      const result = await activateRestaurantWithCode(annualCodeInput.trim(), loginEmailOrPhone.trim());

      setCodeVerificationLoading(false);
      if (result.success) {
        setCodeVerificationResult({
          success: true,
          message: result.message,
          restaurantName: result.restaurant?.name
        });

        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      } else {
        setCodeVerificationResult({
          success: false,
          message: result.message
        });
      }
    } catch (err) {
      console.error('Activation error:', err);
      setCodeVerificationLoading(false);
      setCodeVerificationResult({
        success: false,
        message: 'حدث خطأ أثناء تفعيل الكود، يرجى المحاولة مجدداً.'
      });
    }
  };

  // Generate WhatsApp Notification Link to Farid
  const getWhatsAppNotifyUrl = (rest: { name: string; owner: string; phone: string; reqId: string }) => {
    const text = `مرحباً أستاذ فريد 👋\nتم إرسال طلب تسجيل وترخيص مطعم جديد لمنظومة MATO POS:\n🍽️ اسم المطعم: ${rest.name}\n👤 صاحب المطعم: ${rest.owner}\n📱 رقم الهاتف: ${rest.phone}\n🆔 رقم الطلب: ${rest.reqId}\n\nيرجى اعتماد الحساب وإصدار كود التفعيل السنوي. شكراً لك!`;
    const cleanNum = (ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  };

  const content = (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 dir-rtl">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center relative">
        {isModalMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white text-lg font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
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
          نظام الكاشير وإدارة المطاعم المتكامل — تسجيل سريع وسلس مع المزامنة السحابية الفورية
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 max-w-md mx-auto mt-5">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginStatusNotice(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🔐 تسجيل الدخول
          </button>

          <button
            onClick={() => {
              setActiveTab('register_restaurant');
              setRestSubmittedSuccess(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'register_restaurant'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🍽️ تسجيل مطعم جديد
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-6 space-y-5">

        {/* ================= TAB 1: LOGIN ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {loginStatusNotice && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed space-y-2 ${
                  loginStatusNotice.type === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : loginStatusNotice.type === 'inactive'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : loginStatusNotice.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300 text-center'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-black">
                  {loginStatusNotice.type === 'pending' && <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />}
                  {loginStatusNotice.type === 'inactive' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
                  {loginStatusNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  <span>
                    {loginStatusNotice.type === 'pending'
                      ? 'الحساب بانتظار موافقة فريد وتوليد كود التفعيل'
                      : loginStatusNotice.type === 'success'
                      ? 'تم التفعيل بنجاح!'
                      : 'تنبيه تسجيل الدخول'}
                  </span>
                </div>
                <p className="text-[11px] font-normal text-slate-300 pr-7">
                  {loginStatusNotice.message}
                </p>
                {loginStatusNotice.type === 'pending' && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`https://wa.me/${(ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً أستاذ فريد 👋\nقمت بتقديم طلب تسجيل لمطعمي (${loginEmailOrPhone || 'طلب جديد'}). الحساب بانتظار موافقتك وتزويدي بكود التفعيل السنوي. شكراً لك!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>تواصل مع فريد عبر واتساب للموافقة</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineActivation(!showInlineActivation);
                          setInlineActivationError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-xs"
                      >
                        <Key className="w-4 h-4" />
                        <span>استلمت الكود؟ إدخال كود التفعيل الآن</span>
                      </button>
                    </div>

                    {showInlineActivation && (
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-400/40 space-y-2 text-right">
                        <label className="block text-[11px] font-bold text-amber-300">
                          أدخل كود التفعيل السنوي الذي أرسله لك الأستاذ فريد:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="مثال: MATO-2026-XXXX"
                            value={inlineActivationCode}
                            onChange={e => setInlineActivationCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            disabled={isActivatingInline || !inlineActivationCode.trim()}
                            onClick={handleInlineCodeSubmit}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            {isActivatingInline ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>تفعيل ودخول</span>
                          </button>
                        </div>
                        {inlineActivationError && (
                          <p className="text-[11px] text-rose-400 font-bold">{inlineActivationError}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  placeholder="مثال: 0980073917 أو owner@mato.sy"
                  value={loginEmailOrPhone}
                  onChange={e => setLoginEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono text-right"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  (الافتراضية: admin أو 123456)
                </span>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-slate-400 hover:text-white absolute left-3 top-3.5 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                إذا قمت بإنشاء المطعم برقم 0980073917 يمكنك الدخول بكلمة المرور: <span className="text-amber-300 font-bold font-mono">admin</span> أو <span className="text-amber-300 font-bold font-mono">123456</span> أو كود التفعيل أو أي باسوورد اخترته.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>الدخول مخصص للمالك والمستخدمين المعتمدين بكلمة المرور</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('activate_code')}
                className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>تفعيل كود ترخيص</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق وتسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>تسجيل الدخول بالبريد وكلمة المرور</span>
                </>
              )}
            </button>

            {/* Quick help button */}
            <div className="pt-3 border-t border-slate-800 text-center">
              <a
                href={`https://wa.me/${(ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً أستاذ فريد، أحتاج مساعدة في تسجيل الدخول لمنظومة MATO POS.')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-all inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>تحتاج مساعدة؟ تواصل مع الدعم الفني عبر واتساب</span>
              </a>
            </div>

          </form>
        )}

        {/* ================= TAB 2: REGISTER NEW RESTAURANT (FAST 1-STEP) ================= */}
        {activeTab === 'register_restaurant' && (
          <div>
            {!restSubmittedSuccess ? (
              <form onSubmit={handleRegisterRestaurantSubmit} className="space-y-3.5">
                
                <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs space-y-1">
                  <div className="font-black text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تسجيل وترخيص مطعم جديد — خطوة واحدة سهلة وسريعة:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    املأ البيانات البسيطة أدناه وسيتم إنشاء سجل مطعمك فوراً وإرساله للاعتماد وإصدار كود التفعيل السنوي.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      اسم المطعم / المنشأة *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: مطعم دمشق القديمة"
                        value={restName}
                        onChange={e => setRestName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      اسم صاحب المطعم / المدير *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: محمد الأحمد"
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف / الواتساب للتواصل واستلام الكود *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="مثال: 0991234567 أو +963991234567"
                        value={restPhone}
                        onChange={e => setRestPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      المدينة / المحافظة
                    </label>
                    <div className="relative">
                      <select
                        value={restCity}
                        onChange={e => setRestCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="دمشق">دمشق</option>
                        <option value="ريف دمشق">ريف دمشق</option>
                        <option value="حلب">حلب</option>
                        <option value="حمص">حمص</option>
                        <option value="اللاذقية">اللاذقية</option>
                        <option value="طرطوس">طرطوس</option>
                        <option value="حماة">حماة</option>
                        <option value="أخرى">محافظة أخرى</option>
                      </select>
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      نوع الباقة المطلوبة
                    </label>
                    <select
                      value={restPlanType}
                      onChange={e => setRestPlanType(e.target.value as SaaSPlanType)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="professional">الباقة الاحترافية (Professional) — الأكثر طلباً</option>
                      <option value="starter">الباقة المبتدئة (Starter) — فرع واحد</option>
                      <option value="enterprise">باقة المؤسسات (Enterprise) — فروع متعددة</option>
                    </select>
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
                        value={restPassword}
                        onChange={e => setRestPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: نرغب بتجربة النظام لمدة 14 يوم أولاً..."
                    value={restNotes}
                    onChange={e => setRestNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRest}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isSubmittingRest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال طلب التسجيل...</span>
                    </>
                  ) : (
                    <>
                      <RocketIcon />
                      <span>🚀 إرسال طلب تسجيل المطعم للاعتماد</span>
                    </>
                  )}
                </button>

              </form>
            ) : (
              /* Success confirmation with direct WhatsApp notification to Farid */
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    تم إرسال طلب تسجيل المطعم بنجاح!
                  </h3>
                  <p className="text-xs text-emerald-300 font-bold">
                    تم حفظ طلبك سحابياً وهو بانتظار الاعتماد وتوليد كود التفعيل السنوي
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">اسم المطعم:</span>
                    <span className="font-bold text-white">{restSubmittedSuccess.restaurantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">صاحب المطعم:</span>
                    <span className="font-bold text-white">{restSubmittedSuccess.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الدخول (الهاتف):</span>
                    <span className="font-mono font-bold text-amber-300">{restSubmittedSuccess.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">كلمة المرور المسجلة:</span>
                    <span className="font-mono font-bold text-emerald-400">{restSubmittedSuccess.password || '123456'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/60 pt-2 text-[11px]">
                    <span className="text-slate-400">رقم المرجع:</span>
                    <span className="font-mono text-slate-400">{restSubmittedSuccess.requestId}</span>
                  </div>
                </div>

                {/* Pending Approval Explanation Banner */}
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-right space-y-2">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                    <span>الحساب قيد المراجعة والاعتماد ⏳</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    تم إرسال طلب اشتراك مطعمك بنجاح! وفقاً لسياسة الأمان والاشتراكات، لا يمكن استخدام البرنامج حتى تتم مراجعة الطلب والموافقة عليه من قبل إدارة المنظومة (أ. فريد) وإرسال كود التفعيل السنوي الخاص بك.
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <a
                    href={getWhatsAppNotifyUrl({
                      name: restSubmittedSuccess.restaurantName,
                      owner: restSubmittedSuccess.ownerName,
                      phone: restSubmittedSuccess.phone,
                      reqId: restSubmittedSuccess.requestId
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>📲 إرسال إشعار فوري لفريد عبر واتساب للموافقة واستلام الكود</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('activate_code');
                      setAnnualCodeInput('');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>🔑 استلمت كود التفعيل من فريد؟ فعّل حسابك وادخل الآن</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      title="معاينة ونسخ نص الرسالة"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>معاينة نص الرسالة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setLoginEmailOrPhone(restSubmittedSuccess.phone);
                        setLoginPassword(restSubmittedSuccess.password || restPassword || '123456');
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>العودة لشاشة الدخول</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ACTIVATE ANNUAL KEY ================= */}
        {activeTab === 'activate_code' && (
          <form onSubmit={handleVerifySubscriberCode} className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-bold text-xs text-amber-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>تفعيل ترخيص المشتركين السحابي (كود سنوي):</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إذا قمت بالاشتراك واستلمت كود التفعيل السنوي من الأستاذ فريد عبر واتساب، أدخل الكود هنا أو اضغط زر اللصق لتفعيل نسختك فوراً.
              </p>
            </div>

            {codeVerificationResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold ${
                  codeVerificationResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}
              >
                <div>{codeVerificationResult.message}</div>
                {codeVerificationResult.restaurantName && (
                  <div className="mt-1 text-[11px] text-emerald-400">
                    المطعم: {codeVerificationResult.restaurantName} | الصلاحية حتى: {codeVerificationResult.expiresAt ? new Date(codeVerificationResult.expiresAt).toLocaleDateString('ar-SY') : ''}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  كود التفعيل السنوي (مثال: MATO-2026-XXXX)
                </label>
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg transition-all"
                  title="لصق الكود من الحافظة حتى لو نسخت رسالة الواتساب كاملة"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>📋 لصق واستخراج الكود</span>
                </button>
              </div>

              {pastedStatus && (
                <div className="mb-2 p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                  {pastedStatus}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="MATO-2026-XXXX"
                  value={annualCodeInput}
                  onChange={e => setAnnualCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-amber-400/50 rounded-xl text-amber-300 font-mono font-black text-center tracking-widest text-base focus:outline-none focus:border-amber-400"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={codeVerificationLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {codeVerificationLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من الكود سحابياً...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد وتفعيل الترخيص الآن</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                العودة لتسجيل الدخول
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Footer Support Info */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        <span>منظومة MATO POS السحابية & الأوفلاين — تطوير وإشراف م. فريد الفاتح</span>
      </div>

      {/* WhatsApp Share Modal for Request Notification */}
      {restSubmittedSuccess && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="إرسال طلب التسجيل إلى مالك المنظومة فريد"
          recipientName={ownerContact?.name || 'م. فريد الفاتح'}
          recipientPhone={ownerContact?.whatsappNumber || PLATFORM_OWNER_CONTACT.whatsappNumber}
          recipientRole="مالك ومطور المنظومة"
          restaurantName={restSubmittedSuccess.restaurantName}
          rawMessage={buildSubscriptionRequestNotification({
            restaurantName: restSubmittedSuccess.restaurantName,
            ownerName: restSubmittedSuccess.ownerName,
            phone: restSubmittedSuccess.phone,
            requestId: restSubmittedSuccess.requestId,
            city: restCity,
            planType: restPlanType
          })}
          type="general"
        />
      )}

    </div>
  );

  if (isModalMode) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      {content}
    </div>
  );
};

// Simple rocket icon helper
const RocketIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
