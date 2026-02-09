import Link from 'next/link';

export function Footer() {
  return (
    <footer className='bg-neutral-900 text-neutral-300 py-12'>
      <div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-6'>
        <div>
          <span className='font-semibold text-white'>Doctor&apos;s Clinic</span>
          <p className='mt-2 text-sm'>Clinic management for healthcare professionals.</p>
        </div>
        <div className='flex gap-8'>
          <div>
            <h4 className='font-medium text-white mb-2'>Product</h4>
            <ul className='space-y-1 text-sm'>
              <li>
                <Link href='/pricing' className='hover:text-white'>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href='/blog' className='hover:text-white'>
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className='font-medium text-white mb-2'>Company</h4>
            <ul className='space-y-1 text-sm'>
              <li>
                <Link href='/about' className='hover:text-white'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='hover:text-white'>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className='font-medium text-white mb-2'>Legal</h4>
            <ul className='space-y-1 text-sm'>
              <li>
                <Link href='/privacy' className='hover:text-white'>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href='/terms' className='hover:text-white'>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className='max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-neutral-700 text-sm text-neutral-500'>
        © {new Date().getFullYear()} Doctor&apos;s Clinic. All rights reserved.
      </div>
    </footer>
  );
}
