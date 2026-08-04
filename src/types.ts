export type UserRole = 'Owner' | 'Manager' | 'Cashier' | 'Inventory Manager';

export interface Restaurant {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'fast_food';
  currency: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface User {
  id: string;
  restaurantId: string;
  branchId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  isPendingApproval?: boolean;
  requestedAt?: string;
  requestedRole?: UserRole;
  restaurantName?: string;
  approvalNotes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  icon?: string;
}

export interface Product {
  id: string;
  restaurantId: string;
  branchId: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
  isAvailable: boolean;
  description?: string;
}

export type RawMaterialCategory = 'produce' | 'canned' | 'meats' | 'cheeses' | 'packaging' | 'other' | string;

export interface RawMaterialCategoryInfo {
  id: string;
  name: string;
  icon?: string;
  isCustom?: boolean;
}

export interface Ingredient {
  id: string;
  restaurantId: string;
  name: string;
  category?: RawMaterialCategory; // 'produce' (خضروات وفواكه) | 'canned' (معلبات) | 'meats' (لحومات) | 'cheeses' (أجبان) | 'other' (أخرى)
  unit: string;
  currentStock: number;
  minStockThreshold: number;
  costPerUnit: number; // e.g. price per kg or piece
  // Dual-unit conversion (e.g., buying by piece/head with estimated weight per piece for recipes, like 1 رأس خس = 500غ)
  pieceWeight?: number; // e.g., 500
  pieceWeightUnit?: string; // e.g., 'غرام (غ)' or 'كيلوغرام (كغ)'
  pieceUnitName?: string; // e.g., 'رأس', 'حبة', 'قطعة'
}

export interface RecipeIngredientItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number; // e.g. 80 for 80g
}

export interface Recipe {
  id: string;
  restaurantId: string;
  productId: string;
  items: RecipeIngredientItem[];
  calculatedCost: number;
  profitMargin: number; // percentage
  suggestedPrice: number;
}

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  companyName?: string;
  notes?: string;
}

export interface PurchaseItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  restaurantId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  date: string;
  createdByUserId: string;
  createdByName: string;
}

export type StockMovementType = 'purchase' | 'waste' | 'sale' | 'adjustment';

export interface StockMovement {
  id: string;
  restaurantId: string;
  branchId: string;
  ingredientId: string;
  ingredientName: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  reason?: string;
  date: string;
  createdByUserId: string;
  createdByName: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  branchId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  costAmount: number;
  profitAmount: number;
  status: 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'staff_meal';
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
}

export interface ActivityLog {
  id: string;
  restaurantId: string;
  branchId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionType: string;
  description: string;
  details?: string;
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCallsPerformed?: {
    toolName: string;
    summary: string;
    success: boolean;
  }[];
  requireConfirmation?: {
    actionType: string;
    payload: any;
    promptText: string;
  };
}

export type ExpenseCategory = 'wages' | 'utilities' | 'supplies' | 'rent' | 'maintenance' | 'staff_meals' | 'other';

export interface Expense {
  id: string;
  restaurantId: string;
  branchId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  recipientOrWorker?: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  createdByUserId: string;
  createdByName: string;
}

export interface WasteAnalytics {
  totalWasteCost: number;
  wasteCount: number;
  topWastedIngredients: { ingredientName: string; totalQuantity: number; unit: string; totalCost: number }[];
  wasteByReason: { reason: string; totalCost: number; count: number }[];
}

export interface ExpenseAlert {
  id: string;
  type: 'waste_high' | 'cost_increase' | 'low_margin' | 'low_stock';
  severity: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  actionableRecommendation: string;
}

export interface DashboardStats {
  todaySales: number;
  orderCount: number;
  avgOrderValue: number;
  estimatedProfit: number;
  todayExpenses: number;
  netProfitAfterExpenses: number;
  salesByDay: { day: string; sales: number; orders: number }[];
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
  lowStockIngredients: Ingredient[];
  recentActivities: ActivityLog[];
  wasteAnalytics: WasteAnalytics;
  expenseAlerts: ExpenseAlert[];
  expensesByCategory: { category: ExpenseCategory; label: string; total: number }[];
}

export type SaaSPlanType = 'starter' | 'professional' | 'enterprise';

export interface SoftwareLicense {
  licenseKey: string;
  planType: SaaSPlanType;
  planNameAr: string;
  clientName: string;
  salesRep?: string;
  maxBranches: number;
  maxUsers: number;
  isAiFeaturesEnabled: boolean;
  isInvoiceScannerEnabled: boolean;
  isMultiBranchEnabled: boolean;
  activatedAt: string;
  expiresAt: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'suspended';
  annualPrice: number;
}

export interface LicenseKeyInfo {
  id: string;
  key: string;
  planType: SaaSPlanType;
  planNameAr: string;
  durationDays: number;
  clientName: string;
  salesRep: string;
  createdAt: string;
  isRedeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: string;
}

export interface SystemRegistration {
  id: string;
  restaurantName: string;
  ownerName: string;
  emailOrPhone: string;
  method: 'email' | 'phone';
  planType: SaaSPlanType;
  registeredAt: string;
  status: 'active';
  tenantId: string;
  deviceInfo?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface CommercialProposal {
  proposalNumber: string;
  clientName: string;
  clientPhone: string;
  restaurantType: string;
  selectedPlan: SaaSPlanType;
  extraBranchesCount: number;
  customDiscountPercent: number;
  notes: string;
  validUntilDate: string;
  salesRepName: string;
}


