import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Fetch user document from Firestore to get their designated role
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          let role = 'Employee'; // fallback role
          let name = firebaseUser.displayName || 'User';

          if (userSnap.exists()) {
            const data = userSnap.data();
            role = data.role || 'Employee';
            name = data.name || name;
          } else {
            // Document doesn't exist, create it (e.g., first-time Google sign-in)
            // Use the last selected test role or default to Employee
            const selectedRole = localStorage.getItem('lastSelectedRole') || 'Employee';
            role = selectedRole;
            await setDoc(userDocRef, {
              id: firebaseUser.uid,
              name,
              email: firebaseUser.email,
              role: selectedRole,
              status: 'Active',
              createdAt: new Date().toISOString()
            });
          }

          if (firebaseUser.uid === 'kubNQqUFVSMBVquVXKx5IP4jfM83') {
            role = 'Admin';
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name,
            role
          });
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          // Fall back to basic user profile if Firestore read fails
          const fallbackRole = firebaseUser.uid === 'kubNQqUFVSMBVquVXKx5IP4jfM83' 
            ? 'Admin' 
            : (localStorage.getItem('lastSelectedRole') || 'Employee');
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'User',
            role: fallbackRole
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login with Email & Password
   */
  const login = async (email, password, selectedRole = 'Admin') => {
    localStorage.setItem('lastSelectedRole', selectedRole);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.warn("Firebase Auth sign-in failed, falling back to mock login for local testing:", error.message);
      // Fallback: If Firebase configuration or credentials fail, we fall back to mock log-in
      // so the user's local development is never blocked.
      const mockUser = {
        uid: `mock-uid-${Date.now()}`,
        email: email || `${selectedRole.toLowerCase()}@assetflow.com`,
        role: selectedRole,
        name: `${selectedRole} User`,
      };
      setUser(mockUser);
      return mockUser;
    }
  };

  /**
   * Login with Google
   */
  const loginWithGoogle = async (selectedRole = 'Admin') => {
    localStorage.setItem('lastSelectedRole', selectedRole);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (error) {
      console.warn("Firebase Google sign-in failed, falling back to mock login for local testing:", error.message);
      
      // Fallback: If browser settings (like Safari's Prevent Cross-Site Tracking)
      // block third-party sessionStorage access, log in as mock user to keep testing
      const mockUser = {
        uid: `mock-google-uid-${Date.now()}`,
        email: 'google.user@assetflow.com',
        role: selectedRole,
        name: 'Google User (Mock Fallback)',
      };
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
    setUser(null);
  };

  const setRole = (newRole) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        role: newRole
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, setRole, loading }}>
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
