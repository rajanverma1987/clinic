'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { getAllBlogPosts } from '@/lib/blog/blog-data';

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
      // Try a fallback placeholder
      setImgSrc(`https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=${encodeURIComponent(category)}`);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError && imgSrc.includes('placeholder')) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 text-2xl font-bold mb-4 rounded-lg">
        {category}
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 relative">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 z-10">
          <div className="animate-pulse text-blue-300 text-2xl">📄</div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ${isLoading && !hasError ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}

export default function BlogPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Blog & Resources
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Learn about clinic management, best practices, and how Doctor's Clinic can transform your practice
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="p-6">
                      {/* Featured Image or Placeholder */}
                      {post.image?.url ? (
                        <BlogImageCard 
                          src={post.image.url}
                          alt={post.image.alt || post.title}
                          category={post.category}
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 text-4xl font-bold mb-4 rounded-lg">
                          {post.category}
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="text-blue-600 font-medium group-hover:underline">
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

