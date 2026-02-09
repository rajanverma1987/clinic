'use client';

import { Header } from '@/components/Header';
import { CTASection } from '@/components/marketing/CTASection';
import { DataSecuritySection } from '@/components/marketing/DataSecuritySection';
import { FAQSection } from '@/components/marketing/FAQSection';
import { FeaturesSection } from '@/components/marketing/FeaturesSection';
import { Footer } from '@/components/marketing/Footer';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProductGallerySection } from '@/components/marketing/ProductGallerySection';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';

export default function HomePage() {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 pt-16'>
        <HeroSection />
        <FeaturesSection />
        <DataSecuritySection />
        <ProductGallerySection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
