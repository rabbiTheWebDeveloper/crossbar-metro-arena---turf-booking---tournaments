/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Loading from './loading';



export function Auth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = ['/', '/register', '/forgot-password'];
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isPublicPath = publicPaths.includes(pathname);
      const authenticated = isAuthenticated();

      if (!authenticated && !isPublicPath) {
        router.push('/');
        setIsLoading(false);
      } else if (authenticated && isPublicPath) {
        router.push('/dashboard/market');
        setIsLoading(false);
      }
    };

    checkAuth();
    setIsLoading(false);
  }, [pathname, router]);

  if (isLoading) return <Loading />;

  return children;
}
