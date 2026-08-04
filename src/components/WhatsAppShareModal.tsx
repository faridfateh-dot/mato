import React, { useState } from 'react';
import {
  MessageCircle,
  Copy,
  Check,
  X,
  Phone,
  Send,
  Sparkles,
  Key,
  ShieldCheck,
  Store,
  User,
  Share2
} from 'lucide-react';
import { copyToClipboard, getWhatsAppShareUrl, formatWhatsAppPhoneNumber } from '../lib/whatsappShare';

export interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  recipientName: string;
  recipientPhone?: string;
  recipientRole?: string;
  restaurantName?: string;
  code?: string;
  rawMessage: string;
  type?: 'restaurant_activation' | 'staff_credentials' | 'general';
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  title,
  recipientName,
  recipientPhone = '',
  recipientRole,
  restaurantName,
  code,
  rawMessage,
  type = 'general'
}) => {
  const [phoneInput, setPhoneInput] = useState(recipientPhone);
  const [messageText, setMessageText] = useState(rawMessage);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state when props change
  React.useEffect(() => {
    setPhoneInput(recipientPhone);
    setMessageText(rawMessage);
    setCopiedAll(false);
    setCopiedCode(false);
  }, [recipientPhone, rawMessage, isOpen]);

  if (!isOpen) return null;

  const handleCopyFullMessage = async () => {
    const success = await copyToClipboard(messageText);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleCopyCodeOnly = async () => {
    if (!code) return;
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const url = getWhatsAppShareUrl(phoneInput, messageText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl text-right animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>{title}</span>
              </h3>
              <p className="text-[11px] text-emerald-300/80">
                إرسال ومشاركة كود وبيانات الحساب عبر واتساب بنقرة واحدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-200">
          
          {/* Target Profile Bar */}
          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold">
                {type === 'restaurant_activation' ? <Store className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-white text-xs">{recipientName}</div>
                <div className="text-[10px] text-slate-400">
                  {restaurantName ? `${restaurantName} • ` : ''}
                  {recipientRole ? recipientRole : 'مستخدم معتمد'}
                </div>
              </div>
            </div>

            {code && (
              <div className="text-left">
                <div className="text-[10px] text-slate-400">الكود المخصص:</div>
                <div className="font-mono font-black text-amber-400 text-xs bg-slate-900 px-2 py-0.5 rounded border border-amber-400/30">
                  {code}
                </div>
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>رقم هاتف الواتساب للمستلم:</span>
              <span className="text-[10px] text-emerald-400">
                {formatWhatsAppPhoneNumber(phoneInput) ? 'جاهز للإرسال المباشر' : 'سيفتح قائمة جهات الاتصال'}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="مثال: +963 991 234 567 أو 0991234567"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 dir-ltr text-right pl-9"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              يمكنك كتابة الرقم مع أو بدون كود الدولة (مثال لسوريا: 0991234567 يتم تحويله تلقائياً).
            </p>
          </div>

          {/* Message Preview and Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-300">معاينة نص رسالة الواتساب:</label>
              <span className="text-[10px] text-slate-400">يمكنك تعديل النص قبل الإرسال</span>
            </div>

            <div className="relative">
              <textarea
                rows={7}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 font-sans text-xs focus:outline-none focus:border-emerald-500 leading-relaxed resize-none font-medium"
              />
            </div>
          </div>

          {/* Quick Copy Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleCopyFullMessage}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                copiedAll
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedAll ? 'تم نسخ كامل الرسالة!' : '📋 نسخ نص الرسالة بالكامل'}</span>
            </button>

            {code && (
              <button
                onClick={handleCopyCodeOnly}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  copiedCode
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
              >
                {copiedCode ? <Check className="w-4 h-4 text-slate-950" /> : <Key className="w-4 h-4 text-amber-400" />}
                <span>{copiedCode ? 'تم نسخ الكود فقط!' : '🔑 نسخ كود التفعيل فقط'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            إغلاق
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>📱 إرسال عبر واتساب الآن (WhatsApp)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
