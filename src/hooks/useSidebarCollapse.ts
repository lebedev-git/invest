import { useEffect, useState } from 'react';

// Единое состояние «свёрнутости» бокового меню, общее для портала и админки.
// Хранится в localStorage, поэтому выбор пользователя сохраняется между экранами и сессиями.
const KEY = 'x7_sidebar_collapsed';

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(KEY) === '1');

  useEffect(() => {
    localStorage.setItem(KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const toggle = () => setCollapsed(prev => !prev);

  return { collapsed, toggle };
}
