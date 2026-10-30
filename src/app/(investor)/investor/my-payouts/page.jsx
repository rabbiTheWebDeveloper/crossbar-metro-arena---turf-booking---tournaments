import { redirect } from 'next/navigation';

/** Legacy route: the payout ledger lives at /investor/payouts. */
export default function MyPayoutsRedirect() {
    redirect('/investor/payouts');
}
