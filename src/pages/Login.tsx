import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Loader2, MailCheck, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { X7Logo } from '../components/X7Logo';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { signIn, signUp, confirmOtp, requestPasswordReset, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Шаг подтверждения кода из письма (после регистрации).
  const [otpId, setOtpId] = useState<string | null>(null);
  const [code, setCode] = useState('');

  // Экран восстановления пароля.
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Уже вошли — уводим на портал.
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setOtpId(null);
    setCode('');
    setResetMode(false);
    setResetSent(false);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      // Не раскрываем, существует ли аккаунт (защита от перебора email).
      setResetSent(true);
    } catch {
      setResetSent(true);
    } finally {
      setLoading(false);
    }
  };

  const mapError = (err: any): string => {
    const data = err?.response?.data || err?.data;
    // Частые случаи регистрации: занятый email / слабый пароль.
    if (data?.email) return 'Этот email уже зарегистрирован или указан неверно.';
    if (data?.password) return 'Пароль слишком короткий — минимум 8 символов.';
    if (mode === 'signup') return 'Не удалось зарегистрироваться. Проверьте данные и повторите.';
    return 'Неверный логин или пароль';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        // Создаём аккаунт и отправляем код на почту — дальше шаг ввода кода.
        const id = await signUp(email, password, fullName);
        setOtpId(id);
      } else {
        await signIn(email.trim(), password);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpId) return;
    setError('');
    setLoading(true);
    try {
      await confirmOtp(otpId, code);
      navigate(from, { replace: true });
    } catch {
      setError('Неверный или просроченный код. Проверьте письмо и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  // --- Экран восстановления пароля ---
  if (resetMode) {
    return (
      <div className="min-h-screen w-full bg-base text-slate-100 font-sans flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm card p-8"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
              <KeyRound className="text-white" size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-50">Сброс пароля</h1>
            <p className="text-xs text-slate-500 mt-1">
              {resetSent
                ? 'Если аккаунт с таким email существует, мы отправили на него ссылку для сброса пароля. Проверьте почту (в том числе папку «Спам»).'
                : 'Укажите email, и мы отправим ссылку для смены пароля.'}
            </p>
          </div>

          {resetSent ? (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <LogIn size={16} />
              Вернуться ко входу
            </button>
          ) : (
            <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Логин (email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="you@example.com"
                  className="field"
                />
              </div>

              {error && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Отправить ссылку
              </button>

              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-bold transition-colors"
              >
                ← Вернуться ко входу
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  // --- Экран ввода кода из письма ---
  if (otpId) {
    return (
      <div className="min-h-screen w-full bg-base text-slate-100 font-sans flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm card p-8"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
              <MailCheck className="text-white" size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-50">Подтверждение</h1>
            <p className="text-xs text-slate-500 mt-1">
              Мы отправили код на <span className="text-slate-300 font-bold">{email.trim()}</span>.
              Введите его ниже.
            </p>
          </div>

          <form onSubmit={handleConfirmOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Код из письма</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                placeholder="123456"
                className="field text-center text-lg tracking-[0.3em] font-black"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <MailCheck size={16} />}
              Подтвердить
            </button>

            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-bold transition-colors"
            >
              ← Вернуться ко входу
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-base text-slate-100 font-sans flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm card p-8"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <X7Logo className="w-12 h-12 mb-4" />
          <h1 className="text-2xl font-black tracking-tight text-slate-50">
            {isSignup ? 'Регистрация' : 'Вход в систему'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isSignup ? 'Создайте аккаунт для доступа к порталу' : 'Авторизуйтесь для доступа к порталу'}
          </p>
        </div>

        {/* Переключатель Вход / Регистрация */}
        <div className="flex gap-1 p-1 mb-6 rounded-xl bg-surface-2 border border-line">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              !isSignup ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              isSignup ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Имя</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="name"
                required
                placeholder="Иван Иванов"
                className="field"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Логин (email)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
              placeholder="you@example.com"
              className="field"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Пароль</label>
              {!isSignup && (
                <button
                  type="button"
                  onClick={() => { setError(''); setResetMode(true); setResetSent(false); }}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Забыли пароль?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={isSignup ? 8 : undefined}
                placeholder="••••••••"
                className="field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isSignup && (
              <p className="text-[10px] text-slate-500">Минимум 8 символов.</p>
            )}
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSignup ? (
              <UserPlus size={16} />
            ) : (
              <LogIn size={16} />
            )}
            {isSignup ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
