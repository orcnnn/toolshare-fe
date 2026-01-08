// src/pages/AddToolForm.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { Tool, ToolCreate, toolApi } from '../services/api';

import { ChevronDown } from 'lucide-react';

interface AddToolFormProps {
  userId: number; // Aktif kullanıcı ID'si
  onAdd: (newTool: Tool) => void;
  onCancel: () => void;
}

// SQL verisinden alınan sabit kategoriler
const CATEGORIES = [
  { id: 1, name: 'Elektrikli Aletler' },
  { id: 2, name: 'El Aletleri' },
  { id: 3, name: 'Ölçüm Aletleri' },
  { id: 4, name: 'Boya & Dekorasyon' },
  { id: 5, name: 'Pnömatik Aletler' },
  { id: 6, name: 'Genel Ekipman' }
];

export default function AddToolForm({ userId, onAdd, onCancel }: AddToolFormProps) {
  const [toolName, setToolName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!toolName.trim()) {
      setError('Lütfen alet adı girin');
      return;
    }
    
    if (!selectedCategoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const toolData: ToolCreate = {
        tool_name: toolName.trim(),
        user_id: userId,
        category_id: parseInt(selectedCategoryId),
      };

      const newTool = await toolApi.create(toolData);
      onAdd(newTool);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Alet eklenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setToolName(e.target.value);
    if (error) setError(null);
  };

  
  const handleChangeCatagory = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setSelectedCategoryId(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Alet Paylaş</h2>
        <button 
          onClick={onCancel} 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
      </div>

      {/* Bilgi Kutusu */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Alet paylaşımı</p>
            <p className="text-xs text-blue-600 mt-1">
              Paylaştığınız aletler diğer kullanıcılar tarafından kiralanabilir.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alet Adı <span className="text-red-500">*</span>
          </label>
          <input 
            required
            name="tool_name"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Örn: Bosch Darbeli Matkap"
            value={toolName}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-400 mt-1">
            Aletin marka ve modelini belirtmeniz önerilir.
          </p>
        </div>

        {/* Kullanıcı Bilgisi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <select
              required
              name="category_id"
              value={selectedCategoryId}
              onChange={handleChangeCatagory}
              disabled={isSubmitting}
              className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-gray-400">
                Kategori Seçiniz
              </option>
              {/* Mock Datadan Gelen Kategoriler */}
              <option value="1">Elektrikli Aletler</option>
              <option value="2">El Aletleri</option>
              <option value="3">Ölçüm Aletleri</option>
              <option value="4">Boya & Dekorasyon</option>
              <option value="5">Pnömatik Aletler</option>
              <option value="6">Genel Ekipman</option>
            </select>

            {/* Özel Aşağı Ok İkonu */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <ChevronDown size={20} />
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-1">
            Aletinizin doğru bulunabilmesi için en uygun kategoriyi seçin.
          </p>
        </div>


        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting || !toolName.trim() || !selectedCategoryId}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              isSubmitting || !toolName.trim() || !selectedCategoryId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Ekleniyor...</span>
              </>
            ) : (
              <>
                <Wrench className="w-5 h-5" />
                <span>İlanı Yayınla</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
