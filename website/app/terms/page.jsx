import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';

export default function TermsPage() {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 pt-16 max-w-3xl mx-auto px-6 py-16'>
        <h1 className='text-3xl font-bold mb-6'>Terms of Service</h1>
        <p className='text-neutral-600'>Terms of service content. Update for your domain.</p>
      </main>
      <Footer />
    </div>
  );
}
