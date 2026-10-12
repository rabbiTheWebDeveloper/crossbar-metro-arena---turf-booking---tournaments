'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getStoredBookings, saveBooking, updateBookingStatus, cancelBooking, getStoredTournaments, getStoredRegistrations, saveTournamentRegistration, getStoredChallenges, saveChallenge, getStoredPricing, savePricing, getStoredExpenses, saveExpense, deleteExpense, getStoredInvestors, saveInvestors, getStoredTeams, saveTeam, addPlayerToTeam, getStoredMatchResults, saveMatchResult, getStoredShopProducts, saveShopProduct, getStoredShopReservations, saveShopReservation, updateShopReservationStatus, getActiveSlotHolds, placeSlotHold, releaseSlotHold, getStoredUsers, saveUser, getStoredCurrentUser, saveCurrentUser, getStoredPayouts, savePayout, getStoredRefunds, getStoredOtherIncome, saveOtherIncome, getStoredSMSLogs, logSMSNotification, getStoredSiteSettings, saveSiteSettings, getStoredGalleryPhotos, saveGalleryPhoto, deleteStoredGalleryPhoto, restoreDatabaseBackup } from '../utils/storage';
import { INITIAL_BOOKINGS, INITIAL_TOURNAMENTS, INITIAL_COMMUNITY_CHALLENGES, DEFAULT_PRICING, INITIAL_EXPENSES, INITIAL_INVESTORS, INITIAL_TEAMS, INITIAL_MATCH_RESULTS, INITIAL_USERS, INITIAL_PAYOUTS, INITIAL_REFUNDS, INITIAL_OTHER_INCOME, INITIAL_SHOP_PRODUCTS, INITIAL_SMS_LOGS, VENUE_INFO, INITIAL_GALLERY_PHOTOS } from '../data/initialData';
const ArenaContext = createContext(undefined);
export const ArenaProvider = ({ children }) => {
    const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
    const [slotHolds, setSlotHolds] = useState([]);
    const [pricing, setPricing] = useState(DEFAULT_PRICING);
    const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
    const [investors, setInvestors] = useState(INITIAL_INVESTORS);
    const [payouts, setPayouts] = useState(INITIAL_PAYOUTS);
    const [refunds, setRefunds] = useState(INITIAL_REFUNDS);
    const [otherIncome, setOtherIncome] = useState(INITIAL_OTHER_INCOME);
    const [teams, setTeams] = useState(INITIAL_TEAMS);
    const [matchResults, setMatchResults] = useState(INITIAL_MATCH_RESULTS);
    const [shopProducts, setShopProducts] = useState(INITIAL_SHOP_PRODUCTS);
    const [shopReservations, setShopReservations] = useState([]);
    const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
    const [registrations, setRegistrations] = useState([]);
    const [challenges, setChallenges] = useState(INITIAL_COMMUNITY_CHALLENGES);
    const [galleryPhotos, setGalleryPhotos] = useState(INITIAL_GALLERY_PHOTOS);
    const [users, setUsers] = useState(INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState(() => getStoredCurrentUser());
    const [smsLogs, setSmsLogs] = useState(INITIAL_SMS_LOGS);
    const [siteSettings, setSiteSettings] = useState(VENUE_INFO);
    const [cartItems, setCartItems] = useState([]);
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    // Modals state
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

    // Fetch authoritative live data from MongoDB backend API routes
    const loadRealBackendData = useCallback(async () => {
        try {
            const fetchJson = async (url) => {
                try {
                    const res = await fetch(url);
                    if (res.ok) return await res.json();
                } catch (e) {
                    console.warn(`Fetch ${url} failed:`, e);
                }
                return null;
            };

            const [
                bookingsData,
                settingsData,
                expensesData,
                investorsData,
                payoutsData,
                refundsData,
                otherIncomeData,
                teamsData,
                matchResultsData,
                productsData,
                shopOrdersData,
                eventsData,
                registrationsData,
                galleryData,
                challengesData,
                usersData
            ] = await Promise.all([
                fetchJson('/api/bookings'),
                fetchJson('/api/settings'),
                fetchJson('/api/expenses'),
                fetchJson('/api/investors'),
                fetchJson('/api/payouts'),
                fetchJson('/api/refunds'),
                fetchJson('/api/other-income'),
                fetchJson('/api/teams'),
                fetchJson('/api/match-results'),
                fetchJson('/api/products'),
                fetchJson('/api/shop-orders'),
                fetchJson('/api/events'),
                fetchJson('/api/registrations'),
                fetchJson('/api/gallery'),
                fetchJson('/api/challenges'),
                fetchJson('/api/users')
            ]);

            const unwrap = (data, key) => {
                if (!data) return [];
                if (Array.isArray(data)) return data;
                if (key && Array.isArray(data[key])) return data[key];
                return [];
            };

            if (bookingsData) setBookings(unwrap(bookingsData, 'bookings'));

            if (settingsData) {
                if (settingsData.pricing) setPricing(settingsData.pricing);
                if (settingsData.settings) setSiteSettings(settingsData.settings);
            }

            if (expensesData) setExpenses(unwrap(expensesData, 'expenses'));
            if (investorsData) setInvestors(unwrap(investorsData, 'investors'));
            if (payoutsData) setPayouts(unwrap(payoutsData, 'payouts'));
            if (refundsData) setRefunds(unwrap(refundsData, 'refunds'));
            if (otherIncomeData) setOtherIncome(unwrap(otherIncomeData, 'otherIncome'));
            if (teamsData) setTeams(unwrap(teamsData, 'teams'));
            if (matchResultsData) setMatchResults(unwrap(matchResultsData, 'matchResults'));
            if (productsData) setShopProducts(unwrap(productsData, 'products'));
            if (shopOrdersData) setShopReservations(unwrap(shopOrdersData, 'reservations'));
            if (eventsData) setTournaments(unwrap(eventsData, 'tournaments'));
            if (registrationsData) setRegistrations(unwrap(registrationsData, 'registrations'));
            if (galleryData) setGalleryPhotos(unwrap(galleryData, 'galleryPhotos'));
            if (challengesData) setChallenges(unwrap(challengesData, 'challenges'));
            if (usersData) setUsers(unwrap(usersData, 'users'));
        } catch (err) {
            console.warn('loadRealBackendData caught error:', err);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    // Load initial data and trigger backend live data sync
    useEffect(() => {
        setBookings(getStoredBookings());
        setSlotHolds(getActiveSlotHolds());
        setPricing(getStoredPricing());
        setExpenses(getStoredExpenses());
        setInvestors(getStoredInvestors());
        setPayouts(getStoredPayouts());
        setRefunds(getStoredRefunds());
        setOtherIncome(getStoredOtherIncome());
        setTeams(getStoredTeams());
        setMatchResults(getStoredMatchResults());
        setShopProducts(getStoredShopProducts());
        setShopReservations(getStoredShopReservations());
        setTournaments(getStoredTournaments());
        setRegistrations(getStoredRegistrations());
        setChallenges(getStoredChallenges());
        setGalleryPhotos(getStoredGalleryPhotos());
        setUsers(getStoredUsers());
        setCurrentUser(getStoredCurrentUser());
        setSmsLogs(getStoredSMSLogs());
        setSiteSettings(getStoredSiteSettings());
        setIsInitialized(true);

        // Fetch live MongoDB records
        loadRealBackendData();

        // Check if real database auth cookie exists
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated && data.user) {
                    setCurrentUser(data.user);
                    saveCurrentUser(data.user);
                } else if (data.authenticated === false) {
                    const visitor = {
                        id: 'usr-visitor',
                        name: 'Visitor',
                        phone: '',
                        role: 'visitor',
                        createdAt: new Date().toISOString()
                    };
                    setCurrentUser(visitor);
                    saveCurrentUser(visitor);
                }
            })
            .catch(() => { });
    }, [loadRealBackendData]);
    // 10-minute hold ticker: check every 5 seconds to auto-release expired holds
    useEffect(() => {
        const timer = setInterval(() => {
            const active = getActiveSlotHolds();
            setSlotHolds(active);
        }, 5000);
        return () => clearInterval(timer);
    }, []);
    // Current Overall Financial calculations
    const grossRevenue = useMemo(() => {
        const bookingRevenue = bookings.reduce((sum, b) => {
            if (b.paymentStatus === 'paid_full')
                return sum + b.totalPrice;
            if (b.paymentStatus === 'paid_advance')
                return sum + (b.advanceAmount || 500);
            return sum;
        }, 0);
        const otherTotal = otherIncome.reduce((sum, o) => sum + o.amount, 0);
        const refundsTotal = refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
        return Math.max(0, bookingRevenue + otherTotal - refundsTotal);
    }, [bookings, otherIncome, refunds]);
    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);
    const netProfit = useMemo(() => {
        return grossRevenue - totalExpenses;
    }, [grossRevenue, totalExpenses]);
    const isLossMonth = useMemo(() => {
        return netProfit <= 0;
    }, [netProfit]);
    // Exact Section 8 Monthly Financial Report Formula
    const calculateMonthlyFinance = useCallback((monthStr) => {
        // monthStr format: "YYYY-MM"
        const [year, month] = monthStr.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        // 1. Booking money collected in this month
        // Counted by payment date (createdAt starts with monthStr)
        const monthBookings = bookings.filter(b => b.createdAt.startsWith(monthStr) && b.paymentStatus !== 'cancelled');
        const bookingPayments = monthBookings.reduce((sum, b) => {
            if (b.paymentStatus === 'paid_full')
                return sum + b.totalPrice;
            if (b.paymentStatus === 'paid_advance')
                return sum + (b.advanceAmount || 500);
            return sum;
        }, 0);
        // Completed refunds processed in this month
        const monthRefunds = refunds.filter(r => r.status === 'completed' && (r.refundedDate?.startsWith(monthStr) || r.requestDate.startsWith(monthStr)));
        const refundsAmount = monthRefunds.reduce((sum, r) => sum + r.amount, 0);
        const bookingMoneyCollected = Math.max(0, bookingPayments - refundsAmount);
        // 2. Other income entered for that month
        const monthOtherIncome = otherIncome.filter(o => o.date.startsWith(monthStr));
        const otherIncomeTotal = monthOtherIncome.reduce((sum, o) => sum + o.amount, 0);
        // Total revenue = booking money collected + other income
        const totalRevenue = bookingMoneyCollected + otherIncomeTotal;
        // 3. Expenses dated in that month
        const monthExpenses = expenses.filter(e => e.date.startsWith(monthStr));
        const totalExpensesMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        // 4. Net profit = total revenue - expenses
        const monthNetProfit = totalRevenue - totalExpensesMonth;
        const isLoss = monthNetProfit <= 0;
        const profitMargin = totalRevenue > 0 ? (monthNetProfit / totalRevenue) * 100 : 0;
        // 5. Slots booked and occupancy
        const slotsBooked = monthBookings.length;
        const totalPossibleSlots = 12 * daysInMonth;
        const occupancyRate = (slotsBooked / totalPossibleSlots) * 100;
        // Cancellations
        const cancelledBookings = bookings.filter(b => b.createdAt.startsWith(monthStr) && b.paymentStatus === 'cancelled');
        const cancellationsCount = cancelledBookings.length;
        const cancellationsAmount = cancelledBookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);
        // Money still due
        const dueAmountTotal = monthBookings.reduce((sum, b) => sum + (b.dueAmount || 0), 0);
        // 6. Investor shares
        // Investor share = net profit × investor % ÷ 100. If net profit is zero or negative, every share is ৳0.
        const monthPayouts = payouts.filter(p => p.month === monthStr);
        const investorShares = investors.map(inv => {
            const shareAmount = isLoss ? 0 : Math.round((monthNetProfit * inv.sharePercentage) / 100);
            const isPaid = monthPayouts.some(p => p.investorId === inv.id);
            return {
                investor: inv,
                shareAmount,
                percentage: inv.sharePercentage,
                isPaid
            };
        });
        const totalInvestorShare = investorShares.reduce((sum, i) => sum + i.shareAmount, 0);
        const ownersShare = Math.max(0, monthNetProfit - totalInvestorShare);
        // 7. Daily Breakdown Table
        const dailyBreakdown = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;
            const dayBookings = monthBookings.filter(b => b.date === dayStr);
            const dayIncome = dayBookings.reduce((sum, b) => {
                if (b.paymentStatus === 'paid_full')
                    return sum + b.totalPrice;
                return sum + (b.advanceAmount || 500);
            }, 0);
            const dayExp = monthExpenses.filter(e => e.date === dayStr).reduce((sum, e) => sum + e.amount, 0);
            dailyBreakdown.push({
                date: dayStr,
                slotsBooked: dayBookings.length,
                moneyCollected: dayIncome,
                expenses: dayExp,
                net: dayIncome - dayExp
            });
        }
        // 8. Expenses by Category
        const categoryTotals = {};
        monthExpenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });
        const expensesByCategory = Object.entries(categoryTotals).map(([cat, amt]) => ({
            category: cat,
            amount: amt,
            percentage: totalExpensesMonth > 0 ? (amt / totalExpensesMonth) * 100 : 0
        }));
        // 9. Income by Source
        const incomeBySource = [
            { source: 'Turf Slots Booking', amount: bookingMoneyCollected, percentage: totalRevenue > 0 ? (bookingMoneyCollected / totalRevenue) * 100 : 0 },
            { source: 'Sports Shop Pickup Sales', amount: monthOtherIncome.filter(o => o.source === 'shop_sales').reduce((sum, o) => sum + o.amount, 0), percentage: totalRevenue > 0 ? (monthOtherIncome.filter(o => o.source === 'shop_sales').reduce((sum, o) => sum + o.amount, 0) / totalRevenue) * 100 : 0 },
            { source: 'Tournament & Event Fees', amount: monthOtherIncome.filter(o => o.source === 'event_fees').reduce((sum, o) => sum + o.amount, 0), percentage: totalRevenue > 0 ? (monthOtherIncome.filter(o => o.source === 'event_fees').reduce((sum, o) => sum + o.amount, 0) / totalRevenue) * 100 : 0 },
            { source: 'Sponsorship & Other', amount: monthOtherIncome.filter(o => !['shop_sales', 'event_fees'].includes(o.source)).reduce((sum, o) => sum + o.amount, 0), percentage: totalRevenue > 0 ? (monthOtherIncome.filter(o => !['shop_sales', 'event_fees'].includes(o.source)).reduce((sum, o) => sum + o.amount, 0) / totalRevenue) * 100 : 0 }
        ];
        // 10. Most Popular Slots
        const slotCounts = {};
        monthBookings.forEach(b => {
            slotCounts[b.slotNumber] = (slotCounts[b.slotNumber] || 0) + 1;
        });
        const popularSlotsRanking = pricing.slotPrices.map(s => ({
            slotNumber: s.slotNumber,
            displayTime: s.displayTime,
            count: slotCounts[s.slotNumber] || 0
        })).sort((a, b) => b.count - a.count);
        return {
            month: monthStr,
            bookingMoneyCollected,
            otherIncomeTotal,
            totalRevenue,
            totalExpenses: totalExpensesMonth,
            netProfit: monthNetProfit,
            isLossMonth: isLoss,
            profitMargin,
            slotsBooked,
            occupancyRate,
            cancellationsCount,
            cancellationsAmount,
            dueAmountTotal,
            investorShares,
            ownersShare,
            dailyBreakdown,
            expensesByCategory,
            incomeBySource,
            popularSlotsRanking
        };
    }, [bookings, otherIncome, refunds, expenses, investors, payouts, pricing]);
    // Auth Operations
    const login = useCallback(async (phone, password = 'password123') => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();
            if (res.ok && data.success && data.user) {
                setCurrentUser(data.user);
                saveCurrentUser(data.user);
                return { success: true, message: data.message, user: data.user, token: data.token };
            }
            if (!res.ok && data.error) {
                return { success: false, message: data.error };
            }
        }
        catch (e) {
            console.warn('Backend login error or offline, falling back to local state:', e);
        }
        // Fallback to local user lookup if API is offline
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const user = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
        if (!user) {
            return { success: false, message: 'No account found with this phone number. Please sign up.' };
        }
        if (user.disabled) {
            return { success: false, message: 'Account is deactivated. Please contact Crossbar arena desk.' };
        }
        if (user.password && user.password !== password) {
            return { success: false, message: 'Incorrect password entered.' };
        }
        setCurrentUser(user);
        saveCurrentUser(user);
        return { success: true, user };
    }, [users]);
    const signup = useCallback(async (data) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resData = await res.json();
            if (res.ok && resData.success && resData.user) {
                setCurrentUser(resData.user);
                saveCurrentUser(resData.user);
                setUsers(prev => {
                    const exists = prev.some(u => u.id === resData.user.id || u.phone === resData.user.phone);
                    return exists ? prev : [...prev, resData.user];
                });
                return { success: true, message: resData.message, user: resData.user, token: resData.token };
            }
            if (!res.ok && resData.error) {
                return { success: false, message: resData.error };
            }
        }
        catch (e) {
            console.warn('Backend register error or offline, fallback to local state:', e);
        }
        // Fallback to local storage
        if (!data.phone || data.phone.length < 10) {
            return { success: false, message: 'Please enter a valid 11-digit Bangladeshi mobile number.' };
        }
        if (!data.name?.trim()) {
            return { success: false, message: 'Name is required.' };
        }
        const cleanPhone = data.phone.replace(/[^0-9]/g, '');
        const existing = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
        if (existing) {
            return { success: false, message: 'An account already exists with this phone number. Please log in.' };
        }
        const newUser = {
            id: `usr-${Date.now()}`,
            name: data.name.trim(),
            phone: cleanPhone,
            password: data.password || 'password123',
            role: data.role || 'player',
            playingPosition: data.playingPosition || 'MID',
            email: data.email?.trim() || `${cleanPhone}@bookcrossbar.com`,
            createdAt: new Date().toISOString()
        };
        const updated = saveUser(newUser);
        setUsers(updated);
        setCurrentUser(newUser);
        saveCurrentUser(newUser);
        return { success: true, user: newUser };
    }, [users]);
    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        if (typeof document !== 'undefined') {
            document.cookie = 'cma_auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            document.cookie = 'cma_user=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        }
        const visitor = {
            id: 'usr-visitor',
            name: 'Visitor',
            phone: '',
            role: 'visitor',
            createdAt: new Date().toISOString()
        };
        setCurrentUser(visitor);
        saveCurrentUser(visitor);
    }, []);
    const switchDemoUser = useCallback(async (role, specificId) => {
        if (role === 'visitor') {
            await logout();
            return;
        }
        let target = users.find(u => u.role === role);
        if (specificId) {
            const found = users.find(u => u.id === specificId);
            if (found) target = found;
        }
        if (!target) {
            target = INITIAL_USERS.find(u => u.role === role);
        }
        if (target) {
            setCurrentUser(target);
            saveCurrentUser(target);
            try {
                await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: target.phone,
                        password: target.password || 'password123'
                    })
                });
            } catch (err) {
                console.warn('switchDemoUser login API sync error:', err);
            }
        }
    }, [users, logout]);
    const resetPasswordSMS = useCallback(async (phone) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const user = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
        if (!user) {
            return { success: false, message: 'Mobile number not registered.' };
        }
        const otp = String(Math.floor(1000 + Math.random() * 9000));
        const msg = `Crossbar Metro Arena: Your password reset security code is ${otp}. Valid for 5 minutes.`;
        const sms = {
            id: `sms-${Date.now()}`,
            recipientPhone: user.phone,
            message: msg,
            event: 'otp_reset',
            provider: 'SSLWireless',
            sentAt: new Date().toISOString(),
            status: 'delivered'
        };
        const updatedSms = logSMSNotification(sms);
        setSmsLogs(updatedSms);
        return {
            success: true,
            otp,
            message: `SMS code sent to +880 ${cleanPhone}. (Sandbox Code: ${otp})`
        };
    }, [users]);
    const handleUpdateUserRole = useCallback((userId, newRole) => {
        const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
        setUsers(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cma_users_v3', JSON.stringify(updated));
        }
    }, [users]);
    const handleToggleUserDisabled = useCallback((userId) => {
        const updated = users.map(u => u.id === userId ? { ...u, disabled: !u.disabled } : u);
        setUsers(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cma_users_v3', JSON.stringify(updated));
        }
    }, [users]);
    // SMS Notification Dispatch
    const sendSMSNotification = useCallback((phone, message, event) => {
        const sms = {
            id: `sms-${Date.now()}`,
            recipientPhone: phone,
            message,
            event,
            provider: 'SSLWireless',
            sentAt: new Date().toISOString(),
            status: 'delivered'
        };
        const updated = logSMSNotification(sms);
        setSmsLogs(updated);
    }, []);
    // Booking operations
    const handleBookingSuccess = useCallback(async (newBooking) => {
        try {
            // First save optimistically to state and local storage
            const updated = saveBooking(newBooking);
            setBookings(updated);
            setSlotHolds(getActiveSlotHolds());
            setActiveTicketPass(newBooking);

            // Send to real MongoDB API
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBooking)
            });
            const data = await res.json();
            if (res.ok && data.booking) {
                setBookings(prev => {
                    const exists = prev.some(b => b.id === data.booking.id || b.bookingCode === data.booking.bookingCode);
                    return exists 
                        ? prev.map(b => (b.id === data.booking.id || b.bookingCode === data.booking.bookingCode) ? data.booking : b)
                        : [data.booking, ...prev];
                });
            }

            // Automated SMS confirmation
            const smsText = `Crossbar Metro: Booking ${newBooking.bookingCode} confirmed for ${newBooking.date} (${newBooking.displayTime}). Paid: ৳${(newBooking.advanceAmount || 0).toLocaleString()}, Due: ৳${(newBooking.dueAmount || 0).toLocaleString()}. Uttara Metro Center.`;
            sendSMSNotification(newBooking.captainPhone, smsText, 'booking_confirmed');
        }
        catch (err) {
            console.error('handleBookingSuccess error:', err);
            alert(err.message || 'Error processing booking');
        }
    }, [sendSMSNotification]);

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
        const updated = updateBookingStatus(id, status, collectedCash);
        setBookings(updated);
        try {
            await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, collectedCash })
            });
        } catch (e) {
            console.warn('API updateBookingStatus error:', e);
        }
    }, []);

    const handleCancelBooking = useCallback(async (id) => {
        const result = cancelBooking(id, true);
        setBookings(result.bookings);
        if (result.refund) {
            setRefunds(getStoredRefunds());
        }
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.refund) {
                setRefunds(prev => [data.refund, ...prev.filter(r => r.id !== data.refund.id)]);
            }
        } catch (e) {
            console.warn('API cancelBooking error:', e);
        }
        const target = bookings.find(b => b.id === id);
        if (target) {
            const msg = `Crossbar Metro: Booking ${target.bookingCode} on ${target.date} was cancelled. Advance paid (৳${target.advanceAmount}) sent to refund queue.`;
            sendSMSNotification(target.captainPhone, msg, 'booking_cancelled');
        }
    }, [bookings, sendSMSNotification]);

    const handleRecordRefund = useCallback(async (refundId, amount, method, transactionRef) => {
        const current = getStoredRefunds();
        const updated = current.map(r => {
            if (r.id === refundId) {
                return {
                    ...r,
                    amount,
                    refundMethod: method,
                    status: 'completed',
                    refundedDate: new Date().toISOString().split('T')[0],
                    transactionRef: transactionRef || `REF-${Date.now().toString().slice(-6)}`,
                    recordedBy: currentUser?.name || 'Admin Desk'
                };
            }
            return r;
        });
        if (typeof window !== 'undefined') {
            localStorage.setItem('cma_refunds_v3', JSON.stringify(updated));
        }
        setRefunds(updated);

        try {
            await fetch(`/api/refunds/${refundId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    refundMethod: method,
                    transactionRef: transactionRef || `REF-${Date.now().toString().slice(-6)}`,
                    status: 'completed',
                    recordedBy: currentUser?.name || 'Admin Desk'
                })
            });
        } catch (e) {
            console.warn('API recordRefund error:', e);
        }
    }, [currentUser]);

    const handleRecordPayout = useCallback(async (payout) => {
        const updated = savePayout(payout);
        setPayouts(updated);
        try {
            const res = await fetch('/api/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payout)
            });
            const data = await res.json();
            if (data.investors) {
                setInvestors(data.investors);
            }
        } catch (e) {
            console.warn('API recordPayout error:', e);
        }
    }, []);

    const handleAddOtherIncome = useCallback(async (income) => {
        const updated = saveOtherIncome(income);
        setOtherIncome(updated);
        try {
            await fetch('/api/other-income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(income)
            });
        } catch (e) {
            console.warn('API addOtherIncome error:', e);
        }
    }, []);

    const handleSavePricing = useCallback(async (newConfig) => {
        const updated = savePricing(newConfig);
        setPricing(updated);
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pricing: newConfig })
            });
        } catch (e) {
            console.warn('API savePricing error:', e);
        }
    }, []);

    const handleAddExpense = useCallback(async (expense) => {
        const updated = saveExpense(expense);
        setExpenses(updated);
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense)
            });
        } catch (e) {
            console.warn('API addExpense error:', e);
        }
    }, []);

    const handleDeleteExpense = useCallback(async (id) => {
        const updated = deleteExpense(id);
        setExpenses(updated);
        try {
            await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.warn('API deleteExpense error:', e);
        }
    }, []);

    const handleSaveInvestors = useCallback(async (invs) => {
        const updated = saveInvestors(invs);
        setInvestors(updated);
        try {
            await fetch('/api/investors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invs)
            });
        } catch (e) {
            console.warn('API saveInvestors error:', e);
        }
    }, []);

    const handleSaveTeam = useCallback(async (team) => {
        const updated = saveTeam(team);
        setTeams(updated);
        try {
            await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(team)
            });
        } catch (e) {
            console.warn('API saveTeam error:', e);
        }
    }, []);

    const handleAddPlayerToTeam = useCallback(async (teamId, player) => {
        const updated = addPlayerToTeam(teamId, player);
        setTeams(updated);
        try {
            await fetch(`/api/teams/${teamId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            });
        } catch (e) {
            console.warn('API addPlayerToTeam error:', e);
        }
    }, []);

    const handleSaveMatchResult = useCallback(async (result) => {
        const updated = saveMatchResult(result);
        setMatchResults(updated);
        try {
            await fetch('/api/match-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
        } catch (e) {
            console.warn('API saveMatchResult error:', e);
        }
    }, []);

    const handleSaveShopProduct = useCallback(async (product) => {
        const updated = saveShopProduct(product);
        setShopProducts(updated);
        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
        } catch (e) {
            console.warn('API saveShopProduct error:', e);
        }
    }, []);

    const handleSaveShopReservation = useCallback(async (reservation) => {
        const updated = saveShopReservation(reservation);
        setShopReservations(updated);
        try {
            const payload = {
                reservationCode: reservation.reservationCode,
                customerName: reservation.customerName,
                customerPhone: reservation.customerPhone,
                totalAmount: reservation.price,
                items: reservation.items || [
                    {
                        productId: reservation.productId,
                        name: reservation.productName,
                        size: reservation.size || '',
                        quantity: reservation.quantity || 1,
                        price: reservation.price
                    }
                ],
                notes: reservation.notes || ''
            };
            const res = await fetch('/api/shop-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.reservation) {
                setShopReservations(prev => [data.reservation, ...prev.filter(r => r.id !== reservation.id)]);
            }
        } catch (e) {
            console.warn('API saveShopReservation error:', e);
        }
    }, []);

    const handleUpdateShopReservationStatus = useCallback(async (id, status) => {
        const updated = updateShopReservationStatus(id, status);
        setShopReservations(updated);
        setOtherIncome(getStoredOtherIncome());
        setShopProducts(getStoredShopProducts());
        try {
            await fetch(`/api/shop-orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            // Refresh products & other income
            const [prodsRes, incRes] = await Promise.all([
                fetch('/api/products').then(r => r.json()).catch(() => null),
                fetch('/api/other-income').then(r => r.json()).catch(() => null)
            ]);
            if (prodsRes && Array.isArray(prodsRes)) setShopProducts(prodsRes);
            if (incRes && Array.isArray(incRes)) setOtherIncome(incRes);
        } catch (e) {
            console.warn('API updateShopReservationStatus error:', e);
        }
    }, []);

    const handleRegistrationSuccess = useCallback(async (newReg) => {
        const updated = saveTournamentRegistration(newReg);
        setRegistrations(updated);
        setTournaments(getStoredTournaments());
        try {
            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReg)
            });
            const data = await res.json();
            if (res.ok && data.registration) {
                setRegistrations(prev => [data.registration, ...prev.filter(r => r.id !== newReg.id)]);
            }
        } catch (e) {
            console.warn('API registrationSuccess error:', e);
        }
    }, []);

    const handleSaveTournament = useCallback(async (tournament) => {
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tournament)
            });
            const data = await res.json();
            if (data.tournament) {
                setTournaments(prev => [data.tournament, ...prev]);
            }
        } catch (e) {
            console.warn('API saveTournament error:', e);
        }
    }, []);

    const handleAddChallenge = useCallback(async (newChallenge) => {
        const updated = saveChallenge(newChallenge);
        setChallenges(updated);
        try {
            const res = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChallenge)
            });
            const data = await res.json();
            if (res.ok && data.challenge) {
                setChallenges(prev => [data.challenge, ...prev.filter(c => c.id !== newChallenge.id)]);
            }
        } catch (e) {
            console.warn('API addChallenge error:', e);
        }
    }, []);

    const handleSavePhoto = useCallback(async (photo) => {
        const updated = saveGalleryPhoto(photo);
        setGalleryPhotos(updated);
        try {
            await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(photo)
            });
        } catch (e) {
            console.warn('API savePhoto error:', e);
        }
    }, []);

    const handleDeletePhoto = useCallback(async (id) => {
        const updated = deleteStoredGalleryPhoto(id);
        setGalleryPhotos(updated);
        try {
            await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.warn('API deletePhoto error:', e);
        }
    }, []);

    const handleToggleFeaturedPhoto = useCallback(async (id) => {
        const target = galleryPhotos.find(p => p.id === id);
        if (target) {
            const updatedPhoto = { ...target, featured: !target.featured };
            await handleSavePhoto(updatedPhoto);
        }
    }, [galleryPhotos, handleSavePhoto]);

    const handleSaveSiteSettings = useCallback(async (settings) => {
        const updated = saveSiteSettings(settings);
        setSiteSettings(updated);
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            });
        } catch (e) {
            console.warn('API saveSiteSettings error:', e);
        }
    }, []);
    // Cart operations
    const addToCart = useCallback((product, selectedSize, qty = 1) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.product.id === product.id && item.selectedSize === selectedSize);
            if (existing) {
                return prev.map(item => item === existing ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { product, selectedSize, quantity: qty }];
        });
        setShowCartDrawer(true);
    }, []);
    const removeFromCart = useCallback((productId, size) => {
        setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === size)));
    }, []);
    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);
    // Daily backup JSON export
    const exportDatabaseBackup = useCallback(() => {
        const fullBackup = {
            venue: 'Crossbar Metro Arena (bookcrossbar.com)',
            backupGeneratedAt: new Date().toISOString(),
            bookings,
            pricing,
            expenses,
            investors,
            payouts,
            refunds,
            otherIncome,
            teams,
            matchResults,
            shopProducts,
            shopReservations,
            tournaments,
            registrations,
            challenges,
            galleryPhotos,
            users,
            siteSettings,
            smsLogs
        };
        const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonStr);
        downloadAnchor.setAttribute('download', `crossbar_metro_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }, [bookings, pricing, expenses, investors, payouts, refunds, otherIncome, teams, matchResults, shopProducts, shopReservations, tournaments, registrations, challenges, galleryPhotos, users, siteSettings, smsLogs]);
    const handleRestoreDatabase = useCallback((backupJson) => {
        const ok = restoreDatabaseBackup(backupJson);
        if (ok) {
            setBookings(getStoredBookings());
            setPricing(getStoredPricing());
            setExpenses(getStoredExpenses());
            setInvestors(getStoredInvestors());
            setPayouts(getStoredPayouts());
            setRefunds(getStoredRefunds());
            setOtherIncome(getStoredOtherIncome());
            setTeams(getStoredTeams());
            setMatchResults(getStoredMatchResults());
            setShopProducts(getStoredShopProducts());
            setShopReservations(getStoredShopReservations());
            setTournaments(getStoredTournaments());
            setRegistrations(getStoredRegistrations());
            setChallenges(getStoredChallenges());
            setGalleryPhotos(getStoredGalleryPhotos());
            setUsers(getStoredUsers());
            setSiteSettings(getStoredSiteSettings());
        }
        return ok;
    }, []);
    return (<ArenaContext.Provider value={{
            bookings,
            slotHolds,
            pricing,
            expenses,
            investors,
            payouts,
            refunds,
            otherIncome,
            teams,
            matchResults,
            shopProducts,
            shopReservations,
            tournaments,
            registrations,
            challenges,
            galleryPhotos,
            users,
            currentUser,
            smsLogs,
            siteSettings,
            isInitialized,
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            showCartDrawer,
            setShowCartDrawer,
            grossRevenue,
            totalExpenses,
            netProfit,
            isLossMonth,
            calculateMonthlyFinance,
            activeTicketPass,
            setActiveTicketPass,
            showSquadModal,
            setShowSquadModal,
            showAdminModal,
            setShowAdminModal,
            showPassesDrawer,
            setShowPassesDrawer,
            showInstallModal,
            setShowInstallModal,
            showAuthModal,
            setShowAuthModal,
            authModalInitialTab,
            setAuthModalInitialTab,
            showSSLCommerzModal,
            setShowSSLCommerzModal,
            pendingBookingData,
            setPendingBookingData,
            showHandoverGuide,
            setShowHandoverGuide,
            login,
            signup,
            logout,
            switchDemoUser,
            resetPasswordSMS,
            handleUpdateUserRole,
            handleToggleUserDisabled,
            handleBookingSuccess,
            handlePlaceSlotHold,
            handleReleaseSlotHold,
            handleUpdateBookingStatus,
            handleCancelBooking,
            handleRecordRefund,
            handleRecordPayout,
            handleAddOtherIncome,
            handleSavePricing,
            handleAddExpense,
            handleDeleteExpense,
            handleSaveInvestors,
            handleSaveTeam,
            handleAddPlayerToTeam,
            handleSaveMatchResult,
            handleSaveShopProduct,
            handleSaveShopReservation,
            handleUpdateShopReservationStatus,
            handleRegistrationSuccess,
            handleSaveTournament,
            handleAddChallenge,
            handleSavePhoto,
            handleDeletePhoto,
            handleToggleFeaturedPhoto,
            handleSaveSiteSettings,
            sendSMSNotification,
            exportDatabaseBackup,
            handleRestoreDatabase,
            isLoadingData,
            refreshData: loadRealBackendData
        }}>
      {children}
    </ArenaContext.Provider>);
};
export const useArena = () => {
    const context = useContext(ArenaContext);
    if (!context) {
        throw new Error('useArena must be used within an ArenaProvider');
    }
    return context;
};
