'use client';

import { BlogImage } from '@/components/blog/BlogImage';
import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { markdownToHtml } from '@/lib/blog/markdownToHtml';
import Link from 'next/link';

function getCategoryLabel(t, post) {
  const key = post.category && typeof post.category === 'string'
    ? post.category.toLowerCase().replace(/\s+/g, '')
    : '';
  if (key && t(`blog.categories.${key}`)) return t(`blog.categories.${key}`);
  return post.category;
}

function formatReadTime(t, readTime) {
  const num = typeof readTime === 'string' ? parseInt(readTime.replace(/\D/g, ''), 10) : NaN;
  if (!Number.isNaN(num)) return `${num} ${t('blog.readTime')}`;
  return readTime;
}

function getPostTitle(t, post) {
  const key = `blog.posts.${post.slug}.title`;
  const translated = t(key);
  return translated && translated !== key ? translated : post.title;
}

function getPostExcerpt(t, post) {
  const key = `blog.posts.${post.slug}.excerpt`;
  const translated = t(key);
  return translated && translated !== key ? translated : post.excerpt;
}

function getTranslatedPostContent(t, post) {
  const base = `blog.posts.${post.slug}`;
  const intro = t(`${base}.intro`);
  if (!intro || intro === `${base}.intro`) return null;
  const sectionCount = 7;
  const sections = [];
  for (let i = 0; i < sectionCount; i++) {
    const heading = t(`${base}.section${i}Heading`);
    const content = t(`${base}.section${i}Content`);
    if (!heading || heading === `${base}.section${i}Heading` || !content || content === `${base}.section${i}Content`) break;
    sections.push({ heading, content });
  }
  if (sections.length === 0) return null;
  const conclusion = t(`${base}.conclusion`);
  if (!conclusion || conclusion === `${base}.conclusion`) return null;
  const heroCaption = t(`${base}.heroCaption`);
  return {
    introduction: intro,
    sections,
    conclusion,
    heroCaption: heroCaption && heroCaption !== `${base}.heroCaption` ? heroCaption : post.image?.caption,
  };
}

