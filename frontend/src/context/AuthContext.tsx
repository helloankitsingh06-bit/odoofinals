import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export type UserRole = 'Employee' | 'HRManager' | 'HRPayrollUser' | 'HRPayrollManager' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
  mustChangePassword?: boolean;
  employee?: {
    id: string;
    name: string;
    department: string;
    jobPosition: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generic role-based labels — deliberately NOT tied to any specific (possibly deleted) person.
const DEMO_USERS: Record<UserRole, { email: string; name: string }> = {
  Employee: { email: 'employee@peoplepay360.com', name: 'Employee' },
  HRManager: { email: 'hrmanager@peoplepay360.com', name: 'HR Manager' },
  HRPayrollUser: { email: 'payrolluser@peoplepay360.com', name: 'HR Payroll User' },
  HRPayrollManager: { email: 'payrollmgr@peoplepay360.com', name: 'HR Payroll Manager' },
  Admin: { email: 'admin@peoplepay360.com', name: 'System Administrator' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('peoplepay360_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await apiRequest('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to load session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password = 'Password123!') => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('peoplepay360_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'Employee') => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    localStorage.setItem('peoplepay360_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('peoplepay360_token');
    setToken(null);
    setUser(null);
  };

  const switchRoleQuick = async (role: UserRole) => {
    const demo = DEMO_USERS[role];
    if (demo) {
      await login(demo.email, 'Password123!');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const data = await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (data.token) {
      localStorage.setItem('peoplepay360_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchRoleQuick, changePassword }}>
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
