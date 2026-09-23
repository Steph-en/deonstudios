import React from 'react';
import { PageView, Project } from '../types';
import { SEOHead } from '../components/SEOHead';
import { AdminTab } from '../components/layouts/AdminLayout';

export interface DocumentSeoProps {
  activePage: PageView;
  selectedProject: Project | null;
  adminTab?: AdminTab;
}

export function getSeoConfig({
  activePage,
  selectedProject,
  adminTab,
}: DocumentSeoProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gideonboadi.com';

  let title = 'Deon Studios | Editorial & Fashion Photography by Gideon Boadi';
  let description =
    'Official portfolio of photographer and visual storyteller Gideon Boadi, founder of Deon Studios. Discover evocative fashion, editorial, portraiture, and commercial campaigns.';
  let ogType: 'website' | 'article' | 'profile' = 'website';
  let ogImage = '/assets/gideon_boadi_portrait.png';
  let canonicalUrl = origin;
  let noindex = false;
  let schema: Record<string, unknown> = {};

  if (activePage === 'admin') {
    const tabName = adminTab
      ? adminTab.charAt(0).toUpperCase() + adminTab.slice(1)
      : 'Overview';
    title = `${tabName} — CMS Admin | Deon Studios`;
    description = 'Secure administrative control center for Deon Studios portfolio management.';
    ogType = 'website';
    canonicalUrl = `${origin}/#admin`;
    noindex = true;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
    };
  } else if (activePage === 'about') {
    title = 'About Gideon Boadi — Founder & Creative Director | Deon Studios';
    description =
      'Learn about Gideon Boadi, Ghanaian photographer, image creative, and founder of Deon Studios. Studio philosophy, client roster, awards, and representation in Accra.';
    ogType = 'profile';
    ogImage = '/assets/gideon_boadi_portrait.png';
    canonicalUrl = `${origin}/#about`;

    schema = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Gideon Boadi — Deon Studios',
      description,
      url: canonicalUrl,
      mainEntity: {
        '@type': 'Person',
        name: 'Gideon Boadi',
        jobTitle: 'Photographer & Creative Director',
        worksFor: {
          '@type': 'Organization',
          name: 'Deon Studios',
        },
        nationality: 'Ghanaian',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Accra',
          addressCountry: 'Ghana',
        },
      },
    };
  } else if (activePage === 'contact') {
    title = 'Contact & Inquiries — Gideon Boadi | Deon Studios';
    description =
      'Commission Gideon Boadi and Deon Studios for editorial fashion, advertising campaigns, lookbooks, or portraiture. Studio booking and correspondence.';
    ogType = 'website';
    canonicalUrl = `${origin}/#contact`;

    schema = {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Deon Studios',
      description,
      url: canonicalUrl,
      mainEntity: {
        '@type': 'Organization',
        name: 'Deon Studios',
        email: 'contact@gideonboadi.com',
        url: origin,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'editorial & commercial booking',
          email: 'contact@gideonboadi.com',
          availableLanguage: ['English'],
        },
      },
    };
  } else if (activePage === 'project' && selectedProject) {
    const clientOrCategory = selectedProject.client || selectedProject.category;
    title = `${selectedProject.title} — ${clientOrCategory} | Deon Studios`;

    const snippet = selectedProject.description
      ? selectedProject.description.length > 150
        ? `${selectedProject.description.slice(0, 147)}...`
        : selectedProject.description
      : `${selectedProject.title} — Photographic editorial campaign created by Gideon Boadi for ${selectedProject.client || 'editorial release'}.`;

    description = snippet;
    ogType = 'article';
    canonicalUrl = `${origin}/#project-${selectedProject.slug}`;

    const primaryImage =
      selectedProject.images?.[0]?.url ||
      selectedProject.previewImages?.[0] ||
      '/assets/gideon_boadi_portrait.png';
    ogImage = primaryImage.startsWith('http') ? primaryImage : `${origin}${primaryImage}`;

    schema = {
      '@context': 'https://schema.org',
      '@type': 'VisualArtwork',
      name: selectedProject.title,
      creator: {
        '@type': 'Person',
        name: 'Gideon Boadi',
        jobTitle: 'Photographer & Founder of Deon Studios',
      },
      artform: 'Photography',
      artMedium: 'Digital & 35mm Film Photography',
      description,
      url: canonicalUrl,
      dateCreated: selectedProject.year,
      genre: selectedProject.category,
    };
  } else {
    // Home Page
    title = 'Deon Studios | Editorial & Fashion Photography by Gideon Boadi';
    description =
      'Explore the official portfolio of Gideon Boadi, founder of Deon Studios. Discover evocative fashion, editorial, portraiture, and commercial photography based in Accra.';
    ogType = 'website';
    canonicalUrl = origin;

    schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Deon Studios',
      alternateName: 'Gideon Boadi Portfolio',
      url: origin,
      description,
      publisher: {
        '@type': 'Organization',
        name: 'Deon Studios',
        url: origin,
        logo: `${origin}/assets/gideon_boadi_portrait.png`,
        founder: {
          '@type': 'Person',
          name: 'Gideon Boadi',
        },
      },
    };
  }

  return {
    title,
    description,
    canonicalUrl,
    ogType,
    ogImage,
    noindex,
    schema,
  };
}

/**
 * Declarative React Helmet SEO Component for dynamic document title and meta tag updates.
 */
export const DocumentSeo: React.FC<DocumentSeoProps> = ({
  activePage,
  selectedProject,
  adminTab,
}) => {
  const config = getSeoConfig({ activePage, selectedProject, adminTab });

  return (
    <SEOHead
      title={config.title}
      description={config.description}
      canonicalUrl={config.canonicalUrl}
      ogType={config.ogType}
      ogImage={config.ogImage}
      noindex={config.noindex}
      schema={config.schema}
      publishedTime={
        activePage === 'project' && selectedProject?.year
          ? `${selectedProject.year}-01-01`
          : undefined
      }
      articleSection={
        activePage === 'project' && selectedProject?.category
          ? selectedProject.category
          : undefined
      }
    />
  );
};

/**
 * Hook kept for backwards compatibility if needed, but SEO is now handled
 * declaratively via React Helmet and <DocumentSeo />.
 */
export function useDocumentSeo(options: DocumentSeoProps) {
  // React Helmet asynchronously updates the document title and head tags
  // when <DocumentSeo /> or <SEOHead /> is mounted in the React component tree.
  return options;
}
