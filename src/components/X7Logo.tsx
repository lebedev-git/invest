// Единый логотип бренда: чёрный скруглённый квадрат с белой серифной надписью «com.».
// Реализован как inline-SVG с viewBox — надпись масштабируется вместе с контейнером,
// поэтому одинаково корректно смотрится в любом размере (загрузчик, вход, шапка, меню).
// Проп textClassName сохранён для обратной совместимости с местами вызова и не влияет на SVG.
export const X7Logo = ({
  className = 'w-8 h-8',
  textClassName: _textClassName,
}: {
  className?: string;
  textClassName?: string;
}) => (
  <svg
    className={`${className} shrink-0`}
    viewBox="0 0 100 100"
    role="img"
    aria-label="com."
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="24" fill="#000000" />
    <text
      x="50"
      y="54"
      fill="#ffffff"
      fontFamily="Georgia, 'Times New Roman', 'PT Serif', serif"
      fontSize="46"
      fontWeight="500"
      textAnchor="middle"
      dominantBaseline="central"
    >
      com.
    </text>
  </svg>
);

export default X7Logo;
