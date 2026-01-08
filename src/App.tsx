// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Home, Calendar, User as UserIcon, MapPin, PlusCircle, CheckCircle, AlertCircle, LogOut, Trophy, Crown } from 'lucide-react';

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
  userApi, 
  reservationApi 
} from './services/api';

// Sekme isimleri için bir tip tanımlıyoruz
type Tab = 'home' | 'reservations' | 'add' | 'leaderboard' | 'profile' | 'admin';

// Bildirim yapısı için interface
interface Notification {
  message: string;
  type: 'success' | 'info' | 'error';
}

// LocalStorage key
const AUTH_STORAGE_KEY = 'toolshare_user';

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
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [showNotification, setShowNotification] = useState<Notification | null>(null);
  
  // Kullanıcı verileri
  const [userTools, setUserTools] = useState<Tool[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [userLoading, setUserLoading] = useState(false);

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
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
      <Header activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />

      <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

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
