import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';

// Унифицированные состояния асинхронной загрузки данных (тёмная тема).
// Используются дата-вью (портфель, админ-список) поверх useDeals().

export function LoadingState({ label = 'Загрузка данных…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <Loader2 size={28} className="animate-spin text-emerald-400" />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto my-16">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center">
        <AlertTriangle className="text-rose-400" size={22} />
      </div>
      <h2 className="text-base font-black tracking-tight text-slate-100">Не удалось загрузить данные</h2>
      <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
        >
          <RotateCcw size={15} /> Повторить
        </button>
      )}
    </div>
  );
}
