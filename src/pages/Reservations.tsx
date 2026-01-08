// src/pages/Reservations.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, Wrench, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { Reservation, Tool, toolApi, userApi, reservationApi } from '../services/api';
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

  // Rezervasyonlardaki tool bilgilerini yükle
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
  }, [reservations]);

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

                {/* Tamamla Butonu - Aktif veya Beklemede rezervasyonlar için */}
                {(status.label === 'Aktif' || status.label === 'Beklemede') && (
                  <button
                    onClick={() => handleFinishReservation(reservation.reservation_id)}
                    disabled={finishingReservation === reservation.reservation_id}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Değerlendirme Butonu - Tamamlanmış rezervasyonlar için */}
                {status.label === 'Tamamlandı' && tool && !reviewedReservations.has(reservation.reservation_id) && (
                  <button
                    onClick={() => openReviewModal(
                      reservation.reservation_id,
                      tool.tool_name,
                      `Kullanıcı #${tool.user_id}`,
                      tool.user_id
                    )}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <Star className="w-4 h-4" />
                    Değerlendir
                  </button>
                )}
                {reviewedReservations.has(reservation.reservation_id) && (
                  <div className="mt-3 flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-2 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    <span>Değerlendirildi</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      {[...Array(reviewedReservations.get(reservation.reservation_id))].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
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
