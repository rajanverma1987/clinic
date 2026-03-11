'use client';

import { BlogImage } from '@/components/blog/BlogImage';
import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Card } from '@/components/ui/Card';
import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blog/blog-data';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/** Convert inline markdown (**bold** and *italic*) to HTML. Do bold first so asterisks don't conflict. */
function inlineMarkdownToHtml(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str.replace(/\u2217/g, '*').replace(/\uFF0A/g, '*').replace(/\r\n?/g, '\n').trim();
  if (!s) return '';
  if (/^\*[^*]+\*$/.test(s)) return `<em>${s.slice(1, -1)}</em>`;
  let out = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}

/** Converts markdown-style text to safe HTML: **bold**, *italic*, lists, strips image syntax. */
function markdownToHtml(text) {
  if (!text || typeof text !== 'string') return '';
  let html = text.replace(/\u2217/g, '*').replace(/\uFF0A/g, '*').replace(/\r\n?/g, '\n');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
  const blocks = html.split(/\n\n+/);
  const result = blocks
    .map((block) => {
      const rawLines = block.split('\n').map((l) => l.replace(/\r$/, '').trim());
      const lines = rawLines.filter((l) => l !== '');
      if (lines.length === 0) return '';
      const first = lines[0];
      if (lines.length === 1 && /^\*[^*]+\*$/.test(first)) {
        return `<p class="mb-4"><em>${first.slice(1, -1)}</em></p>`;
      }
      const orderedMatch = first.match(/^\d+\.\s+/);
      const unorderedMatch = first.match(/^[-*]\s+/);
      if (orderedMatch) {
        const listItems = lines
          .map((line) => line.replace(/^\d+\.\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${inlineMarkdownToHtml(line)}</li>`)
          .join('');
        return `<ol class="list-decimal list-inside my-4 space-y-1">${listItems}</ol>`;
      }
      if (unorderedMatch) {
        const listItems = lines
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${inlineMarkdownToHtml(line)}</li>`)
          .join('');
        return `<ul class="list-disc list-inside my-4 space-y-1">${listItems}</ul>`;
      }
      const paragraph = lines.map((line) => inlineMarkdownToHtml(line)).join(' ');
      return `<p class="mb-4">${paragraph}</p>`;
    })
    .filter(Boolean)
    .join('\n');
  return result;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return {
    title: post.seo.metaTitle || post.title,
    description: post.seo.metaDescription || post.excerpt,
    keywords: post.seo.keywords?.join(', '),
    openGraph: {
      title: post.seo.metaTitle || post.title,
      description: post.seo.metaDescription || post.excerpt,
      images: post.seo.ogImage ? [{ url: post.seo.ogImage }] : [],
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedDate,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.metaTitle || post.title,
      description: post.seo.metaDescription || post.excerpt,
      images: post.seo.ogImage ? [post.seo.ogImage] : [],
    },
    alternates: {
      canonical: post.seo.canonicalUrl || `/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage({ params }) {
  const post = getBlogPostBySlug(params.slug);
  const relatedPosts = getRelatedPosts(params.slug);

  if (!post) {
    notFound();
  }

  // Structured data for SEO (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image?.url ? `https://yourdomain.com${post.image.url}` : undefined,
    datePublished: post.date,
    dateModified: post.updatedDate,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: "Doctor's Clinic",
      logo: {
        '@type': 'ImageObject',
        url: 'https://yourdomain.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://yourdomain.com/blog/${post.slug}`,
    },
  };

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Structured Data for SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className='flex-1' style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <article className='pt-8 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-100 via-white to-primary-100'>
          <div className='max-w-4xl mx-auto'>
            {/* Breadcrumb */}
            <nav className='mb-8 text-sm text-neutral-600'>
              <Link href='/' className='hover:text-primary-600'>
                Home
              </Link>
              <span className='mx-2'>/</span>
              <Link href='/blog' className='hover:text-primary-600'>
                Blog
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-neutral-900'>{post.title}</span>
            </nav>

            {/* Category and Read Time */}
            <div className='flex items-center justify-between mb-4'>
              <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full'>
                {post.category}
              </span>
              <span className='text-sm text-neutral-500'>{post.readTime}</span>
            </div>

            {/* Title */}
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
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className='flex items-center justify-between mb-8 pb-8 border-b border-neutral-200'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center'>
                  <span className='text-primary-600 font-semibold'>
                    {post.author.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                </div>
                <div>
                  <p className='font-semibold text-neutral-900'>{post.author.name}</p>
                  <p className='text-sm text-neutral-600'>{post.author.role}</p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-neutral-600'>
                  Published:{' '}
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {post.updatedDate !== post.date && (
                  <p className='text-xs text-neutral-500 mt-1'>
                    Updated:{' '}
                    {new Date(post.updatedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Featured Image */}
            {post.image && (
              <div className='mb-8'>
                <BlogImage
                  src={post.image.url}
                  alt={post.image.alt}
                  className='w-full h-auto rounded-lg shadow-lg'
                  loading='eager'
                  caption={post.image.caption}
                />
              </div>
            )}
          </div>
        </article>

        {/* Content Section */}
        <section className='py-12 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-4xl mx-auto'>
            {/* Introduction */}
            <div className='prose prose-lg max-w-none mb-12'>
              <p className='text-xl text-neutral-700 leading-relaxed'>
                {post.content.introduction}
              </p>
            </div>

            {/* Main Content Sections */}
            <div className='prose prose-lg max-w-none'>
              {post.content.sections.map((section, index) => (
                <div key={index} className='mb-12'>
                  <h2
                    className='text-3xl font-bold mb-6 mt-12'
                    style={{
                      color: '#1A1A1A',
                      fontSize: '30px',
                      lineHeight: '38px',
                      fontWeight: '700',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {section.heading}
                  </h2>

                  {/* Section Content — markdown converted to HTML */}
                  <div
                    className='text-neutral-700 leading-relaxed prose prose-lg max-w-none prose-p:mb-4 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1'
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                  />
                </div>
              ))}

              {/* Conclusion — markdown converted to HTML */}
              <div
                className='mt-12 pt-8 border-t border-neutral-200 text-lg text-neutral-700 leading-relaxed'
                dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content.conclusion) }}
              />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className='mt-12 pt-8 border-t border-neutral-200'>
                <h3 className='text-sm font-semibold text-neutral-900 mb-4'>Tags:</h3>
                <div className='flex flex-wrap gap-2'>
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm hover:bg-neutral-200'
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className='mt-12 p-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg text-center'>
              <h3 className='text-2xl font-bold text-white mb-4'>
                Ready to Transform Your Clinic?
              </h3>
              <p className='text-primary-100 mb-6'>
                Start your free trial today and see how Doctor&apos;s Clinic can streamline your
                operations.
              </p>
              <Link
                href='/register'
                className='inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-100'
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className='py-12 px-4 sm:px-6 lg:px-8 bg-neutral-100'>
            <div className='max-w-7xl mx-auto'>
              <h2 className='text-3xl font-bold text-neutral-900 mb-8'>Related Articles</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className='h-full hover:shadow-lg cursor-pointer group'>
                      <div className='p-6'>
                        <div className='flex items-center justify-between mb-3'>
                          <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full'>
                            {relatedPost.category}
                          </span>
                          <span className='text-sm text-neutral-500'>{relatedPost.readTime}</span>
                        </div>
                        <h3 className='text-xl font-bold text-neutral-900 mb-3 group-hover:text-primary-600'>
                          {relatedPost.title}
                        </h3>
                        <p className='text-neutral-600 mb-4 line-clamp-3'>{relatedPost.excerpt}</p>
                        <div className='flex items-center justify-between text-sm text-neutral-500'>
                          <span>
                            {new Date(relatedPost.date).toLocaleDateString('en-US', {
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
        )}

        {/* Back to Blog */}
        <section className='py-8 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-4xl mx-auto text-center'>
            <Link
              href='/blog'
              className='inline-flex items-center text-primary-600 hover:text-primary-700 font-medium'
            >
              <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
              Back to Blog
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
