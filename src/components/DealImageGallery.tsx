import React, { useRef } from 'react';
import { Trash2, Upload, Loader2 } from 'lucide-react';

// Один локально подготовленный (ещё не загруженный) файл с предпросмотром.
export interface StagedImage {
  id: string;
  url: string;
  name: string;
}

interface DealImageGalleryProps {
  // Уже загруженные на сервер файлы (имена) + резолвер URL по имени.
  serverImages?: string[];
  resolveUrl?: (filename: string) => string;
  onRemoveServer?: (filename: string) => void;
  // Локальные файлы с предпросмотром (режим создания сделки).
  staged?: StagedImage[];
  onRemoveStaged?: (id: string) => void;
  // Добавление новых файлов.
  onAddFiles: (files: File[]) => void;
  busy?: boolean;
  error?: string;
  emptyText?: string;
  hint?: string;
}

// Превью-плитка с кнопкой удаления (общая для серверных и локальных изображений).
function Thumb({ src, alt, onRemove, disabled }: { src: string; alt: string; onRemove?: () => void; disabled?: boolean }) {
  return (
    <div className="relative group rounded-2xl overflow-hidden border border-line aspect-[4/3] bg-surface-2">
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          title="Удалить"
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// Галерея фотографий объекта: сетка превью + загрузка + удаление.
// Используется и на странице сделки (только серверные файлы), и в форме создания
// (серверные при редактировании либо локальные превью при создании).
export function DealImageGallery({
  serverImages = [],
  resolveUrl,
  onRemoveServer,
  staged = [],
  onRemoveStaged,
  onAddFiles,
  busy = false,
  error,
  emptyText,
  hint,
}: DealImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImages = serverImages.length > 0 || staged.length > 0;

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    onAddFiles(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {hasImages ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {serverImages.map(name => (
            <React.Fragment key={name}>
              <Thumb
                src={resolveUrl ? resolveUrl(name) : ''}
                alt={name}
                disabled={busy}
                onRemove={onRemoveServer ? () => onRemoveServer(name) : undefined}
              />
            </React.Fragment>
          ))}
          {staged.map(img => (
            <React.Fragment key={img.id}>
              <Thumb
                src={img.url}
                alt={img.name}
                onRemove={onRemoveStaged ? () => onRemoveStaged(img.id) : undefined}
              />
            </React.Fragment>
          ))}
        </div>
      ) : emptyText ? (
        <div className="border border-dashed border-line rounded-2xl bg-surface-2/50 p-5 text-center">
          <p className="text-xs text-slate-400 font-medium leading-relaxed">{emptyText}</p>
        </div>
      ) : null}

      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-100 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Загрузить фото
      </button>
      {error && <p className="text-[11px] text-rose-500 font-bold text-center">{error}</p>}
      {hint && <p className="text-[10px] text-slate-500 font-medium text-center">{hint}</p>}
    </div>
  );
}
