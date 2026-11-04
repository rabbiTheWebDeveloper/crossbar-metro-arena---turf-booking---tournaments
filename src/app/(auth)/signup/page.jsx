import { permanentRedirect } from 'next/navigation';

/** /signup is a legacy alias of /register. A 308 keeps old links working without creating duplicate content. */
export default function SignupPage() {
    permanentRedirect('/register');
}
