// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Crown, Users, Wrench, Calendar, Star, TrendingUp, 
  Activity, Shield, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Zap, Database, Layers, GitMerge, GitBranch
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  statisticsApi, 
  viewsApi,
  SystemStatisticsSummary, 
  AllActiveUsersStats,
  DualRoleUsersStats,
  LendersOnlyStats,
  RecentReservationView 
} from '../services/api';

// Tab tipi
type SetOperationTab = 'overview' | 'union' | 'intersect' | 'except';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<SystemStatisticsSummary | null>(null);
  const [activeUsers, setActiveUsers] = useState<AllActiveUsersStats[]>([]);
  const [dualRoleUsers, setDualRoleUsers] = useState<DualRoleUsersStats[]>([]);
  const [lendersOnly, setLendersOnly] = useState<LendersOnlyStats[]>([]);
  const [recentReservations, setRecentReservations] = useState<RecentReservationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSetTab, setActiveSetTab] = useState<SetOperationTab>('overview');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryData, usersData, dualRoleData, lendersOnlyData, reservationsData] = await Promise.all([
          statisticsApi.getSystemSummary(),
          statisticsApi.getAllActiveUsers(),
          statisticsApi.getDualRoleUsers(),
          statisticsApi.getLendersOnly(),
          viewsApi.getRecentReservations(),
        ]);
        setSummary(summaryData);
        setActiveUsers(usersData);
        setDualRoleUsers(dualRoleData);
        setLendersOnly(lendersOnlyData);
        setRecentReservations(reservationsData);
      } catch (err) {
        console.error('Admin dashboard veri yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
        <p>Muhtar paneli yükleniyor...</p>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Toplam Kullanıcı', 
      value: summary?.total_users || 0, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Toplam Alet', 
      value: summary?.total_tools || 0, 
      icon: Wrench, 
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      trend: '+8%',
      trendUp: true
    },
    { 
      label: 'Toplam Kiralama', 
      value: summary?.total_reservations || 0, 
      icon: Calendar, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
      trend: '+23%',
      trendUp: true
    },
    { 
      label: 'Toplam Değerlendirme', 
      value: summary?.total_reviews || 0, 
      icon: Star, 
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500',
      trend: '+5%',
      trendUp: true
    },
  ];

  // Activity type'ları grupla (hem İngilizce hem Türkçe değerleri kontrol et)
  const isBorrower = (type: string) => {
    const t = type.toLowerCase();
    return t === 'borrower' || t === 'kiracı' || t === 'kiraci' || t.includes('borrow');
  };
  
  const isLender = (type: string) => {
    const t = type.toLowerCase();
    return t === 'lender' || t === 'kiraya veren' || t === 'kiralayan' || t.includes('lend');
  };

  // Aktivite türlerine göre grupla
  const activityGroups = activeUsers.reduce((acc, user) => {
    const type = user.activity_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(user);
    return acc;
  }, {} as Record<string, typeof activeUsers>);

  // Unique kullanıcı sayısı (aynı kullanıcı hem kiracı hem kiraya veren olabilir)
  const uniqueUserIds = new Set(activeUsers.map(u => u.user_id));
  const uniqueUserCount = uniqueUserIds.size;

  // Unique kiracı ve kiraya veren sayıları
  const borrowerUserIds = new Set(activeUsers.filter(u => isBorrower(u.activity_type)).map(u => u.user_id));
  const lenderUserIds = new Set(activeUsers.filter(u => isLender(u.activity_type)).map(u => u.user_id));
  const borrowerCount = borrowerUserIds.size;
  const lenderCount = lenderUserIds.size;

  // Aktivite türü için Türkçe etiket
  const getActivityLabel = (type: string) => {
    if (isBorrower(type)) return 'Kiracı';
    if (isLender(type)) return 'Kiraya Veren';
    return type;
  };

  // Aktivite türü için renk
  const getActivityColor = (type: string) => {
    if (isBorrower(type)) return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
    if (isLender(type)) return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Crown className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Muhtar Paneli
              <Zap className="w-6 h-6 text-yellow-200" />
            </h1>
            <p className="text-amber-100 mt-1">Mahalle yönetim merkezi</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString('tr-TR')}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">Aktif Kiracılar</span>
          </div>
          <div className="text-4xl font-bold">{borrowerCount}</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-200" />
            <span className="text-emerald-200 text-sm font-medium">Aktif Kiraya Verenler</span>
          </div>
          <div className="text-4xl font-bold">{lenderCount}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-5 h-5 text-purple-200" />
            <span className="text-purple-200 text-sm font-medium">Ort. Alet/Kullanıcı</span>
          </div>
          <div className="text-4xl font-bold">
            {summary?.avg_tools_per_owner?.toFixed(1) || '0'}
          </div>
        </div>
      </div>

      {/* Kullanıcı Aktivite Türü - Pie Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Kullanıcı Aktivite Türü
        </h3>
        
        {Object.keys(activityGroups).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(activityGroups).map(([type, users]) => {
                      // Unique kullanıcı sayısı
                      const uniqueUsers = users.filter((user, index, self) => 
                        index === self.findIndex(u => u.user_id === user.user_id)
                      );
                      return {
                        name: getActivityLabel(type),
                        value: uniqueUsers.length,
                        type: type,
                      };
                    })}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {Object.entries(activityGroups).map(([type], index) => {
                      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
                      const colorIndex = isBorrower(type) ? 0 : isLender(type) ? 1 : index % colors.length;
                      return <Cell key={`cell-${index}`} fill={colors[colorIndex]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} kullanıcı`, 'Sayı']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Details */}
            <div className="space-y-3">
              {Object.entries(activityGroups).map(([type, users]) => {
                const colors = getActivityColor(type);
                // Unique kullanıcıları hesapla
                const uniqueUsersInType = users.filter((user, index, self) => 
                  index === self.findIndex(u => u.user_id === user.user_id)
                );
                const uniqueCount = uniqueUsersInType.length;
                const percentage = ((uniqueCount / uniqueUserCount) * 100).toFixed(1);
                return (
                  <div key={type} className={`${colors.bg} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 ${colors.dot} rounded-full`}></div>
                        <span className={`font-semibold ${colors.text}`}>{getActivityLabel(type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${colors.text}`}>{uniqueCount}</span>
                        <span className={`text-sm ${colors.text} opacity-70`}>({percentage}%)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {uniqueUsersInType.slice(0, 4).map((user, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-600"
                        >
                          {user.user_name}
                        </span>
                      ))}
                      {uniqueCount > 4 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{uniqueCount - 4} kişi daha
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Toplam */}
              <div className="bg-gray-100 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Toplam Aktif Kullanıcı</span>
                  <span className="text-2xl font-bold text-gray-800">{uniqueUserCount}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <p>Henüz aktivite verisi yok</p>
          </div>
        )}
      </div>

      {/* Recent Reservations & Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Kiralamalar */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Son Kiralamalar
          </h3>
          <div className="space-y-3">
            {recentReservations.slice(0, 6).map((res, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{res.tool_name}</p>
                    <p className="text-xs text-gray-400">{res.borrower_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(res.start_t).toLocaleDateString('tr-TR')}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    new Date(res.end_t) > new Date() 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {new Date(res.end_t) > new Date() ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Aktif
                      </>
                    ) : 'Tamamlandı'}
                  </span>
                </div>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <p className="text-center text-gray-400 py-4">Henüz kiralama yok</p>
            )}
          </div>
        </div>

        {/* Aktif Kullanıcılar */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Aktif Kullanıcılar
          </h3>
          <div className="space-y-3">
            {(() => {
              // Unique kullanıcıları ve rollerini hesapla
              const userRolesMap = new Map<number, { user_name: string; isBorrower: boolean; isLender: boolean }>();
              activeUsers.forEach(user => {
                const existing = userRolesMap.get(user.user_id);
                if (existing) {
                  if (isBorrower(user.activity_type)) existing.isBorrower = true;
                  if (isLender(user.activity_type)) existing.isLender = true;
                } else {
                  userRolesMap.set(user.user_id, {
                    user_name: user.user_name,
                    isBorrower: isBorrower(user.activity_type),
                    isLender: isLender(user.activity_type),
                  });
                }
              });
              
              return Array.from(userRolesMap.entries()).slice(0, 8).map(([userId, userData]) => {
                const hasBothRoles = userData.isBorrower && userData.isLender;
                return (
                  <div 
                    key={userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        hasBothRoles 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                          : userData.isLender 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {userData.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block">{userData.user_name}</span>
                        <span className="text-xs text-gray-400">#{userId}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {hasBothRoles ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                          Kiracı + Kiraya Veren
                        </span>
                      ) : (
                        <>
                          {userData.isBorrower && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                              Kiracı
                            </span>
                          )}
                          {userData.isLender && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
                              Kiraya Veren
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            {uniqueUserCount === 0 && (
              <p className="text-center text-gray-400 py-4">Henüz aktif kullanıcı yok</p>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          Sistem Durumu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-700">API Bağlantısı</p>
              <p className="text-sm text-emerald-600">Çalışıyor</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-700">Veritabanı</p>
              <p className="text-sm text-emerald-600">Sağlıklı</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-700">Bekleyen İşlem</p>
              <p className="text-sm text-amber-600">{recentReservations.filter(r => new Date(r.end_t) > new Date()).length} aktif kiralama</p>
            </div>
          </div>
        </div>
      </div>

      {/* Set Operations - UNION, INTERSECT, EXCEPT */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          SQL Set Operasyonları
        </h3>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 p-2 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveSetTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSetTab === 'overview'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveSetTab('union')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSetTab === 'union'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-blue-50'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            UNION
          </button>
          <button
            onClick={() => setActiveSetTab('intersect')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSetTab === 'intersect'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-purple-50'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            INTERSECT
          </button>
          <button
            onClick={() => setActiveSetTab('except')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSetTab === 'except'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            <GitBranch className="w-4 h-4 rotate-180" />
            EXCEPT
          </button>
        </div>

        {/* Tab Contents */}
        {activeSetTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <GitMerge className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">UNION</span>
              </div>
              <p className="text-3xl font-bold">{activeUsers.length}</p>
              <p className="text-blue-200 text-sm mt-1">Tüm Aktif Kullanıcı</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-5 h-5 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">INTERSECT</span>
              </div>
              <p className="text-3xl font-bold">{dualRoleUsers.length}</p>
              <p className="text-purple-200 text-sm mt-1">Çift Rol Kullanıcı</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-5 h-5 text-orange-200 rotate-180" />
                <span className="text-orange-100 text-sm font-medium">EXCEPT</span>
              </div>
              <p className="text-3xl font-bold">{lendersOnly.length}</p>
              <p className="text-orange-200 text-sm mt-1">Sadece Kiraya Veren</p>
            </div>
          </div>
        )}

        {activeSetTab === 'union' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              <h4 className="font-semibold text-blue-900 mb-1">UNION Operatörü</h4>
              <p className="text-blue-700 text-sm">
                RESERVATION tablosunda (kiracı) VEYA TOOL tablosunda (kiraya veren) olan TÜM kullanıcılar.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-blue-500 text-white font-medium">
                Toplam {activeUsers.length} Aktif Kullanıcı
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Kullanıcı</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Aktivite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user) => (
                      <tr key={`${user.user_id}-${user.activity_type}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-500">#{user.user_id}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">{user.user_name}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isBorrower(user.activity_type) 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {getActivityLabel(user.activity_type)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSetTab === 'intersect' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-xl">
              <h4 className="font-semibold text-purple-900 mb-1">INTERSECT Operatörü</h4>
              <p className="text-purple-700 text-sm">
                HEM RESERVATION tablosunda HEM DE TOOL tablosunda olan kullanıcılar. Yani hem kiralayan hem kiraya veren çift rol sahipleri.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-purple-500 text-white font-medium">
                Toplam {dualRoleUsers.length} Çift Rol Kullanıcı
              </div>
              <div className="max-h-72 overflow-y-auto">
                {dualRoleUsers.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Kullanıcı</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dualRoleUsers.map((user) => (
                        <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-500">#{user.user_id}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">{user.user_name}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                              Kiracı + Kiraya Veren
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-400 py-8">Çift rol kullanıcı bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSetTab === 'except' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
              <h4 className="font-semibold text-orange-900 mb-1">EXCEPT Operatörü</h4>
              <p className="text-orange-700 text-sm">
                TOOL tablosunda OLAN ama RESERVATION tablosunda OLMAYAN kullanıcılar. Yani sadece alet paylaşan ama hiç kiralamayan kullanıcılar.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-orange-500 text-white font-medium">
                Toplam {lendersOnly.length} Sadece Kiraya Veren
              </div>
              <div className="max-h-72 overflow-y-auto">
                {lendersOnly.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Kullanıcı</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lendersOnly.map((user) => (
                        <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-500">#{user.user_id}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">{user.user_name}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
                              Sadece Kiraya Veren
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-400 py-8">Sadece kiraya veren kullanıcı bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

