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
  // Регистрация: создаёт пользователя и отправляет код на почту. Возвращает otpId,
  // который нужен для последующего подтверждения в confirmOtp.
  signUp: (email: string, password: string, fullName?: string) => Promise<string>;
  // Подтверждение кода из письма — завершает вход.
  confirmOtp: (otpId: string, code: string) => Promise<void>;
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

  // Саморегистрация с подтверждением по почте (OTP включён в коллекции users).
  // 1) создаём пользователя (роль committee = полный доступ в режиме «одна сущность»),
  // 2) запрашиваем одноразовый код — PocketBase шлёт его на email,
  // 3) возвращаем otpId; ввод кода завершается в confirmOtp → authWithOTP.
  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<string> => {
    const mail = email.trim();
    await pb.collection('users').create({
      email: mail,
      password,
      passwordConfirm: password,
      emailVisibility: true,
      role: 'committee',
      full_name: (fullName || '').trim(),
    });
    const otp = await pb.collection('users').requestOTP(mail);
    return otp.otpId;
  }, []);

  // Завершение регистрации/входа кодом из письма. authWithOTP заодно помечает
  // пользователя verified и наполняет authStore (срабатывает onChange выше).
  const confirmOtp = useCallback(async (otpId: string, code: string) => {
    await pb.collection('users').authWithOTP(otpId, code.trim());
  }, []);

  const signOut = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const role = (user?.role as UserRole) ?? null;

  return (
    <AuthContext.Provider
      value={{ user, role, isAuthenticated: !!user, loading, signIn, signUp, confirmOtp, signOut }}
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
