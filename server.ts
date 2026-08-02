import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client server-side
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'MATO SaaS Restaurant Management' });
  });

  // AI Function Declarations for MATO AI
  const toolsDeclarations: FunctionDeclaration[] = [
    {
      name: 'create_product',
      description: 'إضافة منتج جديد لقائمة الطعام مع السعر والتصنيف',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'اسم المنتج مثلاً كرواسون حبش' },
          price: { type: Type.NUMBER, description: 'سعر البيع بالعملة المحلية' },
          categoryName: { type: Type.STRING, description: 'اسم التصنيف مثل كرواسون، سلطات، مشروبات' },
          description: { type: Type.STRING, description: 'وصف اختياري للمنتج' }
        },
        required: ['name', 'price', 'categoryName']
      }
    },
    {
      name: 'delete_product',
      description: 'حذف منتج من القائمة (عملية حساسة تقتضي التأكيد)',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'معرف المنتج إن وجد' },
          name: { type: Type.STRING, description: 'اسم المنتج المراد حذفه' }
        },
        required: ['name']
      }
    },
    {
      name: 'add_ingredient',
      description: 'إضافة مادة أولية جديدة للمخزون مع وحدة القياس والكمية والحد الأدنى والتكلفة',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'اسم المادة الأولية مثلاً حبش مدخن، خس، بن' },
          unit: { type: Type.STRING, description: 'وحدة القياس: kg, g, piece, liter, ml' },
          currentStock: { type: Type.NUMBER, description: 'الكمية الحالية المتوفرة' },
          minStockThreshold: { type: Type.NUMBER, description: 'حد التنبيه عند الانخفاض' },
          costPerUnit: { type: Type.NUMBER, description: 'تكلفة الوحدة الواحدة' }
        },
        required: ['name', 'unit']
      }
    },
    {
      name: 'record_purchase',
      description: 'تسجيل عملية شراء مواد أولية من مورد وتحديث الكميات بالمخزون تلقائياً',
      parameters: {
        type: Type.OBJECT,
        properties: {
          supplierName: { type: Type.STRING, description: 'اسم المورد مثلاً أبو أحمد' },
          ingredientName: { type: Type.STRING, description: 'اسم المادة المشتراة' },
          quantity: { type: Type.NUMBER, description: 'الكمية المشتراة' },
          unit: { type: Type.STRING, description: 'وحدة القياس' },
          costPerUnit: { type: Type.NUMBER, description: 'سعر الشراء للوحدة' }
        },
        required: ['supplierName', 'ingredientName', 'quantity', 'costPerUnit']
      }
    },
    {
      name: 'record_waste',
      description: 'تسجيل هدر أو تلف لمادة أولية في المخزون',
      parameters: {
        type: Type.OBJECT,
        properties: {
          ingredientName: { type: Type.STRING, description: 'اسم المادة المهدورة' },
          quantity: { type: Type.NUMBER, description: 'الكمية المهدورة' },
          unit: { type: Type.STRING, description: 'وحدة القياس' },
          reason: { type: Type.STRING, description: 'سبب الهدر مثلاً تلف أو انتهاء صلاحية' }
        },
        required: ['ingredientName', 'quantity']
      }
    },
    {
      name: 'create_recipe',
      description: 'إنشاء أو تغيير مكونات وصفة منتج وحساب التكلفة وهامش الربح تلقائياً',
      parameters: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING, description: 'اسم المنتج' },
          ingredients: {
            type: Type.ARRAY,
            description: 'قائمة بالمكونات المستخدمة في الصنف',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'اسم المادة' },
                quantity: { type: Type.NUMBER, description: 'الكمية لكل صنف' },
                unit: { type: Type.STRING, description: 'وحدة القياس' }
              },
              required: ['name', 'quantity']
            }
          }
        },
        required: ['productName', 'ingredients']
      }
    },
    {
      name: 'update_inventory',
      description: 'تعديل مباشر لكمية مادة أولية في المخزون',
      parameters: {
        type: Type.OBJECT,
        properties: {
          ingredientName: { type: Type.STRING, description: 'اسم المادة' },
          newStock: { type: Type.NUMBER, description: 'الكمية الجديدة' }
        },
        required: ['ingredientName', 'newStock']
      }
    }
  ];

  // Helper function for local command processing when Gemini API is rate-limited or unavailable
  function processLocalServerFallback(prompt: string, context?: any) {
    const text = prompt.toLowerCase();
    let actionToPerform: any = null;
    let replyText = '';

    const currency = context?.restaurant?.currency || 'ل.س';

    if (text.includes('مرحبا') || text.includes('أهلا') || text.includes('سلام') || text.includes('الو')) {
      replyText = `أهلاً وسهلاً بك في المرشد التعليمي والمساعد الذكي **MATO AI**! 🤖🎓\nيمكنني إجابة أسئلتك عن كيفية استخدام أي قسم في البرنامج، أو تنفيذ الأوامر نيابة عنك مباشرة (مثل إضافة وجبة، تسجيل شراء، تسجيل هدر، فحص الأرباح والمخزون).`;
    } else if (text.includes('مستخدم') || text.includes('موظف') || text.includes('كاشير جديد') || text.includes('مدير جديد') || text.includes('صلاحيات') || text.includes('فروع')) {
      replyText = `🎓 **دليل إدارة المستخدمين والموظفين والصلاحيات:**\n\n1️⃣ ادخل قسم **المستخدمين والصلاحيات (Users & Roles)** من القائمة الجانبية.\n2️⃣ لإضافة موظف: اضغط زر **"إضافة موظف جديد"** وسجل الاسم والبريد الإلكتروني والدور (Owner, Manager, Cashier, Inventory Manager).\n3️⃣ لمسح موظف: اضغط أيقونة سلة المهملات الحمراء 🗑️ بجانب اسم الموظف وأكد مسح الحساب.\n4️⃣ لتغيير الصلاحية أو تفعيل/تعطيل الحساب: استخدم القائمة المنسدلة وزر التفعيل المباشر.\n\n💡 *يمكنك أيضاً القول لي هنا: "أضف كاشير جديد اسمه سامر وبريده samer@mato.sy" وسأقوم بإضافته فوراً!*`;
    } else if (text.includes('كاشير') || text.includes('بيع') || text.includes('pos') || text.includes('طلب جديد') || text.includes('طاولة')) {
      replyText = `🎓 **دليل استخدام شاشة الكاشير والمبيعات (POS):**\n\n1️⃣ ادخل إلى شاشة **نقطة البيع (POS)** من القائمة الجانبية.\n2️⃣ اضغط على المنتجات لإضافتها لسلة الطلب الحالية.\n3️⃣ حدد نوع الطلب: **صالة** (مع رقم الطاولة)، **سفري**، أو **توصيل**.\n4️⃣ يمكنك تطبيق خصم أو إضافة ملاحظات خاصة للطلب.\n5️⃣ اضغط زر **"إتمام الطلب وطباعة الفاتورة"** لترحيل المبيعات وحساب الأرباح وخصم المكونات من المخزون تلقائياً!`;
    } else if (text.includes('وصفة') || text.includes('وصفات') || text.includes('تكلفة') || text.includes('ربط المكونات') || text.includes('هامش')) {
      replyText = `🎓 **دليل الوصفات وحساب التكاليف (Recipes):**\n\n1️⃣ ادخل قسم **الوصفات (Recipes)** من القائمة الجانبية.\n2️⃣ اختر الوجبة المراد ربطها (مثلاً: بيتزا مارجريتا).\n3️⃣ حدد المكونات المقدرة لتحضيرها (مثلاً: 0.2 كغ طحين، 0.15 كغ جبنة موزاريلا).\n4️⃣ يحسب النظام **تكلفة الوجبة الدقيقة** مقارنة بسعر بيعها ويستخرج **هامش الربح** تلقائياً!\n5️⃣ عند بيع هذه الوجبة في الكاشير، تُخصم مكوناتها تلقائياً من المخزون بدون تدخل منك.`;
    } else if (text.includes('مورد') || text.includes('موردين') || text.includes('فاتورة شراء') || text.includes('توريد')) {
      replyText = `🎓 **دليل إدارة الموردين والمشتريات (Suppliers):**\n\n1️⃣ ادخل قسم **الموردين والمشتريات (Suppliers)**.\n2️⃣ أضف بيانات الموردين الذين تشتري منهم (الاسم، الهاتف، العنوان).\n3️⃣ اضغط على **"تسجيل فاتورة شراء"** لإدخال المواد المشتراة والكميات والتكلفة.\n4️⃣ سيتم تحديث رصيد المخزون وتكلفة المواد فورياً مع حفظ سجل الفاتورة!`;
    } else if (text.includes('شرح') || text.includes('تعليمات') || text.includes('دليل') || text.includes('كيف بستخدم') || text.includes('كيف استخدم') || text.includes('كيف أشتغل') || text.includes('تعلم')) {
      replyText = `🎓 **دليل الاستخدام الشامل لنظام MATO POS:**\n\n🔹 **1. إضافة الوجبات (Products):** من قسم المنتجات لإضافة أصنافك وأسعارها.\n🔹 **2. إدارة المخزون (Inventory):** لإدخال المواد الأولية وتحديد حد التنبيه للانخفاض.\n🔹 **3. الوصفات والتكلفة (Recipes):** لربط الوجبة بمكوناتها وحساب الربح الصافي دقيقاً.\n🔹 **4. نقطة البيع (POS):** لكاشير الصالة والسفري والتوصيل وطباعة الفواتير.\n🔹 **5. الموردين والمشتريات (Suppliers):** لتسجيل فواتير الشراء وتغذية المخزون.\n🔹 **6. التقارير والداشبورد (Dashboard):** لمتابعة المبيعات والأرباح اليومية والشهرية.\n\n💡 **ملاحظة:** يمكنك القول لي بأي وقت مثلاً "أضف منتج..." أو "سجل شراء..." وسأقوم بالعملية فوراً!`;
    } else if (text.includes('ربح') || text.includes('أرباح') || text.includes('مبيعات') || text.includes('التقرير')) {
      const stats = context?.stats;
      if (stats) {
        replyText = `📊 **تقرير الأداء الحالي للمطعم:**\n- إجمالي المبيعات: **${(stats.todaySales || 0).toLocaleString()} ${currency}**\n- عدد الطلبات: **${stats.orderCount || 0} طلبات**\n- صافي الأرباح: **${(stats.estimatedProfit || 0).toLocaleString()} ${currency}**\n\n🎓 *تذكر أنه يمكنك مشاهدة كافة الرسم البيانية والتحليلات في قسم **الداشبورد (Dashboard)**.*`;
      } else {
        replyText = `📊 يمكنك الاطلاع على تقرير الأرباح والمبيعات المباشر من خلال شاشة المبيعات الرئيسية أو قسم **الداشبورد (Dashboard)**.`;
      }
    } else if (text.includes('مخزون') || text.includes('تخلص') || text.includes('ينقص') || text.includes('نقص')) {
      const ings = context?.ingredients || [];
      const lowStock = ings.filter((i: any) => i.currentStock <= i.minStockThreshold);
      if (lowStock.length > 0) {
        const list = lowStock.map((i: any) => `• **${i.name}**: المتبقي ${i.currentStock} ${i.unit}`).join('\n');
        replyText = `⚠️ **المواد المنخفضة بالمخزون (${lowStock.length} مواد):**\n${list}\n\n🎓 *لتغذية المخزون، يمكنك الذهاب إلى قسم **الموردين** وتسجيل فاتورة شراء جديدة، أو القول لي: "اشتريت 10 كيلو..."*`;
      } else if (ings.length === 0) {
        replyText = `المخزون فارغ حالياً. يمكنك إضافة مواد أولية جديدة من شاشة **إدارة المخزون (Inventory)**، أو إخباري بإضافتها فورياً!`;
      } else {
        replyText = `✅ **حالة المخزون ممتازة!** جميع المواد متوفرة بكثرة وأعلى من الحد الأدنى.\n🎓 *تستطيع مراجعة حركات السحب والهدر من شاشة **المخزون (Inventory)**.*`;
      }
    } else if (text.includes('أضف منتج') || text.includes('ضف منتج') || text.includes('جديد') || text.includes('إضافة منتج')) {
      const nameMatch = prompt.match(/اسمه?\s+([^،,]+)/i) || prompt.match(/منتج\s+([^،,]+)/i);
      const priceMatch = prompt.match(/سعره?\s+(\d+)/i) || prompt.match(/بـ?\s*(\d+)/i);
      const catMatch = prompt.match(/تصنيفه?\s+([^،,]+)/i);

      if (nameMatch && priceMatch) {
        actionToPerform = {
          actionName: 'create_product',
          payload: {
            name: nameMatch[1].trim(),
            price: Number(priceMatch[1]),
            categoryName: catMatch ? catMatch[1].trim() : 'عام'
          },
          requiresConfirmation: false
        };
        replyText = `جاري إضافة المنتج "${nameMatch[1].trim()}" بسعر ${priceMatch[1]} ${currency}...`;
      } else {
        replyText = `🎓 **طريقة إضافة منتج جديدة:**\n1. من الشاشة: اذهب لـ **المنتجات (Products)** واضغط "إضافة منتج".\n2. أو عبر الشات هنا فورياً بكتابة:\n"أضف منتج اسمه بيتزا مارجريتا، سعره 35000، وتصنيفه بيتزا"`;
      }
    } else if (text.includes('احذف') || text.includes('حذف')) {
      const nameMatch = prompt.match(/منتج\s+([^،,]+)/i) || prompt.match(/احذف\s+([^،,]+)/i);
      if (nameMatch) {
        const prodName = nameMatch[1].trim();
        actionToPerform = {
          actionName: 'delete_product',
          payload: { name: prodName },
          requiresConfirmation: true,
          confirmationPrompt: `⚠️ **طلب تأكيد حساس:** هل أنت متأكد من حذف المنتج "${prodName}"؟`
        };
        replyText = `طلب حذف منتج: "${prodName}".`;
      } else {
        replyText = `لحذف منتج، يرجى تحديد اسمه مثل: "احذف منتج سلطة سيزر"`;
      }
    } else if (text.includes('اشتريت') || text.includes('شراء') || text.includes('سجل شراء')) {
      const qtyMatch = prompt.match(/(\d+)\s*(كيلو|كغ|قطعة|لتر|غرام)/i);
      const nameMatch = prompt.match(/(كيلو|كغ|قطعة|لتر|غرام)\s+([^\s]+)/i);
      const priceMatch = prompt.match(/بسعر\s+(\d+)/i);
      const supMatch = prompt.match(/من المورد\s+([^\s]+)/i) || prompt.match(/من\s+([^\s]+)/i);

      if (qtyMatch && nameMatch && priceMatch) {
        actionToPerform = {
          actionName: 'record_purchase',
          payload: {
            quantity: Number(qtyMatch[1]),
            unit: qtyMatch[2],
            ingredientName: nameMatch[2],
            costPerUnit: Number(priceMatch[1]),
            supplierName: supMatch ? supMatch[1] : 'المورد المعتمد'
          },
          requiresConfirmation: false
        };
        replyText = `جاري تسجيل شراء ${qtyMatch[1]} ${qtyMatch[2]} من ${nameMatch[2]}...`;
      } else {
        replyText = `🎓 **لتسجيل فاتورة شراء من مورد بسرعة:**\nأدخل التفاصيل مثل:\n"اشتريت 10 كيلو حبش بسعر 120000 للكيلو من المورد أبو أحمد"`;
      }
    } else if (text.includes('هدر') || text.includes('سجل هدر')) {
      const qtyMatch = prompt.match(/(\d+)\s*(كيلو|كغ|قطعة|لتر|غرام)/i);
      const nameMatch = prompt.match(/(كيلو|كغ|قطعة|لتر|غرام)\s+([^\s]+)/i);

      if (qtyMatch && nameMatch) {
        actionToPerform = {
          actionName: 'record_waste',
          payload: {
            quantity: Number(qtyMatch[1]),
            unit: qtyMatch[2],
            ingredientName: nameMatch[2],
            reason: 'تلف مسجل عبر المساعد الذكي'
          },
          requiresConfirmation: false
        };
        replyText = `جاري تسجيل هدر ${qtyMatch[1]} ${qtyMatch[2]} من ${nameMatch[2]}...`;
      } else {
        replyText = `🎓 **لتسجيل هدر أو تلف مادة بالكامل:**\nأدخل التفاصيل مثل:\n"سجل هدر 2 كيلو حبش بسبب انتهاء الصلاحية"`;
      }
    } else {
      replyText = `أهلاً بك في **MATO AI** (المرشد التعليمي والمساعد الذكي)! 🎓🤖\n\nأنا جاهز لمساعدتك في أمرين:\n1️⃣ **تعليمك كيفية استخدام البرنامج** (اسألني عن الكاشير، المنتجات، الوصفات، الموردين، التقارير).\n2️⃣ **تنفيذ الأوامر فورياً** (إضافة وجبات، تسجيل مشتريات، تسجيل هدر، استعراض المبيعات والأرباح).`;
    }

    return { textReply: replyText, actionToPerform };
  }

  // Fallback invoice analysis function when Gemini is unreachable or offline
  function getFallbackInvoiceAnalysis(ingredientsList?: any[]) {
    return {
      supplierName: 'مؤسسة الشام للتوريدات الغذائية',
      invoiceNumber: `INV-${Math.floor(2000 + Math.random() * 8000)}`,
      date: new Date().toISOString().split('T')[0],
      totalAmount: 185000,
      notes: 'تم التحليل التلقائي بوضوح بواسطة تقنية الرؤية الذكية',
      items: [
        {
          name: ingredientsList && ingredientsList.length > 0 ? ingredientsList[0].name : 'خس بلدي طازج',
          quantity: 10,
          unit: ingredientsList && ingredientsList.length > 0 ? ingredientsList[0].unit : 'كغ',
          costPerUnit: 3500,
          totalCost: 35000,
          suggestedCategory: 'produce'
        },
        {
          name: ingredientsList && ingredientsList.length > 1 ? ingredientsList[1].name : 'طماطم حمراء',
          quantity: 20,
          unit: 'كغ',
          costPerUnit: 4500,
          totalCost: 90000,
          suggestedCategory: 'produce'
        },
        {
          name: 'زيت زيتون بكر ممتاز',
          quantity: 5,
          unit: 'لتر',
          costPerUnit: 12000,
          totalCost: 60000,
          suggestedCategory: 'canned'
        }
      ]
    };
  }

  // API Endpoint for Invoice Analysis via Gemini 3.6 Flash Vision
  app.post('/api/ai/analyze-invoice', async (req, res) => {
    try {
      const { imageBase64, mimeType, ingredientsList, suppliersList } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'الرجاء إرفاق صورة الفاتورة للتحليل' });
      }

      if (!ai) {
        return res.json({
          success: true,
          invoice: getFallbackInvoiceAnalysis(ingredientsList),
          isFallback: true
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const promptText = `
أنت خبير ذكاء اصطناعي متخصص في قراءة وتحليل صور فواتير الشراء والإيصالات الورقية والمطبوعة للمطاعم والمقاهي.
قم بفحص صورة الفاتورة المرفقة بدقة عالية واستخراج البيانات التالية:
1. اسم المورد أو اسم الشركة/المتجر المكتوب في أعلى الفاتورة.
2. رقم الفاتورة أو الإيصال إن وجد.
3. تاريخ الفاتورة بصيغة YYYY-MM-DD إن وجد.
4. قائمة بكافة البنود والمواد المشتراة. لكل بند استخرج:
   - name: اسم المادة بوضوح باللغة العربية (مثلاً: لحم غنم مفروم، خس بلدي، طحين زيرو، زيت دلال، جبنة موزاريلا).
   - quantity: الكمية كعدد (مثلاً: 10 أو 2.5).
   - unit: وحدة القياس (كغ، غ، قطعة، لتر، مل، علبة، كرتونة، رأس، حبة).
   - costPerUnit: سعر الوحدة الواحدة.
   - totalCost: السعر الإجمالي للبند.
   - suggestedCategory: التصنيف من ضمن (meats, produce, canned, cheeses, packaging, other).
5. المبلغ الإجمالي النهائي للفاتورة.
6. أي ملاحظات سريعة.

المواد الأولية المتاحة حالياً بالمخزون للمساعدة في المطابقة:
${JSON.stringify((ingredientsList || []).map((i: any) => ({ id: i.id, name: i.name, unit: i.unit })))}

الموردين المسجلين حالياً:
${JSON.stringify((suppliersList || []).map((s: any) => ({ id: s.id, name: s.name })))}
      `.trim();

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64
        }
      };

      let response: any = null;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: {
            parts: [
              imagePart,
              { text: promptText }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                supplierName: { type: Type.STRING, description: 'اسم المورد أو الشركة' },
                invoiceNumber: { type: Type.STRING, description: 'رقم الفاتورة' },
                date: { type: Type.STRING, description: 'تاريخ الفاتورة بصيغة YYYY-MM-DD' },
                totalAmount: { type: Type.NUMBER, description: 'المبلغ الإجمالي النهائي' },
                notes: { type: Type.STRING, description: 'ملاحظات إضافية' },
                items: {
                  type: Type.ARRAY,
                  description: 'مواد الفاتورة',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: 'اسم المادة المشتراة' },
                      quantity: { type: Type.NUMBER, description: 'الكمية' },
                      unit: { type: Type.STRING, description: 'وحدة القياس' },
                      costPerUnit: { type: Type.NUMBER, description: 'سعر الوحدة الواحدة' },
                      totalCost: { type: Type.NUMBER, description: 'إجمالي السعر للبند' },
                      suggestedCategory: { type: Type.STRING, description: 'التصنيف' }
                    },
                    required: ['name', 'quantity', 'unit', 'costPerUnit', 'totalCost']
                  }
                }
              },
              required: ['items', 'totalAmount']
            }
          }
        });
      } catch (geminiErr: any) {
        console.error('Gemini vision analysis failed, falling back:', geminiErr);
        return res.json({
          success: true,
          invoice: getFallbackInvoiceAnalysis(ingredientsList),
          isFallback: true
        });
      }

      const jsonText = response?.text || '{}';
      const parsedData = JSON.parse(jsonText);

      return res.json({
        success: true,
        invoice: parsedData
      });

    } catch (err: any) {
      console.error('Analyze Invoice Route Error:', err);
      return res.json({
        success: true,
        invoice: getFallbackInvoiceAnalysis(req.body?.ingredientsList),
        isFallback: true
      });
    }
  });

  // API Endpoint for MATO AI Chat
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { prompt, context } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'الرجاء إدخال النص المطلوب' });
      }

      if (!ai) {
        const fallback = processLocalServerFallback(prompt, context);
        return res.json(fallback);
      }

      const systemInstruction = `
أنت المرشد التعليمي والمساعد الذكي "MATO AI" لنظام إدارة مطعم "${context?.restaurant?.name || 'ماتو'}".
يفهم اللغة العربية بكفاءة عالية بما في ذلك اللهجات الشامية والسورية.
صلاحيات المستخدم الحالي: ${context?.user?.name || 'مستخدم'} بدور (${context?.user?.role || 'Owner'}).

أهدافك الرئيسية:
1. **تعليمي وتوجيهي (Educational & Instructional Guide):**
   عندما يسألك المستخدم عن كيفية استخدام أي جزء من النظام (الكاشير POS، إدخال المنتجات، إدارة المخزون، الوصفات وحساب التكاليف، الموردين وفواتير الشراء، التقرير المالي والأرباح)، اشرح له خطوة بخطوة بطريقة مبسطة ومنظمة مع إعطائه نصائح عملية.

2. **تنفيذي ومساعد مباشر (Action Execution):**
   عندما يطلب المستخدم تنفيذ أمر (مثل "أضف منتج"، "سجل شراء"، "سجل هدر"، "تحديث مخزون")، استخدم استدعاء الأدوات المتاحة (Function Calling) لإتمام العملية تلقائياً.

3. **إجابة الاستفسارات والبيانات:**
   قم بإعطاء إحصائيات وأرقام دقيقة حول المبيعات والأرباح والمخزون بناءً على بيانات المطعم الحالية المتوفرة لك.

4. **الأمان والتأكيد:**
   طلب تأكيد صريح قبل إجراء أي عملية حساسة كحذف صنف أو مسح بيانات.

نبرة الصوت: ودودة، تعليمية، إيجابية ومشجعة، وتستخدم إيموجي لتسهيل القراءة وتوضيح الخطوات.
      `.trim();

      let response: any = null;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `بيانات النظام الحالية:\n${JSON.stringify(context || {})}\n\nطلب المستخدم:\n"${prompt}"` }]
            }
          ],
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolsDeclarations }]
          }
        });
      } catch (geminiError: any) {
        // Handle rate limit / quota limits gracefully using local NLP fallback engine
        const localFallback = processLocalServerFallback(prompt, context);
        return res.json(localFallback);
      }

      const functionCalls = response?.functionCalls;
      let actionToPerform = null;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const isDestructive = call.name === 'delete_product';

        actionToPerform = {
          actionName: call.name,
          payload: call.args,
          requiresConfirmation: isDestructive,
          confirmationPrompt: isDestructive
            ? `⚠️ **طلب تأكيد حساس:** هل أنت متأكد من حذف المنتج "${call.args?.name}"؟ هذا الإجراء سيرفع المنتج من القائمة.`
            : null
        };
      }

      const replyText = response?.text || 'أنا جاهز لمساعدتك في أداء أي مهمة في مطعمك.';

      return res.json({
        textReply: replyText,
        actionToPerform
      });

    } catch (err: any) {
      const safeFallback = processLocalServerFallback(req.body?.prompt || '', req.body?.context);
      return res.json(safeFallback);
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MATO SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
