// src/pages/Leaderboard.tsx
import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, TrendingUp, Star, Users } from 'lucide-react';
import { analyticsApi, viewsApi } from '../services/api';

// Local types that match actual backend response
interface TopUser {
  user_id: number;
  user_name: string;
  avg_score: number;
  review_count: number;
}

interface ActiveUser {
  user_id: number;
  user_name: string;
  activity_type: string;
}

interface DualRoleUser {
  user_id: number;
  user_name: string;
}

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [allActiveUsers, setAllActiveUsers] = useState<ActiveUser[]>([]);
  const [dualRoleUsers, setDualRoleUsers] = useState<DualRoleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'top' | 'active' | 'dual'>('top');

  // Verileri yükle
  useEffect(() => {
    const loadLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [top, active, dual] = await Promise.all([
          analyticsApi.getTopUsers().catch(err => {
            console.error('Top users error:', err);
            return [];
          }),
          viewsApi.getAllActiveUsers().catch(err => {
            console.error('Active users error:', err);
            return [];
          }),
          viewsApi.getDualRoleUsers().catch(err => {
            console.error('Dual role users error:', err);
            return [];
          }),
        ]);
        setTopUsers(top || []);
        setAllActiveUsers(active || []);
        setDualRoleUsers(dual || []);
      } catch (err) {
        console.error('Leaderboard verisi yükleme hatası:', err);
        setError('Liderlik tablosu verileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboardData();
  }, []);

  // Rozet render et
  const renderMedal = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-gray-400 font-bold">{rank + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p>Liderlik tablosu yükleniyor...</p>
      </div>
    );
  }

  const groupedUsers = Array.from(
  allActiveUsers.reduce((map, user) => {
    if (!map.has(user.user_id)) {
      // Kullanıcı ilk kez ekleniyorsa
      map.set(user.user_id, { 
        ...user, 
        all_activities: [user.activity_type] // Aktiviteleri dizi yapıyoruz
      });
    } else {
      // Kullanıcı zaten varsa, yeni aktivite tipini listesine ekle
      const existingUser = map.get(user.user_id);
      if (!existingUser.all_activities.includes(user.activity_type)) {
        existingUser.all_activities.push(user.activity_type);
      }
    }
    return map;
  }, new Map()).values()
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Başlık */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Liderlik Tablosu</h1>
        </div>
        <p className="text-sm opacity-90">En güvenilir ve aktif topluluk üyelerini keşfedin</p>
      </div>

      {/* En İyi Kullanıcılar */}
      {(
        <div className="space-y-3">
          {topUsers.length > 0 ? (
            topUsers.map((user, index) => (
              <div
                key={user.user_id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 transition-transform hover:shadow-md ${
                  index === 0
                    ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-white'
                    : index === 1
                      ? 'border-gray-400'
                      : 'border-orange-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    {renderMedal(index)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{user.user_name}</h3>
                    <p className="text-xs text-gray-500">
                      {user.review_count} değerlendirme alıyor
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-2xl font-bold text-blue-600">{(user.avg_score || 0).toFixed(1)}</span>
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </div>
                    <p className="text-xs text-gray-500">Güvenlik Skoru</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${((user.avg_score || 0) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Henüz veri bulunmamaktadır</p>
            </div>
          )}
        </div>
      )}
      
      {/* Aktif Üyeler */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {groupedUsers.length > 0 ? (
            groupedUsers.map((user) => (
              <div
                key={user.user_id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-blue-100"
              >
                <div className="flex items-center gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {user.user_name.charAt(0).toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{user.user_name}</h3>
                    
                    {/* Boncuklar (Badges) Alanı */}
                    <div className="flex gap-2 flex-wrap mt-1">
                      
                      {/* Kiracı (Borrower) Kontrolü */}
                      {user.all_activities.includes('Borrower') && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          <span>🟢</span>
                          Kiracı
                        </span>
                      )}

                      {/* Kiralayan (Lender) Kontrolü */}
                      {/* Not: Veritabanınızda 'Lender' yerine başka bir keyword varsa burayı güncelleyin */}
                      {user.all_activities.includes('Lender') && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          <span>🟣</span>
                          Kiralayan
                        </span>
                      )}
                      
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
      <div className="text-center py-8 text-gray-400">
                    <Flame className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Henüz veri bulunmamaktadır</p>
                  </div>
                )}
        </div>
      )}  

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-1 bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-center border-l border-r border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{new Set(allActiveUsers.map((user) => user.user_id)).size}</div>
          <p className="text-xs text-gray-600">Aktif Üye</p>
        </div>
      </div>
    </div>
  );
}