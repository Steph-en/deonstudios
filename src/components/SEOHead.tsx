import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  imageAlt?: string;
  noindex?: boolean;
  author?: string;
  keywords?: string[];
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  publishedTime?: string;
  articleSection?: string;
}

const DEFAULT_TITLE = 'Deon Studios | Editorial & Fashion Photography by Gideon Boadi';
const DEFAULT_DESCRIPTION =
  'Official portfolio of photographer and visual storyteller Gideon Boadi, founder of Deon Studios. Discover evocative fashion, editorial, portraiture, and commercial campaigns.';
const DEFAULT_IMAGE = '/assets/gideon_boadi_portrait.png';
const DEFAULT_KEYWORDS = [
  'Gideon Boadi',
  'Deon Studios',
  'Fashion Photographer Accra',
  'Editorial Photography Ghana',
  'African Fashion Photography',
  'Commercial Campaigns',
  'Visual Storyteller',
  'High Fashion Editorial',
  'Portraiture',
];

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  imageAlt,
  noindex = false,
  author = 'Gideon Boadi',
  keywords = DEFAULT_KEYWORDS,
  schema,
  publishedTime,
  articleSection,
}) => {
  // Resolve base origin for absolute URLs required by search engines & social cards
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://gideonboadi.com';

  const fullTitle = title || DEFAULT_TITLE;

  const resolvedCanonical = canonicalUrl
    ? canonicalUrl.startsWith('http')
      ? canonicalUrl
      : `${origin}${canonicalUrl}`
    : typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`
    : origin;

  const resolvedImage = ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`;

  // Default WebSite Schema if none provided
  const resolvedSchema =
    schema || {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Deon Studios',
      alternateName: 'Gideon Boadi Photography Portfolio',
      url: origin,
      description: DEFAULT_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: 'Deon Studios',
        url: origin,
        logo: `${origin}/assets/gideon_boadi_portrait.png`,
        founder: {
          '@type': 'Person',
          name: 'Gideon Boadi',
          jobTitle: 'Photographer & Creative Director',
        },
      },
    };

  return (
    <Helmet>
      {/* 1. Primary Document Title & Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
      />

      {/* 2. Canonical URL */}
      <link rel="canonical" href={resolvedCanonical} />

      {/* 3. OpenGraph / Facebook Tags */}
      <meta property="og:site_name" content="Deon Studios" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:alt" content={imageAlt || fullTitle} />

      {/* Article specific metadata if applicable */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && articleSection && (
        <meta property="article:section" content={articleSection} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* 4. Twitter / X Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={imageAlt || fullTitle} />
      <meta name="twitter:site" content="@deonstudios" />
      <meta name="twitter:creator" content="@deonstudios" />

      {/* 5. Schema.org JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(resolvedSchema)}
      </script>
    </Helmet>
  );
};
