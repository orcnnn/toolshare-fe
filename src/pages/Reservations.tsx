// src/pages/Reservations.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, Wrench, Clock, CheckCircle, XCircle, Star, X } from 'lucide-react';
// YENİ: 'User' tipini de import ettik
import { Reservation, Tool, User, toolApi, userApi, reservationApi } from '../services/api';
import ReviewModal from '../components/ReviewModal';

// Props arayüzü
interface ReservationsProps {
  reservations: Reservation[];
  loading?: boolean;
  currentUserId?: number;
  onReservationFinished?: (reservation: Reservation) => void;
}

// Tool cache'i için tip
type ToolCache = Record<number, Tool>;
// YENİ: Owner (Kullanıcı) cache'i için tip
type OwnerCache = Record<number, User>;

// Review modal state için interface
interface ReviewModalState {
  isOpen: boolean;
  reservationId: number;
  toolName: string;
  ownerName: string;
  ownerId: number;
}

export default function Reservations({ reservations, loading = false, currentUserId, onReservationFinished }: ReservationsProps) {
  const [tools, setTools] = useState<ToolCache>({});
  // YENİ: Sahiplerin isimlerini tutacak state
  const [owners, setOwners] = useState<OwnerCache>({});
  
  // reservation_id -> score mapping
  const [reviewedReservations, setReviewedReservations] = useState<Map<number, number>>(new Map());
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    isOpen: false,
    reservationId: 0,
    toolName: '',
    ownerName: '',
    ownerId: 0,
  });
  // Tamamlama işlemi için loading state
  const [finishingReservation, setFinishingReservation] = useState<number | null>(null);
  // İptal işlemi için loading state
  const [cancellingReservation, setCancellingReservation] = useState<number | null>(null);

  // Kullanıcının yaptığı değerlendirmeleri yükle
  useEffect(() => {
    if (!currentUserId) return;

    const loadSubmittedReviews = async () => {
      try {
        const reviews = await userApi.getSubmittedReviews(currentUserId);
        const reviewMap = new Map<number, number>();
        reviews.forEach(review => {
          reviewMap.set(review.reservation_id, review.score);
        });
        setReviewedReservations(reviewMap);
      } catch (err) {
        console.error('Değerlendirmeler yüklenemedi:', err);
      }
    };

    loadSubmittedReviews();
  }, [currentUserId]);

  // Review modal'ı aç
  const openReviewModal = (reservationId: number, toolName: string, ownerName: string, ownerId: number) => {
    setReviewModal({
      isOpen: true,
      reservationId,
      toolName,
      ownerName,
      ownerId,
    });
  };

  // Review modal'ı kapat
  const closeReviewModal = () => {
    setReviewModal(prev => ({ ...prev, isOpen: false }));
  };

  // Review başarılı olduğunda
  const handleReviewSuccess = (score: number) => {
    setReviewedReservations(prev => new Map(prev).set(reviewModal.reservationId, score));
  };

  // Rezervasyonu erken tamamla
  const handleFinishReservation = async (reservationId: number) => {
    setFinishingReservation(reservationId);
    try {
      const updatedReservation = await reservationApi.finish(reservationId);
      onReservationFinished?.(updatedReservation);
    } catch (err) {
      console.error('Rezervasyon tamamlama hatası:', err);
      alert('Rezervasyon tamamlanırken bir hata oluştu.');
    } finally {
      setFinishingReservation(null);
    }
  };

  // Beklemedeki rezervasyonu iptal et
  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
    
    setCancellingReservation(reservationId);
    try {
      await reservationApi.cancel(reservationId);
      // Sayfa yenilenerek güncel liste gösterilsin
      window.location.reload();
    } catch (err: any) {
      console.error('Rezervasyon iptal hatası:', err);
      alert(err.message || 'Rezervasyon iptal edilirken bir hata oluştu.');
      setCancellingReservation(null);
    }
  };

  // 1. Rezervasyonlardaki tool bilgilerini yükle
  useEffect(() => {
    const loadTools = async () => {
      const uniqueToolIds = [...new Set(reservations.map(r => r.tool_id))];
      const newTools: ToolCache = {};
      
      await Promise.all(
        uniqueToolIds.map(async (toolId) => {
          if (!tools[toolId]) {
            try {
              const tool = await toolApi.getById(toolId);
              newTools[toolId] = tool;
            } catch (err) {
              console.error(`Tool ${toolId} yüklenemedi:`, err);
            }
          }
        })
      );
      
      if (Object.keys(newTools).length > 0) {
        setTools(prev => ({ ...prev, ...newTools }));
      }
    };

    if (reservations.length > 0) {
      loadTools();
    }
  }, [reservations]); // tools dependency'den çıkarıldı, loop olmasın diye

  // YENİ: 2. Tools yüklendikten sonra sahiplerini (isimlerini) yükle
  useEffect(() => {
    const loadOwners = async () => {
      const loadedTools = Object.values(tools);
      if (loadedTools.length === 0) return;

      // Tool'lardan user_id'leri topla
      const uniqueOwnerIds = [...new Set(loadedTools.map(t => t.user_id))];
      
      // Henüz yüklenmemiş olanları bul
      const idsToFetch = uniqueOwnerIds.filter(id => !owners[id]);
      
      if (idsToFetch.length === 0) return;

      const newOwners: OwnerCache = {};
      
      await Promise.all(
        idsToFetch.map(async (userId) => {
          try {
            const user = await userApi.getById(userId);
            newOwners[userId] = user;
          } catch (err) {
            console.error(`User ${userId} yüklenemedi:`, err);
          }
        })
      );
      
      if (Object.keys(newOwners).length > 0) {
        setOwners(prev => ({ ...prev, ...newOwners }));
      }
    };

    loadOwners();
  }, [tools]); // tools değiştiğinde çalışır

  // Rezervasyon durumunu belirle
  const getReservationStatus = (reservation: Reservation) => {
    const now = new Date();
    const startDate = new Date(reservation.start_t);
    const endDate = new Date(reservation.end_t);

    if (now < startDate) {
      return { label: 'Beklemede', color: 'yellow', icon: Clock };
    } else if (now >= startDate && now <= endDate) {
      return { label: 'Aktif', color: 'green', icon: CheckCircle };
    } else {
      return { label: 'Tamamlandı', color: 'gray', icon: XCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p>Rezervasyonlar yükleniyor...</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-2xl shadow-sm p-8">
        <Calendar className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-600">Henüz kiralama yapmadınız</h3>
        <p className="text-sm text-center mt-2">İhtiyacınız olan aletleri vitrinde bulabilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">Rezervasyonlarım</h2>

      {/* Rezervasyon Listesi */}
      <div className="space-y-4">
        {reservations.map((reservation) => {
          const tool = tools[reservation.tool_id];
          // YENİ: Sahibin bilgisini al
          const owner = tool ? owners[tool.user_id] : null;
          
          const status = getReservationStatus(reservation);
          const StatusIcon = status.icon;

            const colorClasses = {
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-400',
            green: 'bg-green-100 text-green-700 border-green-400',
            gray: 'bg-gray-100 text-gray-600 border-gray-400',
          };

          return (
            <div
              key={reservation.reservation_id}
              className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 ${
                status.color === 'yellow'
                  ? 'border-yellow-400'
                  : status.color === 'green'
                    ? 'border-green-400'
                    : 'border-gray-400'
              } flex gap-4 md:gap-6`}
            >
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800">
                    {tool?.tool_name || `Alet #${reservation.tool_id}`}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                      colorClasses[status.color as keyof typeof colorClasses]
                    }`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Rezervasyon #{reservation.reservation_id}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Başlangıç:</span>
                    <span>{new Date(reservation.start_t).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Bitiş:</span>
                  <span>{new Date(reservation.end_t).toLocaleDateString('tr-TR')}</span>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Oluşturuldu: {new Date(reservation.created_at).toLocaleDateString('tr-TR')}
                </p>

                {/* Aksiyon Butonları */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Aktif için Tamamla Butonu */}
                  {status.label === 'Aktif' && (
                    <button
                      onClick={() => handleFinishReservation(reservation.reservation_id)}
                      disabled={finishingReservation === reservation.reservation_id}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {finishingReservation === reservation.reservation_id ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                          Tamamlanıyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Tamamla
                        </>
                      )}
                    </button>
                  )}

                  {/* Beklemede için Bırak Butonu */}
                  {status.label === 'Beklemede' && (
                    <button
                      onClick={() => handleCancelReservation(reservation.reservation_id)}
                      disabled={cancellingReservation === reservation.reservation_id}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingReservation === reservation.reservation_id ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                          İptal Ediliyor...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          İptal Et
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Değerlendirme Butonu */}
                {status.label === 'Tamamlandı' && tool && !reviewedReservations.has(reservation.reservation_id) && (
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {/* Alet Sahibi */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {owner?.user_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="font-medium">{owner?.user_name || `Kullanıcı #${tool.user_id}`}</span>
                    </div>
                    
                    {/* Değerlendir Butonu */}
                    <button
                      onClick={() => openReviewModal(
                        reservation.reservation_id,
                        tool.tool_name,
                        owner ? owner.user_name : `Kullanıcı #${tool.user_id}`,
                        tool.user_id
                      )}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      <Star className="w-4 h-4" />
                      Değerlendir
                    </button>
                  </div>
                )}
                {reviewedReservations.has(reservation.reservation_id) && (
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {/* Alet Sahibi */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {owner?.user_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="font-medium">{owner?.user_name || `Kullanıcı #${tool?.user_id}`}</span>
                    </div>
                    
                    {/* Değerlendirildi Badge */}
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-2 rounded-xl">
                      <CheckCircle className="w-4 h-4" />
                      <span>Değerlendirildi</span>
                      <div className="flex items-center gap-0.5 ml-1">
                        {[...Array(reviewedReservations.get(reservation.reservation_id))].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {currentUserId && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={closeReviewModal}
          reservationId={reviewModal.reservationId}
          toolName={reviewModal.toolName}
          ownerName={reviewModal.ownerName}
          ownerId={reviewModal.ownerId}
          reviewerId={currentUserId}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}