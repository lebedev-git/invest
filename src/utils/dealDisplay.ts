// Единый слой отображения статусов сделки (тёмная тема).
// Карты типизированы как Record<DealStatus, …> — компилятор гарантирует,
// что у каждого статуса из DEAL_STATUSES есть цвет бейджа и стадия прогресса.
import type { DealStatus } from '../context/DealContext';

// Бейджи: translucent-заливка + светлый текст для читаемости на dark-фоне.
export const STATUS_COLORS: Record<DealStatus, string> = {
  'Рассматривается': 'bg-slate-500/20 text-slate-400',
  'Сбор заявок': 'bg-violet-500/15 text-violet-300',
  'Сбор': 'bg-violet-500/15 text-violet-300',
  'Сделка': 'bg-sky-500/15 text-sky-300',
  'Куплен': 'bg-teal-500/15 text-teal-300',
  'Регистрация': 'bg-blue-500/15 text-blue-300',
  'Стройка': 'bg-amber-500/15 text-amber-300',
  'Ремонт': 'bg-orange-500/15 text-orange-300',
  'Поиск арендатора': 'bg-indigo-500/15 text-indigo-300',
  'Аренда': 'bg-emerald-500/15 text-emerald-300',
  'В управлении': 'bg-emerald-500/15 text-emerald-300',
  'Продажа': 'bg-rose-500/15 text-rose-300',
  'Закрыта': 'bg-slate-500/20 text-slate-300',
  'Завершен': 'bg-slate-500/20 text-slate-300',
};

// Фолбэк-классы бейджа, когда статус не найден в карте.
export const STATUS_FALLBACK = 'bg-slate-500/20 text-slate-300';

// Нормализация подписи: обрезает пустые значения до фолбэка.
// (Ранее это были карты-идентичности TEXT_FIXES/LABEL_FIXES — функционально no-op.)
export const cleanLabel = (value?: string, fallback = ''): string => String(value || '') || fallback;

// Типобезопасный доступ к цвету бейджа: статус из БД — свободный text,
// поэтому индексируем с фолбэком, а не напрямую по узкому ключу.
export const statusColor = (status?: string): string =>
  STATUS_COLORS[cleanLabel(status) as DealStatus] || STATUS_FALLBACK;

// Прогресс по стадии жизненного цикла сделки — честно из реального статуса.
export const STAGE_ORDER: Record<DealStatus, number> = {
  'Рассматривается': 0,
  'Сбор заявок': 1,
  'Сбор': 1,
  'Сделка': 2,
  'Регистрация': 3,
  'Куплен': 4,
  'Стройка': 4,
  'Ремонт': 4,
  'Поиск арендатора': 5,
  'Аренда': 6,
  'В управлении': 6,
  'Продажа': 7,
  'Закрыта': 8,
  'Завершен': 8,
};
export const MAX_STAGE = 8;

export const getStageProgress = (status?: string): number => {
  const stage = STAGE_ORDER[cleanLabel(status) as DealStatus];
  return stage === undefined ? 0 : Math.round((stage / MAX_STAGE) * 100);
};