export function BlogPostContent({ post, relatedPosts, clinicAppUrl }) {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'ar' ? 'ar-EG' : locale === 'es' ? 'es' : 'en-US';
  const categoryLabel = getCategoryLabel(t, post);
  const postTitle = getPostTitle(t, post);
  const translatedContent = getTranslatedPostContent(t, post);
  const displayContent = translatedContent || {
    introduction: post.content.introduction,
    sections: post.content.sections.map((s) => ({ heading: s.heading, content: s.content })),
    conclusion: post.content.conclusion,
    heroCaption: post.image?.caption,
  };

  const displayTags = (() => {
    if (!translatedContent) return post.tags || [];
    const base = `blog.posts.${post.slug}`;
    const tags = [];
    for (let i = 1; i <= 6; i++) {
      const tag = t(`${base}.tag${i}`);
      if (!tag || tag === `${base}.tag${i}`) break;
      tags.push(tag);
    }
    return tags.length > 0 ? tags : (post.tags || []);
  })();

  const displayAuthorRole = (() => {
    const base = `blog.posts.${post.slug}`;
    const role = t(`${base}.authorRole`);
    return role && role !== `${base}.authorRole` ? role : post.author?.role;
  })();

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50' key={locale}>
      <Header />
      <main className='flex-1' style={{ paddingTop: '120px' }}>
        <article
          className='bg-gradient-to-br from-white via-neutral-50 to-primary-50/30 relative overflow-hidden'
          style={{
            paddingTop: '32px',
            paddingBottom: '48px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-4xl mx-auto relative z-10'>
            <Breadcrumb
              items={[
                { label: t('common.home'), href: '/' },
                { label: t('navigation.blog'), href: '/blog' },
                { label: postTitle },
              ]}
            />

            <div className='flex items-center justify-between mb-4'>
              <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full'>
                {categoryLabel}
              </span>
              <span className='text-sm text-neutral-500'>{formatReadTime(t, post.readTime)}</span>
            </div>

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
              {postTitle}
            </h1>

            <div className='flex items-center justify-between mb-8 pb-8 border-b border-neutral-200'>
              <div className='flex items-center' style={{ gap: '16px' }}>
                <div
                  className='bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0'
                  style={{ width: '48px', height: '48px' }}
                >
                  <span
                    className='text-primary-600 font-semibold'
                    style={{ fontSize: '16px', lineHeight: '1' }}
                  >
                    {post.author.name
                      .split(' ')
                      .filter(
                        (n) => !['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.', 'Dr'].includes(n),
                      )
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p
                    className='font-semibold text-neutral-900'
                    style={{
                      fontSize: '18px',
                      lineHeight: '28px',
                      fontWeight: '600',
                      marginBottom: '4px',
                    }}
                  >
                    {post.author.name}
                  </p>
                  <p
                    className='text-neutral-600'
                    style={{ fontSize: '14px', lineHeight: '20px', fontWeight: '400' }}
                  >
                    {displayAuthorRole}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-neutral-600'>
                  {t('blog.published')}:{' '}
                  {new Date(post.date).toLocaleDateString(dateLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {post.updatedDate !== post.date && (
                  <p className='text-xs text-neutral-500 mt-1'>
                    {t('blog.updated')}:{' '}
                    {new Date(post.updatedDate).toLocaleDateString(dateLocale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {post.image && (
              <div className='mb-8'>
                <BlogImage
                  src={post.image.url}
                  alt={post.image.alt}
                  className='w-full h-auto rounded-lg shadow-lg'
                  loading='eager'
                  caption={displayContent.heroCaption}
                />
              </div>
            )}
          </div>
        </article>

        <section
          className='bg-white'
          style={{
            paddingTop: '48px',
            paddingBottom: '48px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-4xl mx-auto'>
            <div className='prose prose-lg max-w-none mb-12'>
              <p className='text-xl text-neutral-700 leading-relaxed'>
                {displayContent.introduction}
              </p>
            </div>

            <div className='prose prose-lg max-w-none'>
              {displayContent.sections.map((section, index) => (
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
                  <div
                    className='text-neutral-700 leading-relaxed prose prose-lg max-w-none prose-p:mb-4 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1'
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                  />
                </div>
              ))}

              <div
                className='mt-12 pt-8 border-t border-neutral-200 text-lg text-neutral-700 leading-relaxed'
                dangerouslySetInnerHTML={{ __html: markdownToHtml(displayContent.conclusion) }}
              />
            </div>

            <div className='mt-12 overflow-visible'>
              {displayTags.length > 0 && (
                <div className='flex flex-wrap justify-center gap-2 px-4 py-4'>
                  <span className='w-full text-center text-sm font-medium text-neutral-600 mb-1'>{t('blog.tags')}</span>
                  {displayTags.map((tag, index) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm hover:bg-neutral-200 whitespace-nowrap'
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className='p-8 sm:p-10 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg text-center overflow-visible'>
                <h3 className='text-2xl font-bold text-white mb-4'>
                  {t('blog.ctaTitle')}
                </h3>
                <p className='text-primary-100 mb-6'>
                  {t('blog.ctaDescription')}
                </p>
                <a
                  href={`${clinicAppUrl}/register`}
                  className='inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-100'
                >
                  {t('blog.ctaButton')}
                </a>
              </div>
            </div>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section
            className='bg-neutral-100'
            style={{
              paddingTop: '48px',
              paddingBottom: '48px',
              paddingLeft: '32px',
              paddingRight: '32px',
            }}
          >
            <div className='max-w-7xl mx-auto'>
              <h2 className='text-3xl font-bold text-neutral-900 mb-8'>
                {t('blog.relatedArticles')}
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className='h-full hover:shadow-lg cursor-pointer group'>
                      <div className='p-6'>
                        <div className='flex items-center justify-between mb-3'>
                          <span className='text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full'>
                            {getCategoryLabel(t, relatedPost)}
                          </span>
                          <span className='text-sm text-neutral-500'>{formatReadTime(t, relatedPost.readTime)}</span>
                        </div>
                        <h3 className='text-xl font-bold text-neutral-900 mb-3 group-hover:text-primary-600'>
                          {getPostTitle(t, relatedPost)}
                        </h3>
                        <p className='text-neutral-600 mb-4 line-clamp-3'>{getPostExcerpt(t, relatedPost)}</p>
                        <div className='flex items-center justify-between text-sm text-neutral-500'>
                          <span>
                            {new Date(relatedPost.date).toLocaleDateString(dateLocale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <span className='text-primary-600 font-medium group-hover:underline'>
                            {t('blog.readMoreLink')}
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

        <section
          className='bg-white'
          style={{
            paddingTop: '32px',
            paddingBottom: '32px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-4xl mx-auto'>
            <Breadcrumb
              items={[
                { label: t('common.home'), href: '/' },
                { label: t('navigation.blog'), href: '/blog' },
              ]}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
