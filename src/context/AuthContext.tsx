import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ProviderProfile, UserRole, NotificationItem } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  providerProfile: ProviderProfile | null;
  loading: boolean;
  activeRole: UserRole;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  login: (credentials: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  switchRoleView: (role: UserRole) => void;
  markNotifsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>('client');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshMe = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProviderProfile(data.providerProfile || null);
      if (data.user) {
        setActiveRole(data.user.role);
        fetchNotifs();
      }
    } catch (err) {
      setUser(null);
      setProviderProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifs = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = async (credentials: any) => {
    const data = await api.login(credentials);
    setUser(data.user);
    setProviderProfile(data.providerProfile || null);
    setActiveRole(data.user.role);
    await fetchNotifs();
  };

  const register = async (payload: any) => {
    const data = await api.register(payload);
    setUser(data.user);
    setProviderProfile(data.providerProfile || null);
    setActiveRole(data.user.role);
    await fetchNotifs();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setProviderProfile(null);
    setActiveRole('client');
    setNotifications([]);
  };

  const switchRoleView = (role: UserRole) => {
    // Role view is strictly locked to user's assigned account role
    if (user) {
      setActiveRole(user.role);
    } else {
      setActiveRole(role);
    }
  };

  const markNotifsRead = async () => {
    await api.markNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        providerProfile,
        loading,
        activeRole,
        notifications,
        unreadNotifsCount,
        login,
        register,
        logout,
        refreshMe,
        switchRoleView,
        markNotifsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
