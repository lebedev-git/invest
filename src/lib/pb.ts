import PocketBase from 'pocketbase';

// Единый инстанс PocketBase на всё приложение.
// LocalAuthStore (по умолчанию) сам персистит сессию в localStorage.
export const pb = new PocketBase(
  (import.meta as any).env?.VITE_PB_URL || 'http://127.0.0.1:8090',
);

export type UserRole = 'investor' | 'committee';
