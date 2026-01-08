// src/pages/Marketplace.tsx
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Search, Star, Hammer, Wrench, Filter, Clock, Package, CheckCircle, TrendingUp, User as UserIcon, ChevronDown, X } from 'lucide-react';
import { Tool, ToolWithStatus, ToolStatusType, User, userApi, toolApi, analyticsApi, AvailableToolSearch } from '../services/api';
import ReservationModal from '../components/ReservationModal';

// Placeholder görseller
import placeholder1 from '../assets/placeholder1.png';
import placeholder2 from '../assets/placeholder2.png';
import placeholder3 from '../assets/placeholder3.jpg';

const placeholderImages = [placeholder1, placeholder2, placeholder3];

// Filter tipi
type FilterType = 'all' | 'never_reserved' | 'currently_available' | 'currently_rented';

// Filter seçenekleri
const STATUS_FILTERS: { id: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'Tümü', icon: <Package className="w-4 h-4" />, color: 'blue' },
  { id: 'currently_available', label: 'Müsait', icon: <CheckCircle className="w-4 h-4" />, color: 'green' },
  { id: 'currently_rented', label: 'Kirada', icon: <Clock className="w-4 h-4" />, color: 'orange' },
  { id: 'never_reserved', label: 'Hiç Kiralanmamış', icon: <Star className="w-4 h-4" />, color: 'purple' },
];

// Props arayüzünü tanımlıyoruz
interface MarketplaceProps {
  tools: Tool[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onReserve: (tool: Tool, startDate: Date, endDate: Date) => Promise<void>;
  currentUserId: number;
  currentUserName: string;
  reservedToolIds: number[];
}

// Owner cache'i için tip
type OwnerCache = Record<number, User>;

export default function Marketplace({ 
  tools, 
  loading,
  error,
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  onReserve,
  currentUserId,
  currentUserName,
  reservedToolIds 
}: MarketplaceProps) {
  const [owners, setOwners] = useState<OwnerCache>({});
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  
  // Durum filtreleme state'leri
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [filteredByStatus, setFilteredByStatus] = useState<ToolWithStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [toolStatuses, setToolStatuses] = useState<Record<number, ToolWithStatus>>({});

  // Advanced search state'leri
  const [advancedSearchResults, setAdvancedSearchResults] = useState<AvailableToolSearch[]>([]);
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  // Bana ait filtresi
  const [showOnlyMyTools, setShowOnlyMyTools] = useState(false);
  
  // Filtreleme dropdown state
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Advanced search'ü tetikle
  useEffect(() => {
    if (!useAdvancedSearch || !searchTerm) return;

    const performAdvancedSearch = async () => {
      setAdvancedLoading(true);
      try {
        const results = await analyticsApi.searchAvailableTools(searchTerm, 30);
        setAdvancedSearchResults(results);
      } catch (err) {
        console.error('Advanced search hatası:', err);
        setAdvancedSearchResults([]);
      } finally {
        setAdvancedLoading(false);
      }
    };

    performAdvancedSearch();
  }, [searchTerm, useAdvancedSearch]);

  // Durum bilgisini yükle (API zaten owner bilgisini döndürüyor)
  useEffect(() => {
    const loadToolsByStatus = async () => {
      setStatusLoading(true);
      try {
        const data = await toolApi.getByStatus(statusFilter);
        setFilteredByStatus(data);
        
        // Tool durumlarını cache'e al
        const statusMap: Record<number, ToolWithStatus> = {};
        data.forEach(tool => {
          statusMap[tool.tool_id] = tool;
        });
        setToolStatuses(prev => ({ ...prev, ...statusMap }));
      } catch (err) {
        console.error('Durum filtreleme hatası:', err);
      } finally {
        setStatusLoading(false);
      }
    };

    loadToolsByStatus();
  }, [statusFilter]);

  // Props'tan gelen tools için sahipleri yükle (ilk yükleme)
  useEffect(() => {
    const loadOwners = async () => {
      const uniqueUserIds = [...new Set(tools.map(t => t.user_id))];
      const newOwners: OwnerCache = {};
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          if (!owners[userId]) {
            try {
              const user = await userApi.getById(userId);
              newOwners[userId] = user;
            } catch (err) {
              console.error(`User ${userId} yüklenemedi:`, err);
            }
          }
        })
      );
      
      if (Object.keys(newOwners).length > 0) {
        setOwners(prev => ({ ...prev, ...newOwners }));
      }
    };

