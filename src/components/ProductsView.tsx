import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChefHat,
  Tag,
  CheckCircle,
  XCircle,
  Sparkles,
  FolderPlus,
  Folder,
  Pencil,
  AlertCircle,
  Check
} from 'lucide-react';
import { Product, Category } from '../types';

interface ProductsViewProps {
  onNavigateRecipeForProduct?: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onNavigateRecipeForProduct }) => {
  const {
    products,
    categories,
    currentRestaurant,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    recipes
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState<boolean>(false);
  const [categoryFormName, setCategoryFormName] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryName: 'كرواسون',
    description: '',
    imageUrl: '',
    isAvailable: true
  });

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      categoryName: categories[0]?.name || 'عام',
      description: '',
      imageUrl: '',
      isAvailable: true
    });
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      price: p.price.toString(),
      categoryName: p.categoryName,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      isAvailable: p.isAvailable
    });
    setShowModal(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryFormName.trim());
      triggerNotification(`تم تحديث اسم التصنيف إلى "${categoryFormName.trim()}" بنجاح!`);
    } else {
      const newCat = addCategory(categoryFormName.trim());
      triggerNotification(`تم إضافة التصنيف الجديد "${newCat.name}" بنجاح!`);
      // Auto-select in form if product modal is open
      setFormData(prev => ({ ...prev, categoryName: newCat.name }));
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryFormName('');
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;

    const count = products.filter(p => p.categoryId === categoryToDelete.id || p.categoryName === categoryToDelete.name).length;
    if (count > 0) {
      triggerNotification(`تنبيه: يحتوي هذا التصنيف على ${count} أصناف مسجلة!`, 'error');
    }

    deleteCategory(categoryToDelete.id);
    triggerNotification(`تم حذف التصنيف "${categoryToDelete.name}" بنجاح.`);
    setCategoryToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    // ensure category
    let cat = categories.find(c => c.name.trim() === formData.categoryName.trim());
    if (!cat) {
      cat = addCategory(formData.categoryName.trim());
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        price: Number(formData.price),
        categoryId: cat.id,
        categoryName: cat.name,
        description: formData.description,
        imageUrl: formData.imageUrl?.trim() || undefined,
        isAvailable: formData.isAvailable
      });
      triggerNotification(`تم تحديث بيانات الصنف "${formData.name}" بنجاح.`);
    } else {
      addProduct({
        name: formData.name,
        price: Number(formData.price),
        categoryId: cat.id,
        categoryName: cat.name,
        description: formData.description,
        imageUrl: formData.imageUrl?.trim() || undefined,
        isAvailable: formData.isAvailable
      });
      triggerNotification(`تم إضافة الصنف الجديد "${formData.name}" إلى القائمة.`);
    }

    setShowModal(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory || p.categoryName === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold text-white transition-all animate-bounce ${
            notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            <span>إدارة المنتجات وقائمة الطعام (Menu)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إضافة الوجبات والأصناف، تنظيم التصنيفات، تحديد الأسعار، وتفعيل أو إيقاف العناصر
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryFormName('');
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border border-slate-200"
          >
            <FolderPlus className="w-4 h-4 text-amber-600" />
            <span>إضافة تصنيف جديد</span>
          </button>

          <button
            onClick={() => setShowManageCategoriesModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border border-slate-200"
            title="إدارة وتعديل التصنيفات الحالية"
          >
            <Folder className="w-4 h-4 text-slate-500" />
            <span>إدارة التصنيفات ({categories.length})</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            الكل ({products.length})
          </button>
          {categories.map(c => {
            const count = products.filter(p => p.categoryId === c.id || p.categoryName === c.name).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-slate-900 text-amber-400 shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedCategory === c.id ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryFormName('');
              setShowCategoryModal(true);
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ تصنيف</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن صنف أو تصنيف..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mb-1">لا توجد وجبات أو منتجات حالياً</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            تم مسح القائمة بنجاح. يمكنك بدء إضافة الوجبات والمنتجات الخاصة بمطعمك بسهولة عبر زر الإضافة أو المساعد الذكي.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول وجبة</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
          const recipe = recipes.find(r => r.productId === product.id);
          const hasRecipe = !!recipe;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                !product.isAvailable ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Image Container (Only if image URL is set by user) */}
                {product.imageUrl && product.imageUrl.trim().length > 0 ? (
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {product.categoryName}
                    </div>

                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center text-rose-300 font-bold text-xs">
                        غير متوفر حالياً
                      </div>
                    )}
                  </div>
                ) : (
                  /* Clean, compact header without image box */
                  <div className="p-4 pb-2 flex items-center justify-between gap-2 border-b border-slate-100/80 bg-gradient-to-r from-slate-50 to-amber-50/30">
                    <span className="bg-amber-100/90 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {product.categoryName}
                    </span>
                    {!product.isAvailable && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        غير متوفر
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1">{product.name}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[32px] mb-3">
                    {product.description || 'صنف ممتاز مطهو بعناية بأجود المكونات'}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">السعر</span>
                      <span className="text-base font-black text-amber-600">
                        {product.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{currentRestaurant.currency}</span>
                      </span>
                    </div>

                    {hasRecipe ? (
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block">التكلفة / هامش الربح</span>
                        <span className="text-xs font-bold text-emerald-600">
                          {recipe.calculatedCost.toLocaleString()} ({recipe.profitMargin}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">بلا وصفة ربط</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => updateProduct(product.id, { isAvailable: !product.isAvailable })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    product.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                  title="تغيير الحالة"
                >
                  {product.isAvailable ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-500" />}
                  <span>{product.isAvailable ? 'نشط' : 'متوقف'}</span>
                </button>

                {onNavigateRecipeForProduct && (
                  <button
                    onClick={() => onNavigateRecipeForProduct(product.id)}
                    className="px-2 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="إدارة الوصفة والتكلفة"
                  >
                    <ChefHat className="w-3 h-3" />
                    <span>الوصفة</span>
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`)) {
                        deleteProduct(product.id);
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs my-auto max-h-[88vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>{editingProduct ? 'تعديل بيانات صنف' : 'إضافة صنف جديد لقائمة الطعام'}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 pb-20">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كرواسون حبش وجبنة"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر ({currentRestaurant.currency}) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">التصنيف *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryFormName('');
                        setShowCategoryModal(true);
                      }}
                      className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>تصنيف جديد</span>
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={formData.categoryName}
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setEditingCategory(null);
                          setCategoryFormName('');
                          setShowCategoryModal(true);
                        } else {
                          setFormData({ ...formData, categoryName: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__add_new__" className="text-amber-600 font-bold">
                        ➕ + إضافة تصنيف جديد...
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">رابط صورة الصنف (اختياري)</label>
                  <span className="text-[10px] text-slate-400">اتركه فارغاً إذا كنت لا ترغب بصورة</span>
                </div>
                <input
                  type="url"
                  placeholder="https://... (اختياري - يمكنك تركه فارغاً)"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {formData.imageUrl?.trim() && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
                    <img src={formData.imageUrl} alt="معاينة" className="w-9 h-9 rounded-lg object-cover" />
                    <span className="text-[10px] text-slate-600 font-bold">معاينة الصورة</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="mr-auto text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف الصنف</label>
                <textarea
                  rows={2}
                  placeholder="مكونات وطريقة تقديم الصنف..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailableCheck"
                  checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                />
                <label htmlFor="isAvailableCheck" className="font-bold text-slate-700">
                  متوفر للطلب في قائمة الطعام حالياً
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md cursor-pointer"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>{editingCategory ? 'تعديل اسم التصنيف' : 'إضافة تصنيف جديد لقائمة الطعام'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم التصنيف الجديد *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثال: مشروبات باردة، وجبات رئيسية، مشويات..."
                  value={categoryFormName}
                  onChange={e => setCategoryFormName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Quick Presets */}
              {!editingCategory && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">اقتراحات سريعة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['مشروبات ساخنة', 'مشروبات باردة', 'وجبات رئيسية', 'مشويات', 'سلطات ومقبلات', 'حلويات', 'سندويشات', 'صلصات إضافية'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCategoryFormName(preset)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-medium rounded-lg text-[10px] transition-colors cursor-pointer border border-slate-200"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? 'حفظ الاسم' : 'إضافة التصنيف'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-400" />
                <span>إدارة التصنيفات الحالية ({categories.length})</span>
              </h2>
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <p className="text-slate-500 text-[11px]">قائمة بالاقسام والتصنيفات في مطعمك ويمكنك تعديل أسمائها أو حذفها.</p>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryFormName('');
                    setShowCategoryModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] hover:bg-amber-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>جديد</span>
                </button>
              </div>

              <div className="space-y-2">
                {categories.map(cat => {
                  const count = products.filter(p => p.categoryId === cat.id || p.categoryName === cat.name).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/80 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{cat.name}</span>
                          <span className="text-[10px] text-slate-500">{count} أصناف مرتبطة</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryFormName(cat.name);
                            setShowCategoryModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="تعديل اسم التصنيف"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="حذف التصنيف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="px-4 py-2 bg-slate-900 text-amber-400 font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-5 text-center text-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">حذف التصنيف "{categoryToDelete.name}"</h3>
            <p className="text-slate-500 mb-4 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ لن تتأثر الأصناف المسجلة تحته وستبقى محفوظة.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteCategory}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md cursor-pointer"
              >
                حذف التصنيف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
