import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, ALLOWED_DOMAIN, ADMIN_EMAIL } from '../firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  domainError: string | null;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u && !u.email?.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
        setDomainError(`Only @${ALLOWED_DOMAIN} accounts are allowed.`);
        signOut(auth);
        setUser(null);
      } else {
        setDomainError(null);
        setUser(u);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    setDomainError(null);
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const isAdmin = !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <AuthCtx.Provider value={{ user, loading, domainError, isAdmin, signIn, signOutUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
