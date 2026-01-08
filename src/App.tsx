// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Home, Calendar, User as UserIcon, PlusCircle, CheckCircle, AlertCircle, Trophy, Activity, Clock, Wrench, Heart, Github, Mail, X, ChevronLeft } from 'lucide-react';

// Bileşenleri İçe Aktarma
import { Header, NavButton } from './components/UI';
import Marketplace from './pages/Marketplace';
import AddToolForm from './pages/AddToolForm';
import Reservations from './pages/Reservations';
import UserProfile from './pages/UserProfile';
import Leaderboard from './pages/Leaderboard';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';

// Hook ve API'leri İçe Aktarma
import { useTools } from './hooks/useTools';
import { 
  Tool, 
  User, 
  Reservation, 
  ReservationCreate,
  RecentReservationView,
  userApi, 
  reservationApi,
  viewsApi
} from './services/api';

// Sekme isimleri için bir tip tanımlıyoruz
type Tab = 'home' | 'reservations' | 'add' | 'leaderboard' | 'profile' | 'admin';

// Bildirim yapısı için interface
interface Notification {
  message: string;
  type: 'success' | 'info' | 'error';
}

// LocalStorage keys
const AUTH_STORAGE_KEY = 'toolshare_user';
const TAB_STORAGE_KEY = 'toolshare_active_tab';

