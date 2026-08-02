import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle,
  AlertOctagon,
  Trash2,
  RefreshCw,
  PlusCircle,
  ShoppingBag,
  TrendingDown,
  BarChart3,
  Boxes,
  HelpCircle
} from 'lucide-react';

export const AIChatView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    confirmPendingAIAction,
    clearChatHistory,
    currentRestaurant,
    currentUser
  } = useData();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isSending) return;

    setInputPrompt('');
    setIsSending(true);
    await sendChatMessage(text);
    setIsSending(false);
  };

  const quickChips = [
    { label: '🎓 دليل الاستخدام الشامل', prompt: 'كيف بستخدم برنامج MATO POS وطريقة العمل عليه؟' },
    { label: '👥 إدارة الموظفين والمستخدمين', prompt: 'كيف بضيف موظف جديد، بغير صلاحياته، أو بمسح حساب مستخدم بالنظام؟' },
    { label: '🏢 إضافة وتعديل الفروع', prompt: 'كيف بضيف فرع جديد للمطعم، أو بتعدل بياناته أو بمسحه؟' },
    { label: '🛒 كاشير البيع (POS)', prompt: 'كيف بستخدم كاشير المبيعات POS والطلبات وطباعة الفواتير؟' },
    { label: '🍔 إضافة وجبة جديدة', prompt: 'كيف أضيف وجبة جديدة مع السعر والتصنيف بالبرنامج؟' },
    { label: '🍲 حساب تكلفة الوجبة', prompt: 'كيف أربط الوصفة بالمكونات لحساب التكلفة الفعلية وهامش الربح؟' },
    { label: '📦 إدارة المخزون والهدر', prompt: 'كيف بتابع المواد اللي رح تخلص بالمخزون وتسجيل التالف؟' },
    { label: '🚚 الموردين والمشتريات', prompt: 'كيف أسجل فاتورة شراء من مورد وتحديث المخزون؟' },
    { label: '💸 المصاريف وأجور العمال', prompt: 'كيف بسجل أجور العمال ومصاريف الكهرباء والغاز والمحارم بالبرنامج؟' },
    { label: '📊 الأرباح والتقارير', prompt: 'كم ربحت اليوم بجميع الفروع وكيف بشوف التقارير؟' },
    { label: '⚡ أضف موظف تلقائياً', prompt: 'أضف كاشير جديد اسمه سامر العلي وبريده samer@mato.sy' },
    { label: '⚡ أضف منتج تلقائياً', prompt: 'أضف منتج اسمه بيتزا مارجريتا، سعره 35000، وتصنيفه بيتزا' },
    { label: '⚡ سجل أجر عامل تلقائياً', prompt: 'سجل أجر عامل صالة بقيمة 50000 ل.س باسم العامل أحمد' },
    { label: '⚡ سجل مصروف غاز تلقائياً', prompt: 'سجل مصروف تعبئة أسطوانة غاز بقيمة 85000 ل.س للمطبخ' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white text-base">المرشد التعليمي والمساعد الذكي (MATO AI)</h1>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                دليل تعليمي + منفذ أسرع 🎓
              </span>
            </div>
            <p className="text-xs text-slate-400">
              يشرح لك كيفية استخدام كافة أقسام النظام خطوة بخطوة، وينفذ عملياتك الذكية باللغة العربية والعامية
            </p>
          </div>
        </div>

        <button
          onClick={clearChatHistory}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="مسح سجل المحادثة"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Suggestion Chips Bar */}
      <div className="p-2 bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap pl-2 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          أسئلة تعليمية وأوامر:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.prompt)}
            disabled={isSending}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-semibold whitespace-nowrap transition-all border border-slate-700/80 hover:border-amber-400 cursor-pointer flex items-center gap-1"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Stream Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {chatMessages.map(msg => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                  isUser ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-400 border border-slate-700'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2 max-w-full">
                <div
                  className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isUser
                      ? 'bg-amber-400 text-slate-950 font-medium rounded-tl-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Executed Tools Badge */}
                {msg.toolCallsPerformed && msg.toolCallsPerformed.length > 0 && (
                  <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-[11px] space-y-1">
                    {msg.toolCallsPerformed.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم تنفيذ الأداة ({t.toolName}): {t.summary}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending Sensitive Action Confirmation Box */}
                {msg.requireConfirmation && (
                  <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl space-y-2 text-amber-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertOctagon className="w-4 h-4" />
                      <span>تأكيد عملية إدارية حساسة</span>
                    </div>
                    <p className="text-slate-300">{msg.requireConfirmation.promptText}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => confirmPendingAIAction(msg.id, true)}
                        className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black rounded-lg text-xs hover:bg-amber-300 cursor-pointer"
                      >
                        نعم، تأكيد التنفيذ
                      </button>
                      <button
                        onClick={() => confirmPendingAIAction(msg.id, false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-700 cursor-pointer"
                      >
                        إلغاء الأمر
                      </button>
                    </div>
                  </div>
                )}

                <div className={`text-[10px] text-slate-500 ${isUser ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>جاري التحليل واستدعاء وظائف النظام المباشرة...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="اكتب أمرك للمساعد هنا (مثلاً: أضف منتج، سجل شراء، شو أكتر المنتجات مبيعاً؟)..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            disabled={isSending}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isSending}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/10 cursor-pointer transition-all"
          >
            <span>إرسال</span>
            <Send className="w-4 h-4 fill-slate-950" />
          </button>
        </form>
      </div>

    </div>
  );
};
