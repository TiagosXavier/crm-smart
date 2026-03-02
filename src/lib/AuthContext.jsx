import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      // Verifica se há token salvo
      const token = localStorage.getItem('auth_token');

      if (token) {
        // Tenta obter o usuário atual
        const currentUser = await api.auth.me();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // Token inválido, remove
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        }
      } else {
        // Sem token - modo desenvolvimento, cria usuário mock
        const mockUser = {
          id: 'dev-user-1',
          email: 'dev@example.com',
          full_name: 'Usuário Dev',
          role: 'admin',
          status: 'online',
          company_id: 'd0f0c0d0-0000-0000-0000-000000000001',
        };
        setUser(mockUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Em desenvolvimento, usa usuário mock mesmo com erro
      const mockUser = {
        id: 'dev-user-1',
        email: 'dev@example.com',
        full_name: 'Usuário Dev',
        role: 'admin',
        status: 'online',
        company_id: 'd0f0c0d0-0000-0000-0000-000000000001',
      };
      setUser(mockUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await api.auth.login(email, password);
      if (result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed',
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    api.auth.logout();
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        login,
        logout,
        navigateToLogin,
        checkAuth,
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
