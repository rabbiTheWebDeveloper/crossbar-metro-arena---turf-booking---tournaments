'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getActiveSlotHolds, placeSlotHold, releaseSlotHold, saveCurrentUser, getStoredSMSLogs, logSMSNotification } from '../utils/storage';
import { DEFAULT_PRICING, VENUE_INFO, SCHEDULE_SLOTS_DEFINITION, BOOKING_ADDONS } from '../data/initialData';
import { cleanPhone } from '../lib/phone';
import { hasPermission } from '../lib/permissions';

const ArenaContext = createContext(undefined);

const VISITOR = { id: 'usr-visitor', name: 'Visitor', phone: '', role: 'visitor' };
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const AUTH_SYNC_KEY = 'cma_auth_sync';
const AUTH_ONLY_PATHS = new Set(['/login', '/register', '/signup', '/forgot-password', '/logout']);
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));
export { cleanPhone };

function readHydratedUserCookie() {
    if (typeof document === 'undefined') return null;
    try {
        const match = document.cookie.split('; ').find(row => row.startsWith('cma_user='));
        if (!match) return null;
        const raw = decodeURIComponent(match.slice('cma_user='.length));
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.role && parsed.role !== 'visitor') {
            return parsed;
        }
    } catch {
        // ignore malformed cookie
    }
    return null;
}

function clearClientUserCookie() {
    if (typeof document === 'undefined') return;
    document.cookie = 'cma_user=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

function broadcastAuthSync(role, id = '') {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify({ role, id, ts: Date.now() }));
    } catch {
        // ignore storage quota errors
    }
}

/** Dhaka calendar date (YYYY-MM-DD) for an ISO timestamp. */
const dhakaDate = (iso) => {
    if (!iso) return '';
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)); } catch { return String(iso).slice(0, 10); }
};
export const todayDhaka = () => dhakaDate(new Date().toISOString());

/** Money actually collected for a booking (only paid statuses count; nothing is invented). */
export const collectedAmount = (b) => {
    if (!b) return 0;
    if (b.paymentStatus === 'paid_full') return Number(b.totalPrice) || 0;
    if (b.paymentStatus === 'paid_advance' || b.paymentStatus === 'needs_refund') return Number(b.advanceAmount) || 0;
    return 0;
};

/** JSON fetch helper: never throws, always returns { ok, status, data } */
async function api(url, options = {}) {
    try {
        const res = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data, error: res.ok ? null : (data.error || `Request failed (${res.status})`) };
    } catch (e) {
        return { ok: false, status: 0, data: {}, error: 'Network error. Please check your connection and try again.' };
    }
}

const unwrap = (data, key) => {
    if (!data) return null;
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data[key])) return data[key];
    return null;
};
const upsert = (list, item, key = 'id') => {
    if (!item) return list;
    const exists = list.some(x => x[key] === item[key]);
    return exists ? list.map(x => (x[key] === item[key] ? item : x)) : [item, ...list];
};