export default function App() {
  // Auth state - localStorage'dan başlat
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored !== null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  // useTools hook'u ile tool verilerini yönet
  const { tools, loading: toolsLoading, error: toolsError, fetchTools } = useTools();
  
  // State tanımlamaları
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    // Geçerli bir tab değeri mi kontrol et
    const validTabs: Tab[] = ['home', 'reservations', 'add', 'leaderboard', 'profile', 'admin'];
    if (stored && validTabs.includes(stored as Tab)) {
      return stored as Tab;
    }
    return 'home';
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [showNotification, setShowNotification] = useState<Notification | null>(null);
  
  // Kullanıcı verileri
  const [userTools, setUserTools] = useState<Tool[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  
  // Son aktivite verileri
  const [recentActivity, setRecentActivity] = useState<RecentReservationView[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false);

  // Login handler
  const handleLoginSuccess = (user: User) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUserTools([]);
    setMyReservations([]);
    setActiveTab('home');
  };

  // Kullanıcı verilerini yükle (sadece giriş yapılmışsa)
  useEffect(() => {
    if (!currentUser) return;

    const loadUserData = async () => {
      setUserLoading(true);
      try {
        const [tools, reservations] = await Promise.all([
          userApi.getTools(currentUser.user_id),
          userApi.getReservations(currentUser.user_id),
        ]);
        setUserTools(tools);
        setMyReservations(reservations);
      } catch (err) {
        console.error('Kullanıcı verileri yüklenemedi:', err);
      } finally {
        setUserLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  // Son aktiviteleri yükle
  useEffect(() => {
    if (!currentUser) return;

    const loadRecentActivity = async () => {
      setActivityLoading(true);
      try {
        const activity = await viewsApi.getRecentReservations();
        setRecentActivity(activity.slice(0, 5));
      } catch (err) {
        console.error('Son aktiviteler yüklenemedi:', err);
      } finally {
        setActivityLoading(false);
      }
    };

    loadRecentActivity();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(loadRecentActivity, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Sayfa değiştiğinde aktivite panelini kapat ve tab'ı kaydet
  useEffect(() => {
    setActivitySidebarOpen(false);
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Yan panel açıkken kaydırmayı kapat
  useEffect(() => {
    if (activitySidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = '';
    };
  }, [activitySidebarOpen]);

  // Bildirim Fonksiyonu
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  // İşlem Fonksiyonları
  const handleAddTool = (newTool: Tool) => {
    // Yeni alet eklendiğinde listeyi güncelle
    fetchTools();
    setUserTools(prev => [newTool, ...prev]);
    triggerNotification('Alet başarıyla vitrine eklendi!');
    setActiveTab('home');
  };

  const handleReserve = async (tool: Tool, startDate: Date, endDate: Date) => {
    if (!currentUser) return;
    
    try {
      const reservationData: ReservationCreate = {
        user_id: currentUser.user_id,
        tool_id: tool.tool_id,
        start_t: startDate.toISOString(),
        end_t: endDate.toISOString(),
      };

      const newReservation = await reservationApi.create(reservationData);
      
      // Mevcut rezervasyonu güncelle veya yeni ekle
      setMyReservations(prev => {
        const existingIndex = prev.findIndex(r => r.reservation_id === newReservation.reservation_id);
        if (existingIndex >= 0) {
          // Mevcut rezervasyon güncellendi (uzatma)
          const updated = [...prev];
          updated[existingIndex] = newReservation;
          return updated;
        }
        // Yeni rezervasyon
        return [newReservation, ...prev];
      });
      
      triggerNotification(`${tool.tool_name} için rezervasyon kaydedildi!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rezervasyon yapılırken bir hata oluştu';
      triggerNotification(errorMessage.toString(), 'error');
      //throw err; // Modal'ın hata durumunu görebilmesi için
    }
  };

  // Rezerve edilmiş tool ID'lerini hesapla
  const reservedToolIds = myReservations.map(r => r.tool_id);

  // İçerik Yönlendirme
  const renderContent = () => {
    if (!currentUser) return null;
    
    switch (activeTab) {
      case 'home':
        return (
          <Marketplace 
            tools={tools}
            loading={toolsLoading}
            error={toolsError}
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onReserve={handleReserve}
            currentUserId={currentUser.user_id}
            currentUserName={currentUser.user_name}
            reservedToolIds={reservedToolIds}
          />
        );
      case 'add':
        return (
          <AddToolForm 
            userId={currentUser.user_id}
            onAdd={handleAddTool} 
            onCancel={() => setActiveTab('home')} 
          />
        );
      case 'reservations':
        return (
          <Reservations 
            reservations={myReservations}
            loading={userLoading}
            currentUserId={currentUser.user_id}
            onReservationFinished={(updatedReservation) => {
              // Rezervasyonu güncelle (bitiş tarihi bugüne ayarlanmış olacak)
              setMyReservations(prev => 
                prev.map(r => 
                  r.reservation_id === updatedReservation.reservation_id 
                    ? updatedReservation 
                    : r
                )
              );
            }}
          />
        );
      case 'leaderboard':
        return <Leaderboard />;
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminDashboard /> : null;
      case 'profile':
        return (
          <UserProfile 
            user={currentUser}
            userTools={userTools}
            userReservations={myReservations}
            loading={userLoading}
            onLogout={handleLogout}
            onAdminDashboard={currentUser?.role === 'admin' ? () => setActiveTab('admin') : undefined}
          />
        );
      default:
        return (
          <Marketplace 
            tools={tools}
            loading={toolsLoading}
            error={toolsError}
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
            onReserve={handleReserve}
            currentUserId={currentUser.user_id}
            currentUserName={currentUser.user_name}
            reservedToolIds={reservedToolIds}
          />
        );
    }
  };

  // Bildirim renkleri
  const notificationColors = {
    success: 'bg-gray-900 text-green-400',
    info: 'bg-blue-900 text-blue-200',
    error: 'bg-red-900 text-red-200',
  };

  const NotificationIcon = showNotification?.type === 'error' ? AlertCircle : CheckCircle;

  // Giriş yapılmamışsa AuthPage göster
  if (!isAuthenticated || !currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Ana İçerik */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>

      </div>

      {/* Sağdan Açılır Panel - Son Aktivite (Sadece Vitrin sayfasında) */}
      {activeTab === 'home' && (
        <>
          {/* Toggle Butonu */}
          <button
            onClick={() => setActivitySidebarOpen(true)}
            className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-l-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
              activitySidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Activity className="w-5 h-5" />
              <ChevronLeft className="w-4 h-4" />
            </div>
          </button>

          {/* Overlay - Tüm ekranlarda görünür */}
          {activitySidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setActivitySidebarOpen(false)}
            />
          )}

          {/* Slide-in Panel */}
          <aside 
            className={`fixed right-0 top-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
              activitySidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Son Aktiviteler</h2>
                </div>
                <button
                  onClick={() => setActivitySidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activityLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
                    <p className="text-sm">Yükleniyor...</p>
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div 
                        key={activity.reservation_id} 
                        className={`group relative bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 ${
                          activitySidebarOpen ? 'animate-in slide-in-from-right' : ''
                        }`}
                        style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
                      >
                        {/* Üst kısım - Kiralayan ve alet */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                            {activity.borrower_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-semibold text-gray-800">{activity.borrower_name}</span>
                              <span className="text-gray-500"> kiraladı</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-700 truncate">{activity.tool_name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Alt kısım - Tarih bilgisi */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(activity.start_t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                            <span className="text-gray-300">→</span>
                            <span>{new Date(activity.end_t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            activity.status === 'Aktif' 
                              ? 'bg-green-100 text-green-700'
                              : activity.status === 'Beklemede'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {activity.status}
                          </span>
                        </div>

                        {/* Sahip bilgisi */}
                        <p className="mt-2 text-xs text-gray-400">
                          <span className="text-gray-500">{activity.owner_name}</span>'den
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Henüz aktivite yok</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {recentActivity.length > 0 && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">Son 5 rezervasyon gösteriliyor</p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 lg:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo ve Açıklama */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ToolShare</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Komşularınızla alet paylaşımı platformu. İhtiyacınız olan aleti kolayca bulun veya kullanmadığınız aletlerinizi paylaşarak topluma katkıda bulunun.
              </p>
            </div>

            {/* Hızlı Linkler */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Hızlı Linkler</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setActiveTab('home')} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Vitrin
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('add')} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Alet Paylaş
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('leaderboard')} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Liderlik Tablosu
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Profilim
                  </button>
                </li>
              </ul>
            </div>

            {/* İletişim */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">İletişim</h3>
              <div className="space-y-3">
                <a 
                  href="mailto:info@toolshare.com" 
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  info@toolshare.com
                </a>
                <a 
                  href="https://github.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Alt Footer */}
          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} ToolShare. Tüm hakları saklıdır.
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> in Turkey
            </p>
          </div>
        </div>
      </footer>

      {/* Bildirim Toast */}
      {showNotification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 ${
          notificationColors[showNotification.type]
        } px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in zoom-in duration-300`}>
          <NotificationIcon className="w-5 h-5" />
          <span>{showNotification.message}</span>
        </div>
      )}

      {/* Alt Navigasyon - Mobil'de görünür, masaüstünde gizli */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 lg:hidden">
        <div className="max-w-5xl mx-auto flex justify-around py-2">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home size={24} />} 
            label="Vitrin" 
          />
          <NavButton 
            active={activeTab === 'reservations'} 
            onClick={() => setActiveTab('reservations')} 
            icon={<Calendar size={24} />} 
            label="Kiralama" 
          />
          <div className="relative -top-4">
            <button 
              onClick={() => setActiveTab('add')}
              className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 active:scale-95"
            >
              <PlusCircle size={28} />
            </button>
          </div>
          <NavButton 
            active={activeTab === 'leaderboard'} 
            onClick={() => setActiveTab('leaderboard')} 
            icon={<Trophy size={24} />} 
            label="Liderlik" 
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<UserIcon size={24} />} 
            label="Profil" 
          />
        </div>
      </nav>
    </div>
  );
}
