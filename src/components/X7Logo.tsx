// Единый логотип X7 Invest — фирменный знак из самых первых версий портала:
// тёмный скруглённый квадрат с белой надписью «X7».
// Используется во всех точках бренда (портал, вход, админка, загрузчик).
export const X7Logo = ({
  className = 'w-8 h-8',
  textClassName = 'text-sm',
}: {
  className?: string;
  textClassName?: string;
}) => (
  <div
    className={`${className} bg-slate-900 rounded-lg flex items-center justify-center shrink-0`}
  >
    <span className={`text-white font-black tracking-tight ${textClassName}`}>X7</span>
  </div>
);

export default X7Logo;
