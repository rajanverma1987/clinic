import { redirect } from 'next/navigation';

/**
 * Clinic app root. Marketing website is separate (website/ app at www).
 * Redirect to login so accounts.yoursite.com/ goes straight to sign-in.
 */
export default function RootPage() {
  redirect('/login');
}
