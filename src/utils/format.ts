// Единый слой форматирования чисел и денег.
// Раньше эти функции были продублированы в Portal, CreateDeal, ProjectView и AdminDeals
// с мелкими расхождениями — здесь сведены к одному набору.

// Сумма в рублях без прочерка (для заведомо валидных значений).
export const formatRub = (value: number): string =>
  `${Math.round(value).toLocaleString('ru-RU')} ₽`;

// Сумма в рублях с прочерком для нуля. Отрицательные значения показываются как есть
// (убытки не маскируются), нулевые/нечисловые → «—».
export const money = (value?: number | string): string => {
  const amount = Number(value) || 0;
  return amount !== 0 ? formatRub(amount) : '—';
};

// Сумма в миллионах рублей (для компактных карточек/диаграмм).
export const formatMln = (value: number): string =>
  `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;

// Сумма со знаком (+/−) — для прогноза/денежного потока.
export const formatSignedRub = (value: number): string =>
  `${value >= 0 ? '+' : '-'}${formatRub(Math.abs(value))}`;

// Разделители тысяч для произвольного числа в полях ввода (с сохранением дробной части).
export const formatNumberString = (val: string | number): string => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\s/g, '');
  if (isNaN(Number(numStr))) return String(val);
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

// Обратное преобразование: убрать разделители тысяч.
export const parseNumberString = (val: string): string => val.replace(/\s/g, '');
