import React from 'react';
import { useArena } from '@/context/ArenaContext';
import { Screen, Loading } from '@/components/ui';
import { VisitorWelcome } from '@/features/player/VisitorWelcome';
import { PlayerDashboard } from '@/features/player/PlayerDashboard';
import { StaffAccount } from '@/features/player/StaffAccount';

/**
 * "Me" tab. What it shows depends on who is signed in:
 *   visitor          -> sign-in prompt and the booking lookup
 *   player           -> the Matchday Hub (bookings, teams, results, challenges, orders, profile)
 *   admin / investor -> account card with shortcuts to the Arena Desk / Investor portal
 */
export default function MeScreen() {
    const { authChecked, isVisitor, isPlayer } = useArena();

    if (!authChecked) {
        return (
            <Screen tab title="Me" refreshable={false}>
                <Loading label="Checking your session…" />
            </Screen>
        );
    }
    if (isVisitor) return <VisitorWelcome />;
    if (isPlayer) return <PlayerDashboard />;
    return <StaffAccount />;
}
