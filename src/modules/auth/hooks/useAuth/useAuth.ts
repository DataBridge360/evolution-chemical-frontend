'use client';

import { useEffect, useState } from 'react';
import { authService } from '../../services/AuthService';
import { User, UserRole } from '@/src/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const isAuthenticated = authService.isAuthenticated();
  const isOwner = user?.role === UserRole.OWNER;
  const isCompanyAdmin = user?.role === UserRole.COMPANY_ADMIN;

  return {
    user,
    loading,
    isAuthenticated,
    isOwner,
    isCompanyAdmin,
  };
}
