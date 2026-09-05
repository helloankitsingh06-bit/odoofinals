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

const AuthContext = createContext(null);

// Optional: an email that should be treated as Admin in the UI. The backend is
// still the source of truth for authorization — this only affects menu gating.
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Role is not queried from the browser. It comes from the admin-email
        // match, or the role picked on the login screen (dev convenience),
        // defaulting to "Employee".
        const email = (firebaseUser.email || '').toLowerCase();
        const role =
          ADMIN_EMAIL && email === ADMIN_EMAIL
            ? 'Admin'
            : localStorage.getItem('lastSelectedRole') || 'Employee';

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /** Email/password login. Falls back to a local mock user if Firebase fails. */
  const login = async (email, password, selectedRole = 'Employee') => {
    localStorage.setItem('lastSelectedRole', selectedRole);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (error) {
      console.warn('Firebase login failed, using local mock user:', error.code);
      const mockUser = {
        uid: `mock-${Date.now()}`,
        email: email || 'user@example.com',
        role: selectedRole,
        name: `${selectedRole} User`,
      };
      setUser(mockUser);
      return mockUser;
    }
  };

  /** Email/password sign up. New accounts always get the "Employee" role. */
  const signup = async (email, password, name = '') => {
    localStorage.setItem('lastSelectedRole', 'Employee');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    return credential.user;
  };

  /** Google popup login. Falls back to a local mock user if unavailable. */
  const loginWithGoogle = async (selectedRole = 'Employee') => {
    localStorage.setItem('lastSelectedRole', selectedRole);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return credential.user;
    } catch (error) {
      console.warn('Google sign-in unavailable, using local mock user:', error.code);
      const mockUser = {
        uid: `mock-google-${Date.now()}`,
        email: 'google.user@example.com',
        role: selectedRole,
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
    setUser(null);
  };

  /** Dev-only: change the current role without re-authenticating. */
  const setRole = (role) => {
    localStorage.setItem('lastSelectedRole', role);
    setUser((prev) => (prev ? { ...prev, role } : prev));
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
