'use client';
import { createContext, useContext } from 'react';

/**
 * Which partner record the investor portal is showing.
 * - Investors are fixed to their own record (`myInvestorId` from the server).
 * - Admins may switch between partners (`canSwitch`).
 * `activeInvestor` is null while data loads or when no partner is linked to the login.
 */
export const InvestorContext = createContext({
    activeInvestor: null,
    selectedInvestorId: '',
    setSelectedInvestorId: () => {},
    canSwitch: false,
    isLinked: false
});

export const useInvestor = () => useContext(InvestorContext);
