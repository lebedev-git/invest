import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

// Глобальный предохранитель: ловит ошибки рендера в дереве и показывает
// тёмный fallback вместо «белого экрана». Перезагрузка — единственное
// безопасное восстановление для непредвиденного состояния.
export default class ErrorBoundary extends Component<Props, State> {
  // В проекте не подключены @types/react, поэтому база Component приходит как any
  // и наследуемые члены не видны компилятору — объявляем props/state явно.
  declare props: Props;
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Перехвачена ошибка рендера:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen w-full bg-base text-slate-100 font-sans flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <AlertTriangle className="text-rose-400" size={26} />
          </div>
          <h1 className="text-lg font-black tracking-tight">Что-то пошло не так</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Произошла непредвиденная ошибка интерфейса. Попробуйте перезагрузить страницу.
          </p>
          {this.state.message && (
            <p className="text-[11px] text-slate-600 font-mono break-all">{this.state.message}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-2 flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <RotateCcw size={15} /> Перезагрузить
          </button>
        </div>
      </div>
    );
  }
}
