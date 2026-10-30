import { buildMetadata } from '../../../lib/seo';
import SquadBuilderClient from './SquadBuilderClient';

export const metadata = buildMetadata({ title: 'Squad Builder', description: 'Plan your lineup, pick a formation and share your squad before the match.', path: '/squad-builder' });

export default function SquadBuilderPage() {
    return <SquadBuilderClient />;
}
