import { BlogPostContent } from '@/app/blog/[slug]/BlogPostContent';
import { getAllBlogPosts, getBlogPostBySlug, getRelatedPosts } from '@/lib/blog/blog-data';
import { CLINIC_APP_URL } from '@/lib/config';
import { notFound } from 'next/navigation';

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
  const clinicAppUrl = CLINIC_APP_URL.replace(/\/$/, '');

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
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BlogPostContent post={post} relatedPosts={relatedPosts} clinicAppUrl={clinicAppUrl} />
    </>
  );
}
