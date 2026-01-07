// src/pages/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { Star, ShieldCheck, Clock, User as UserIcon, Wrench, LogOut, TrendingUp, Crown } from 'lucide-react';
import { ProfileMenuItem } from '../components/UI';
import { User, Tool, Reservation, analyticsApi, LendingPerformance } from '../services/api';

// Props için arayüz tanımlıyoruz
interface UserProfileProps {
  user: User | null;
  userTools: Tool[];
  userReservations: Reservation[];
  loading?: boolean;
  onLogout?: () => void;
  onAdminDashboard?: () => void;
}

export default function UserProfile({ user, userTools, userReservations, loading = false, onLogout, onAdminDashboard }: UserProfileProps) {
  const [lenderPerformance, setLenderPerformance] = useState<LendingPerformance[]>([]);

  // Alet performans verilerini yükle
  useEffect(() => {
    if (!user) return;

    const loadPerformance = async () => {
      try {
        const performance = await analyticsApi.getLenderPerformance(user.user_id, 5);
        setLenderPerformance(performance);
      } catch (err) {
        console.error('Performans yükleme hatası:', err);
      }
    };

    loadPerformance();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p>Profil yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-2xl shadow-sm p-8">
        <UserIcon className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-600">Kullanıcı bulunamadı</h3>
        <p className="text-sm text-center mt-2">Lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profil Kartı */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl border-2 border-white/30 backdrop-blur-sm font-bold">
            {user.user_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{user.user_name}</h2>
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 text-xs font-bold rounded-full shadow-lg animate-pulse">
                  <Crown className="w-3.5 h-3.5" />
                  MUHTAR
                </span>
              )}
            </div>
            <p className="text-blue-100 text-sm">
              Üyelik: {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <div className="text-center border-r border-white/10">
            <div className="text-3xl font-bold flex items-center justify-center gap-1">
              {user.avg_scr.toFixed(1)} 
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="text-xs text-blue-200 mt-1">Güvenlik Skoru</div>
          </div>
          <div className="text-center border-r border-white/10">
            <div className="text-3xl font-bold">{userTools.length}</div>
            <div className="text-xs text-blue-200 mt-1">Paylaşılan Alet</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{user.rev_cnt}</div>
            <div className="text-xs text-blue-200 mt-1">Değerlendirme</div>
          </div>
        </div>
      </div>

      {/* Muhtar Paneli Butonu - Sadece Admin için */}
      {user.role === 'admin' && onAdminDashboard && (
        <button
          onClick={onAdminDashboard}
          className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <Crown className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg">Muhtar Paneli</span>
          <span className="text-amber-200 text-sm">→</span>
        </button>
      )}

      {/* Kullanıcı Aletleri */}
      {userTools.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Paylaştığım Aletler
          </h3>
          <div className="space-y-2">
            {userTools.slice(0, 5).map(tool => (
              <div 
                key={tool.tool_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-700">{tool.tool_name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  #{tool.tool_id}
                </span>
              </div>
            ))}
            {userTools.length > 5 && (
              <p className="text-center text-sm text-gray-400 pt-2">
                +{userTools.length - 5} alet daha
              </p>
            )}
          </div>
        </div>
      )}

      {/* Aletlerim Performansı - Güzelleştirilmiş */}
      {lenderPerformance.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Aletlerim Performansı
          </h3>
          <div className="space-y-4">
            {lenderPerformance.slice(0, 5).map(perf => {
              // Yüzdelik hesapla (5 yıldız oranı)
              const fiveStarPercentage = perf.total_lends > 0 
                ? Math.round((perf.five_star_count / perf.total_lends) * 100) 
                : 0;
              
              return (
                <div key={perf.tool_id} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  {/* Alet Adı ve Puan */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-800">{perf.tool_name}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-yellow-700">{perf.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {/* İstatistikler */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">{perf.total_lends}</div>
                      <div className="text-xs text-gray-500 mt-1">Toplam Kiralama</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-2xl font-bold text-green-600">{perf.five_star_count}</div>
                      <div className="text-xs text-gray-500 mt-1">5 Yıldız</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">%{fiveStarPercentage}</div>
                      <div className="text-xs text-gray-500 mt-1">Memnuniyet</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Memnuniyet Oranı</span>
                      <span className="font-medium text-green-600">{fiveStarPercentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${fiveStarPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menü Listesi */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <ProfileMenuItem 
          icon={<ShieldCheck className="text-green-500" />} 
          label="Kimlik Doğrulama" 
          status="Doğrulandı" 
        />
        <ProfileMenuItem 
          icon={<Star className="text-yellow-500" />} 
          label="Değerlendirmelerim" 
        />
        <ProfileMenuItem 
          icon={<Clock className="text-blue-500" />} 
          label="Geçmiş Kiralamalar" 
        />
        <ProfileMenuItem 
          icon={<UserIcon className="text-purple-500" />} 
          label="Hesap Ayarları" 
        />
      </div>

      {/* Çıkış Butonu */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Çıkış Yap</span>
        </button>
      )}
    </div>
  );
}
