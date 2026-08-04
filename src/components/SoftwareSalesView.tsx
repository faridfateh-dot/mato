import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  deleteRestaurantFromFirestore,
  getClientWhatsAppLink,
  PLATFORM_OWNER_CONTACT
} from '../lib/firebase';
import {
  WhatsAppShareModal,
  WhatsAppShareModalProps
} from './WhatsAppShareModal';
import {
  copyToClipboard,
  buildRestaurantActivationMessage,
  buildStaffCredentialsMessage,
  buildGeneralWhatsAppMessage,
  getWhatsAppShareUrl
} from '../lib/whatsappShare';
import {
  ShieldCheck,
  Key,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Copy,
  Plus,
  Printer,
  Download,
  Upload,
  Zap,
  Award,
  DollarSign,
  Users,
  Store,
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
  Check,
  Globe,
  Sliders,
  HelpCircle,
  ShoppingBag,
  Share2,
  MessageCircle,
  Phone,
  Trash2,
  Search,
  X
} from 'lucide-react';
import { SaaSPlanType, SoftwareLicense, LicenseKeyInfo, CommercialProposal, RestaurantSubscriptionRequest } from '../types';

export const SoftwareSalesView: React.FC = () => {
  const {
    currentRestaurant,
    branches,
    users,
    products,
    ingredients,
    suppliers,
    recipes,
    orders,
    expenses,
    licenseInfo,
    licenseKeys,
    redeemLicenseKey,
    generateLicenseKey,
    updateRestaurantBranding,
    exportSystemBackup,
    importSystemBackup,
    currentUser,
    systemRegistrations,
    deleteRegistrationRecord,
    firestoreRestaurants,
    generateAnnualActivationCode,
    subscriptionRequests,
    pendingRestaurantRequestsCount,
    approveRestaurantSubscription,
    rejectRestaurantSubscription,
    deleteRestaurantRecord,
    deleteSubscriptionRequest,
    createDirectRestaurantLicense,
    ownerContact,
    updateOwnerContact
  } = useData();

  const [activeTab, setActiveTab] = useState<'requests' | 'registrations' | 'contact' | 'license' | 'generator' | 'plans' | 'proposal' | 'backup'>('requests');
  const [restaurantToDelete, setRestaurantToDelete] = useState<{ id: string; name: string; ownerName?: string; phone?: string; status?: string } | null>(null);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showBulkDeleteRejectedModal, setShowBulkDeleteRejectedModal] = useState(false);
  const [isDeletingRestaurant, setIsDeletingRestaurant] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Owner Contact Form State
  const [contactForm, setContactForm] = useState({
    name: ownerContact?.name || 'فريد الفاتح',
    phone: ownerContact?.phone || '+963 991 234 567',
    whatsappNumber: ownerContact?.whatsappNumber || '963991234567',
    email: ownerContact?.email || 'farid.fateh@hotmail.com',
    company: ownerContact?.company || 'MATO POS Systems & SaaS'
  });
  const [contactSavedStatus, setContactSavedStatus] = useState<string | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Synchronize contact form when ownerContact changes
  React.useEffect(() => {
    if (ownerContact) {
      setContactForm({
        name: ownerContact.name || 'فريد الفاتح',
        phone: ownerContact.phone || '+963 991 234 567',
        whatsappNumber: ownerContact.whatsappNumber || '963991234567',
        email: ownerContact.email || 'farid.fateh@hotmail.com',
        company: ownerContact.company || 'MATO POS Systems & SaaS'
      });
    }
  }, [ownerContact]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      await updateOwnerContact(contactForm);
      setContactSavedStatus('تم حفظ وتحديث رقم هاتف الواتساب وبيانات التواصل بنجاح سحابياً!');
      setTimeout(() => setContactSavedStatus(null), 4000);
    } catch (err) {
      alert('حدث خطأ أثناء حفظ البيانات.');
    } finally {
      setIsSavingContact(false);
    }
  };

  // Key Activation Input
  const [inputKey, setInputKey] = useState('');
  const [activationFeedback, setActivationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New License Key Modal / Form
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    clientName: '',
    salesRep: currentUser.name || 'قسم المبيعات',
    planType: 'professional' as SaaSPlanType,
    durationDays: 365,
  });
  const [createdKeySuccess, setCreatedKeySuccess] = useState<string | null>(null);

  // Direct Manual Restaurant Creation Modal (by Farid)
  const [showDirectCreateModal, setShowDirectCreateModal] = useState(false);
  const [directForm, setDirectForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    city: 'دمشق',
    planType: 'professional' as SaaSPlanType,
    durationYears: 1
  });
  const [directSuccessResult, setDirectSuccessResult] = useState<{
    restaurantId: string;
    code: string;
    expiry: string;
    name: string;
    phone: string;
  } | null>(null);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  // Proposal State
  const [proposal, setProposal] = useState<CommercialProposal>({
    proposalNumber: `PROP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: 'مطعم بيت الشاورما والمشويات',
    clientPhone: '+963 991 234 567',
    restaurantType: 'مطعم ووجبات سريعة',
    selectedPlan: 'professional',
    extraBranchesCount: 2,
    customDiscountPercent: 10,
    notes: 'شامل التركيب مجاناً، تدريب الكادر على نظام POS والمخزون، والدعم الفني 24/7 لمدة سنة كاملة.',
    validUntilDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salesRepName: currentUser.name || 'مدير المبيعات والتراخيص'
  });

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // WhatsApp Share Modal State
  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    recipientName: string;
    recipientPhone?: string;
    recipientRole?: string;
    restaurantName?: string;
    code?: string;
    rawMessage: string;
    type?: 'restaurant_activation' | 'staff_credentials' | 'general';
  }>({
    isOpen: false,
    title: '',
    recipientName: '',
    recipientPhone: '',
    code: '',
    rawMessage: '',
    type: 'restaurant_activation'
  });

  const openShareModal = (config: {
    title?: string;
    restaurantName?: string;
    recipientName: string;
    recipientPhone?: string;
    recipientRole?: string;
    code?: string;
    expiryDate?: string;
    planName?: string;
    rawMessage?: string;
    type?: 'restaurant_activation' | 'staff_credentials' | 'general';
  }) => {
    const formattedExpiry = config.expiryDate
      ? new Date(config.expiryDate).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
      : undefined;

    const msg = config.rawMessage || buildRestaurantActivationMessage({
      restaurantName: config.restaurantName || config.recipientName,
      ownerName: config.recipientName,
      code: config.code || '',
      expiryDate: formattedExpiry,
      planName: config.planName || 'الاشتراك السنوي الشامل'
    });

    setShareModalConfig({
      isOpen: true,
      title: config.title || `مشاركة كود التفعيل عبر واتساب (${config.restaurantName || config.recipientName})`,
      recipientName: config.recipientName,
      recipientPhone: config.recipientPhone || '',
      recipientRole: config.recipientRole || 'مالك المطعم / المشترك',
      restaurantName: config.restaurantName,
      code: config.code,
      rawMessage: msg,
      type: config.type || 'restaurant_activation'
    });
  };

  // White-label branding form
  const [brandingForm, setBrandingForm] = useState({
    name: currentRestaurant.name,
    currency: currentRestaurant.currency,
    taxNumber: currentRestaurant.taxNumber || '1029384756',
    address: currentRestaurant.address || 'دمشق - السبع بحرات',
    phone: currentRestaurant.phone || '+963 11 222 3344'
  });
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Backup file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Copy Key Helper with fallback and toast feedback
  const handleCopy = async (text: string, id: string, label: string = 'تم نسخ الكود بنجاح!') => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKeyId(id);
      setToastNotification(label);
      setTimeout(() => setCopiedKeyId(null), 2500);
      setTimeout(() => setToastNotification(null), 4000);
    }
  };

  // Redeem Key Action
  const handleRedeemKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    const res = redeemLicenseKey(inputKey.trim());
    if (res.success) {
      setActivationFeedback({ type: 'success', message: res.message });
      setInputKey('');
    } else {
      setActivationFeedback({ type: 'error', message: res.message });
    }
  };

  // Create Key Action
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyForm.clientName.trim()) return;

    const generatedKey = generateLicenseKey({
      planType: newKeyForm.planType,
      durationDays: Number(newKeyForm.durationDays),
      clientName: newKeyForm.clientName,
      salesRep: newKeyForm.salesRep
    });

    setCreatedKeySuccess(generatedKey);
  };

  // Handle Approve Restaurant Request
  const handleApproveRequest = async (reqId: string) => {
    setActionLoadingId(reqId);
    try {
      const res = await approveRestaurantSubscription(reqId, 1);

      openShareModal({
        title: `🎉 تمت الموافقة! إرسال كود التفعيل لمطعم (${res.restaurantName})`,
        restaurantName: res.restaurantName,
        recipientName: res.ownerName || res.restaurantName,
        recipientPhone: res.ownerPhone,
        code: res.code,
        expiryDate: res.expiry,
        planName: 'الاشتراك السنوي الشامل'
      });

      setToastNotification(`تمت الموافقة وتوليد كود التفعيل لمطعم (${res.restaurantName}) بنجاح: ${res.code}`);
      setTimeout(() => setToastNotification(null), 5000);
    } catch (err) {
      alert('حدث خطأ أثناء الموافقة على الطلب.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Request
  const handleRejectRequest = async (reqId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رفض طلب ترخيص مطعم (${name})؟`)) return;
    setActionLoadingId(reqId);
    try {
      await rejectRestaurantSubscription(reqId);
      alert('تم رفض وحذف الطلب بنجاح.');
    } catch {
      alert('حدث خطأ أثناء العملية.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Direct Restaurant Creation Submit
  const handleDirectCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.name.trim() || !directForm.ownerName.trim() || !directForm.phone.trim()) return;

    setIsSubmittingDirect(true);
    try {
      const res = await createDirectRestaurantLicense({
        name: directForm.name.trim(),
        ownerName: directForm.ownerName.trim(),
        phone: directForm.phone.trim(),
        email: directForm.email.trim(),
        city: directForm.city.trim(),
        planType: directForm.planType,
        durationYears: Number(directForm.durationYears)
      });

      setDirectSuccessResult({
        restaurantId: res.restaurantId,
        code: res.code,
        expiry: res.expiry,
        name: directForm.name.trim(),
        phone: directForm.phone.trim()
      });
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء وترخيص المطعم.');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  // Calculate Proposal Price
  const getPlanBasePrice = (plan: SaaSPlanType) => {
    if (plan === 'starter') return 1200;
    if (plan === 'professional') return 2400;
    return 4500;
  };

  const calculateProposalTotal = () => {
    const base = getPlanBasePrice(proposal.selectedPlan);
    const extraBranchesCost = (proposal.extraBranchesCount || 0) * 350;
    const subtotal = base + extraBranchesCost;
    const discount = subtotal * ((proposal.customDiscountPercent || 0) / 100);
    return Math.max(0, subtotal - discount);
  };

  // Save White Label Branding
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantBranding({
      name: brandingForm.name,
      currency: brandingForm.currency,
      taxNumber: brandingForm.taxNumber,
      address: brandingForm.address,
      phone: brandingForm.phone
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2500);
  };

  // Export JSON Backup
  const handleDownloadBackup = () => {
    const jsonStr = exportSystemBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MATO_SaaS_Backup_${currentRestaurant.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importSystemBackup(content);
        if (success) {
          setBackupStatus({ type: 'success', message: 'تم استيراد واسترجاع بيانات النظام بنجاح! تم تحديث كافة الجداول.' });
        } else {
          setBackupStatus({ type: 'error', message: 'ملف التنسيق غير صالح أو متضرر.' });
        }
      } catch (err) {
        setBackupStatus({ type: 'error', message: 'فشل في قراءة ملف النسخة الاحتياطية.' });
      }
    };
    reader.readAsText(file);
  };

  // Days remaining calculation
  const getDaysRemaining = () => {
    const expire = new Date(licenseInfo.expiresAt).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((expire - now) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top SaaS Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>لوحة المالك العام — إدارة حسابات واشتراكات المطاعم المسجلة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>إدارة حسابات المطاعم المسجلة وتراخيص MATO SaaS</span>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">v4.5 Enterprise</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              إدارة واعتماد طلبات المطاعم الجديدة، إصدار وتجديد التراخيص السنوية، إدارة بيانات أصحاب المطاعم، وحسابات باقات الأسعار وعروض الأسعار الرسمية.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 text-center">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">المطاعم المسجلة</span>
              <span className="font-extrabold text-amber-400 text-sm truncate block">{Math.max(firestoreRestaurants.length, systemRegistrations.length, 1)} مطعم</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 text-center">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">طلبات جديدة معلقة</span>
              <span className={`font-extrabold text-sm ${pendingRestaurantRequestsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {pendingRestaurantRequestsCount} طلب
              </span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 text-center col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">حساب المالك الرئيسي</span>
              <span className="font-extrabold text-amber-300 text-xs truncate block">{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>طلبات ترخيص المطاعم الجديدة</span>
            {pendingRestaurantRequestsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {pendingRestaurantRequestsCount} جديد
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'registrations'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span>المطاعم المرخصة والاشتراكات ({Math.max(systemRegistrations.length, firestoreRestaurants.length, 1)})</span>
          </button>

          <button
            onClick={() => setShowDirectCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 mr-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>➕ إنشاء وترخيص مطعم مباشر (فريد)</span>
          </button>

          <button
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'license'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>حالة الترخيص وتفعيل المفتاح</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>توليد مفاتيح الترخيص للعملاء</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>الباقات والأسعار التجارية</span>
          </button>

          <button
            onClick={() => setActiveTab('proposal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'proposal'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>مولّد عرض السعر للعميل</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>📱 إعدادات رقم واتساب المالك (فريد)</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>تصدير واستيراد بيانات العملاء</span>
          </button>
        </div>
      </div>

      {/* Quick WhatsApp Configuration Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">رقم الواتساب الحالي لاستقبال الإشعارات والطلبات:</span>
              <span className="font-mono font-black text-emerald-400 dir-ltr bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {ownerContact?.phone || ownerContact?.whatsappNumber || '+963 991 234 567'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              أي طلب تسجيل مطعم جديد أو استفسار دعم يتم إرساله مباشرة إلى هذا الرقم على تطبيق WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('contact')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer flex-1 sm:flex-initial"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تعديل رقم الواتساب</span>
          </button>
          
          <a
            href={`https://wa.me/${(ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً فريد! هذه رسالة اختبارية لتأكيد ربط رقم الواتساب بنجاح مع منصة MATO POS.')}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs flex-1 sm:flex-initial"
            title="تجربة فتح واتساب الآن"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>تجربة إرسال</span>
          </a>
        </div>
      </div>

      {/* ==================== TAB: PENDING SUBSCRIPTION REQUESTS ==================== */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="font-black text-sm text-amber-400">بوابة طلبات الاشتراك والتراخيص السنوية</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>الطلبات الواردة من أصحاب المطاعم بانتظار موافقة المالك (فريد)</span>
              </h2>
              <p className="text-xs text-slate-300">
                إدارة كاملة لطلبات التسجيل: الموافقة وإصدار كود التفعيل السنوي، رفض الطلبات، أو حذف طلبات التسجيل نهائياً
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDirectCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>إضافة وترخيص مطعم جديد مباشرة</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastNotification && (
            <div className="bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastNotification}</span>
              </div>
              <button onClick={() => setToastNotification(null)} className="p-1 hover:bg-emerald-600 rounded-lg cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Requests Table Container */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            {/* Table Header & Search/Filters */}
            {(() => {
              // Prepare aggregated list of all requests
              const allRequests: Array<{
                id: string;
                restaurantName: string;
                ownerName: string;
                phone: string;
                email: string;
                city: string;
                branchesCount: number;
                planType: SaaSPlanType;
                status: 'pending_approval' | 'approved' | 'rejected';
                activationCode?: string;
                expiresAt?: string;
                requestedAt?: string;
                approvedAt?: string;
              }> = [...subscriptionRequests];

              firestoreRestaurants.forEach(fr => {
                if (!allRequests.some(a => a.id === fr.id)) {
                  allRequests.push({
                    id: fr.id,
                    restaurantName: fr.name,
                    ownerName: fr.ownerName,
                    phone: fr.phone || fr.email || '',
                    email: fr.email || '',
                    city: 'دمشق',
                    branchesCount: 1,
                    planType: (fr.planType as SaaSPlanType) || 'professional',
                    status: fr.status === 'active' ? 'approved' : fr.status === 'pending_approval' ? 'pending_approval' : 'rejected',
                    activationCode: fr.activationCode,
                    expiresAt: fr.subscriptionExpiry,
                    requestedAt: fr.registeredAt,
                    approvedAt: fr.status === 'active' ? fr.registeredAt : undefined
                  });
                }
              });

              const pendingCount = allRequests.filter(r => r.status === 'pending_approval').length;
              const approvedCount = allRequests.filter(r => r.status === 'approved').length;
              const rejectedCount = allRequests.filter(r => r.status === 'rejected').length;

              const filteredRequests = allRequests.filter(req => {
                if (requestStatusFilter === 'pending' && req.status !== 'pending_approval') return false;
                if (requestStatusFilter === 'approved' && req.status !== 'approved') return false;
                if (requestStatusFilter === 'rejected' && req.status !== 'rejected') return false;

                if (requestSearch.trim()) {
                  const q = requestSearch.toLowerCase().trim();
                  const matchesName = req.restaurantName.toLowerCase().includes(q);
                  const matchesOwner = req.ownerName.toLowerCase().includes(q);
                  const matchesPhone = (req.phone || '').toLowerCase().includes(q);
                  const matchesId = req.id.toLowerCase().includes(q);
                  const matchesCode = (req.activationCode || '').toLowerCase().includes(q);
                  return matchesName || matchesOwner || matchesPhone || matchesId || matchesCode;
                }
                return true;
              });

              return (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Store className="w-5 h-5 text-amber-500" />
                        <span>قائمة طلبات التسجيل والاشتراك</span>
                        <span className="text-xs font-bold text-slate-400">({allRequests.length} إجمالي)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        إمكانية البحث، الفلترة، الموافقة، الرفض، وحذف طلبات التسجيل نهائياً
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {rejectedCount > 0 && (
                        <button
                          onClick={() => setShowBulkDeleteRejectedModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="حذف جميع الطلبات المرفوضة دفعة واحدة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>مسح المرفوضة ({rejectedCount})</span>
                        </button>
                      )}

                      {pendingCount > 0 && (
                        <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>يوجد {pendingCount} طلبات معلقة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        onClick={() => setRequestStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          requestStatusFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الكل ({allRequests.length})
                      </button>
                      <button
                        onClick={() => setRequestStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          requestStatusFilter === 'pending'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>معلقة</span>
                        {pendingCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-900 animate-ping inline-block" />
                        )}
                        <span>({pendingCount})</span>
                      </button>
                      <button
                        onClick={() => setRequestStatusFilter('approved')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          requestStatusFilter === 'approved'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        معتمدة ({approvedCount})
                      </button>
                      <button
                        onClick={() => setRequestStatusFilter('rejected')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          requestStatusFilter === 'rejected'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        مرفوضة ({rejectedCount})
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={requestSearch}
                        onChange={e => setRequestSearch(e.target.value)}
                        placeholder="بحث باسم المطعم، المالك، الهاتف..."
                        className="w-full pl-3 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      />
                      {requestSearch && (
                        <button
                          onClick={() => setRequestSearch('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* If no requests found */}
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Store className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {requestSearch || requestStatusFilter !== 'all'
                            ? 'لا توجد نتائج تطابق معايير البحث والفلترة'
                            : 'لا توجد طلبات اشتراك مسجلة حالياً'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {requestSearch || requestStatusFilter !== 'all'
                            ? 'جرب تغيير نص البحث أو اختيار تبويب فلترة آخر'
                            : 'عندما يقوم صاحب مطعم بطلب ترخيص جديد، سيظهر طلبه هنا فوراً مع بيانات الاتصال للموافقة عليه أو حذفه'}
                        </p>
                      </div>
                      {requestSearch || requestStatusFilter !== 'all' ? (
                        <button
                          onClick={() => {
                            setRequestSearch('');
                            setRequestStatusFilter('all');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>إلغاء الفلترة والبحث</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowDirectCreateModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>ترخيص مطعم لعميل جديد يدوياً</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-y border-slate-200 text-slate-700 font-bold">
                            <th className="p-3">اسم المطعم</th>
                            <th className="p-3">صاحب المطعم</th>
                            <th className="p-3">رقم الهاتف (واتساب)</th>
                            <th className="p-3">المدينة / الفروع</th>
                            <th className="p-3">الباقة المطلوبة</th>
                            <th className="p-3">حالة الطلب</th>
                            <th className="p-3">كود التفعيل الصادر</th>
                            <th className="p-3 text-center">إجراءات المالك (موافقة / رفض / حذف)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRequests.map((req) => {
                            const isPending = req.status === 'pending_approval';
                            const isApproved = req.status === 'approved';
                            const isRejected = req.status === 'rejected';

                            const whatsappMsg = req.activationCode 
                              ? `أهلاً بك أستاذ ${req.ownerName}! 🎉\nتمت الموافقة على طلب ترخيص مطعم (${req.restaurantName}) في نظام MATO POS.\n\n🔑 كود التفعيل السنوي الخاص بك: ${req.activationCode}\n📅 تاريخ انتهاء الاشتراك: ${new Date(req.expiresAt || Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SY')}\n\nيمكنك الآن إدخال الكود وتفعيل النظام فوراً.`
                              : `أهلاً بك أستاذ ${req.ownerName}! بخصوص طلب ترخيص مطعم (${req.restaurantName}) في نظام MATO POS...`;
                            
                            const whatsappUrl = req.phone ? getClientWhatsAppLink(req.phone, whatsappMsg) : '';

                            return (
                              <tr key={req.id} className="hover:bg-amber-50/40 transition-all">
                                <td className="p-3 font-bold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs shrink-0">
                                      🍽️
                                    </div>
                                    <div>
                                      <div className="font-black text-slate-900">{req.restaurantName}</div>
                                      <div className="text-[10px] text-slate-400">معرف: {req.id}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3 font-bold text-slate-800">
                                  {req.ownerName}
                                </td>

                                <td className="p-3 font-mono font-bold text-slate-700 dir-ltr text-right">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{req.phone || 'غير مسجل'}</span>
                                    {whatsappUrl && (
                                      <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all"
                                        title="مراسلة عبر واتساب"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>

                                <td className="p-3 text-slate-600">
                                  <div>{req.city || 'دمشق'}</div>
                                  <div className="text-[10px] text-slate-400">{req.branchesCount || 1} فرع</div>
                                </td>

                                <td className="p-3">
                                  <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold text-[11px]">
                                    {req.planType === 'starter' ? 'الباقة المبتدئة' : req.planType === 'enterprise' ? 'باقة المؤسسات' : 'الباقة الاحترافية'}
                                  </span>
                                </td>

                                <td className="p-3">
                                  {isPending ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full font-black text-[11px] animate-pulse">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>بانتظار موافقة فريد</span>
                                    </span>
                                  ) : isApproved ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>تمت الموافقة والتفعيل</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                                      <X className="w-3.5 h-3.5" />
                                      <span>مرفوض</span>
                                    </span>
                                  )}
                                </td>

                                <td className="p-3">
                                  {req.activationCode ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-400 border border-amber-400/40 px-2.5 py-1 rounded-lg font-mono font-black text-xs select-all">
                                          <Key className="w-3 h-3" />
                                          <span>{req.activationCode}</span>
                                        </span>
                                        <button
                                          onClick={() => handleCopy(req.activationCode || '', req.id, `تم نسخ كود تفعيل (${req.restaurantName}) بنجاح!`)}
                                          className="p-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 transition-all cursor-pointer"
                                          title="نسخ كود التفعيل"
                                        >
                                          {copiedKeyId === req.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                      </div>
                                      {req.expiresAt && (
                                        <div className="text-[10px] text-slate-500">
                                          ينتهي: {new Date(req.expiresAt).toLocaleDateString('ar-SY')}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">لم يصدر بعد</span>
                                  )}
                                </td>

                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {isPending && (
                                      <>
                                        <button
                                          disabled={actionLoadingId === req.id}
                                          onClick={() => handleApproveRequest(req.id)}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                          title="موافقة وإصدار كود سنوي ومشاركته عبر واتساب"
                                        >
                                          {actionLoadingId === req.id ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Check className="w-3.5 h-3.5" />
                                          )}
                                          <span>موافقة وتفعيل</span>
                                        </button>

                                        <button
                                          disabled={actionLoadingId === req.id}
                                          onClick={() => handleRejectRequest(req.id, req.restaurantName)}
                                          className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition-all cursor-pointer"
                                          title="رفض الطلب"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          onClick={() => setRestaurantToDelete({
                                            id: req.id,
                                            name: req.restaurantName,
                                            ownerName: req.ownerName,
                                            phone: req.phone,
                                            status: req.status
                                          })}
                                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                                          title="حذف طلب التسجيل نهائياً"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {isApproved && (
                                      <>
                                        <button
                                          onClick={() => openShareModal({
                                            title: `مشاركة كود تفعيل مطعم (${req.restaurantName}) عبر واتساب`,
                                            restaurantName: req.restaurantName,
                                            recipientName: req.ownerName,
                                            recipientPhone: req.phone,
                                            code: req.activationCode,
                                            expiryDate: req.expiresAt,
                                            planName: req.planType === 'starter' ? 'الباقة المبتدئة' : req.planType === 'enterprise' ? 'باقة المؤسسات' : 'الباقة الاحترافية'
                                          })}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                          title="مشاركة الكود والبيانات عبر واتساب"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          <span>إرسال ومشاركة</span>
                                        </button>

                                        <button
                                          onClick={async () => {
                                            const res = await generateAnnualActivationCode(req.id, req.restaurantName);
                                            openShareModal({
                                              title: `🎉 تم تجديد الترخيص! إرسال الكود الجديد لمطعم (${req.restaurantName})`,
                                              restaurantName: req.restaurantName,
                                              recipientName: req.ownerName,
                                              recipientPhone: req.phone,
                                              code: res.code,
                                              expiryDate: res.newExpiry,
                                              planName: 'الاشتراك السنوي الشامل'
                                            });
                                            setToastNotification(`تم تجديد كود المطعم (${req.restaurantName}) بنجاح! الكود: ${res.code}`);
                                            setTimeout(() => setToastNotification(null), 5000);
                                          }}
                                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
                                          title="تجديد كود سنة إضافية ومشاركته عبر واتساب"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        </button>

                                        <button
                                          onClick={() => setRestaurantToDelete({
                                            id: req.id,
                                            name: req.restaurantName,
                                            ownerName: req.ownerName,
                                            phone: req.phone,
                                            status: req.status
                                          })}
                                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                                          title="حذف سجل وترخيص المطعم نهائياً"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {isRejected && (
                                      <>
                                        <button
                                          disabled={actionLoadingId === req.id}
                                          onClick={() => handleApproveRequest(req.id)}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                          title="إعادة الموافقة والتفعيل"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>موافقة وتفعيل الآن</span>
                                        </button>

                                        <button
                                          onClick={() => setRestaurantToDelete({
                                            id: req.id,
                                            name: req.restaurantName,
                                            ownerName: req.ownerName,
                                            phone: req.phone,
                                            status: req.status
                                          })}
                                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                                          title="حذف الطلب المرفوض نهائياً"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>حذف الطلب</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================== DIRECT RESTAURANT CREATION MODAL ==================== */}
      {showDirectCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn dir-rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 text-right relative">
            
            <button
              onClick={() => {
                setShowDirectCreateModal(false);
                setDirectSuccessResult(null);
              }}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!directSuccessResult ? (
              <>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>صلاحية خاصة بالمالك فريد</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    إنشاء وترخيص مطعم جديد مباشرة وإصدار كود سنوي
                  </h3>
                  <p className="text-xs text-slate-500">
                    أدخل بيانات المطعم الجديد لتوليد الترخيص السنوي وحفظه سحابياً في Firestore فورياً
                  </p>
                </div>

                <form onSubmit={handleDirectCreateSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم المطعم / المنشأة *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مطعم قصر الشام"
                      value={directForm.name}
                      onChange={e => setDirectForm({ ...directForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">اسم صاحب المطعم / المدير *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: حسام الدين"
                        value={directForm.ownerName}
                        onChange={e => setDirectForm({ ...directForm, ownerName: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">رقم هاتف الواتساب *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: +963991234567"
                        value={directForm.phone}
                        onChange={e => setDirectForm({ ...directForm, phone: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">المدينة</label>
                      <select
                        value={directForm.city}
                        onChange={e => setDirectForm({ ...directForm, city: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs"
                      >
                        <option value="دمشق">دمشق</option>
                        <option value="ريف دمشق">ريف دمشق</option>
                        <option value="حلب">حلب</option>
                        <option value="حمص">حمص</option>
                        <option value="اللاذقية">اللاذقية</option>
                        <option value="طرطوس">طرطوس</option>
                        <option value="حماة">حماة</option>
                        <option value="السويداء">السويداء</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الباقة المطلوبة</label>
                      <select
                        value={directForm.planType}
                        onChange={e => setDirectForm({ ...directForm, planType: e.target.value as SaaSPlanType })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs font-bold"
                      >
                        <option value="starter">الباقة المبتدئة (1200$/سنة)</option>
                        <option value="professional">الباقة الاحترافية (2400$/سنة)</option>
                        <option value="enterprise">باقة المؤسسات (4500$/سنة)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">مدة الترخيص</label>
                    <select
                      value={directForm.durationYears}
                      onChange={e => setDirectForm({ ...directForm, durationYears: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs font-bold"
                    >
                      <option value={1}>سنة واحدة (365 يوماً)</option>
                      <option value={2}>سنتان (730 يوماً)</option>
                      <option value={3}>3 سنوات (تفعيل مميز)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDirect}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs mt-4"
                  >
                    {isSubmittingDirect ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري إنشاء وترخيص المطعم سحابياً...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>تأكيد الترخيص وتوليد كود التفعيل فوراً</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-black text-2xl">
                  🎉
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    تم ترخيص مطعم ({directSuccessResult.name}) بنجاح!
                  </h3>
                  <p className="text-xs text-slate-500">
                    تم تسجيل المطعم في Firebase وتوليد كود التفعيل السنوي الخاص به
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                  <div className="text-slate-400 text-[11px]">كود التفعيل السنوي الخاص بالمطعم:</div>
                  <div className="font-mono font-black text-lg text-amber-400 select-all tracking-wider">
                    {directSuccessResult.code}
                  </div>
                  <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                    تاريخ انتهاء الترخيص: {new Date(directSuccessResult.expiry).toLocaleDateString('ar-SY')}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => openShareModal({
                      title: `🎉 إرسال كود التفعيل لمطعم (${directSuccessResult.name})`,
                      restaurantName: directSuccessResult.name,
                      recipientName: directForm.ownerName || directSuccessResult.name,
                      recipientPhone: directSuccessResult.phone,
                      code: directSuccessResult.code,
                      expiryDate: directSuccessResult.expiry,
                      planName: directForm.planType === 'starter' ? 'الباقة المبتدئة' : directForm.planType === 'enterprise' ? 'باقة المؤسسات' : 'الباقة الاحترافية'
                    })}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>📱 مشاركة وإرسال كود التفعيل عبر واتساب</span>
                  </button>

                  <button
                    onClick={() => handleCopy(directSuccessResult.code, 'direct_created', 'تم نسخ كود تفعيل المطعم بنجاح!')}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedKeyId === 'direct_created' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                    <span>{copiedKeyId === 'direct_created' ? 'تم النسخ للحافظة!' : '📋 نسخ كود التفعيل فقط'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDirectCreateModal(false);
                      setDirectSuccessResult(null);
                      setDirectForm({
                        name: '',
                        ownerName: '',
                        phone: '',
                        email: '',
                        city: 'دمشق',
                        planType: 'professional',
                        durationYears: 1
                      });
                    }}
                    className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    إغلاق والعودة للقائمة
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==================== TAB 1: CURRENT LICENSE & KEY REDEMPTION ==================== */}
      {activeTab === 'license' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active License Details Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">تفاصيل الترخيص والاشتراك الحالي</h2>
                  <p className="text-slate-500 text-xs">بيانات العقد والصلاحيات المتاحة بالنظام</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>الترخيص نشط ومفعل</span>
              </span>
            </div>

            {/* License Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">اسم العميل / المطعم:</span>
                <span className="font-bold text-slate-900 text-sm">{licenseInfo.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">مفتاح التفعيل الحالي:</span>
                <span className="font-mono font-bold text-amber-700 text-xs bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  {licenseInfo.licenseKey}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">تاريخ التفعيل:</span>
                <span className="font-bold text-slate-800">{licenseInfo.activatedAt}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">تاريخ الانتهاء التجديد:</span>
                <span className="font-bold text-rose-700">{licenseInfo.expiresAt}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">حد الفروع المسموحة:</span>
                <span className="font-bold text-slate-900">{licenseInfo.maxBranches} فروع</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">حد حسابات المستخدمين:</span>
                <span className="font-bold text-slate-900">{licenseInfo.maxUsers} مستخدمين</span>
              </div>
            </div>

            {/* Included Capabilities */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs mb-3">الميزات والموديل التشغيلي المتوفر بحسابك:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">نظام الكاشير المتقدم (POS)</span>
                    <span className="text-[11px] text-slate-500">طاولات، سفري، توصيل، وطباعة الفواتير</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 ${licenseInfo.isAiFeaturesEnabled ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-800 block">مساعد MATO AI الذكي</span>
                    <span className="text-[11px] text-slate-500">مساعد إداري بالصوت والنص والاستجابة التلقائية</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 ${licenseInfo.isInvoiceScannerEnabled ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-800 block">ماسح الفواتير بالرؤية الذكية</span>
                    <span className="text-[11px] text-slate-500">قراءة صور الفواتير الورقية وتحديث المواد تلقائياً</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 ${licenseInfo.isMultiBranchEnabled ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-800 block">إدارة الفروع المتعددة</span>
                    <span className="text-[11px] text-slate-500">ربط مخازن ومبيعات الفروع بسلاسة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Activation Form Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black mb-4">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-base mb-1">تفعيل مفتاح ترخيص جديد 🔑</h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                هل حصلت على كود ترخيص أو تجديد من قسم المبيعات؟ أدخل المفتاح هنا لتمديد اشتراكك أو ترقية الباقة فوراً.
              </p>

              <form onSubmit={handleRedeemKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">أدخل مفتاح التفعيل:</label>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="MATO-PRO-XXXX-XXXX"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-amber-400 outline-hidden"
                  />
                </div>

                {activationFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    activationFeedback.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {activationFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{activationFeedback.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>تفعيل مفتاح الترخيص الآن</span>
                </button>
              </form>
            </div>

            {/* Quick Preset Test Keys */}
            <div className="pt-4 border-t border-slate-800 text-xs">
              <span className="block text-[11px] text-slate-400 font-bold mb-2">مفاتيح تجريبية سريعة للتجربة:</span>
              <div className="space-y-1.5">
                {licenseKeys.slice(0, 2).map(k => (
                  <button
                    key={k.id}
                    onClick={() => setInputKey(k.key)}
                    className="w-full text-right p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 font-mono text-[11px] text-amber-300 flex items-center justify-between transition-colors"
                  >
                    <span>{k.key}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{k.planNameAr}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 2: LICENSE KEYS GENERATOR FOR SALES ==================== */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>إدارة ومولد مفاتيح تراخيص العملاء (للمبيعات)</span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">قم بإنشاء وتوزيع مفاتيح التفعيل للعملاء والمطاعم الجديدة</p>
            </div>

            <button
              onClick={() => setShowKeyModal(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md shadow-amber-400/20 transition-all flex items-center gap-2 text-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مفتاح ترخيص جديد للعميل</span>
            </button>
          </div>

          {/* Keys Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
              <span>قائمة مفاتيح التفعيل المولدّة بالنظام ({licenseKeys.length} مفتاح)</span>
              <span className="text-slate-400 text-[11px]">جاهزة للإرسال عبر واتساب أو البريد</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">مفتاح الترخيص (Key)</th>
                    <th className="p-3.5">اسم العميل / المطعم</th>
                    <th className="p-3.5">الباقة</th>
                    <th className="p-3.5">المدة</th>
                    <th className="p-3.5">مسؤول المبيعات</th>
                    <th className="p-3.5">حالة المفتاح</th>
                    <th className="p-3.5 text-center">نسخ الكود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {licenseKeys.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-700 text-xs">
                        {k.key}
                      </td>
                      <td className="p-3.5 font-bold">{k.clientName}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          {k.planNameAr}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold">{k.durationDays === 36500 ? 'مدى الحياة (دائم)' : `${k.durationDays} يوم`}</td>
                      <td className="p-3.5 text-slate-600">{k.salesRep}</td>
                      <td className="p-3.5">
                        {k.isRedeemed ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            مستعمل بواسطة {k.redeemedBy || 'العميل'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ متاح للتفعيل
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCopy(k.key, k.id, `تم نسخ مفتاح ترخيص (${k.clientName}) بنجاح!`)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="نسخ المفتاح"
                          >
                            {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKeyId === k.id ? 'تم النسخ!' : 'نسخ'}</span>
                          </button>

                          <button
                            onClick={() => openShareModal({
                              title: `مشاركة كود ترخيص (${k.clientName}) عبر واتساب`,
                              restaurantName: k.clientName,
                              recipientName: k.clientName,
                              code: k.key,
                              planName: k.planNameAr,
                              rawMessage: buildRestaurantActivationMessage({
                                restaurantName: k.clientName,
                                code: k.key,
                                planName: k.planNameAr
                              })
                            })}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all cursor-pointer"
                            title="مشاركة عبر واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>إنشاء مفتاح ترخيص جديد للعميل</span>
              </h3>
              <button onClick={() => { setShowKeyModal(false); setCreatedKeySuccess(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdKeySuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">تم إنشاء المفتاح بنجاح! 🎉</h4>
                  <p className="text-slate-500 text-xs mt-1">يمكنك نسخ الكود أو إرساله للعميل عبر واتساب فوراً</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl font-mono font-black text-amber-800 text-sm tracking-wider select-all">
                  {createdKeySuccess}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openShareModal({
                      title: `مشاركة كود ترخيص (${newKeyForm.clientName}) عبر واتساب`,
                      restaurantName: newKeyForm.clientName,
                      recipientName: newKeyForm.clientName,
                      code: createdKeySuccess,
                      planName: newKeyForm.planType === 'starter' ? 'الباقة الأساسية' : newKeyForm.planType === 'enterprise' ? 'باقة المؤسسات' : 'الباقة الاحترافية'
                    })}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>📱 إرسال ومشاركة المفتاح عبر واتساب</span>
                  </button>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleCopy(createdKeySuccess, 'new_created', 'تم نسخ مفتاح الترخيص بنجاح!')}
                      className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKeyId === 'new_created' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKeyId === 'new_created' ? 'تم النسخ!' : 'نسخ المفتاح'}</span>
                    </button>
                    <button
                      onClick={() => { setCreatedKeySuccess(null); setShowKeyModal(false); }}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-200"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم مطعم / شركة العميل:</label>
                  <input
                    type="text"
                    required
                    value={newKeyForm.clientName}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, clientName: e.target.value })}
                    placeholder="مثال: مطعم بيت البيتزا والبرغر"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع باقة الاشتراك:</label>
                  <select
                    value={newKeyForm.planType}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, planType: e.target.value as SaaSPlanType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  >
                    <option value="starter">الباقة الأساسية (Starter)</option>
                    <option value="professional">الباقة الاحترافية الشاملة (Professional)</option>
                    <option value="enterprise">باقة المؤسسات - مدى الحياة (Enterprise Lifetime)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدة الاشتراك (بالأيام):</label>
                  <select
                    value={newKeyForm.durationDays}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, durationDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  >
                    <option value={30}>30 يوم (تجريبي / شهري)</option>
                    <option value={90}>90 يوم (3 أشهر)</option>
                    <option value={365}>365 يوم (سنة كاملة)</option>
                    <option value={36500}>دائم (مدى الحياة - Lifetime)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم مسؤول المبيعات:</label>
                  <input
                    type="text"
                    value={newKeyForm.salesRep}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, salesRep: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md"
                  >
                    توليد مفتاح جديد 🚀
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PRICING PLANS ==================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl font-black text-slate-900">باقات وأسعار اشتراكات برنامج MATO SaaS</h2>
            <p className="text-slate-500 text-xs">
              باقات مرنة تناسب كافة أحجام المطاعم والكافيهات مع إمكانية الترقية والدعم الفني المباشر
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">للكافيهات والمطاعم الناشئة</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">الباقة الأساسية</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$1,200</span>
                  <span className="text-xs text-slate-500"> / سنوياً</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>نظام الكاشير السريع (POS)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>إدارة المنيو والوجبات</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>فرع واحد + حتي 3 مستخدمين</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>تقارير المبيعات اليومية</span></li>
                  <li className="flex items-center gap-2 text-slate-400"><X className="w-4 h-4 shrink-0" /> <span>بدون مساعد الذكاء الاصطناعي</span></li>
                </ul>
              </div>

              <button
                onClick={() => { setProposal({ ...proposal, selectedPlan: 'starter' }); setActiveTab('proposal'); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                إنشاء عرض سعر لهذه الباقة
              </button>
            </div>

            {/* Professional Plan (Popular) */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border-2 border-amber-400 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3.5 right-6 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                الأكثر مبيعاً ⭐
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">للمطاعم المتوسطة والكبيرة</span>
                <h3 className="text-xl font-black text-white mt-1">الباقة الاحترافية الشاملة</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-amber-400">$2,400</span>
                  <span className="text-xs text-slate-400"> / سنوياً</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>جميع ميزات الباقة الأساسية</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>مساعد MATO AI الذكي بالصوت والنص</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>ماسح الفواتير بالرؤية الذكية بالذكاء الاصطناعي</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>جرد المخزون وحساب الهدر والتكلفة التلقائي</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>حتى 5 فروع + مستخدمين غير محدودين</span></li>
                </ul>
              </div>

              <button
                onClick={() => { setProposal({ ...proposal, selectedPlan: 'professional' }); setActiveTab('proposal'); }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer text-center shadow-md shadow-amber-400/20"
              >
                إنشاء عرض سعر لهذه الباقة
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">للمجموعات والسلاسل الضخمة</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">باقة المؤسسات - مدى الحياة</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$4,500</span>
                  <span className="text-xs text-slate-500"> / دفعة واحدة (Lifetime)</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>ترخيص دائم مدى الحياة (No annual fee)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>فروع ومستخدمين غير محدودين</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>سيرفر خاص وشعار وهوية مخصصة للعميل</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>تحديثات ونسخ احتياطي تلقائي مدى الحياة</span></li>
                </ul>
              </div>

              <button
                onClick={() => { setProposal({ ...proposal, selectedPlan: 'enterprise' }); setActiveTab('proposal'); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                إنشاء عرض سعر لهذه الباقة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 4: COMMERCIAL PROPOSAL GENERATOR ==================== */}
      {activeTab === 'proposal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Proposal Editor Controls */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>إعداد بيانات عرض السعر الرسمي للعميل</span>
            </h2>

            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المطعم / العميل:</label>
              <input
                type="text"
                value={proposal.clientName}
                onChange={(e) => setProposal({ ...proposal, clientName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">هاتف العميل:</label>
                <input
                  type="text"
                  value={proposal.clientPhone}
                  onChange={(e) => setProposal({ ...proposal, clientPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع المنشأة:</label>
                <input
                  type="text"
                  value={proposal.restaurantType}
                  onChange={(e) => setProposal({ ...proposal, restaurantType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الباقة المختارة:</label>
              <select
                value={proposal.selectedPlan}
                onChange={(e) => setProposal({ ...proposal, selectedPlan: e.target.value as SaaSPlanType })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
              >
                <option value="starter">الباقة الأساسية ($1,200/سنوياً)</option>
                <option value="professional">الباقة الاحترافية الشاملة ($2,400/سنوياً)</option>
                <option value="enterprise">باقة المؤسسات - مدى الحياة ($4,500/دفعة واحدة)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">فروع إضافية ($350/فرع):</label>
                <input
                  type="number"
                  min="0"
                  value={proposal.extraBranchesCount}
                  onChange={(e) => setProposal({ ...proposal, extraBranchesCount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نسبة خصم المبيعات (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={proposal.customDiscountPercent}
                  onChange={(e) => setProposal({ ...proposal, customDiscountPercent: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ملاحظات وخدمات إضافية:</label>
              <textarea
                rows={3}
                value={proposal.notes}
                onChange={(e) => setProposal({ ...proposal, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
              />
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة عرض السعر الرسمي للعميل 🖨️</span>
            </button>
          </div>

          {/* Official Quotation Document Preview */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border-2 border-slate-800 shadow-xl space-y-6 text-right print:p-0 print:border-none">
            
            {/* Proposal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base">
                    M
                  </div>
                  <span className="font-black text-xl text-slate-900 tracking-tight">MATO SaaS Solutions</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">حلول إدارة وتطوير أنظمة المطاعم والكافيهات الذكية</p>
              </div>

              <div className="text-left text-xs">
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {proposal.proposalNumber}
                </span>
                <span className="block text-slate-400 text-[10px] mt-1">التاريخ: {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-900 text-base">عرض سعر رسمي لتشغيل واستضافة البرنامج (Commercial Proposal)</h3>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">المقدم إلى السيد / الشركة:</span>
                <span className="font-black text-slate-900">{proposal.clientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">نوع نشاط المنشأة:</span>
                <span className="font-bold text-slate-800">{proposal.restaurantType}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">رقم هاتف للتواصل:</span>
                <span className="font-mono font-bold text-slate-800">{proposal.clientPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">صلاحية عرض السعر لغاية:</span>
                <span className="font-bold text-rose-700">{proposal.validUntilDate}</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3">البيان والخدمة</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-left">السعر الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                <tr>
                  <td className="p-3 font-bold">
                    {proposal.selectedPlan === 'starter' ? 'الباقة الأساسية' : proposal.selectedPlan === 'professional' ? 'الباقة الاحترافية الشاملة مع AI' : 'باقة المؤسسات الترخيص الدائم'}
                  </td>
                  <td className="p-3 text-center">1 اشتراك</td>
                  <td className="p-3 text-left font-bold">${getPlanBasePrice(proposal.selectedPlan)}</td>
                </tr>
                {proposal.extraBranchesCount > 0 && (
                  <tr>
                    <td className="p-3">ربط وتشغيل فروع إضافية ($350/فرع)</td>
                    <td className="p-3 text-center">{proposal.extraBranchesCount} فروع</td>
                    <td className="p-3 text-left font-bold">${proposal.extraBranchesCount * 350}</td>
                  </tr>
                )}
                {proposal.customDiscountPercent > 0 && (
                  <tr className="bg-emerald-50 text-emerald-800">
                    <td className="p-3 font-bold">خصم خاص مبيعات ({proposal.customDiscountPercent}%)</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-left font-bold">
                      -${((getPlanBasePrice(proposal.selectedPlan) + proposal.extraBranchesCount * 350) * (proposal.customDiscountPercent / 100)).toFixed(0)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-900 text-amber-400 font-black text-sm">
                  <td className="p-3">المبلغ الصافي النهائي المطلوب:</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-left text-base">${calculateProposalTotal().toLocaleString()} USD</td>
                </tr>
              </tbody>
            </table>

            {/* Notes & Guarantees */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
              <span className="font-extrabold text-amber-900 block">شروط وضمانات العقد:</span>
              <p className="text-slate-700 text-[11px] leading-relaxed">{proposal.notes}</p>
            </div>

            {/* Signatures Footer */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600 font-bold">
              <div>
                <span>توقيع وختم قسم المبيعات:</span>
                <span className="block font-black text-slate-900 mt-2">{proposal.salesRepName}</span>
              </div>
              <div className="text-left">
                <span>توقيع العميل بالموافقة:</span>
                <span className="block text-slate-300 mt-2">........................................</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 5: BACKUP & DATA EXPORT/IMPORT ==================== */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Export Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900 text-base">تصدير قاعدة بيانات المطعم بالكامل 📦</h2>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                قم بتصدير جميع بيانات الوجبات، المخزون، الوصفات، الموردين، والمبيعات بملف JSON واحد لإنشاء نسخة احتياطية للعميل أو تسليمه النظام.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700"><span>عدد الوجبات بالمنيو:</span><span className="font-bold">{products.length} وجبة</span></div>
              <div className="flex justify-between text-slate-700"><span>عدد المواد بالمخزون:</span><span className="font-bold">{ingredients.length} مادة</span></div>
              <div className="flex justify-between text-slate-700"><span>عدد الموردين المسجلين:</span><span className="font-bold">{suppliers.length} موردين</span></div>
              <div className="flex justify-between text-slate-700"><span>عدد المبيعات والمصاريف:</span><span className="font-bold">{orders.length + expenses.length} سجلاً</span></div>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تحميل ملف النسخة الاحتياطية (.JSON)</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900 text-base">استيراد نسخة بيانات مطعم عميل 📥</h2>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                رفع واستعادة ملف JSON لتعبئة النظام ببيانات مطعم جديد فوراً عند التسليم للعميل.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <span className="block font-bold text-slate-800 text-xs">اضغط هنا لاختيار ملف البيانات (JSON)</span>
              <span className="block text-[11px] text-slate-400">يدعم كافة النسخ الاحتياطية المصدرة من MATO POS</span>
            </div>

            {backupStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                backupStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {backupStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{backupStatus.message}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 6: SYSTEM REGISTRATIONS & CLOUD PLATFORM ADMIN DASHBOARD */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          
          {/* Cloud Database Integration Status Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-black text-sm text-emerald-400">قاعدة البيانات السحابية Firebase (Firestore) متصلة ومزكاة</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>لوحة تحكم الأدمن (مدير المنصة) — إدارة الاشتراكات وأكواد التفعيل</span>
              </h2>
              <p className="text-xs text-slate-300">
                يتم مزامنة المطاعم وأكواد التفعيل وتواريخ الانتهاء لحظياً عبر قاعدة بيانات Firebase سحابية
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl text-right">
                <div className="text-[10px] text-slate-400">إجمالي المطاعم بالمنصة</div>
                <div className="text-lg font-black text-amber-400">
                  {Math.max(systemRegistrations.length, firestoreRestaurants.length, 1)} مطاعم
                </div>
              </div>
            </div>
          </div>

          {/* MAIN TABLE: REGISTERED RESTAURANTS & ANNUAL ACTIVATION CODES */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-500" />
                  <span>جدول المطاعم المسجلة، أرقام هواتفها، وتواريخ انتهاء اشتراكها السنوي</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  يمكنك توليد 'كود تفعيل سنوي' جديد لكل مطعم بنقرة واحدة لتمديد اشتراكه وتغيير حالته فورياً إلى (فعّال)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">اسم المطعم / المنشأة</th>
                    <th className="p-3">المالك / مدير المطعم</th>
                    <th className="p-3">رقم الهاتف / البريد</th>
                    <th className="p-3">تاريخ انتهاء الاشتراك السنوي</th>
                    <th className="p-3">حالة الاشتراك</th>
                    <th className="p-3">كود التفعيل السنوي الحالي</th>
                    <th className="p-3 text-center">إجراءات الأدمن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Render Firestore Restaurants or fallback to SystemRegistrations */}
                  {(firestoreRestaurants.length > 0
                    ? firestoreRestaurants
                    : systemRegistrations.map(sr => ({
                        id: sr.tenantId || sr.id,
                        name: sr.restaurantName,
                        ownerName: sr.ownerName,
                        phone: sr.emailOrPhone,
                        email: sr.emailOrPhone,
                        status: (sr.status === 'active' ? 'active' : 'expired') as 'active' | 'expired' | 'pending',
                        activationCode: `MATO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        registeredAt: sr.registeredAt
                      }))
                  ).map((rest) => {
                    const expiryDate = new Date(rest.subscriptionExpiry);
                    const isExpired = expiryDate < new Date() || rest.status === 'expired';

                    return (
                      <tr key={rest.id} className="hover:bg-amber-50/40 transition-all">
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                              🏢
                            </div>
                            <div>
                              <div className="font-black text-slate-900">{rest.name}</div>
                              <div className="text-[10px] text-slate-400">معرّف: {rest.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-bold text-slate-800">
                          {rest.ownerName}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700 dir-ltr text-right">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                              {rest.phone || rest.email || 'غير محدد'}
                            </span>
                            {rest.phone && (
                              <button
                                onClick={() => openShareModal({
                                  title: `مراسلة مطعم (${rest.name}) عبر واتساب`,
                                  restaurantName: rest.name,
                                  recipientName: rest.ownerName,
                                  recipientPhone: rest.phone,
                                  code: rest.activationCode,
                                  expiryDate: rest.subscriptionExpiry,
                                  rawMessage: rest.activationCode
                                    ? buildRestaurantActivationMessage({
                                        restaurantName: rest.name,
                                        ownerName: rest.ownerName,
                                        code: rest.activationCode,
                                        expiryDate: expiryDate.toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
                                      })
                                    : `مرحباً أستاذ ${rest.ownerName}! بخصوص اشتراك وترخيص مطعم (${rest.name}) في نظام MATO POS...`
                                })}
                                className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all cursor-pointer"
                                title="مراسلة العميل ومشاركة الكود عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-mono font-bold text-xs text-slate-800">
                            {expiryDate.toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ينتهي في {expiryDate.toLocaleDateString('en-GB')}
                          </div>
                        </td>

                        <td className="p-3">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                              <X className="w-3.5 h-3.5" />
                              <span>منتهي الاشتراك</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>فعّال (نشط)</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-400 border border-amber-400/40 px-3 py-1 rounded-xl font-mono font-black text-xs select-all shadow-xs">
                              <Key className="w-3.5 h-3.5" />
                              <span>{rest.activationCode || 'لم يولد كود بعد'}</span>
                            </span>
                            {rest.activationCode && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopy(rest.activationCode || '', rest.id, `تم نسخ كود تفعيل (${rest.name}) بنجاح!`)}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 transition-all cursor-pointer"
                                  title="نسخ كود التفعيل"
                                >
                                  {copiedKeyId === rest.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                                </button>
                                <button
                                  onClick={() => openShareModal({
                                    title: `مشاركة كود ترخيص (${rest.name}) عبر واتساب`,
                                    restaurantName: rest.name,
                                    recipientName: rest.ownerName,
                                    recipientPhone: rest.phone,
                                    code: rest.activationCode,
                                    expiryDate: rest.subscriptionExpiry,
                                    planName: 'الاشتراك السنوي الشامل'
                                  })}
                                  className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-all cursor-pointer"
                                  title="إرسال الكود للعميل عبر واتساب"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={async () => {
                                const res = await generateAnnualActivationCode(rest.id, rest.name);
                                openShareModal({
                                  title: `🎉 تم تجديد الترخيص! مشاركة الكود الجديد لمطعم (${rest.name})`,
                                  restaurantName: rest.name,
                                  recipientName: rest.ownerName,
                                  recipientPhone: rest.phone,
                                  code: res.code,
                                  expiryDate: res.newExpiry,
                                  planName: 'الاشتراك السنوي الشامل'
                                });
                                setToastNotification(`تم تمديد اشتراك مطعم (${rest.name}) وتوليد كود التفعيل: ${res.code}`);
                                setTimeout(() => setToastNotification(null), 5000);
                              }}
                              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>توليد كود سنوي جديد (تمديد سنة)</span>
                            </button>

                            {rest.activationCode && (
                              <button
                                onClick={() => openShareModal({
                                  title: `مشاركة كود تفعيل مطعم (${rest.name}) عبر واتساب`,
                                  restaurantName: rest.name,
                                  recipientName: rest.ownerName,
                                  recipientPhone: rest.phone,
                                  code: rest.activationCode,
                                  expiryDate: rest.subscriptionExpiry
                                })}
                                className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="إرسال ومشاركة كود التفعيل عبر واتساب"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-[11px] font-black">مشاركة</span>
                              </button>
                            )}

                            <button
                              onClick={() => setRestaurantToDelete({ id: rest.id, name: rest.name })}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                              title="حذف حساب وترخيص المطعم نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: OWNER WHATSAPP & CONTACT SETTINGS ==================== */}
      {activeTab === 'contact' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-6 text-white border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>ربط رقم هاتف الواتساب المباشر لمالك المنصة</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>إعدادات رقم هاتف واتساب فريد (استقبال الإشعارات والطلبات)</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                حدد رقم هاتفك المربوط بـ WhatsApp ليتم إرسال إشعارات طلبات تسجيل المطاعم الجديدة وطلبات المساعدة مباشرة إلى هاتفك المحمول فور تقديمها.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${(contactForm.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً فريد! هذه رسالة اختبارية لتأكيد ربط رقم الواتساب بنجاح مع منظومة MATO POS 🚀')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>تجربة فتح محادثة واتساب لرقمك</span>
              </a>
            </div>
          </div>

          {contactSavedStatus && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{contactSavedStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Settings Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  <span>تعديل وحفظ بيانات هاتف الواتساب والتواصل</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  يتم حفظ هذه البيانات سحابياً في قاعدة البيانات وتحديث كافة روابط واتساب في المنظومة تلقائياً.
                </p>
              </div>

              <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
                
                {/* WhatsApp Phone Number */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>رقم هاتف الواتساب (مع رمز الدولة وبدون مسافات)</span>
                    <span className="text-[10px] text-emerald-600 font-bold">مطلوب للروابط السريعة (wa.me)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: 963991234567 أو 966501234567"
                      value={contactForm.whatsappNumber}
                      onChange={e => setContactForm({ ...contactForm, whatsappNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                    />
                    <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    أدخل كود الدولة ثم رقم الهاتف (مثال لسوريا: <code className="text-emerald-700 font-bold font-mono">963991234567</code>).
                  </p>
                </div>

                {/* Display Phone Number */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    رقم الهاتف المنسق للعرض والاتصال المباشر
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: +963 991 234 567"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Owner Name */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      اسم المالك
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: فريد الفاتح"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      البريد الإلكتروني الرسمي
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="مثال: farid.fateh@hotmail.com"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    اسم الشركة / المنظومة
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: MATO POS Systems & SaaS"
                    value={contactForm.company}
                    onChange={e => setContactForm({ ...contactForm, company: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingContact}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingContact ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ سحابياً...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>💾 حفظ وتحديث رقم الواتساب سحابياً</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContactForm({
                        name: 'فريد الفاتح',
                        phone: '+963 991 234 567',
                        whatsappNumber: '963991234567',
                        email: 'farid.fateh@hotmail.com',
                        company: 'MATO POS Systems & SaaS'
                      });
                    }}
                    className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    استعادة الافتراضي
                  </button>
                </div>

              </form>
            </div>

            {/* Live Explanation & WhatsApp Preview Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* WhatsApp Message Preview Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">معاينة الرسالة الواردة لهاتفك</h4>
                      <span className="text-[10px] text-emerald-400">WhatsApp Notification Preview</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    الآن
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 text-xs font-mono leading-relaxed whitespace-pre-line">
                  {`مرحباً أستاذ ${contactForm.name} 👋
تم إرسال طلب تسجيل وترخيص مطعم جديد لمنظومة MATO POS:
🍽️ اسم المطعم: مطعم دمشق القديمة
👤 صاحب المطعم: أبو أحمد
📱 رقم الهاتف: 0991234567
🆔 رقم الطلب: sub_1722789123

يرجى اعتماد الحساب وإصدار كود التفعيل السنوي. شكراً لك!`}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>تصلك هذه الرسالة تلقائياً بنقرة واحدة من شاشة تسجيل العملاء الجدد.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>يمكنك الموافقة وتوليد كود التفعيل بضغطة زر وإرساله لصاحب المطعم.</span>
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://wa.me/${(contactForm.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً فريد! هذه تجربة لمعاينة إشعار الطلبات على واتساب.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال تجربة الآن إلى {contactForm.whatsappNumber || 'رقمك'}</span>
                  </a>
                </div>
              </div>

              {/* Status Info Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>تأكيد المزامنة السحابية</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  الرقم النشط حالياً في النظام: <strong className="text-slate-900 font-mono font-bold dir-ltr">{contactForm.whatsappNumber}</strong>.
                  بمجرد النقر على "حفظ وتحديث"، سيتم تحديث جميع شاشات تسجيل الدخول، طلبات التفعيل، وصفحات الدعم الفني فورياً.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==================== DELETE RESTAURANT / REQUEST CONFIRMATION MODAL ==================== */}
      {restaurantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn dir-rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">تأكيد حذف طلب التسجيل وسجل المطعم</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك بحذف طلب التسجيل / حساب مطعم <strong className="text-rose-600 font-black">({restaurantToDelete.name})</strong> نهائياً من قاعدة البيانات السحابية وسجلات المنصة؟
              </p>

              {restaurantToDelete.ownerName && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-right space-y-1 text-slate-700">
                  <div><span className="text-slate-400">صاحب المطعم:</span> <strong className="text-slate-900">{restaurantToDelete.ownerName}</strong></div>
                  {restaurantToDelete.phone && <div><span className="text-slate-400">الهاتف:</span> <strong className="text-slate-900 font-mono">{restaurantToDelete.phone}</strong></div>}
                  <div><span className="text-slate-400">المعرف:</span> <span className="text-slate-500 font-mono text-[10px]">{restaurantToDelete.id}</span></div>
                </div>
              )}

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px] text-rose-800 text-right space-y-0.5">
                <p>• سيتم مسح هذا الطلب بالكامل من قائمة طلبات التسجيل السحابية والمحلية.</p>
                <p>• سيتم إيقاف وحذف أي كود تفعيل مرتبط بهذا الطلب.</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isDeletingRestaurant}
                onClick={async () => {
                  const id = restaurantToDelete.id;
                  const name = restaurantToDelete.name;
                  setIsDeletingRestaurant(true);
                  try {
                    await deleteRestaurantRecord(id);
                    setRestaurantToDelete(null);
                    setToastNotification(`تم حذف طلب وسجل مطعم (${name}) بنجاح.`);
                    setTimeout(() => setToastNotification(null), 4000);
                  } catch (err) {
                    alert('حدث خطأ أثناء محاولة الحذف.');
                  } finally {
                    setIsDeletingRestaurant(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingRestaurant ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>نعم، حذف نهائي الآن</span>
              </button>
              <button
                disabled={isDeletingRestaurant}
                onClick={() => setRestaurantToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BULK DELETE REJECTED REQUESTS MODAL ==================== */}
      {showBulkDeleteRejectedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn dir-rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">مسح وحذف كافة الطلبات المرفوضة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل ترغب في حذف كافة طلبات التسجيل المرفوضة نهائياً من قاعدة البيانات السحابية وسجلات المنصة؟
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-100 p-2 rounded-xl">
                هذا الإجراء سيقوم بتنظيف قائمة الطلبات ومسح السجلات المرفوضة القديمة بشكل نهائي.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isDeletingRestaurant}
                onClick={async () => {
                  setIsDeletingRestaurant(true);
                  try {
                    const rejected = subscriptionRequests.filter(r => r.status === 'rejected');
                    for (const r of rejected) {
                      await deleteRestaurantRecord(r.id);
                    }
                    setShowBulkDeleteRejectedModal(false);
                    setToastNotification(`تم مسح وحذف كافة الطلبات المرفوضة بنجاح.`);
                    setTimeout(() => setToastNotification(null), 4000);
                  } catch (err) {
                    alert('حدث خطأ أثناء مسح الطلبات المرفوضة.');
                  } finally {
                    setIsDeletingRestaurant(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingRestaurant ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>نعم، مسح كافة المرفوضة</span>
              </button>
              <button
                disabled={isDeletingRestaurant}
                onClick={() => setShowBulkDeleteRejectedModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== WHATSAPP SHARE MODAL ==================== */}
      <WhatsAppShareModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={shareModalConfig.title}
        recipientName={shareModalConfig.recipientName}
        recipientPhone={shareModalConfig.recipientPhone}
        recipientRole={shareModalConfig.recipientRole}
        restaurantName={shareModalConfig.restaurantName}
        code={shareModalConfig.code}
        rawMessage={shareModalConfig.rawMessage}
        type={shareModalConfig.type}
      />

    </div>
  );
};
