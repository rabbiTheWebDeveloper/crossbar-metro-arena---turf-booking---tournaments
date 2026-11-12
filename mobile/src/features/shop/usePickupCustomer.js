import { useEffect, useState } from 'react';
import { useArena } from '@/context/ArenaContext';

/**
 * Name + mobile number for a counter pickup, prefilled from the signed-in user.
 * The prefill only fills empty fields, so it never overwrites what the customer typed.
 */
export function usePickupCustomer() {
    const { currentUser, isVisitor } = useArena();
    const [customerName, setCustomerName] = useState(!isVisitor ? (currentUser?.name || '') : '');
    const [customerPhone, setCustomerPhone] = useState(!isVisitor ? (currentUser?.phone || '') : '');

    const userName = !isVisitor ? (currentUser?.name || '') : '';
    const userPhone = !isVisitor ? (currentUser?.phone || '') : '';
    useEffect(() => {
        if (userName) setCustomerName(prev => prev || userName);
        if (userPhone) setCustomerPhone(prev => prev || userPhone);
    }, [userName, userPhone]);

    return { customerName, setCustomerName, customerPhone, setCustomerPhone };
}
