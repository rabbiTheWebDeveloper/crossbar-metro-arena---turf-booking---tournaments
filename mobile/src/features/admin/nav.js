import { Clock, Calendar, Layers, Repeat, TrendingUp, Users, Tag, AlertCircle, ShoppingBag, Package, ClipboardCheck, UsersRound, Trophy, Award, Camera } from 'lucide-react-native';

/**
 * Sections of the Arena Desk (admin portal). `badge` names a counter computed in useAdminBadges().
 */
export const ADMIN_NAV = [
    { key: 'today', label: 'Today', description: 'Live schedule, cash and gate', href: '/admin', icon: Clock },
    { key: 'schedule', label: 'Schedule', description: 'Slot grid by date', href: '/admin/schedule', icon: Calendar },
    { key: 'all-bookings', label: 'All bookings', description: 'Search, filter, collect dues', href: '/admin/all-bookings', icon: Layers },
    { key: 'recurring', label: 'Fixed slots (bulk)', description: 'Weekly series for regular squads', href: '/admin/recurring', icon: Repeat },
    { key: 'financial-report', label: 'Financial report', description: 'Revenue, expenses, profit', href: '/admin/financial-report', icon: TrendingUp },
    { key: 'investors', label: 'Investors', description: 'Partners and payouts', href: '/admin/investors', icon: Users },
    { key: 'slot-pricing', label: 'Slot pricing', description: 'Price matrix and booking rules', href: '/admin/slot-pricing', icon: Tag },
    { key: 'refunds', label: 'Refunds', description: 'Pending and completed refunds', href: '/admin/refunds', icon: AlertCircle, badge: 'refunds' },
    { key: 'shop-orders', label: 'Shop orders', description: 'Pickup reservations', href: '/admin/shop-orders', icon: ShoppingBag, badge: 'orders' },
    { key: 'products', label: 'Products', description: 'Shop inventory', href: '/admin/products', icon: Package },
    { key: 'registrations', label: 'Registrations', description: 'Tournament entries', href: '/admin/registrations', icon: ClipboardCheck, badge: 'registrations' },
    { key: 'players', label: 'Players', description: 'Accounts and roles', href: '/admin/players', icon: UsersRound },
    { key: 'events', label: 'Events', description: 'Tournaments and cups', href: '/admin/events', icon: Trophy },
    { key: 'match-results', label: 'Match results', description: 'Approve and publish scores', href: '/admin/match-results', icon: Award, badge: 'results' },
    { key: 'gallery', label: 'Gallery', description: 'Arena photos', href: '/admin/gallery', icon: Camera }
];
