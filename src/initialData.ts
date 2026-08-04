import {
  Restaurant,
  Branch,
  User,
  Category,
  Product,
  Ingredient,
  Recipe,
  Supplier,
  Purchase,
  StockMovement,
  Order,
  ActivityLog,
  Expense
} from './types';

export const INITIAL_RESTAURANT: Restaurant = {
  id: 'rest_01',
  name: 'ماتو كافيه ومطعم (MATO)',
  type: 'cafe',
  currency: 'ل.س',
  logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-01-01T08:00:00Z',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_main',
    restaurantId: 'rest_01',
    name: 'الفرع الرئيسي - الشعلان',
    address: 'دمشق، الشعلان، شارع الحمزاوية',
    phone: '+963 11 223 4567',
    isMain: true,
  },
  {
    id: 'br_malki',
    restaurantId: 'rest_01',
    name: 'فرع المالكي',
    address: 'دمشق، المالكي، مقابل حديقة الجاحظ',
    phone: '+963 11 334 8901',
    isMain: false,
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_owner_farid',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    name: 'فريد (مالك المنظومة)',
    email: 'farid.fateh@hotmail.com',
    phone: '+963991234567',
    password: 'admin',
    pinCode: '1234',
    role: 'Owner',
    isActive: true,
    isPendingApproval: false,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr_owner_default',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    name: 'المالك (المدير العام)',
    email: 'owner@mato.sy',
    phone: '0991234567',
    password: 'admin',
    pinCode: '1234',
    role: 'Owner',
    isActive: true,
    isPendingApproval: false,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_croissant', restaurantId: 'rest_01', name: 'كرواسون', icon: 'Croissant' },
  { id: 'cat_sandwiches', restaurantId: 'rest_01', name: 'ساندويشات', icon: 'Sandwich' },
  { id: 'cat_salads', restaurantId: 'rest_01', name: 'سلطات', icon: 'Salad' },
  { id: 'cat_sweets', restaurantId: 'rest_01', name: 'حلويات', icon: 'Cake' },
  { id: 'cat_drinks', restaurantId: 'rest_01', name: 'مشروبات', icon: 'Coffee' },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing_01',
    restaurantId: 'rest_01',
    name: 'طماطم طازجة',
    category: 'produce',
    unit: 'كيلوغرام (كغ)',
    currentStock: 15,
    minStockThreshold: 5,
    costPerUnit: 12000
  },
  {
    id: 'ing_02',
    restaurantId: 'rest_01',
    name: 'خس إفرنجي',
    category: 'produce',
    unit: 'كيلوغرام (كغ)',
    currentStock: 8,
    minStockThreshold: 3,
    costPerUnit: 15000,
    pieceWeight: 500,
    pieceWeightUnit: 'غرام (غ)',
    pieceUnitName: 'رأس'
  },
  {
    id: 'ing_03',
    restaurantId: 'rest_01',
    name: 'تونا معلبة',
    category: 'canned',
    unit: 'قطعة',
    currentStock: 24,
    minStockThreshold: 10,
    costPerUnit: 25000
  },
  {
    id: 'ing_04',
    restaurantId: 'rest_01',
    name: 'ذرة حلوة معلبة',
    category: 'canned',
    unit: 'قطعة',
    currentStock: 18,
    minStockThreshold: 6,
    costPerUnit: 18000
  },
  {
    id: 'ing_05',
    restaurantId: 'rest_01',
    name: 'لحم بقر مفروم',
    category: 'meats',
    unit: 'كيلوغرام (كغ)',
    currentStock: 12,
    minStockThreshold: 4,
    costPerUnit: 180000
  },
  {
    id: 'ing_06',
    restaurantId: 'rest_01',
    name: 'صدر دجاج',
    category: 'meats',
    unit: 'كيلوغرام (كغ)',
    currentStock: 20,
    minStockThreshold: 5,
    costPerUnit: 95000
  },
  {
    id: 'ing_07',
    restaurantId: 'rest_01',
    name: 'جبنة موزاريلا',
    category: 'cheeses',
    unit: 'كيلوغرام (كغ)',
    currentStock: 10,
    minStockThreshold: 3,
    costPerUnit: 140000
  },
  {
    id: 'ing_08',
    restaurantId: 'rest_01',
    name: 'جبنة شيدر شرائح',
    category: 'cheeses',
    unit: 'كيلوغرام (كغ)',
    currentStock: 7,
    minStockThreshold: 2,
    costPerUnit: 160000
  },
  {
    id: 'ing_09',
    restaurantId: 'rest_01',
    name: 'علب كرتون وجبات سفري',
    category: 'packaging',
    unit: 'قطعة',
    currentStock: 350,
    minStockThreshold: 100,
    costPerUnit: 350
  },
  {
    id: 'ing_10',
    restaurantId: 'rest_01',
    name: 'أكواب ورقية 12 أونص',
    category: 'packaging',
    unit: 'قطعة',
    currentStock: 450,
    minStockThreshold: 150,
    costPerUnit: 250
  }
];

