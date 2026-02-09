'use client';

import { CTASection } from '@/components/marketing/CTASection';
import { DataSecuritySection } from '@/components/marketing/DataSecuritySection';
import { FAQSection } from '@/components/marketing/FAQSection';
import { FeaturesSection } from '@/components/marketing/FeaturesSection';
import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProductGallerySection } from '@/components/marketing/ProductGallerySection';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3); // Default for SSR
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  const handleContactClick = useCallback(() => {
    window.location.href = '/support/contact';
  }, []);

  const toggleShowAllFeatures = useCallback(() => {
    setShowAllFeatures((prev) => !prev);
  }, []);

  const handleFaqToggle = useCallback((index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }, []);

  // Mark component as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    // Only run on client side after mount and when not authenticated
    if (typeof window === 'undefined' || !mounted || authLoading || user) return;

    let timeoutId;
    const updateCardsPerView = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.innerWidth >= 1024) {
          setCardsPerView(3);
        } else if (window.innerWidth >= 768) {
          setCardsPerView(2);
        } else {
          setCardsPerView(1);
        }
      }, 150);
    };

    // Initial set based on window width
    if (window.innerWidth >= 1024) {
      setCardsPerView(3);
    } else if (window.innerWidth >= 768) {
      setCardsPerView(2);
    } else {
      setCardsPerView(1);
    }

    window.addEventListener('resize', updateCardsPerView, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCardsPerView);
    };
  }, [mounted, authLoading, user]);

  useEffect(() => {
    // Only run when not authenticated
    if (authLoading || user) return;

    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => {
        const totalTestimonials = 6;
        const totalSlides = Math.ceil(totalTestimonials / cardsPerView);
        return prev === totalSlides - 1 ? 0 : prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [cardsPerView, authLoading, user]);

  // Show loading or nothing while redirecting authenticated users
  if (authLoading || user) {
    return null;
  }

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50 relative'>
      <Header />
      <main className='flex-1 min-h-[calc(100vh-200px)]' style={{ paddingTop: '80px' }}>
        <HeroSection onContactClick={handleContactClick} />
        <FeaturesSection
          showAllFeatures={showAllFeatures}
          onToggleFeatures={toggleShowAllFeatures}
        />
        <DataSecuritySection />
        <ProductGallerySection />
        <TestimonialsSection
          currentTestimonialIndex={currentTestimonialIndex}
          setCurrentTestimonialIndex={setCurrentTestimonialIndex}
          cardsPerView={cardsPerView}
        />
        <FAQSection openFaqIndex={openFaqIndex} onFaqToggle={handleFaqToggle} />
        <CTASection user={user} />
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
