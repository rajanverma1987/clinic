import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { getAllBlogPosts, getBlogPostBySlug, getRelatedPosts } from '@/lib/blog/blog-data';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CLINIC_APP_URL } from '@/lib/config';
const CLINIC_URL = CLINIC_APP_URL;

export function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return { title: 'Blog Post Not Found' };
  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
  };
}

function SectionContent({ content }) {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let processed = content.replace(imageRegex, '');
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
  const parts = processed
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean);
  const wrapListItems = (html) =>
    html.replace(
      /((?:<li>[\s\S]*?<\/li>\s*)+)/g,
      '<ul class="list-disc pl-6 my-2 space-y-1">$1</ul>',
    );
  return (
    <div className='text-neutral-700 leading-relaxed space-y-4'>
      {parts.map((paragraph, i) => (
        <div
          key={i}
          className='[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1'
          dangerouslySetInnerHTML={{
            __html: wrapListItems(paragraph.replace(/\n/g, '<br/>')),
          }}
        />
      ))}
    </div>
  );
}

export default function BlogPostPage({ params }) {
  const post = getBlogPostBySlug(params.slug);
  const relatedPosts = getRelatedPosts(params.slug);

  if (!post) notFound();

  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 pt-20'>
        <article className='pt-8 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-100 via-white to-primary-100'>
          <div className='max-w-4xl mx-auto'>
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

            <div className='flex items-center justify-between mb-4'>
              <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full'>
                {post.category}
              </span>
              <span className='text-sm text-neutral-500'>{post.readTime}</span>
            </div>

            <h1 className='text-4xl md:text-5xl font-bold text-neutral-900 mb-6'>{post.title}</h1>

            <div className='flex items-center justify-between mb-8 pb-8 border-b border-neutral-200'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center'>
                  <span className='text-primary-600 font-semibold'>
                    {post.author?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || '?'}
                  </span>
                </div>
                <div>
                  <p className='font-semibold text-neutral-900'>{post.author?.name}</p>
                  <p className='text-sm text-neutral-600'>{post.author?.role}</p>
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
                {post.updatedDate && post.updatedDate !== post.date && (
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

            {post.image?.url && (
              <div className='mb-8 rounded-lg overflow-hidden'>
                <Image
                  src={post.image.url}
                  alt={post.image.alt || post.title}
                  width={1200}
                  height={630}
                  className='w-full h-auto'
                  unoptimized
                />
                {post.image.caption && (
                  <p className='text-sm text-neutral-500 mt-2'>{post.image.caption}</p>
                )}
              </div>
            )}
          </div>
        </article>

        <section className='py-12 px-4 sm:px-6 lg:px-8 bg-white'>
          <div className='max-w-4xl mx-auto'>
            {post.content?.introduction && (
              <p className='text-xl text-neutral-700 leading-relaxed mb-12'>
                {post.content.introduction}
              </p>
            )}

            {post.content?.sections?.map((section, index) => (
              <div key={index} className='mb-12'>
                <h2 className='text-3xl font-bold text-neutral-900 mb-6 mt-12'>
                  {section.heading}
                </h2>
                <SectionContent content={section.content} />
              </div>
            ))}

            {post.content?.conclusion && (
              <div className='mt-12 pt-8 border-t border-neutral-200'>
                <p className='text-lg text-neutral-700 leading-relaxed'>
                  {post.content.conclusion}
                </p>
              </div>
            )}

            <div className='mt-12 p-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg text-center'>
              <h3 className='text-2xl font-bold text-white mb-4'>
                Ready to Transform Your Clinic?
              </h3>
              <p className='text-primary-100 mb-6'>
                Start your free trial today and see how Doctor&apos;s Clinic can streamline your
                operations.
              </p>
              <a
                href={CLINIC_URL}
                className='inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50'
              >
                Get Clinic Access
              </a>
            </div>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className='py-12 px-4 sm:px-6 lg:px-8 bg-neutral-100'>
            <div className='max-w-7xl mx-auto'>
              <h2 className='text-3xl font-bold text-neutral-900 mb-8'>Related Articles</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <article className='h-full border border-neutral-200 rounded-xl p-6 bg-white hover:shadow-lg transition-shadow'>
                      <div className='flex items-center justify-between mb-3'>
                        <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full'>
                          {relatedPost.category}
                        </span>
                        <span className='text-sm text-neutral-500'>{relatedPost.readTime}</span>
                      </div>
                      <h3 className='text-xl font-bold text-neutral-900 mb-3 hover:text-primary-600'>
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
                        <span className='text-primary-600 font-medium'>Read more →</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
