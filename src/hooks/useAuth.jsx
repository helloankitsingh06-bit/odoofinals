import { useState, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Mock user. Defaults to null so that user must "log in" via Login page, 
  // or defaults to Admin if we want to skip. Let's make it default to null 
  // so the login page can be tested, but start with Admin if we want default bypass.
  // Actually, starting with Admin by default is good so that dashboard renders immediately.
  const [user, setUser] = useState({
    uid: 'mock-uid-123',
    email: 'admin@assetflow.com',
    role: 'Admin', // Default: 'Admin'
    name: 'Jane Doe',
  });

  /**
   * Mock login function.
   * 
   * @param {string} email 
   * @param {string} password 
   * @param {string} selectedRole - The role chosen from the dropdown ('Admin', 'Employee', 'AssetManager', 'DeptHead').
   */
  const login = async (email, password, selectedRole = 'Admin') => {
    console.log('Mock login with:', email, 'role:', selectedRole);
    
    const role = selectedRole || 'Admin';
    setUser({
      uid: `mock-uid-${Date.now()}`,
      email: email || `${role.toLowerCase()}@assetflow.com`,
      role: role,
      name: `${role} User`,
    });
  };

  const logout = async () => {
    console.log('Mock logout');
    setUser(null);
  };

  const setRole = (newRole) => {
    setUser(prev => {
      if (!prev) {
        return {
          uid: 'mock-uid-123',
          email: `${newRole.toLowerCase()}@assetflow.com`,
          role: newRole,
          name: `${newRole} User`,
        };
      }
      return {
        ...prev,
        role: newRole,
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setRole, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
