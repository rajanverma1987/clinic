# Blog Images Directory

This directory contains images used in blog posts.

## Directory Structure

```
public/images/blog/
├── clinic-operations-hero.jpg          # Featured image for introduction post
├── clinic-operations-og.jpg            # Open Graph image for introduction post
├── clinic-challenges.jpg                # Section image
├── dashboard-overview.jpg                # Section image
├── billing-system.jpg                   # Section image
├── security-compliance.jpg               # Section image
├── doctor-using-system.jpg               # Section image
├── getting-started.jpg                   # Section image
├── streamlined-operations.jpg            # Featured image for operations post
├── streamlined-operations-og.jpg         # Open Graph image
├── admin-time-breakdown.jpg              # Section image
├── automated-reminders.jpg                # Section image
├── integrated-workflow.jpg               # Section image
├── efficiency-metrics.jpg                # Section image
├── implementation-timeline.jpg           # Section image
├── security-compliance-hero.jpg          # Featured image for security post
├── security-compliance-og.jpg            # Open Graph image
├── breach-statistics.jpg                 # Section image
├── encryption-layers.jpg                 # Section image
├── audit-log-dashboard.jpg               # Section image
├── rbac-interface.jpg                    # Section image
├── hipaa-checklist.jpg                   # Section image
├── gdpr-features.jpg                     # Section image
├── backup-recovery.jpg                   # Section image
├── telemedicine-hero.jpg                 # Featured image for telemedicine post
├── telemedicine-og.jpg                   # Open Graph image
├── telemedicine-growth.jpg               # Section image
├── telemedicine-scheduling.jpg           # Section image
├── patient-telemedicine.jpg              # Section image
├── provider-telemedicine.jpg             # Section image
├── telemedicine-security.jpg              # Section image
├── telemedicine-best-practices.jpg       # Section image
└── telemedicine-future.jpg               # Section image
```

## Image Requirements

### Featured Images
- **Size**: 1200x630px (optimal for social sharing)
- **Format**: JPG or PNG
- **File Size**: Under 500KB recommended
- **Aspect Ratio**: 1.91:1

### Content Images
- **Width**: 800-1200px
- **Format**: JPG, PNG, or WebP
- **File Size**: Under 300KB recommended
- **Aspect Ratio**: Flexible (16:9 or 4:3 work well)

### Open Graph Images
- **Size**: 1200x630px
- **Format**: JPG or PNG
- **File Size**: Under 1MB
- **Purpose**: Displayed when sharing on social media

## Image Optimization

Before uploading images:
1. Compress images using tools like:
   - TinyPNG (https://tinypng.com)
   - Squoosh (https://squoosh.app)
   - ImageOptim (Mac)
2. Use WebP format when possible for better performance
3. Ensure images have descriptive filenames
4. Add proper alt text in blog post data

## Alt Text Guidelines

All images should have descriptive alt text:
- Describe what's in the image
- Include context relevant to the blog post
- Keep it concise (under 125 characters)
- Don't start with "Image of..." or "Picture of..."

Examples:
- ✅ "Modern clinic management dashboard showing patient appointments and analytics"
- ❌ "Image of dashboard"

## Adding New Images

1. Optimize the image (compress, resize if needed)
2. Save with a descriptive filename (kebab-case)
3. Place in this directory
4. Reference in blog post data with path: `/images/blog/filename.jpg`
5. Add alt text and caption in blog post data

## Image Sources

When creating or sourcing images:
- Use royalty-free stock photos
- Ensure images are relevant to healthcare/clinic management
- Consider using illustrations or infographics for complex concepts
- Maintain consistent style across all blog images

## Notes

- All image paths in blog posts are relative to `/public`
- Images are lazy-loaded for performance
- Featured images are loaded eagerly for better UX
- Content images are loaded lazily as user scrolls
