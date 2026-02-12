'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1 flex items-center justify-center' style={{ paddingTop: '120px', paddingBottom: '64px' }}>
        <div className='text-center max-w-md mx-auto px-8'>
          <div className='text-8xl font-bold text-primary-100 mb-4'>404</div>
          <h1
            className='text-neutral-900 mb-4'
            style={{ fontSize: '28px', lineHeight: '36px', fontWeight: '700' }}
          >
            Page Not Found
          </h1>
          <p className='text-neutral-600 mb-8 text-base'>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/'>
              <Button variant='primary' size='md' className='w-full sm:w-auto'>
                Back to Home
              </Button>
            </Link>
            <Link href='/support/contact'>
              <Button variant='outline' size='md' className='w-full sm:w-auto'>
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
