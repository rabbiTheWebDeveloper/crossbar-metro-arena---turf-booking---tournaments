import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useOpenTab } from '@/lib/navigation';
import { useArena } from '@/context/ArenaContext';

/**
 * Where to go after a successful login / sign-up:
 *   admin    -> Arena Desk
 *   investor -> Investor portal
 *   player   -> back to whatever they were doing (or the Me tab when there is nothing to go back to)
 *
 * Returns `finish(user)`. The navigation waits until the context has switched to the new role, so
 * the role-guarded stacks (/admin, /investor) are already unlocked when we navigate to them.
 */
export function useAuthRedirect() {
    const router = useRouter();
    const openTab = useOpenTab();
    const { role } = useArena();
    const [targetRole, setTargetRole] = useState(null);
    const done = useRef(false);

    useEffect(() => {
        if (!targetRole || role !== targetRole || done.current) return undefined;
        const timer = setTimeout(() => {
            if (done.current) return;
            done.current = true;
            if (targetRole === 'admin') router.replace('/admin');
            else if (targetRole === 'investor') router.replace('/investor');
            else if (router.canGoBack()) router.back();
            else openTab('/me');
        }, 0);
        return () => clearTimeout(timer);
    }, [targetRole, role, router, openTab]);

    return useCallback((user) => {
        done.current = false;
        setTargetRole(user?.role || 'player');
    }, []);
}
