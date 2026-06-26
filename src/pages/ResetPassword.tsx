import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { KeyRound, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Страница задания нового пароля по ссылке из письма: /reset-password/:token
// Визуально повторяет экран входа/регистрации (карточка, поля, акцент emerald).
export default function ResetPassword() {
  const { token = '' } = useParams();
  const { confirmPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль слишком короткий — минимум 8 символов.');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(token, password, confirm);
      setDone(true);
    } catch {
      setError('Ссылка недействительна или просрочена. Запросите сброс пароля заново.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-base text-slate-100 font-sans flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm card p-8"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            {done ? <CheckCircle2 className="text-white" size={22} /> : <KeyRound className="text-white" size={22} />}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50">
            {done ? 'Пароль обновлён' : 'Новый пароль'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {done
              ? 'Теперь войдите в портал с новым паролем.'
              : 'Придумайте новый пароль для входа в портал X7 Invest.'}
          </p>
        </div>

        {done ? (
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            Войти
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Новый пароль</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Минимум 8 символов.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Подтвердите пароль</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="••••••••"
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
              Сохранить пароль
            </button>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
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
