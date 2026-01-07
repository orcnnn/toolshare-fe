// src/components/ReviewModal.tsx
import React, { useState } from 'react';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { reviewApi, ReviewCreate } from '../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: number;
  toolName: string;
  ownerName: string;
  ownerId: number;
  reviewerId: number;
  onSuccess?: (score: number) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  reservationId,
  toolName,
  ownerName,
  ownerId,
  reviewerId,
  onSuccess,
}: ReviewModalProps) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Lütfen bir puan seçin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reviewData: ReviewCreate = {
        score,
        reservation_id: reservationId,
        user_id_reviewer: reviewerId,
        user_id_target: ownerId,
      };

      await reviewApi.create(reviewData);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.(score);
        onClose();
        // Reset state
        setScore(0);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Değerlendirme gönderilemedi';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setScore(0);
      setHoveredScore(0);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const scoreLabels = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white">
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Değerlendirme Yap</h2>
              <p className="text-amber-100 text-sm">Deneyimini paylaş</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600 fill-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Teşekkürler!</h3>
              <p className="text-gray-500">Değerlendirmen başarıyla kaydedildi.</p>
            </div>
          ) : (
            <>
              {/* Tool & Owner Info */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Kiralanan Alet</p>
                <p className="font-bold text-gray-800">{toolName}</p>
                <p className="text-sm text-gray-500 mt-2 mb-1">Alet Sahibi</p>
                <p className="font-medium text-gray-700">{ownerName}</p>
              </div>

              {/* Star Rating */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-3">Puanınız</p>
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setScore(star)}
                      onMouseEnter={() => setHoveredScore(star)}
                      onMouseLeave={() => setHoveredScore(0)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                      disabled={loading}
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoveredScore || score)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className={`text-sm font-medium transition-opacity ${
                  (hoveredScore || score) > 0 ? 'opacity-100' : 'opacity-0'
                } ${
                  (hoveredScore || score) >= 4 ? 'text-green-600' : 
                  (hoveredScore || score) >= 3 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {scoreLabels[hoveredScore || score]}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || score === 0}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Değerlendirmeyi Gönder
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

