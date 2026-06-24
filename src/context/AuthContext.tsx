import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { pb, UserRole } from '../lib/pb';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  name?: string;
  phone?: string;
  telegram?: string;
  verified?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const currentUser = (): AuthUser | null =>
  pb.authStore.isValid ? (pb.authStore.record as unknown as AuthUser) : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Реакция на любой логин/логаут/refresh токена.
    const unsubscribe = pb.authStore.onChange(() => setUser(currentUser()));

    // Валидируем сохранённую сессию при старте.
    (async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh();
        } catch {
          pb.authStore.clear();
        }
      }
      setLoading(false);
    })();

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password);
  }, []);

  // Саморегистрация. В режиме «одна сущность» новый пользователь получает роль
  // committee (полный доступ) и сразу логинится.
  // ЗАДЕЛ ПОД OTP: когда на сервере включат SMTP + One-time password, здесь
  // достаточно после create вызвать pb.collection('users').requestOTP(email)
  // и провести подтверждение кодом перед авто-входом (см. authWithOTP).
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    await pb.collection('users').create({
      email: email.trim(),
      password,
      passwordConfirm: password,
      emailVisibility: true,
      role: 'committee',
      full_name: (fullName || '').trim(),
    });
    await pb.collection('users').authWithPassword(email.trim(), password);
  }, []);

  const signOut = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const role = (user?.role as UserRole) ?? null;

  return (
    <AuthContext.Provider
      value={{ user, role, isAuthenticated: !!user, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
