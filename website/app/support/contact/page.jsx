import { redirect } from 'next/navigation';

/**
 * Redirect /support/contact to /contact so the website has a single contact page.
 */
export default function SupportContactPage() {
  redirect('/contact');
}
