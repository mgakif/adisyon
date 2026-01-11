import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductUnit, ProductType, ProductCategory } from '../types';
import { ICONS, CATEGORIES } from '../constants';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>, imageFile?: File) => void;
  initialData?: Product | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    unit: 'kg',
    type: 'retail',
    category: 'nuts'
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({ ...initialData });
            setImagePreview(initialData.image || null);
            setImageFile(null);
        } else {
            setFormData({
                name: '',
                price: 0,
                unit: 'kg',
                type: 'retail',
                category: 'nuts'
            });
            setImagePreview(null);
            setImageFile(null);
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Resim sıkıştırma fonksiyonu
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8, maxSizeKB: number = 300): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Boyutları orantılı olarak küçült
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context oluşturulamadı'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Kaliteyi ayarlayarak sıkıştır
          let currentQuality = quality;
          const tryCompress = (q: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Resim sıkıştırılamadı'));
                  return;
                }

                const sizeKB = blob.size / 1024;
                
                // Eğer hedef boyuttan büyükse ve kalite düşürülebilirse, tekrar dene
                if (sizeKB > maxSizeKB && q > 0.5) {
                  tryCompress(q - 0.1);
                } else {
                  // File nesnesine dönüştür
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              'image/jpeg',
              q
            );
          };

          tryCompress(currentQuality);
        };

        img.onerror = () => {
          reject(new Error('Resim yüklenemedi'));
        };
      };

      reader.onerror = () => {
        reject(new Error('Dosya okunamadı'));
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Lütfen bir resim dosyası seçin.');
        return;
      }
      
      // Validate file size (max 5MB - sıkıştırma öncesi)
      if (file.size > 5 * 1024 * 1024) {
        alert('Resim boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }

      try {
        // Resmi sıkıştır
        const compressedFile = await compressImage(file);
        
        // Sıkıştırılmış dosyayı kaydet
        setImageFile(compressedFile);
        
        // Preview için oku
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Resim sıkıştırma hatası:', error);
        alert('Resim işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFormData({ ...formData, image: undefined });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, imageFile || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">{initialData ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
            <button onClick={onClose}><ICONS.Close /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Resmi</label>
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                      >
                        <ICONS.Close size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition"
                    >
                      <ICONS.Package size={32} className="text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">Resim eklemek için tıklayın</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG (Otomatik sıkıştırılır, ~300KB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı</label>
                <input 
                    type="text" 
                    required
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fiyat (₺)</label>
                    <input 
                        type="number" 
                        required
                        step="0.01"
                        min="0"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Birim</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value as ProductUnit})}
                    >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="qty">Adet</option>
                        <option value="portion">Porsiyon</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                    >
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as ProductType})}
                    >
                        <option value="retail">Perakende (Market)</option>
                        <option value="service">Hizmet (Kafe/Mutfak)</option>
                    </select>
                </div>
            </div>

            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition mt-4">
                KAYDET
            </button>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;