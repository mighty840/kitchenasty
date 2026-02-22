import { create } from 'zustand';
import * as SecureStorage from '../lib/secure-storage';
import type { User } from '../api/types';
import { authApi } from '../api/endpoints';

const TOKEN_KEY = 'auth_token';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  async login(email, password) {
    const res = await authApi.login(email, password);
    const { token, customer } = res.data!;
    await SecureStorage.setItem(TOKEN_KEY, token);
    set({ token, user: customer });
  },

  async register(data) {
    const res = await authApi.register(data);
    const { token, customer } = res.data!;
    await SecureStorage.setItem(TOKEN_KEY, token);
    set({ token, user: customer });
  },

  async loginWithToken(token) {
    await SecureStorage.setItem(TOKEN_KEY, token);
    set({ token });
    try {
      const res = await authApi.getMe();
      set({ user: res.data!.customer });
    } catch {
      await get().logout();
    }
  },

  async logout() {
    await SecureStorage.deleteItem(TOKEN_KEY);
    set({ user: null, token: null });
  },

  async restoreSession() {
    try {
      const token = await SecureStorage.getItem(TOKEN_KEY);
      if (!token) {
        set({ isLoading: false });
        return;
      }
      set({ token });
      const res = await authApi.getMe();
      set({ user: res.data!.customer, isLoading: false });
    } catch {
      await SecureStorage.deleteItem(TOKEN_KEY);
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
