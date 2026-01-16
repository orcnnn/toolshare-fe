// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { Wrench, User, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, Users } from 'lucide-react';
import { userApi, UserCreate, UserLogin, User as UserType } from '../services/api';

interface AuthPageProps {
  onLoginSuccess: (user: UserType) => void;
}

type AuthMode = 'login' | 'register';

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetForm = () => {
    setUserName('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!userName.trim() || !password.trim()) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Şifreler eşleşmiyor');
        return;
      }
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const userData: UserCreate = {
          user_name: userName.trim(),
          password: password,
        };
        const newUser = await userApi.create(userData);
        onLoginSuccess(newUser);
      } else {
        const credentials: UserLogin = {
          user_name: userName.trim(),
          password: password,
        };
        const user = await userApi.login(credentials);
        onLoginSuccess(user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: 'Ücretsiz Paylaşım', desc: 'Komşularınla alet paylaş' },
    { icon: Shield, title: 'Güvenli İşlem', desc: 'Değerlendirme sistemi ile güven' },
    { icon: Users, title: 'Topluluk', desc: 'Binlerce aktif kullanıcı' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      {/* Sol Panel - Marka ve Özellikler */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Dekoratif Arka Plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
        </div>

        {/* Logo ve Başlık */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ToolShare</h1>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Komşunla{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Paylaş
            </span>
            ,<br />
            Birlikte{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Kazan
            </span>
          </h2>
          <p className="text-lg text-blue-200/80 max-w-md">
            Mahallendeki aletlere anında eriş, kendi aletlerini paylaşarak topluluğa katkı sağla.
          </p>
        </div>

        {/* Özellikler */}
        <div className="relative z-10 space-y-6">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-blue-200/60">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alt Bilgi */}
        <div className="relative z-10 text-sm text-blue-200/50">
          © 2026 ToolShare. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Sağ Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobil Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-3 rounded-2xl">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ToolShare</h1>
          </div>

          {/* Form Kartı */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
            {/* Tab Seçimi */}
            <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {/* Başlık */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {mode === 'login' ? 'Tekrar Hoş Geldin!' : 'Hesap Oluştur'}
              </h3>
              <p className="text-blue-200/60 text-sm">
                {mode === 'login'
                  ? 'Hesabına giriş yap ve paylaşmaya devam et'
                  : 'Hemen ücretsiz kayıt ol ve topluluğa katıl'}
              </p>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Kullanıcı Adı */}
              <div>
                <label className="block text-sm font-medium text-blue-200/80 mb-2">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-blue-300/50" />
                  </div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="örn: ahmet_yilmaz"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-medium text-blue-200/80 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-blue-300/50" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300/50 hover:text-blue-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Şifre Onayı - Sadece Kayıt Modunda */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-blue-200/80 mb-2">
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-blue-300/50" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Alt Link */}
            <p className="mt-6 text-center text-sm text-blue-200/50">
              {mode === 'login' ? (
                <>
                  Hesabın yok mu?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Hemen Kayıt Ol
                  </button>
                </>
              ) : (
                <>
                  Zaten hesabın var mı?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Giriş Yap
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Demo Bilgisi */}
          <p className="mt-6 text-center text-xs text-blue-200/30">
            Demo için herhangi bir kullanıcı adı ve şifre ile kayıt olabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