export const INITIAL_RECIPES: Recipe[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_01',
    restaurantId: 'rest_01',
    name: 'المورد أبو أحمد',
    companyName: 'شركة النور للحوم والمقبلات',
    phone: '+963 944 555 666',
    notes: 'مورد معتمد للحوم والحبش المدخن عالي الجودة'
  },
  {
    id: 'sup_02',
    restaurantId: 'rest_01',
    name: 'شركة المراعي',
    companyName: 'المراعي للألبان والأجبان',
    phone: '+963 933 777 888',
    notes: 'توصيل يومي للأجبان والحليب الطازج'
  },
  {
    id: 'sup_03',
    restaurantId: 'rest_01',
    name: 'مطحنة الشام للقهوة',
    companyName: 'مؤسسة الشام للبن الفاخر',
    phone: '+963 955 888 999',
    notes: 'توريد البن الكولومبي والبرازيلي المحمص حديثاً'
  }
];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log_01',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    userId: 'usr_owner',
    userName: 'فاريد الفاتح',
    userRole: 'Owner',
    actionType: 'تأسيس النظام',
    description: 'إنشاء حساب المطعم الرئيسي وإضافة الفروع الأولى',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'log_02',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    userId: 'usr_inventory',
    userName: 'أحمد الحموي',
    userRole: 'Inventory Manager',
    actionType: 'تسجيل شراء',
    description: 'تسجيل شراء 10 كغ حبش مدخن من المورد أبو أحمد بقيمة 1,200,000 ل.س',
    createdAt: '2026-07-25T14:30:00Z'
  },
  {
    id: 'log_03',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    userId: 'usr_manager',
    userName: 'سامر العلي',
    userRole: 'Manager',
    actionType: 'تسجيل هدر',
    description: 'تسجيل هدر 1.5 كغ خس ورقي بسبب التلف',
    createdAt: '2026-07-26T16:00:00Z'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_01',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    title: 'أجور عمال الصالة والمطبخ (يومية)',
    category: 'wages',
    amount: 150000,
    date: new Date().toISOString(),
    notes: 'توزيع أجور العمال لليوم',
    recipientOrWorker: 'طاقم الصالة والمطبخ',
    paymentMethod: 'cash',
    createdByUserId: 'usr_owner',
    createdByName: 'فاريد الفاتح'
  },
  {
    id: 'exp_02',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    title: 'تعبئة أسطوانة غاز للمطبخ',
    category: 'utilities',
    amount: 85000,
    date: new Date().toISOString(),
    notes: 'غاز الفرن الرئيسي',
    recipientOrWorker: 'شركة الغاز',
    paymentMethod: 'cash',
    createdByUserId: 'usr_manager',
    createdByName: 'سامر العلي'
  },
  {
    id: 'exp_03',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    title: 'شراء محارم وورقيات ومستلزمات صالة',
    category: 'supplies',
    amount: 45000,
    date: new Date().toISOString(),
    notes: 'علب محارم رول وورق تغليف',
    recipientOrWorker: 'متجر التجهيزات',
    paymentMethod: 'cash',
    createdByUserId: 'usr_owner',
    createdByName: 'فاريد الفاتح'
  }
];