    if (tools.length > 0) {
      loadOwners();
    }
  }, [tools]);
  
  // Filtreleme: status filter + search + bana ait
  const displayTools = statusFilter === 'all' ? tools : filteredByStatus;
  const filteredTools = displayTools.filter(tool => {
    const matchesSearch = tool.tool_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Bana ait filtresi
    if (showOnlyMyTools) {
      const toolOwnerId = 'user_id' in tool ? tool.user_id : (tool as ToolWithStatus).owner_id;
      if (toolOwnerId !== currentUserId) return false;
    }
    
    return matchesSearch;
  });

  // Tool'un durumunu al
  const getToolStatus = (toolId: number): ToolStatusType | null => {
    return toolStatuses[toolId]?.status || null;
  };

  // Durum badge'i render et
  const renderStatusBadge = (toolId: number) => {
    const toolWithStatus = toolStatuses[toolId];
    if (!toolWithStatus) return null;

    const status = toolWithStatus.status;
    
    // Türkçe status değerlerine göre renk belirle
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'Müsait': { bg: 'bg-green-100', text: 'text-green-700' },
      'Şu An Kirada': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'Hiç Kiralanmamış': { bg: 'bg-purple-100', text: 'text-purple-700' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  // Input değişimi için tip güvenliği
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Kirala butonuna tıklandığında modal aç
  const handleReserveClick = (tool: Tool | ToolWithStatus) => {
    // ToolWithStatus ise Tool formatına dönüştür
    if ('owner_id' in tool) {
      const convertedTool: Tool = {
        tool_id: tool.tool_id,
        tool_name: tool.tool_name,
        user_id: tool.owner_id,
        category_id: tool.category_id,
        created_at: new Date().toISOString(), // Placeholder
      };
      setSelectedTool(convertedTool);
    } else {
      setSelectedTool(tool);
    }
  };

  // Modal'dan onay geldiğinde
  const handleReserveConfirm = async (startDate: Date, endDate: Date) => {
    if (selectedTool) {
      await onReserve(selectedTool, startDate, endDate);
      setSelectedTool(null);
    }
  };

  // Modal'ı kapat
  const handleModalClose = () => {
    setSelectedTool(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p>Aletler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400 bg-red-50 rounded-2xl p-8">
        <Hammer className="w-12 h-12 mb-3 opacity-50" />
        <p className="font-medium">Hata: {error}</p>
        <p className="text-sm text-gray-500 mt-2">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rezervasyon Modal */}
      {selectedTool && (
        <ReservationModal
          tool={selectedTool}
          ownerName={owners[selectedTool.user_id]?.user_name}
          currentUserName={currentUserName}
          onConfirm={handleReserveConfirm}
          onClose={handleModalClose}
        />
      )}

      {/* Arama ve Filtreleme */}
      <div className={`p-4 rounded-2xl shadow-sm space-y-4 transition-all duration-300 ${
        useAdvancedSearch 
          ? 'bg-gradient-to-r from-purple-600 to-purple-700' 
          : 'bg-white'
      }`}>
        <div className="relative">
          <Search className={`absolute left-3 top-3 w-5 h-5 ${useAdvancedSearch ? 'text-purple-300' : 'text-gray-400'}`} />
          <input 
            type="text" 
            placeholder={useAdvancedSearch ? "Müsait aletlerde ara..." : "Ne aramıştınız? (Matkap, Çadır...)"} 
            className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
              useAdvancedSearch 
                ? 'bg-purple-500/50 text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-300' 
                : 'bg-gray-100 focus:ring-2 focus:ring-blue-500'
            }`}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Advanced Search ve Filtreleme Butonları */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setUseAdvancedSearch(!useAdvancedSearch)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              useAdvancedSearch 
                ? 'bg-white text-purple-600 shadow-md' 
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
            title={useAdvancedSearch ? "Normal arama moduna geç" : "Gelişmiş arama modunu aç"}
          >
            <TrendingUp className="w-4 h-4" />
            {useAdvancedSearch ? 'Normal Arama' : 'Gelişmiş Arama'}
          </button>
          
          {/* Filtreleme Dropdown - Sadece normal aramada */}
          {!useAdvancedSearch && (
            <div className="relative">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  (showOnlyMyTools || statusFilter !== 'all')
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtreleme
                <ChevronDown className={`w-4 h-4 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {filterDropdownOpen && (
                <>
                  {/* Overlay to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setFilterDropdownOpen(false)}
                  />
                  
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                    {/* Sahiplik Filtresi */}
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sahiplik</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowOnlyMyTools(false)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            !showOnlyMyTools 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                          Tümü
                        </button>
                        <button
                          onClick={() => setShowOnlyMyTools(true)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            showOnlyMyTools 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <UserIcon className="w-4 h-4" />
                          Bana Ait
                        </button>
                      </div>
                    </div>
                    
                    {/* Durum Filtresi */}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Durum</p>
                      <div className="grid grid-cols-2 gap-2">
                        {STATUS_FILTERS.map(filter => {
                          const isActive = statusFilter === filter.id;
                          const colorClasses = {
                            blue: isActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                            green: isActive ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100',
                            orange: isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100',
                            purple: isActive ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100',
                          };
                          return (
                            <button
                              key={filter.id}
                              onClick={() => setStatusFilter(filter.id)}
                              disabled={statusLoading}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                colorClasses[filter.color as keyof typeof colorClasses]
                              } ${statusLoading ? 'opacity-50' : ''}`}
                            >
                              {filter.icon}
                              {filter.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Filtreleri Temizle */}
                    {(showOnlyMyTools || statusFilter !== 'all') && (
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setShowOnlyMyTools(false);
                            setStatusFilter('all');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                          Filtreleri Temizle
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Aktif filtre göstergesi */}
          {!useAdvancedSearch && (showOnlyMyTools || statusFilter !== 'all') && (
            <div className="flex gap-1.5 flex-wrap">
              {showOnlyMyTools && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <UserIcon className="w-3 h-3" />
                  Bana Ait
                  <button onClick={() => setShowOnlyMyTools(false)} className="ml-0.5 hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                  statusFilter === 'currently_available' ? 'bg-green-100 text-green-700' :
                  statusFilter === 'currently_rented' ? 'bg-orange-100 text-orange-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {STATUS_FILTERS.find(f => f.id === statusFilter)?.label}
                  <button onClick={() => setStatusFilter('all')} className="ml-0.5 hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Sonuç Sayısı - Sadece normal aramada */}
        {!useAdvancedSearch && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {statusLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></span>
                  Yükleniyor...
                </span>
              ) : (
                <span><strong>{filteredTools.length}</strong> alet bulundu</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Gelişmiş Arama Sonuçları - Müsait Aletler */}
      {useAdvancedSearch && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Müsait Aletler (Sonraki 30 Gün)
          </h3>
          {!searchTerm ? (
            <p className="text-gray-500 text-center py-8">
              Müsait aletler arasında aramak için yukarıdaki arama kutusuna bir kelime yazın.
            </p>
          ) : advancedLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent mr-3"></span>
              <span className="text-gray-600">Müsait aletler aranıyor...</span>
            </div>
          ) : advancedSearchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedSearchResults.map(tool => {
                const isOwnTool = tool.owner_id === currentUserId;
                return (
                  <div key={tool.tool_id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-gray-800">{tool.tool_name}</p>
                    <p className="text-sm text-gray-500 mt-1">{tool.owner_name}</p>
                    {tool.category_name && (
                      <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {tool.category_name}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (!isOwnTool) {
                          // AvailableToolSearch'ü Tool formatına dönüştür
                          const convertedTool: Tool = {
                            tool_id: tool.tool_id,
                            tool_name: tool.tool_name,
                            user_id: tool.owner_id,
                            category_id: null,
                            created_at: new Date().toISOString(),
                          };
                          setSelectedTool(convertedTool);
                        }
                      }}
                      disabled={isOwnTool}
                      className={`w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isOwnTool
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isOwnTool ? 'Senin Aletin' : 'Kirala'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              "{searchTerm}" aramasına uygun müsait alet bulunmadı.
            </p>
          )}
        </div>
      )}

      {/* İlan Listesi - Sadece normal aramada */}
      {!useAdvancedSearch && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredTools.map(tool => {
          // Filtered data'dan owner bilgisi al (API zaten döndürüyor)
          const toolStatus = toolStatuses[tool.tool_id];
          // Type guard: user_id varsa Tool, yoksa ToolWithStatus
          const userId = 'user_id' in tool ? tool.user_id : toolStatus?.owner_id;
          const ownerName = toolStatus?.owner_name || (userId ? owners[userId]?.user_name : undefined);
          const ownerId = toolStatus?.owner_id || userId;
          const owner = userId ? owners[userId] : undefined;
          const createdAt = 'created_at' in tool ? tool.created_at : undefined;
          
          const isOwnTool = ownerId === currentUserId;
          // Basit kontrol: tool şu an kirada mı?
          const isCurrentlyRented = toolStatus?.status === 'Şu An Kirada';
          return (
            <div key={tool.tool_id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {/* Owner Bilgisi - Üst Kısım */}
              <div className="p-3 flex items-center gap-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {ownerName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {ownerName || `Kullanıcı #${ownerId}`}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{owner?.avg_scr?.toFixed(1) || '-'}</span>
                    {owner?.rev_cnt !== undefined && (
                      <span className="text-gray-400">({owner.rev_cnt} değerlendirme)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tool Görseli */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <img 
                  src={placeholderImages[tool.tool_id % placeholderImages.length]} 
                  alt={tool.tool_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm">
                  #{tool.tool_id}
                </div>
                {/* Durum Badge */}
                <div className="absolute top-3 right-3">
                  {renderStatusBadge(tool.tool_id)}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 line-clamp-2">{tool.tool_name}</h3>
                </div>
                
                <p className="text-xs text-gray-400 mb-3">
                  {toolStatus?.category_name ? (
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{toolStatus.category_name}</span>
                  ) : createdAt ? (
                    `Eklendi: ${new Date(createdAt).toLocaleDateString('tr-TR')}`
                  ) : null}
                </p>
                
                <div className="flex items-center gap-2 mt-4">
                  <button 
                    onClick={() => !isOwnTool && handleReserveClick(tool)}
                    disabled={isOwnTool}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isOwnTool
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isCurrentlyRented
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isOwnTool ? (
                      'Senin Aletin'
                    ) : isCurrentlyRented ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Müsait Günleri Gör
                      </>
                    ) : (
                      'Kirala'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredTools.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Hammer className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aradığınız kriterlere uygun alet bulunamadı.</p>
        </div>
      )}
      </>
      )}
    </div>
  );
}
