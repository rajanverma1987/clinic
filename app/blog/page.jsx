'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { getAllBlogPosts } from '@/lib/blog/blog-data';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Get blog posts from the data file
const blogPosts = getAllBlogPosts();

// Client component for blog image with error handling
function BlogImageCard({ src, alt, category }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Show gradient placeholder if error or no image
  if (hasError || !src) {
    return (
      <div
        className='mb-6 w-full flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-100 text-primary-700 rounded-lg relative overflow-hidden'
        style={{ height: '192px' }}
      >
        <div className='absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10'></div>
        <div className='relative z-10 flex flex-col items-center gap-2'>
          <svg
            className='w-16 h-16 text-primary-500/60'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <span className='text-sm font-semibold text-primary-600'>{category}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className='mb-6 overflow-hidden rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 relative group'
      style={{ width: '100%', height: '192px' }}
    >
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 z-10'>
          <div className='animate-pulse'>
            <svg
              className='w-12 h-12 text-primary-300'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          </div>
        </div>
      )}
      <Image
        src={imgSrc}
        alt={alt || category || 'Blog image'}
        fill
        className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleError}
        onLoad={handleLoad}
        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        unoptimized={false}
        priority={false}
      />
    </div>
  );
}

export default function BlogPage() {
  const { t } = useI18n();

  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1' style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <section className='pt-16 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-100 via-white to-primary-100'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h1
                className='text-4xl md:text-5xl font-bold mb-6'
                style={{
                  color: '#1A1A1A',
                  fontSize: '48px',
                  lineHeight: '56px',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                }}
              >
                Blog & Resources
              </h1>
              <p className='text-xl text-neutral-600 max-w-2xl mx-auto'>
                Learn about clinic management, best practices, and how Doctor&apos;s Clinic can transform
                your practice
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className='h-full hover:shadow-lg cursor-pointer group transition-shadow duration-300'>
                    <div className='p-6 lg:p-8'>
                      {/* Featured Image or Placeholder */}
                      {post.image?.url ? (
                        <BlogImageCard
                          src={post.image.url}
                          alt={post.image.alt || post.title}
                          category={post.category}
                        />
                      ) : (
                        <div className='w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 text-4xl font-bold mb-6 rounded-lg'>
                          {post.category}
                        </div>
                      )}
                      <div className='flex items-center justify-between mb-4'>
                        <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1.5 rounded-full'>
                          {post.category}
                        </span>
                        <span className='text-sm text-neutral-500'>{post.readTime}</span>
                      </div>
                      <h2 className='text-xl font-bold text-neutral-900 mb-4 group-hover:text-primary-600 transition-colors duration-200'>
                        {post.title}
                      </h2>
                      <p className='text-neutral-600 mb-6 line-clamp-3 leading-relaxed'>
                        {post.excerpt}
                      </p>
                      <div className='flex items-center justify-between text-sm text-neutral-500 pt-2 border-t border-neutral-100'>
                        <span>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className='text-primary-600 font-medium group-hover:underline'>
                          Read more →
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
