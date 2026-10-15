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
  Expense,
  RestaurantSubscriptionRequest
} from './types';

export const FOOD_BREAK_TENANT_ID = 'sub_1790630390550';

export const INITIAL_RESTAURANT: Restaurant = {
  id: FOOD_BREAK_TENANT_ID,
  name: 'food break',
  type: 'fast_food',
  currency: 'ل.س',
  logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-09-28T21:19:50.551Z',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_main_sub_1790630390550',
    restaurantId: FOOD_BREAK_TENANT_ID,
    name: 'الفرع الرئيسي - Food Break',
    address: 'دمشق، المزة أوتوستراد، بجانب برج دمشق',
    phone: '0980073917',
    isMain: true,
  }
];

export const usr_foodbreak_owner: User = {
  id: 'usr_sub_1790630390550',
  restaurantId: FOOD_BREAK_TENANT_ID,
  branchId: '',
  name: 'farid (مدير مطعم Food Break)',
  email: 'foodbreak@mato.sy',
  phone: '0980073917',
  password: '123454321',
  pinCode: '1234',
  role: 'Owner',
  isPlatformOwner: false,
  isActive: true,
  isPendingApproval: false,
  restaurantName: 'food break',
  createdAt: '2026-09-28T21:19:50.551Z'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_owner_farid',
    restaurantId: 'rest_01',
    branchId: '',
    name: 'فريد (مالك المنظومة)',
    email: 'farid.fateh@hotmail.com',
    phone: '+963991234567',
    password: 'admin',
    pinCode: '1234',
    role: 'Owner',
    isPlatformOwner: true,
    isActive: true,
    isPendingApproval: false,
    createdAt: '2026-01-01T00:00:00Z'
  },
  usr_foodbreak_owner,
  {
    id: 'usr_owner_default',
    restaurantId: 'rest_01',
    branchId: '',
    name: 'مدير المطعم (صاحب المنشأة)',
    email: 'owner@mato.sy',
    phone: '0991234567',
    password: 'admin',
    pinCode: '1234',
    role: 'Owner',
    isPlatformOwner: false,
    isActive: true,
    isPendingApproval: false,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const FOOD_BREAK_RESTAURANT: Restaurant = {
  id: FOOD_BREAK_TENANT_ID,
  name: 'food break',
  type: 'fast_food',
  currency: 'ل.س',
  logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-09-28T21:19:50.551Z',
};

export const FOOD_BREAK_BRANCHES: Branch[] = [
  {
    id: 'br_main_sub_1790630390550',
    restaurantId: FOOD_BREAK_TENANT_ID,
    name: 'الفرع الرئيسي - Food Break',
    address: 'دمشق، المزة أوتوستراد، بجانب برج دمشق',
    phone: '0980073917',
    isMain: true,
  }
];

export const FOOD_BREAK_CATEGORIES: Category[] = [
  { id: 'cat_fb_burgers', restaurantId: 'rest_foodbreak', name: 'برغر وساندويش', icon: 'Sandwich' },
  { id: 'cat_fb_pizza', restaurantId: 'rest_foodbreak', name: 'بيتزا ومعجنات', icon: 'UtensilsCrossed' },
  { id: 'cat_fb_appetizers', restaurantId: 'rest_foodbreak', name: 'مقبلات وبطاطا', icon: 'Boxes' },
  { id: 'cat_fb_drinks', restaurantId: 'rest_foodbreak', name: 'مشروبات وعصائر', icon: 'Coffee' },
  { id: 'cat_fb_desserts', restaurantId: 'rest_foodbreak', name: 'حلويات ووافل', icon: 'Cake' },
];

export const FOOD_BREAK_PRODUCTS: Product[] = [
  {
    id: 'prod_fb_01',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'برغر فود بريك دبل سبيشال',
    price: 45000,
    categoryId: 'cat_fb_burgers',
    categoryName: 'برغر وساندويش',
    isAvailable: true,
    description: 'شريحتان من اللحم البقري الصافي مع جبنة الشيدر والصوص الخاص وخضار طازجة'
  },
  {
    id: 'prod_fb_02',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'ساندويش زنجر كرسبي حار',
    price: 38000,
    categoryId: 'cat_fb_burgers',
    categoryName: 'برغر وساندويش',
    isAvailable: true,
    description: 'صدر دجاج مقرمش حار مع صوص الرانش والخس وصلصة الفود بريك'
  },
  {
    id: 'prod_fb_03',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'بيتزا بيبيروني سوبريم (كبير)',
    price: 58000,
    categoryId: 'cat_fb_pizza',
    categoryName: 'بيتزا ومعجنات',
    isAvailable: true,
    description: 'جبنة موزاريلا فاخرة مع شرائح البيبيروني وصلصة الطماطم الإيطالية'
  },
  {
    id: 'prod_fb_04',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'بطاطا ويدجز مبهرة مع صوص الشيدر',
    price: 22000,
    categoryId: 'cat_fb_appetizers',
    categoryName: 'مقبلات وبطاطا',
    isAvailable: true,
    description: 'قطع بطاطا ويدجز مقرمشة مع بهارات الأعشاب وصوص الجبن الذائب'
  },
  {
    id: 'prod_fb_05',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'أصابع جبنة موزاريلا مقرمشة (6 قطع)',
    price: 26000,
    categoryId: 'cat_fb_appetizers',
    categoryName: 'مقبلات وبطاطا',
    isAvailable: true,
    description: 'أصابع موزاريلا ذهبية مقرمشة مع صوص المارينارا'
  },
  {
    id: 'prod_fb_06',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'عصير برتقال طبيعي طازج',
    price: 18000,
    categoryId: 'cat_fb_drinks',
    categoryName: 'مشروبات وعصائر',
    isAvailable: true,
    description: 'عصير برتقال طبيعي معصور طازجاً بدون سكر مضاف'
  },
  {
    id: 'prod_fb_07',
    restaurantId: 'rest_foodbreak',
    branchId: 'br_foodbreak_main',
    name: 'كولا مثلجة 330 مل',
    price: 8000,
    categoryId: 'cat_fb_drinks',
    categoryName: 'مشروبات وعصائر',
    isAvailable: true,
    description: 'مشروب غازي بارد مع ثلج'
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

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_FOOD_BREAK_SUBSCRIPTION: RestaurantSubscriptionRequest = {
  id: FOOD_BREAK_TENANT_ID,
  restaurantName: 'food break',
  ownerName: 'farid',
  phone: '0980073917',
  email: 'foodbreak@mato.sy',
  city: 'دمشق',
  branchesCount: 1,
  planType: 'professional',
  status: 'approved',
  activationCode: 'MATO-2026-HGC1550',
  expiresAt: '2027-09-29T08:47:25.887Z',
  requestedAt: '2026-09-28T21:19:50.551Z',
  approvedAt: '2026-09-28T21:19:50.551Z',
  notes: 'حساب مطعم فود بريك المرخص والمعتمد بالكامل'
};
