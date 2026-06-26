// Единый логотип X7 Invest — изометрический куб в изумрудных тонах.
// Используется во всех точках бренда (портал, вход, админка, загрузчик).
export const X7Logo = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={`${className} shrink-0`}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Верхняя грань */}
    <path d="M50 15 L15 35 L50 55 L85 35 Z" fill="#10b981" />
    {/* Левая грань */}
    <path d="M15 35 L15 75 L50 95 L50 55 Z" fill="#059669" />
    {/* Правая грань */}
    <path d="M85 35 L85 75 L50 95 L50 55 Z" fill="#047857" />
  </svg>
);

export default X7Logo;
