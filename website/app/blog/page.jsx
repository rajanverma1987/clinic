'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { getAllBlogPosts } from '@/lib/blog/blog-data';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const blogPosts = getAllBlogPosts();

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

  const handleLoad = () => setIsLoading(false);

  if (hasError || !src) {
    return (
      <div
        className={
          'mb-6 w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-100 text-primary-700 rounded-lg relative overflow-hidden'
        }
      >
        <span className={'text-sm font-semibold'}>{category}</span>
      </div>
    );
  }

  return (
    <div className={'mb-6 w-full h-48 overflow-hidden rounded-lg bg-neutral-100 relative group'}>
      {isLoading && (
        <div className={'absolute inset-0 flex items-center justify-center bg-neutral-100 z-10'}>
          <div className={'animate-pulse w-12 h-12 rounded-full bg-primary-200'} />
        </div>
      )}
      <Image
        src={imgSrc}
        alt={alt || category || 'Blog image'}
        fill
        className={
          'object-cover transition-transform duration-300 group-hover:scale-105 ' +
          (isLoading ? 'opacity-0' : 'opacity-100')
        }
        onError={handleError}
        onLoad={handleLoad}
        sizes={'(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      />
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className={'min-h-screen flex flex-col'}>
      <Header />
      <main className={'flex-1'}>
        <section
          className={
            'px-4 sm:px-6 lg:px-8 pt-36 pb-16 bg-gradient-to-br from-primary-100 via-white to-primary-100'
          }
        >
          <div className={'section-container'}>
            <div className={'text-center mb-16'}>
              <h1 className={'text-neutral-900 text-3xl md:text-4xl font-bold mb-6'}>
                Blog & Resources
              </h1>
              <p className={'text-neutral-600 max-w-2xl mx-auto text-lg'}>
                Learn about clinic management, best practices, and how Doctor&apos;s Clinic can
                transform your practice.
              </p>
            </div>
          </div>
        </section>

        <section className={'py-16 px-4 sm:px-6 lg:px-8 bg-white'}>
          <div className={'section-container'}>
            <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'}>
              {blogPosts.map((post) => (
                <Link key={post.id} href={'/blog/' + post.slug}>
                  <article
                    className={
                      'h-full border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 group'
                    }
                  >
                    {post.image?.url ? (
                      <BlogImageCard
                        src={post.image.url}
                        alt={post.image.alt || post.title}
                        category={post.category}
                      />
                    ) : (
                      <div
                        className={
                          'w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 font-bold mb-6 rounded-lg'
                        }
                      >
                        {post.category}
                      </div>
                    )}
                    <div className={'flex items-center justify-between mb-4'}>
                      <span
                        className={
                          'text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1.5 rounded-full'
                        }
                      >
                        {post.category}
                      </span>
                      <span className={'text-sm text-neutral-500'}>{post.readTime}</span>
                    </div>
                    <h2
                      className={
                        'text-neutral-900 text-xl font-semibold mb-4 group-hover:text-primary-600 transition-colors'
                      }
                    >
                      {post.title}
                    </h2>
                    <p className={'text-neutral-600 mb-6 line-clamp-3'}>{post.excerpt}</p>
                    <div
                      className={
                        'flex items-center justify-between text-neutral-500 pt-2 border-t border-neutral-100 text-sm'
                      }
                    >
                      <span>
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className={'text-primary-600 font-medium group-hover:underline'}>
                        Read more →
                      </span>
                    </div>
                  </article>
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
