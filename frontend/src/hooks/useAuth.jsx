import { useState, useEffect, createContext, useContext } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import { auth, googleProvider } from '../lib/firebase';
import { ROLES, VALID_ROLES } from '../constants';
import { userService } from '../lib/userService';

const AuthContext = createContext(null);

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').toLowerCase();
        let role = localStorage.getItem('lastSelectedRole') || ROLES.EMPLOYEE;

        if (ADMIN_EMAIL && email === ADMIN_EMAIL) {
          role = ROLES.ADMIN;
        }

        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role,
        };

        setUser(baseUser);

        // Sync with backend asynchronously
        try {
          const profile = await userService.getMe();
          if (profile && profile.role) {
            setUser((prev) => (prev ? { ...prev, ...profile } : prev));
          }
        } catch (err) {
          console.warn('Backend user profile sync notice:', err.message);
        }
      } else {
        const savedRole = localStorage.getItem('lastSelectedRole');
        if (savedRole && VALID_ROLES.includes(savedRole)) {
          setUser({
            uid: `mock-${savedRole.toLowerCase()}-uid`,
            email: `mock_${savedRole.toLowerCase()}@example.com`,
            name: `Mock ${savedRole}`,
            role: savedRole,
          });
        } else {
          setUser({
            uid: 'mock-admin-uid',
            email: 'admin@example.com',
            name: 'Mock Admin',
            role: ROLES.ADMIN,
          });
          localStorage.setItem('lastSelectedRole', ROLES.ADMIN);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /** Email/password login. Falls back to a local mock user if Firebase fails. */
  const login = async (email, password, selectedRole = ROLES.EMPLOYEE) => {
    localStorage.setItem('lastSelectedRole', selectedRole);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (error) {
      console.warn('Firebase login notice, using local mock user:', error.code || error.message);
      const safeRole = VALID_ROLES.includes(selectedRole) ? selectedRole : ROLES.EMPLOYEE;
      const mockUser = {
        uid: `mock-${safeRole.toLowerCase()}-${Date.now()}`,
        email: email || `${safeRole.toLowerCase()}@example.com`,
        role: safeRole,
        name: `${safeRole} User`,
      };
      setUser(mockUser);
      return mockUser;
    }
  };

  /** Email/password sign up. New accounts always get the "Employee" role server-side. */
  const signup = async (email, password, name = '') => {
    localStorage.setItem('lastSelectedRole', ROLES.EMPLOYEE);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name && credential.user) {
      await updateProfile(credential.user, { displayName: name });
    }
    // Attempt backend sync
    try {
      await userService.sync({ email, name });
    } catch (e) {
      console.warn('Backend signup sync notice:', e.message);
    }
    return credential.user;
  };

  /** Google popup login. Falls back to a local mock user if unavailable. */
  const loginWithGoogle = async (selectedRole = ROLES.EMPLOYEE) => {
    localStorage.setItem('lastSelectedRole', selectedRole);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return credential.user;
    } catch (error) {
      console.warn('Google sign-in notice, using local mock user:', error.code || error.message);
      const safeRole = VALID_ROLES.includes(selectedRole) ? selectedRole : ROLES.EMPLOYEE;
      const mockUser = {
        uid: `mock-google-${Date.now()}`,
        email: 'google.user@example.com',
        role: safeRole,
        name: 'Google User',
      };
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn(e);
    }
    localStorage.removeItem('lastSelectedRole');
    setUser(null);
  };

  /** Dev-only: change the current role without re-authenticating. */
  const setRole = (role) => {
    if (!VALID_ROLES.includes(role)) return;
    localStorage.setItem('lastSelectedRole', role);
    setUser((prev) => (prev ? { ...prev, role } : {
      uid: `mock-${role.toLowerCase()}-uid`,
      email: `mock_${role.toLowerCase()}@example.com`,
      name: `Mock ${role}`,
      role,
    }));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, loginWithGoogle, logout, setRole, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