export const ArenaProvider = ({ children }) => {
    const pathname = usePathname() || '/';
    const isAuthOnlyPage = AUTH_ONLY_PATHS.has(pathname.replace(/\/+$/, '') || '/');
    const fullDataLoadedKeyRef = useRef('');
    // Each data load gets a number; only the newest one may write state (stops a slow, older load
    // - e.g. the previous user's data after logout - from overwriting newer data).
    const loadSeqRef = useRef(0);
    // ---- Data (MongoDB is the single source of truth) ----
    const [bookings, setBookings] = useState([]);
    const [slotHolds, setSlotHolds] = useState([]);
    const [pricing, setPricing] = useState(DEFAULT_PRICING);
    const [expenses, setExpenses] = useState([]);
    const [investors, setInvestors] = useState([]);
    const [myInvestorId, setMyInvestorId] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [otherIncome, setOtherIncome] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matchResults, setMatchResults] = useState([]);
    const [myMatchResults, setMyMatchResults] = useState([]);
    const [shopProducts, setShopProducts] = useState([]);
    const [shopReservations, setShopReservations] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [myChallenges, setMyChallenges] = useState([]);
    const [galleryPhotos, setGalleryPhotos] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]); // staff roles (admin only)
    const [myCustomer, setMyCustomer] = useState(null); // the signed-in player's customer-list record
    const [customerSettings, setCustomerSettings] = useState(null); // their own preferences (null until loaded)
    const [currentUser, setCurrentUser] = useState(VISITOR);
    const [authChecked, setAuthChecked] = useState(false);
    const [smsLogs, setSmsLogs] = useState([]);
    const [siteSettings, setSiteSettings] = useState(VENUE_INFO);
    const [cartItems, setCartItems] = useState([]);
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [notice, setNotice] = useState(null); // { type: 'success'|'error'|'info', message }
    const [paymentGateways, setPaymentGateways] = useState({ eps: false, active: 'eps' });

    // ---- UI / modal state ----
    const [activeTicketPass, setActiveTicketPass] = useState(null);
    const [showSquadModal, setShowSquadModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showPassesDrawer, setShowPassesDrawer] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalInitialTab, setAuthModalInitialTab] = useState('login');
    const [showSSLCommerzModal, setShowSSLCommerzModal] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState(null);
    const [showHandoverGuide, setShowHandoverGuide] = useState(false);

    const role = currentUser?.role || 'visitor';
    const isVisitor = role === 'visitor';
    const isAdmin = role === 'admin';
    const isInvestor = role === 'investor';
    // Staff open the admin portal with the permissions of their staff role; admins hold every permission.
    const isStaff = role === 'staff';
    const canAccessAdmin = isAdmin || isStaff;
    const can = useCallback((permission) => hasPermission(currentUser, permission), [currentUser]);
    const noticeTimer = useRef(null);

    const showNotice = useCallback((type, message, ms = 4500) => {
        if (!message) return;
        setNotice({ type, message, id: Date.now() });
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(null), ms);
    }, []);

    // ---- Settings shape helpers ----
    const applySettings = useCallback((data) => {
        if (!data) return;
        if (data.settings) setSiteSettings(prev => ({ ...prev, ...data.settings }));
        if (data.paymentGateways) setPaymentGateways(data.paymentGateways);
        const p = data.pricing || data.settings;
        if (p) {
            setPricing(prev => ({
                ...prev,
                ...p,
                slotPrices: Array.isArray(p.slotPrices) && p.slotPrices.length === 12 ? p.slotPrices : (prev.slotPrices || SCHEDULE_SLOTS_DEFINITION),
                bookingAddOns: Array.isArray(p.bookingAddOns) ? p.bookingAddOns : (prev.bookingAddOns || BOOKING_ADDONS),
                weekendDays: Array.isArray(p.weekendDays) && p.weekendDays.length ? p.weekendDays : (prev.weekendDays || ['Friday', 'Saturday'])
            }));
        }
    }, []);

    // ---- Load data for the current role (permission-filtered & route-aware) ----
    const loadRealBackendData = useCallback(async (userOrRole = currentUser, { settingsOnly = false } = {}) => {
        const targetUser = typeof userOrRole === 'object' && userOrRole
            ? userOrRole
            : { ...(currentUser || VISITOR), role: String(userOrRole || role) };
        const userRole = targetUser.role || 'visitor';
        const seq = ++loadSeqRef.current;
        const isStale = () => seq !== loadSeqRef.current;

        setIsLoadingData(true);
        setLoadError('');
        const get = (url) => api(url);
        try {
            if (settingsOnly) {
                const sRes = await get('/api/settings');
                if (!isStale() && sRes.ok) applySettings(sRes.data);
                return;
            }

            fullDataLoadedKeyRef.current = `${userRole}:${targetUser.id || 'anon'}:${(targetUser.permissions || []).join(',')}`;

            const publicCalls = {
                settings: get('/api/settings'),
                bookings: get('/api/bookings'),
                events: get('/api/events'),
                products: get('/api/products'),
                gallery: get('/api/gallery'),
                results: get('/api/match-results'),
                teams: get('/api/teams'),
                challenges: get('/api/challenges')
            };
            const roleCalls = {};
            if (userRole === 'admin') {
                Object.assign(roleCalls, {
                    expenses: get('/api/expenses'),
                    investors: get('/api/investors'),
                    payouts: get('/api/payouts'),
                    refunds: get('/api/refunds'),
                    otherIncome: get('/api/other-income'),
                    shopOrders: get('/api/shop-orders'),
                    registrations: get('/api/registrations'),
                    users: get('/api/users?includeDisabled=1'),
                    roles: get('/api/roles'),
                    allResults: get('/api/match-results?status=all'),
                    allChallenges: get('/api/challenges?status=all')
                });
            } else if (userRole === 'staff') {
                // Only request admin endpoints granted to this staff member's role (zero 403 console noise)
                if (hasPermission(targetUser, ['finance', 'investors'])) {
                    roleCalls.expenses = get('/api/expenses');
                    roleCalls.investors = get('/api/investors');
                    roleCalls.payouts = get('/api/payouts');
                    roleCalls.otherIncome = get('/api/other-income');
                }
                if (hasPermission(targetUser, ['refunds', 'finance'])) {
                    roleCalls.refunds = get('/api/refunds');
                }
                if (hasPermission(targetUser, 'shop_orders')) {
                    roleCalls.shopOrders = get('/api/shop-orders');
                }
                if (hasPermission(targetUser, ['registrations', 'events'])) {
                    roleCalls.registrations = get('/api/registrations');
                }
                if (hasPermission(targetUser, ['players', 'investors'])) {
                    roleCalls.users = get('/api/users?includeDisabled=1');
                }
                if (hasPermission(targetUser, 'matches')) {
                    roleCalls.allResults = get('/api/match-results?status=all');
                    roleCalls.allChallenges = get('/api/challenges?status=all');
                }
            } else if (userRole === 'investor') {
                Object.assign(roleCalls, {
                    expenses: get('/api/expenses'), investors: get('/api/investors'), payouts: get('/api/payouts'),
                    refunds: get('/api/refunds'), otherIncome: get('/api/other-income')
                });
            } else if (userRole === 'player') {
                Object.assign(roleCalls, {
                    myBookings: get('/api/bookings?mine=1'), myResults: get('/api/match-results?mine=1'),
                    myChallenges: get('/api/challenges?mine=1'), myRegistrations: get('/api/registrations?mine=1'),
                    myOrders: get('/api/shop-orders?mine=1'), customerSettings: get('/api/customer/settings')
                });
            }
            const keys = [...Object.keys(publicCalls), ...Object.keys(roleCalls)];
            const results = await Promise.all([...Object.values(publicCalls), ...Object.values(roleCalls)]);
            if (isStale()) return;
            const r = Object.fromEntries(keys.map((k, i) => [k, results[i]]));
            const failed = keys.filter(k => !r[k].ok && r[k].status !== 401 && r[k].status !== 403);
            if (failed.length === keys.length) setLoadError('Could not reach the arena server. Showing limited data.');

            if (r.settings.ok) applySettings(r.settings.data);
            const pub = unwrap(r.bookings.data, 'bookings') || [];
            const mine = r.myBookings && r.myBookings.ok ? (unwrap(r.myBookings.data, 'bookings') || []) : [];
            if (r.bookings.ok || mine.length) {
                const map = new Map(pub.map(b => [b.id, b]));
                mine.forEach(b => map.set(b.id, b));
                setBookings([...map.values()]);
            }
            if (r.events.ok) setTournaments(unwrap(r.events.data, 'tournaments') || []);
            if (r.products.ok) setShopProducts(unwrap(r.products.data, 'products') || []);
            if (r.gallery.ok) setGalleryPhotos(unwrap(r.gallery.data, 'galleryPhotos') || []);
            if (r.allResults && r.allResults.ok) setMatchResults(unwrap(r.allResults.data, 'matchResults') || []);
            else if (r.results.ok) setMatchResults(unwrap(r.results.data, 'matchResults') || []);
            if (r.myResults && r.myResults.ok) setMyMatchResults(unwrap(r.myResults.data, 'matchResults') || []);
            if (r.teams.ok) setTeams(unwrap(r.teams.data, 'teams') || []);
            if (r.allChallenges && r.allChallenges.ok) setChallenges(unwrap(r.allChallenges.data, 'challenges') || []);
            else if (r.challenges.ok) setChallenges(unwrap(r.challenges.data, 'challenges') || []);
            if (r.myChallenges && r.myChallenges.ok) setMyChallenges(unwrap(r.myChallenges.data, 'challenges') || []);
            if (r.expenses && r.expenses.ok) setExpenses(unwrap(r.expenses.data, 'expenses') || []);
            if (r.investors && r.investors.ok) { setInvestors(unwrap(r.investors.data, 'investors') || []); setMyInvestorId(r.investors.data.myInvestorId || null); }
            if (r.payouts && r.payouts.ok) setPayouts(unwrap(r.payouts.data, 'payouts') || []);
            if (r.refunds && r.refunds.ok) setRefunds(unwrap(r.refunds.data, 'refunds') || []);
            if (r.otherIncome && r.otherIncome.ok) setOtherIncome(unwrap(r.otherIncome.data, 'otherIncome') || []);
            if (r.shopOrders && r.shopOrders.ok) setShopReservations(unwrap(r.shopOrders.data, 'reservations') || []);
            if (r.myOrders && r.myOrders.ok) setShopReservations(unwrap(r.myOrders.data, 'reservations') || []);
            if (r.registrations && r.registrations.ok) setRegistrations(unwrap(r.registrations.data, 'registrations') || []);
            if (r.myRegistrations && r.myRegistrations.ok) setRegistrations(unwrap(r.myRegistrations.data, 'registrations') || []);
            if (r.users && r.users.ok) setUsers(unwrap(r.users.data, 'users') || []);
            if (r.roles && r.roles.ok) setRoles(unwrap(r.roles.data, 'roles') || []);
            if (r.customerSettings && r.customerSettings.ok) {
                setMyCustomer(r.customerSettings.data.customer || null);
                setCustomerSettings(r.customerSettings.data.settings || null);
            }
        } catch (err) {
            if (isStale()) return;
            console.warn('loadRealBackendData caught error:', err);
            setLoadError('Could not load arena data.');
        } finally {
            if (!isStale()) {
                setIsLoadingData(false);
                setIsInitialized(true);
            }
        }
    }, [currentUser, role, applySettings]);

    // ---- Boot: fast-hydrate cookie immediately, then verify /api/auth/me in parallel with data ----
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setSlotHolds(getActiveSlotHolds());
            setSmsLogs(getStoredSMSLogs());
            try { const c = JSON.parse(localStorage.getItem('cma_cart_v1') || '[]'); if (Array.isArray(c)) setCartItems(c); } catch { /* ignore */ }

            const hydrated = readHydratedUserCookie();
            if (hydrated) {
                setCurrentUser(hydrated);
            }

            // Start the data load and the session check together, but release the auth gate as soon as
            // /api/auth/me answers so the panels render without waiting for every data endpoint.
            const initialTarget = hydrated || VISITOR;
            const dataPromise = loadRealBackendData(initialTarget, { settingsOnly: isAuthOnlyPage });
            const me = await api('/api/auth/me');
            if (cancelled) return;

            const verifiedUser = me.ok && me.data.authenticated && me.data.user ? me.data.user : VISITOR;
            if (verifiedUser.role === 'visitor') {
                clearClientUserCookie();
            }
            setCurrentUser(verifiedUser);
            saveCurrentUser(verifiedUser);
            setAuthChecked(true);

            await dataPromise;
            if (cancelled) return;
            const expectedKey = `${verifiedUser.role}:${verifiedUser.id || 'anon'}:${(verifiedUser.permissions || []).join(',')}`;
            if (!isAuthOnlyPage && fullDataLoadedKeyRef.current !== expectedKey) {
                await loadRealBackendData(verifiedUser);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load full data automatically when navigating away from lightweight auth pages (/login -> dashboard or /)
    useEffect(() => {
        if (!authChecked || isAuthOnlyPage) return;
        const expectedKey = `${currentUser?.role || 'visitor'}:${currentUser?.id || 'anon'}:${(currentUser?.permissions || []).join(',')}`;
        if (fullDataLoadedKeyRef.current !== expectedKey) {
            loadRealBackendData(currentUser);
        }
    }, [pathname, isAuthOnlyPage, authChecked, currentUser, loadRealBackendData]);

    // Multi-tab auth sync & browser back-forward cache (bfcache) session verification
    useEffect(() => {
        const resetPrivateState = () => {
            setCurrentUser(VISITOR);
            saveCurrentUser(VISITOR);
            clearClientUserCookie();
            fullDataLoadedKeyRef.current = '';
            loadSeqRef.current += 1;
            setIsLoadingData(false);
            setUsers([]); setRoles([]); setExpenses([]); setInvestors([]); setPayouts([]); setRefunds([]);
            setOtherIncome([]); setShopReservations([]); setRegistrations([]); setMyMatchResults([]); setMyChallenges([]);
            setMyCustomer(null); setCustomerSettings(null); setActiveTicketPass(null);
        };

        const recheckSession = async () => {
            const me = await api('/api/auth/me');
            if (me.ok && me.data.authenticated && me.data.user) {
                setCurrentUser(me.data.user);
                saveCurrentUser(me.data.user);
            } else {
                resetPrivateState();
            }
        };

        const onStorage = (e) => {
            if (e.key !== AUTH_SYNC_KEY || !e.newValue) return;
            try {
                const payload = JSON.parse(e.newValue);
                if (payload.role === 'visitor') resetPrivateState();
                else recheckSession();
            } catch {
                // ignore
            }
        };

        const onPageShow = (e) => {
            if (e.persisted) recheckSession();
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener('pageshow', onPageShow);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('pageshow', onPageShow);
        };
    }, []);

    // Persist the cart only (per-device convenience)
    useEffect(() => {
        try { localStorage.setItem('cma_cart_v1', JSON.stringify(cartItems)); } catch { /* ignore */ }
    }, [cartItems]);

    // Local hold timer: only ticks while something is held, and only re-renders when the set changes
    useEffect(() => {
        if (slotHolds.length === 0) return undefined;
        const timer = setInterval(() => {
            const active = getActiveSlotHolds();
            setSlotHolds(prev => (prev.length === active.length && prev.every((h, i) => h.id === active[i]?.id) ? prev : active));
        }, 5000);
        return () => clearInterval(timer);
    }, [slotHolds.length]);

    // ---- Derived: my bookings (strict phone / userId match, never for visitors) ----
    const myBookings = useMemo(() => {
        if (isVisitor) return [];
        const phone = cleanPhone(currentUser.phone);
        const uid = String(currentUser.id || '');
        return bookings.filter(b => !b.isPublicView && ((phone && cleanPhone(b.captainPhone) === phone) || (uid && b.userId === uid)));
    }, [bookings, currentUser, isVisitor]);

    // Teams the signed-in user captains (server marks them with isMine; teams created this session carry captainPhone)
    const myTeams = useMemo(() => {
        if (isVisitor) return [];
        const phone = cleanPhone(currentUser.phone);
        return teams.filter(t => t.isMine || (phone && t.captainPhone && cleanPhone(t.captainPhone) === phone) || (currentUser.teamId && t.id === currentUser.teamId));
    }, [teams, currentUser, isVisitor]);

    // ---- Finance (monthly, cash basis) ----
    const calculateMonthlyFinance = useCallback((monthStr) => {
        const [year, month] = monthStr.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const inMonth = (iso) => String(iso || '').startsWith(monthStr);
        // Money: by the day it was collected (paidAt, else createdAt) in Dhaka time
        const paidMonthBookings = bookings.filter(b => !b.isPublicView && inMonth(dhakaDate(b.paidAt || b.createdAt)) && collectedAmount(b) > 0);
        const bookingPayments = paidMonthBookings.reduce((s, b) => s + collectedAmount(b), 0);
        const monthRefunds = refunds.filter(r => r.status === 'completed' && inMonth(r.refundedDate));
        const refundsAmount = monthRefunds.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        const bookingMoneyCollected = Math.max(0, bookingPayments - refundsAmount);
        const monthOtherIncome = otherIncome.filter(o => inMonth(o.date));
        const otherIncomeTotal = monthOtherIncome.reduce((s, o) => s + (Number(o.amount) || 0), 0);
        const totalRevenue = bookingMoneyCollected + otherIncomeTotal;
        const monthExpenses = expenses.filter(e => inMonth(e.date));
        const totalExpensesMonth = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const monthNetProfit = totalRevenue - totalExpensesMonth;
        const isLoss = monthNetProfit <= 0;
        const profitMargin = totalRevenue > 0 ? (monthNetProfit / totalRevenue) * 100 : 0;
        // Slots: by play date
        const playedMonthBookings = bookings.filter(b => inMonth(b.date) && b.paymentStatus !== 'cancelled' && b.paymentStatus !== 'pending_payment');
        const slotsBooked = playedMonthBookings.length;
        const occupancyRate = Math.min(100, (slotsBooked / (12 * daysInMonth)) * 100);
        const cancelledBookings = bookings.filter(b => inMonth(b.date) && b.paymentStatus === 'cancelled' && !b.isPublicView);
        const cancellationsCount = cancelledBookings.length;
        const cancellationsAmount = cancelledBookings.reduce((s, b) => s + (Number(b.advanceAmount) || 0), 0);
        const dueAmountTotal = playedMonthBookings.reduce((s, b) => s + (Number(b.dueAmount) || 0), 0);
        // Investor shares (active partners only)
        const monthPayouts = payouts.filter(p => p.month === monthStr);
        const investorShares = investors.filter(inv => (inv.status || 'active') === 'active').map(inv => {
            const shareAmount = isLoss ? 0 : Math.round((monthNetProfit * (Number(inv.sharePercentage) || 0)) / 100);
            const paidAmount = monthPayouts.filter(p => p.investorId === inv.id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
            return { investor: inv, shareAmount, percentage: Number(inv.sharePercentage) || 0, paidAmount, balance: Math.max(0, shareAmount - paidAmount), isPaid: shareAmount > 0 && paidAmount >= shareAmount };
        });
        const totalInvestorShare = investorShares.reduce((s, i) => s + i.shareAmount, 0);
        const ownersShare = monthNetProfit - totalInvestorShare;
        const slotsByDay = {};
        for (const b of playedMonthBookings) slotsByDay[b.date] = (slotsByDay[b.date] || 0) + 1;
        const incomeByDay = {};
        for (const b of paidMonthBookings) {
            const dKey = dhakaDate(b.paidAt || b.createdAt);
            incomeByDay[dKey] = (incomeByDay[dKey] || 0) + collectedAmount(b);
        }
        const expByDay = {};
        for (const e of monthExpenses) expByDay[e.date] = (expByDay[e.date] || 0) + (Number(e.amount) || 0);

        const dailyBreakdown = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;
            const dayIncome = incomeByDay[dayStr] || 0;
            const dayExp = expByDay[dayStr] || 0;
            dailyBreakdown.push({ date: dayStr, slotsBooked: slotsByDay[dayStr] || 0, moneyCollected: dayIncome, expenses: dayExp, net: dayIncome - dayExp });
        }
        const categoryTotals = {};
        monthExpenses.forEach(e => { categoryTotals[e.category || 'other'] = (categoryTotals[e.category || 'other'] || 0) + (Number(e.amount) || 0); });
        const expensesByCategory = Object.entries(categoryTotals).map(([cat, amt]) => ({ category: cat, amount: amt, percentage: totalExpensesMonth > 0 ? (amt / totalExpensesMonth) * 100 : 0 }));
        const sumSrc = (f) => monthOtherIncome.filter(f).reduce((s, o) => s + (Number(o.amount) || 0), 0);
        const pct = (a) => (totalRevenue > 0 ? (a / totalRevenue) * 100 : 0);
        const incomeBySource = [
            { key: 'bookings', source: 'Turf Slots Booking', amount: bookingMoneyCollected, percentage: pct(bookingMoneyCollected) },
            { key: 'shop_sales', source: 'Sports Shop Pickup Sales', amount: sumSrc(o => o.source === 'shop_sales'), percentage: pct(sumSrc(o => o.source === 'shop_sales')) },
            { key: 'event_fees', source: 'Tournament & Event Fees', amount: sumSrc(o => o.source === 'event_fees'), percentage: pct(sumSrc(o => o.source === 'event_fees')) },
            { key: 'other', source: 'Sponsorship & Other', amount: sumSrc(o => !['shop_sales', 'event_fees'].includes(o.source)), percentage: pct(sumSrc(o => !['shop_sales', 'event_fees'].includes(o.source))) }
        ];
        const slotCounts = {};
        playedMonthBookings.forEach(b => { slotCounts[b.slotNumber] = (slotCounts[b.slotNumber] || 0) + 1; });
        const popularSlotsRanking = (pricing.slotPrices || SCHEDULE_SLOTS_DEFINITION).map(s => ({ slotNumber: s.slotNumber, displayTime: s.displayTime, count: slotCounts[s.slotNumber] || 0 })).sort((a, b) => b.count - a.count);
        return { month: monthStr, bookingMoneyCollected, otherIncomeTotal, totalRevenue, totalExpenses: totalExpensesMonth, netProfit: monthNetProfit, isLossMonth: isLoss, profitMargin, slotsBooked, occupancyRate, cancellationsCount, cancellationsAmount, refundsAmount, dueAmountTotal, investorShares, totalInvestorShare, ownersShare, dailyBreakdown, expensesByCategory, incomeBySource, popularSlotsRanking };
    }, [bookings, otherIncome, refunds, expenses, investors, payouts, pricing]);

    const currentMonthFinance = useMemo(() => calculateMonthlyFinance(todayDhaka().slice(0, 7)), [calculateMonthlyFinance]);
    const activeBookingAddOns = useMemo(
        () => (Array.isArray(pricing?.bookingAddOns) ? pricing.bookingAddOns : BOOKING_ADDONS).filter(a => a && a.enabled !== false),
        [pricing?.bookingAddOns]
    );
    const grossRevenue = currentMonthFinance.totalRevenue;
    const totalExpenses = currentMonthFinance.totalExpenses;
    const netProfit = currentMonthFinance.netProfit;
    const isLossMonth = currentMonthFinance.isLossMonth;

    // ---- Auth ----
    const login = useCallback(async (identifier, password) => {
        const r = await api('/api/auth/login', { method: 'POST', body: { identifier, password } });
        if (r.ok && r.data.user) {
            setCurrentUser(r.data.user);
            saveCurrentUser(r.data.user);
            setAuthChecked(true);
            broadcastAuthSync(r.data.user.role, r.data.user.id);
            loadRealBackendData(r.data.user);
            return { success: true, message: r.data.message, user: r.data.user };
        }
        return { success: false, message: r.error || 'Login failed' };
    }, [loadRealBackendData]);

    const signup = useCallback(async (data) => {
        const r = await api('/api/auth/register', { method: 'POST', body: data });
        if (r.ok && r.data.user) {
            setCurrentUser(r.data.user);
            saveCurrentUser(r.data.user);
            setAuthChecked(true);
            broadcastAuthSync(r.data.user.role, r.data.user.id);
            loadRealBackendData(r.data.user);
            return { success: true, message: r.data.message, user: r.data.user };
        }
        return { success: false, message: r.error || 'Registration failed' };
    }, [loadRealBackendData]);

    const logout = useCallback(async () => {
        clearClientUserCookie();
        setCurrentUser(VISITOR);
        saveCurrentUser(VISITOR);
        fullDataLoadedKeyRef.current = '';
        loadSeqRef.current += 1;
        setIsLoadingData(false);
        setUsers([]); setRoles([]); setExpenses([]); setInvestors([]); setPayouts([]); setRefunds([]); setOtherIncome([]); setShopReservations([]); setRegistrations([]); setMyMatchResults([]); setMyChallenges([]);
        setMyCustomer(null); setCustomerSettings(null); setActiveTicketPass(null);
        broadcastAuthSync('visitor', '');
        await api('/api/auth/logout', { method: 'POST' });
    }, []);

    /** Demo role switching only works when NEXT_PUBLIC_DEMO_MODE=true (never in production). */
    const switchDemoUser = useCallback(async (targetRole) => {
        if (!DEMO_MODE) {
            showNotice('info', 'Demo accounts are disabled on this site. Please log in with your own account.');
            return { success: false };
        }
        if (targetRole === 'visitor') { await logout(); return { success: true }; }
        const demo = { admin: '01711223344', investor: '01819556677', player: '01844332211' }[targetRole];
        if (!demo) return { success: false };
        return login(demo, 'password123');
    }, [login, logout, showNotice]);

    const resetPasswordSMS = useCallback(async () => ({
        success: false,
        message: 'Password reset by SMS is not available yet. Please contact the arena desk on WhatsApp to reset your password.'
    }), []);

    const handleUpdateProfile = useCallback(async (patch) => {
        const r = await api('/api/auth/me', { method: 'PUT', body: patch });
        if (r.ok && r.data.user) { setCurrentUser(r.data.user); saveCurrentUser(r.data.user); showNotice('success', r.data.message || 'Profile updated'); return { ok: true, user: r.data.user }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleChangePassword = useCallback(async (currentPassword, newPassword) => {
        const r = await api('/api/auth/me', { method: 'PUT', body: { currentPassword, newPassword } });
        if (r.ok) { showNotice('success', 'Password changed'); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleSendEmailVerification = useCallback(async (email) => {
        const r = await api('/api/auth/verify-email/send', { method: 'POST', body: email ? { email } : {} });
        if (r.ok) {
            if (r.data?.email && currentUser && r.data.email !== currentUser.email) {
                const updated = { ...currentUser, email: r.data.email, emailVerified: false, emailVerifiedAt: null };
                setCurrentUser(updated);
                saveCurrentUser(updated);
            }
            return { ok: true, message: r.data?.message || 'Verification code sent.', alreadyVerified: Boolean(r.data?.alreadyVerified), email: r.data?.email };
        }
        return { ok: false, error: r.error || 'Could not send verification code.' };
    }, [currentUser]);

    const handleConfirmEmailVerification = useCallback(async (code) => {
        const r = await api('/api/auth/verify-email/confirm', { method: 'POST', body: { code } });
        if (r.ok && r.data?.user) {
            setCurrentUser(r.data.user);
            saveCurrentUser(r.data.user);
            showNotice('success', r.data.message || 'Email verified');
            return { ok: true, message: r.data.message, user: r.data.user };
        }
        return { ok: false, error: r.error || 'Verification failed.' };
    }, [showNotice]);

    /**
     * Save the player's own preferences and/or their area: { settings?: { preferredChannel, notifications, bookingDefaults }, profile?: { area } }.
     * The server returns what it stored, which replaces the local copy.
     */
    const handleSaveCustomerSettings = useCallback(async (patch) => {
        const r = await api('/api/customer/settings', { method: 'PUT', body: patch });
        if (r.ok) {
            if (r.data.customer) setMyCustomer(r.data.customer);
            if (r.data.settings) setCustomerSettings(r.data.settings);
            showNotice('success', r.data.message || 'Settings saved');
            return { ok: true, settings: r.data.settings, customer: r.data.customer };
        }
        showNotice('error', r.error);
        return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Admin: users ----
    const refreshUsers = useCallback(async () => {
        const r = await api('/api/users?includeDisabled=1');
        if (r.ok) setUsers(unwrap(r.data, 'users') || []);
    }, []);
    const handleAdminUpdateUser = useCallback(async (id, patch) => {
        const r = await api(`/api/users/${id}`, { method: 'PATCH', body: patch });
        if (!r.ok) throw new Error(r.error);
        setUsers(prev => prev.map(u => (u.id === id ? r.data.user : u)));
        return r.data.user;
    }, []);
    const handleCreateUser = useCallback(async (data) => {
        const r = await api('/api/users', { method: 'POST', body: data });
        if (r.ok && r.data.user) { setUsers(prev => [r.data.user, ...prev]); showNotice('success', r.data.message || 'Account created'); return { ok: true, user: r.data.user }; }
        return { ok: false, error: r.error };
    }, [showNotice]);
    /** Permanently remove a login (admin only). Bookings and payouts made by the person are kept. */
    const handleDeleteUser = useCallback(async (id) => {
        const r = await api(`/api/users/${id}?permanent=1`, { method: 'DELETE' });
        if (r.ok) { setUsers(prev => prev.filter(u => u.id !== id)); setInvestors(prev => prev.map(i => (i.userId === id ? { ...i, userId: '' } : i))); showNotice('success', r.data.message || 'Account deleted'); return { ok: true }; }
        return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Admin: staff roles ----
    const refreshRoles = useCallback(async () => {
        const r = await api('/api/roles');
        if (r.ok) setRoles(unwrap(r.data, 'roles') || []);
    }, []);
    /** Create (no id) or update a staff role: { id?, name, description, permissions } */
    const handleSaveRole = useCallback(async ({ id, ...data }) => {
        const r = id ? await api(`/api/roles/${id}`, { method: 'PUT', body: data }) : await api('/api/roles', { method: 'POST', body: data });
        if (r.ok && r.data.role) {
            setRoles(prev => (id ? prev.map(x => (x.id === id ? r.data.role : x)) : [...prev, r.data.role]).sort((a, b) => a.name.localeCompare(b.name)));
            // Staff rows show the role name, so keep them in step with a rename
            if (id) setUsers(prev => prev.map(u => (u.staffRoleId === id ? { ...u, staffRoleName: r.data.role.name } : u)));
            showNotice('success', r.data.message || 'Role saved');
            return { ok: true, role: r.data.role };
        }
        return { ok: false, error: r.error };
    }, [showNotice]);
    const handleDeleteRole = useCallback(async (id) => {
        const r = await api(`/api/roles/${id}`, { method: 'DELETE' });
        if (r.ok) { setRoles(prev => prev.filter(x => x.id !== id)); showNotice('success', r.data.message || 'Role deleted'); return { ok: true }; }
        return { ok: false, error: r.error };
    }, [showNotice]);

    const handleUpdateUserRole = useCallback((userId, newRole) => handleAdminUpdateUser(userId, { role: newRole }).catch(e => showNotice('error', e.message)), [handleAdminUpdateUser, showNotice]);
    const handleToggleUserDisabled = useCallback((userId) => {
        const u = users.find(x => x.id === userId);
        return handleAdminUpdateUser(userId, { disabled: !u?.disabled }).catch(e => showNotice('error', e.message));
    }, [users, handleAdminUpdateUser, showNotice]);

    // ---- SMS log (local record of notifications the system intends to send) ----
    const sendSMSNotification = useCallback((phone, message, event) => {
        const sms = { id: `sms-${Date.now()}`, recipientPhone: cleanPhone(phone), message, event, provider: 'queued', sentAt: new Date().toISOString(), status: 'queued' };
        setSmsLogs(logSMSNotification(sms));
    }, []);

    // ---- Bookings ----
    const refreshBookings = useCallback(async () => {
        const [pub, mine] = await Promise.all([api('/api/bookings'), role === 'player' ? api('/api/bookings?mine=1') : Promise.resolve({ ok: false })]);
        if (pub.ok) {
            const map = new Map((unwrap(pub.data, 'bookings') || []).map(b => [b.id, b]));
            if (mine.ok) (unwrap(mine.data, 'bookings') || []).forEach(b => map.set(b.id, b));
            setBookings([...map.values()]);
        }
    }, [role]);

    /** Admin counter / walk-in booking. Server computes price unless courtPrice is given. */
    const handleBookingSuccess = useCallback(async (newBooking) => {
        const r = await api('/api/bookings', { method: 'POST', body: newBooking });
        if (r.ok && r.data.booking) {
            setBookings(prev => upsert(prev, r.data.booking));
            setActiveTicketPass(r.data.booking);
            const b = r.data.booking;
            sendSMSNotification(b.captainPhone, `Crossbar Metro: Booking ${b.bookingCode} confirmed for ${b.date} (${b.displayTime}). Paid: ৳${(b.advanceAmount || 0).toLocaleString()}, Due: ৳${(b.dueAmount || 0).toLocaleString()}.`, 'booking_confirmed');
            showNotice('success', r.data.message || 'Booking confirmed');
            return { ok: true, booking: b };
        }
        showNotice('error', r.error);
        return { ok: false, error: r.error };
    }, [sendSMSNotification, showNotice]);

    /** Public online booking: creates a server-priced payment hold and returns the EPS gateway URL. */
    const startOnlinePayment = useCallback(async (pendingBooking) => {
        const r = await api('/api/payment/eps/init', { method: 'POST', body: { pendingBooking } });
        if (r.ok && r.data.gatewayUrl) return { ok: true, ...r.data };
        return { ok: false, error: r.error || 'Could not start payment' };
    }, []);

    /** Look up a booking by code (optionally with phone or gateway tranId for full details). */
    const lookupBooking = useCallback(async (code, phone, tranId) => {
        const qs = new URLSearchParams();
        if (phone) qs.set('phone', phone);
        if (tranId) qs.set('tranId', tranId);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        const r = await api(`/api/bookings/${encodeURIComponent(code)}${suffix}`);
        return r.ok ? { ok: true, booking: r.data.booking } : { ok: false, error: r.error };
    }, []);

    const handlePlaceSlotHold = useCallback((courtId, date, slotNumber, teamName) => {
        const hold = placeSlotHold(courtId, date, slotNumber, teamName, pricing.holdMinutes || 10);
        setSlotHolds(getActiveSlotHolds());
        return hold;
    }, [pricing.holdMinutes]);
    const handleReleaseSlotHold = useCallback((courtId, date, slotNumber) => {
        releaseSlotHold(courtId, date, slotNumber);
        setSlotHolds(getActiveSlotHolds());
    }, []);

    const handleUpdateBookingStatus = useCallback(async (id, status, collectedCash) => {
        const body = {};
        if (collectedCash && Number(collectedCash) > 0) body.collectedCash = Number(collectedCash);
        else if (status) body.status = status;
        if (status === 'played') { body.played = true; delete body.status; }
        const r = await api(`/api/bookings/${id}`, { method: 'PATCH', body });
        if (r.ok && r.data.booking) { setBookings(prev => upsert(prev, r.data.booking)); return { ok: true, booking: r.data.booking }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleMarkPlayed = useCallback(async (id, played = true) => {
        const r = await api(`/api/bookings/${id}`, { method: 'PATCH', body: { played } });
        if (r.ok && r.data.booking) { setBookings(prev => upsert(prev, r.data.booking)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleCancelBooking = useCallback(async (id) => {
        const r = await api(`/api/bookings/${id}`, { method: 'DELETE' });
        if (r.ok) {
            if (r.data.booking) setBookings(prev => upsert(prev, r.data.booking));
            if (r.data.refund) setRefunds(prev => upsert(prev, r.data.refund));
            const b = r.data.booking;
            if (b) sendSMSNotification(b.captainPhone, `Crossbar Metro: Booking ${b.bookingCode} on ${b.date} was cancelled.${r.data.refund ? ` ৳${r.data.refund.amount} queued for refund.` : ''}`, 'booking_cancelled');
            showNotice('success', r.data.message || 'Booking cancelled');
            return { ok: true, booking: b, refund: r.data.refund };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [sendSMSNotification, showNotice]);

    const handleCreateRecurringBookings = useCallback(async (payload) => {
        const r = await api('/api/bookings/bulk', { method: 'POST', body: payload });
        if (!r.ok) { const err = new Error(r.error); err.data = r.data; throw err; }
        if (!payload.dryRun && Array.isArray(r.data.bookings) && r.data.bookings.length) {
            setBookings(prev => { const codes = new Set(r.data.bookings.map(b => b.bookingCode)); return [...r.data.bookings, ...prev.filter(b => !codes.has(b.bookingCode))]; });
            const first = r.data.bookings[0];
            sendSMSNotification(first.captainPhone, `Crossbar Metro: ${r.data.bookings.length} fixed slots confirmed for ${first.teamName} (${first.displayTime}) from ${r.data.summary?.firstDate} to ${r.data.summary?.lastDate}.`, 'booking_confirmed');
            showNotice('success', r.data.message || `${r.data.bookings.length} bookings created`);
        }
        return r.data;
    }, [sendSMSNotification, showNotice]);
    const handleCancelSeries = useCallback(async (seriesId, scope = 'upcoming') => {
        const r = await api(`/api/bookings/bulk?seriesId=${encodeURIComponent(seriesId)}&scope=${scope}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(r.error);
        await refreshBookings();
        showNotice('success', r.data.message || 'Series cancelled');
        return r.data;
    }, [refreshBookings, showNotice]);

    // ---- Finance (admin) ----
    const handleRecordRefund = useCallback(async (refundId, amount, method, transactionRef, status = 'completed') => {
        const r = await api(`/api/refunds/${refundId}`, { method: 'PATCH', body: { amount, refundMethod: method, transactionRef, status, recordedBy: currentUser?.name || 'Admin Desk' } });
        if (r.ok && r.data.refund) { setRefunds(prev => upsert(prev, r.data.refund)); showNotice('success', 'Refund updated'); return { ok: true, refund: r.data.refund }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [currentUser, showNotice]);

    const handleRecordPayout = useCallback(async (payout) => {
        const r = await api('/api/payouts', { method: 'POST', body: payout });
        if (r.ok && r.data.payout) {
            setPayouts(prev => upsert(prev, r.data.payout));
            if (Array.isArray(r.data.investors)) setInvestors(r.data.investors);
            showNotice('success', r.data.message || 'Payout recorded');
            return { ok: true, payout: r.data.payout };
        }
        if (r.status !== 409) showNotice('error', r.error);
        return { ok: false, error: r.error, status: r.status, paidSoFar: r.data.paidSoFar };
    }, [showNotice]);

    const handleAddOtherIncome = useCallback(async (income) => {
        const r = await api('/api/other-income', { method: 'POST', body: income });
        if (r.ok && r.data.otherIncome) { setOtherIncome(prev => upsert(prev, r.data.otherIncome)); showNotice('success', 'Income recorded'); return { ok: true, otherIncome: r.data.otherIncome }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleAddExpense = useCallback(async (expense) => {
        const r = await api('/api/expenses', { method: 'POST', body: expense });
        if (r.ok && r.data.expense) { setExpenses(prev => upsert(prev, r.data.expense)); showNotice('success', 'Expense recorded'); return { ok: true, expense: r.data.expense }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleDeleteExpense = useCallback(async (id) => {
        const r = await api(`/api/expenses/${id}`, { method: 'DELETE' });
        if (r.ok) { setExpenses(prev => prev.filter(e => e.id !== id)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleSavePricing = useCallback(async (newConfig) => {
        const r = await api('/api/settings', { method: 'PUT', body: newConfig });
        if (r.ok) { applySettings(r.data); showNotice('success', 'Pricing saved'); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [applySettings, showNotice]);

    const handleSaveSiteSettings = useCallback(async (settings) => {
        const r = await api('/api/settings', { method: 'PUT', body: settings });
        if (r.ok) { applySettings(r.data); showNotice('success', 'Settings saved'); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [applySettings, showNotice]);

    const handleSaveInvestors = useCallback(async (invs) => {
        const payload = (Array.isArray(invs) ? invs : [invs]).map(i => (isObjectId(i.id) ? i : { ...i, id: undefined, _id: undefined }));
        const r = await api('/api/investors', { method: 'POST', body: payload });
        if (r.ok && Array.isArray(r.data.investors)) {
            setInvestors(r.data.investors);
            if (r.data.user) setUsers(prev => upsert(prev, r.data.user));
            showNotice('success', r.data.message || 'Investors saved');
            return { ok: true, ...r.data };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleCreateInvestor = useCallback(async (data) => {
        const r = await api('/api/investors', { method: 'POST', body: data });
        if (r.ok) {
            if (Array.isArray(r.data.investors)) setInvestors(r.data.investors);
            else if (r.data.investor) setInvestors(prev => upsert(prev, r.data.investor));
            if (r.data.user) setUsers(prev => upsert(prev, r.data.user));
            const emailMsg = r.data.emailStatus?.sent ? ` Welcome email sent to ${r.data.emailStatus.toEmail}.` : '';
            showNotice('success', `${r.data.message || 'Investor partner added'}.${emailMsg}`);
            return { ok: true, ...r.data };
        }
        showNotice('error', r.error);
        return { ok: false, error: r.error };
    }, [showNotice]);

    const handleUpdateInvestor = useCallback(async (id, patch) => {
        const r = await api(`/api/investors/${id}`, { method: 'PUT', body: patch });
        if (r.ok && r.data.investor) {
            setInvestors(prev => upsert(prev, r.data.investor));
            if (r.data.user) setUsers(prev => upsert(prev, r.data.user));
            showNotice('success', r.data.message || 'Investor updated');
            return { ok: true, investor: r.data.investor, user: r.data.user || null };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    /** With { permanent: true } the partner is removed even when payouts exist (the payout history is kept). */
    const handleDeleteInvestor = useCallback(async (id, { permanent = false, deleteAccount = false } = {}) => {
        const qs = new URLSearchParams();
        if (permanent) qs.set('permanent', '1');
        if (deleteAccount) qs.set('deleteAccount', '1');
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        const r = await api(`/api/investors/${id}${suffix}`, { method: 'DELETE' });
        if (r.ok) {
            setInvestors(prev => (r.data.investor ? upsert(prev, r.data.investor) : prev.filter(i => i.id !== id)));
            if (r.data.deletedUserId) setUsers(prev => prev.filter(u => u.id !== r.data.deletedUserId));
            showNotice('success', r.data.message);
            return { ok: true, deletedUserId: r.data.deletedUserId || null };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    /** Investor email / password / login actions: resend_welcome | send_reset_code | reset_password | create_login */
    const handleInvestorMailAction = useCallback(async (id, payload) => {
        const r = await api(`/api/investors/${id}/mail`, { method: 'POST', body: payload });
        if (r.ok) {
            if (r.data.investor) setInvestors(prev => upsert(prev, r.data.investor));
            if (r.data.user) setUsers(prev => upsert(prev, r.data.user));
            showNotice('success', r.data.message || 'Done');
            return { ok: true, ...r.data };
        }
        showNotice('error', r.error);
        return { ok: false, error: r.error };
    }, [showNotice]);

    /** Partner's own payout preference. Admins pass `investorId` to save it on a partner's behalf. */
    const handleSaveInvestorSettings = useCallback(async (payoutDetails, investorId) => {
        const r = await api('/api/investors/settings', { method: 'PUT', body: { payoutDetails, ...(investorId ? { investorId } : {}) } });
        if (r.ok && r.data.investor) { setInvestors(prev => upsert(prev, r.data.investor)); showNotice('success', r.data.message || 'Payout preference saved'); return { ok: true, investor: r.data.investor }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Teams ----
    const handleSaveTeam =useCallback(async (team) => {
        const r = await api('/api/teams', { method: 'POST', body: team });
        if (r.ok && r.data.team) {
            setTeams(prev => upsert(prev, { ...r.data.team, isMine: true }));
            if (currentUser && !isObjectId(currentUser.teamId)) { const u = { ...currentUser, teamId: r.data.team.id }; setCurrentUser(u); saveCurrentUser(u); }
            showNotice('success', 'Team registered');
            return { ok: true, team: r.data.team };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [currentUser, showNotice]);

    const handleUpdateTeam = useCallback(async (teamId, patch) => {
        const r = await api(`/api/teams/${teamId}`, { method: 'PATCH', body: patch });
        if (r.ok && r.data.team) { setTeams(prev => upsert(prev, r.data.team)); return { ok: true, team: r.data.team }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);
    const handleAddPlayerToTeam = useCallback((teamId, player) => handleUpdateTeam(teamId, { newPlayer: player }), [handleUpdateTeam]);
    const handleRemovePlayerFromTeam = useCallback((teamId, playerId) => handleUpdateTeam(teamId, { removePlayerId: playerId }), [handleUpdateTeam]);
    const handleDeleteTeam = useCallback(async (teamId) => {
        const r = await api(`/api/teams/${teamId}`, { method: 'DELETE' });
        if (r.ok) { setTeams(prev => prev.filter(t => t.id !== teamId)); showNotice('success', 'Team deleted'); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Match results ----
    const handleSaveMatchResult = useCallback(async (result) => {
        const r = isObjectId(result.id)
            ? await api(`/api/match-results/${result.id}`, { method: 'PATCH', body: result })
            : await api('/api/match-results', { method: 'POST', body: { ...result, id: undefined } });
        if (r.ok && r.data.matchResult) {
            const mr = r.data.matchResult;
            setMatchResults(prev => (mr.status === 'published' || isAdmin ? upsert(prev, mr) : prev.filter(x => x.id !== mr.id)));
            setMyMatchResults(prev => upsert(prev, mr));
            if (mr.status === 'published') { const tr = await api('/api/teams'); if (tr.ok) setTeams(unwrap(tr.data, 'teams') || []); }
            showNotice('success', r.data.message || 'Result saved');
            return { ok: true, matchResult: mr, message: r.data.message };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [isAdmin, showNotice]);

    const handleDeleteMatchResult = useCallback(async (id) => {
        const r = await api(`/api/match-results/${id}`, { method: 'DELETE' });
        if (r.ok) { setMatchResults(prev => prev.filter(m => m.id !== id)); setMyMatchResults(prev => prev.filter(m => m.id !== id)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Shop ----
    const handleSaveShopProduct = useCallback(async (product) => {
        const body = isObjectId(product.id) ? product : { ...product, id: undefined, _id: undefined };
        const r = await api('/api/products', { method: 'POST', body });
        if (r.ok && r.data.product) { setShopProducts(prev => upsert(prev, r.data.product)); showNotice('success', r.data.message || 'Product saved'); return { ok: true, product: r.data.product }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);
    const handleDeleteShopProduct = useCallback(async (id) => {
        const r = await api(`/api/products/${id}`, { method: 'DELETE' });
        if (r.ok) { setShopProducts(prev => prev.filter(p => p.id !== id)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleSaveShopReservation = useCallback(async (reservation) => {
        const items = reservation.items && reservation.items.length
            ? reservation.items.map(i => ({ productId: i.productId || i.product?.id, quantity: i.quantity || 1, size: i.size || i.selectedSize || '' }))
            : [{ productId: reservation.productId, quantity: reservation.quantity || 1, size: reservation.size || '' }];
        const r = await api('/api/shop-orders', { method: 'POST', body: { customerName: reservation.customerName, customerPhone: reservation.customerPhone, items, pickupDate: reservation.pickupDate, notes: reservation.notes || '' } });
        if (r.ok && r.data.reservation) { setShopReservations(prev => upsert(prev, r.data.reservation)); return { ok: true, reservation: r.data.reservation }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    const handleUpdateShopReservationStatus = useCallback(async (id, status) => {
        const r = await api(`/api/shop-orders/${id}`, { method: 'PATCH', body: { status } });
        if (r.ok && r.data.reservation) {
            setShopReservations(prev => upsert(prev, r.data.reservation));
            const [prods, inc] = await Promise.all([api('/api/products'), api('/api/other-income')]);
            if (prods.ok) setShopProducts(unwrap(prods.data, 'products') || []);
            if (inc.ok) setOtherIncome(unwrap(inc.data, 'otherIncome') || []);
            return { ok: true, reservation: r.data.reservation };
        }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Tournaments & registrations ----
    const handleRegistrationSuccess = useCallback(async (newReg) => {
        const r = await api('/api/registrations', { method: 'POST', body: { ...newReg, id: undefined } });
        if (r.ok && r.data.registration) { setRegistrations(prev => upsert(prev, r.data.registration)); return { ok: true, registration: r.data.registration, message: r.data.message }; }
        return { ok: false, error: r.error };
    }, []);
    const handleUpdateRegistration = useCallback(async (id, patch) => {
        const r = await api(`/api/registrations/${id}`, { method: 'PATCH', body: patch });
        if (!r.ok) throw new Error(r.error);
        setRegistrations(prev => prev.map(x => (x.id === id ? r.data.registration : x)));
        const ev = await api('/api/events'); if (ev.ok) setTournaments(unwrap(ev.data, 'tournaments') || []);
        return r.data.registration;
    }, []);
    const handleDeleteRegistration = useCallback(async (id) => {
        const r = await api(`/api/registrations/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(r.error);
        setRegistrations(prev => prev.filter(x => x.id !== id));
        return r.data;
    }, []);
    const handleSaveTournament = useCallback(async (tournament) => {
        const r = isObjectId(tournament.id)
            ? await api(`/api/events/${tournament.id}`, { method: 'PATCH', body: tournament })
            : await api('/api/events', { method: 'POST', body: { ...tournament, id: undefined } });
        if (r.ok && r.data.tournament) { setTournaments(prev => upsert(prev, r.data.tournament)); showNotice('success', r.data.message || 'Tournament saved'); return { ok: true, tournament: r.data.tournament }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);
    const handleDeleteTournament = useCallback(async (id) => {
        const r = await api(`/api/events/${id}`, { method: 'DELETE' });
        if (r.ok) { setTournaments(prev => prev.filter(t => t.id !== id)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Challenges ----
    const handleAddChallenge = useCallback(async (newChallenge) => {
        const r = await api('/api/challenges', { method: 'POST', body: { ...newChallenge, id: undefined } });
        if (r.ok && r.data.challenge) { setChallenges(prev => upsert(prev, r.data.challenge)); setMyChallenges(prev => upsert(prev, r.data.challenge)); return { ok: true, challenge: r.data.challenge }; }
        if (r.status === 401) { setAuthModalInitialTab('login'); setShowAuthModal(true); }
        showNotice('error', r.error); return { ok: false, error: r.error, status: r.status };
    }, [showNotice]);
    const handleUpdateChallenge = useCallback(async (id, patch) => {
        const r = await api(`/api/challenges/${id}`, { method: 'PATCH', body: patch });
        if (r.ok && r.data.challenge) {
            const c = r.data.challenge;
            setChallenges(prev => (c.status === 'open' ? upsert(prev, c) : prev.filter(x => x.id !== id)));
            setMyChallenges(prev => upsert(prev, c));
            showNotice('success', r.data.message || 'Challenge updated');
            return { ok: true, challenge: c, message: r.data.message };
        }
        if (r.status === 401) { setAuthModalInitialTab('login'); setShowAuthModal(true); }
        showNotice('error', r.error); return { ok: false, error: r.error, status: r.status };
    }, [showNotice]);
    const handleDeleteChallenge = useCallback(async (id) => {
        const r = await api(`/api/challenges/${id}`, { method: 'DELETE' });
        if (r.ok) { setChallenges(prev => prev.filter(c => c.id !== id)); setMyChallenges(prev => prev.filter(c => c.id !== id)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);

    // ---- Gallery ----
    const handleSavePhoto = useCallback(async (photo) => {
        const body = isObjectId(photo.id) ? photo : { ...photo, id: undefined, _id: undefined };
        const r = await api('/api/gallery', { method: 'POST', body });
        if (r.ok && r.data.photo) { setGalleryPhotos(prev => upsert(prev, r.data.photo)); return { ok: true, photo: r.data.photo }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);
    const handleDeletePhoto = useCallback(async (id) => {
        const r = await api(`/api/gallery/${id}`, { method: 'DELETE' });
        if (r.ok) { setGalleryPhotos(prev => prev.filter(p => p.id !== id)); return { ok: true }; }
        showNotice('error', r.error); return { ok: false, error: r.error };
    }, [showNotice]);
    const handleToggleFeaturedPhoto = useCallback(async (id) => {
        const target = galleryPhotos.find(p => p.id === id);
        if (target) return handleSavePhoto({ ...target, featured: !target.featured });
        return { ok: false };
    }, [galleryPhotos, handleSavePhoto]);

    // ---- Cart ----
    const addToCart = useCallback((product, selectedSize, qty = 1) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.product.id === product.id && item.selectedSize === selectedSize);
            if (existing) return prev.map(item => (item === existing ? { ...item, quantity: Math.min(10, item.quantity + qty) } : item));
            return [...prev, { product, selectedSize, quantity: qty }];
        });
        setShowCartDrawer(true);
    }, []);
    const removeFromCart = useCallback((productId, size) => setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === size))), []);
    const clearCart = useCallback(() => setCartItems([]), []);

    // ---- Backup ----
    const exportDatabaseBackup = useCallback(() => {
        const fullBackup = { venue: 'Crossbar Metro Arena (bookcrossbar.com)', backupGeneratedAt: new Date().toISOString(), bookings, pricing, expenses, investors, payouts, refunds, otherIncome, teams, matchResults, shopProducts, shopReservations, tournaments, registrations, challenges, galleryPhotos, users, siteSettings };
        const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
        const a = document.createElement('a');
        a.setAttribute('href', jsonStr);
        a.setAttribute('download', `crossbar_metro_backup_${todayDhaka()}.json`);
        document.body.appendChild(a); a.click(); a.remove();
    }, [bookings, pricing, expenses, investors, payouts, refunds, otherIncome, teams, matchResults, shopProducts, shopReservations, tournaments, registrations, challenges, galleryPhotos, users, siteSettings]);
    const handleRestoreDatabase = useCallback(() => {
        showNotice('info', 'Restore from a JSON file is not supported. Backups are read-only exports; data lives in the MongoDB database.');
        return false;
    }, [showNotice]);

    const value = useMemo(() => ({
        bookings, myBookings, slotHolds, pricing, activeBookingAddOns, expenses, investors, myInvestorId, payouts, refunds, otherIncome, teams, myTeams, matchResults, myMatchResults,
        shopProducts, shopReservations, tournaments, registrations, challenges, myChallenges, galleryPhotos, users, roles, currentUser, authChecked,
        isVisitor, isAdmin, isInvestor, isStaff, canAccessAdmin, can, smsLogs, siteSettings, paymentGateways, isInitialized, isLoadingData, loadError, notice, showNotice, setNotice,
        cartItems, addToCart, removeFromCart, clearCart, showCartDrawer, setShowCartDrawer,
        grossRevenue, totalExpenses, netProfit, isLossMonth, currentMonthFinance, calculateMonthlyFinance,
        activeTicketPass, setActiveTicketPass, showSquadModal, setShowSquadModal, showAdminModal, setShowAdminModal,
        showPassesDrawer, setShowPassesDrawer, showInstallModal, setShowInstallModal, showAuthModal, setShowAuthModal,
        authModalInitialTab, setAuthModalInitialTab, showSSLCommerzModal, setShowSSLCommerzModal, pendingBookingData, setPendingBookingData,
        showHandoverGuide, setShowHandoverGuide,
        login, signup, logout, switchDemoUser, resetPasswordSMS, handleUpdateProfile, handleChangePassword, handleSendEmailVerification, handleConfirmEmailVerification, demoMode: DEMO_MODE,
        myCustomer, customerSettings, handleSaveCustomerSettings,
        handleUpdateUserRole, handleToggleUserDisabled, refreshUsers, handleAdminUpdateUser, handleCreateUser, handleDeleteUser,
        refreshRoles, handleSaveRole, handleDeleteRole,
        handleBookingSuccess, startOnlinePayment, lookupBooking, handlePlaceSlotHold, handleReleaseSlotHold, handleUpdateBookingStatus, handleMarkPlayed, handleCancelBooking,
        handleCreateRecurringBookings, handleCancelSeries, refreshBookings,
        handleRecordRefund, handleRecordPayout, handleAddOtherIncome, handleSavePricing, handleSaveSiteSettings, handleAddExpense, handleDeleteExpense,
        handleSaveInvestors, handleCreateInvestor, handleUpdateInvestor, handleDeleteInvestor, handleInvestorMailAction, handleSaveInvestorSettings,
        handleSaveTeam, handleUpdateTeam, handleAddPlayerToTeam, handleRemovePlayerFromTeam, handleDeleteTeam,
        handleSaveMatchResult, handleDeleteMatchResult,
        handleSaveShopProduct, handleDeleteShopProduct, handleSaveShopReservation, handleUpdateShopReservationStatus,
        handleRegistrationSuccess, handleUpdateRegistration, handleDeleteRegistration, handleSaveTournament, handleDeleteTournament,
        handleAddChallenge, handleUpdateChallenge, handleDeleteChallenge,
        handleSavePhoto, handleDeletePhoto, handleToggleFeaturedPhoto,
        sendSMSNotification, exportDatabaseBackup, handleRestoreDatabase, refreshData: loadRealBackendData
    }), [
        bookings, myBookings, slotHolds, pricing, activeBookingAddOns, expenses, investors, myInvestorId, payouts, refunds, otherIncome, teams, myTeams, matchResults, myMatchResults,
        shopProducts, shopReservations, tournaments, registrations, challenges, myChallenges, galleryPhotos, users, roles, currentUser, authChecked,
        isVisitor, isAdmin, isInvestor, isStaff, canAccessAdmin, can, smsLogs, siteSettings, paymentGateways, isInitialized, isLoadingData, loadError, notice, showNotice,
        cartItems, addToCart, removeFromCart, clearCart, showCartDrawer,
        grossRevenue, totalExpenses, netProfit, isLossMonth, currentMonthFinance, calculateMonthlyFinance,
        activeTicketPass, showSquadModal, showAdminModal, showPassesDrawer, showInstallModal, showAuthModal, authModalInitialTab,
        showSSLCommerzModal, pendingBookingData, showHandoverGuide,
        login, signup, logout, switchDemoUser, resetPasswordSMS, handleUpdateProfile, handleChangePassword, handleSendEmailVerification, handleConfirmEmailVerification,
        myCustomer, customerSettings, handleSaveCustomerSettings,
        handleUpdateUserRole, handleToggleUserDisabled, refreshUsers, handleAdminUpdateUser, handleCreateUser, handleDeleteUser,
        refreshRoles, handleSaveRole, handleDeleteRole,
        handleBookingSuccess, startOnlinePayment, lookupBooking, handlePlaceSlotHold, handleReleaseSlotHold, handleUpdateBookingStatus, handleMarkPlayed, handleCancelBooking,
        handleCreateRecurringBookings, handleCancelSeries, refreshBookings,
        handleRecordRefund, handleRecordPayout, handleAddOtherIncome, handleSavePricing, handleSaveSiteSettings, handleAddExpense, handleDeleteExpense,
        handleSaveInvestors, handleCreateInvestor, handleUpdateInvestor, handleDeleteInvestor, handleInvestorMailAction, handleSaveInvestorSettings,
        handleSaveTeam, handleUpdateTeam, handleAddPlayerToTeam, handleRemovePlayerFromTeam, handleDeleteTeam,
        handleSaveMatchResult, handleDeleteMatchResult,
        handleSaveShopProduct, handleDeleteShopProduct, handleSaveShopReservation, handleUpdateShopReservationStatus,
        handleRegistrationSuccess, handleUpdateRegistration, handleDeleteRegistration, handleSaveTournament, handleDeleteTournament,
        handleAddChallenge, handleUpdateChallenge, handleDeleteChallenge,
        handleSavePhoto, handleDeletePhoto, handleToggleFeaturedPhoto,
        sendSMSNotification, exportDatabaseBackup, handleRestoreDatabase, loadRealBackendData
    ]);

    return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>;
};

export const useArena = () => {
    const context = useContext(ArenaContext);
    if (!context) {
        throw new Error('useArena must be used within an ArenaProvider');
    }
    return context;
};
