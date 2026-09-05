import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export type UserRole = 'Employee' | 'HRManager' | 'HRPayrollUser' | 'HRPayrollManager' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
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
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, { email: string; name: string }> = {
  Employee: { email: 'employee@peoplepay360.com', name: 'Devon Hayes (Employee)' },
  HRManager: { email: 'hrmanager@peoplepay360.com', name: 'Marcus Sterling (HR Manager)' },
  HRPayrollUser: { email: 'payrolluser@peoplepay360.com', name: 'Jordan Reed (Payroll User)' },
  HRPayrollManager: { email: 'payrollmgr@peoplepay360.com', name: 'Sophia Chen (Payroll Manager)' },
  Admin: { email: 'admin@peoplepay360.com', name: 'System Administrator (Admin)' }
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
    setIsLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('peoplepay360_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRoleQuick }}>
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
