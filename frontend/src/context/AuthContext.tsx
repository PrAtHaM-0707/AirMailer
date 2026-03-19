import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { decodeJWT, refreshToken } from "@/lib/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
    
    const handleAuthError = () => {
      logout();
      toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const checkAuth = async () => {
    let token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    const payload = decodeJWT(token);
    const isExpired = !payload || payload.exp * 1000 < Date.now();

    if (isExpired) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        setIsAuthenticated(false);
        return false;
      }
      token = localStorage.getItem('token')!;
    }
    
    setIsAuthenticated(true);
    return true;
  };

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

 
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
