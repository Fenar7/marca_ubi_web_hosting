import type { Metadata } from 'next';
import ClientHeader from '@/app/components/ClientHeader/ClientHeader';
import MonumentalFooter from '@/app/components/Sections/MonumentalFooter';
import ContactHero from './components/ContactHero';
import InquiryComposer from './components/InquiryComposer';
import StudioCards from './components/StudioCards';
import WantToWorkWithUs from './components/WantToWorkWithUs';
import styles from './Contact.module.scss';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marcaubi.com').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: 'Contact & Global Studios | Marca Ubi Enterprise Agency',
  description:
    'Connect with Marca Ubi. Direct intake channels for enterprise brand architecture, digital flagships, and studio consultations across our Calicut and Trivandrum hubs.',
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/contact`,
    siteName: 'Marca Ubi',
    locale: 'en_US',
    title: 'Contact & Global Studios | Marca Ubi Enterprise Agency',
    description:
      'Direct intake channels for enterprise brand architecture, digital flagships, and strategic collaboration. Connect directly with our studio desks.',
    images: [
      {
        url: `${siteUrl}/images/hero-image.png`,
        width: 1200,
        height: 630,
        alt: 'Marca Ubi Studio Desks & Direct Intake Portal',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@marcaubi',
    creator: '@marcaubi',
    title: 'Contact & Global Studios | Marca Ubi Enterprise Agency',
    description:
      'Direct intake channels for enterprise brand architecture, digital flagships, and studio consultations across our Calicut and Trivandrum hubs.',
    images: [`${siteUrl}/images/hero-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Marca Ubi',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'ContactPage',
      '@id': `${siteUrl}/contact#webpage`,
      url: `${siteUrl}/contact`,
      name: 'Contact Marca Ubi | Global Studios & Enterprise Inquiries',
      description:
        'Direct intake channels, inquiry routing, and physical studio locations for Marca Ubi Enterprise Agency in Calicut and Trivandrum.',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#organization` },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteUrl}/contact` },
        ],
      },
    },
    {
      '@type': ['Organization', 'ProfessionalService', 'LocalBusiness'],
      '@id': `${siteUrl}/#organization`,
      name: 'Marca Ubi',
      legalName: 'Marca Ubi Enterprise Agency',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': `${siteUrl}/#logo`,
        url: `${siteUrl}/images/marca-ubi-red-png.svg`,
        caption: 'Marca Ubi Enterprise Agency Logo',
      },
      image: `${siteUrl}/images/hero-image.png`,
      priceRange: '$$$$',
      currenciesAccepted: 'INR, USD, AED, GBP, EUR',
      paymentAccepted: 'Bank Wire, Corporate Credit Card, Invoice',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+917012052472',
          email: 'hello@marcaubi.com',
          contactType: 'customer service',
          areaServed: ['IN', 'AE', 'GB', 'US'],
          availableLanguage: ['English', 'Malayalam', 'Arabic'],
        },
        {
          '@type': 'ContactPoint',
          email: 'careers@marcaubi.com',
          contactType: 'recruitment',
          areaServed: ['IN', 'AE', 'GB', 'US'],
          availableLanguage: ['English', 'Malayalam'],
        },
      ],
      location: [
        {
          '@type': 'LocalBusiness',
          '@id': `${siteUrl}/#studio-calicut`,
          name: 'Marca Ubi Studio Calicut (HiLITE HQ)',
          telephone: '+917012052472',
          email: 'hello@marcaubi.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Level 4, HiLITE Business Park, Poovangal',
            addressLocality: 'Calicut',
            addressRegion: 'KL',
            postalCode: '673014',
            addressCountry: 'IN',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 11.2588,
            longitude: 75.8322,
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00',
            },
          ],
        },
        {
          '@type': 'LocalBusiness',
          '@id': `${siteUrl}/#studio-trivandrum`,
          name: 'Marca Ubi Creative Studio Trivandrum',
          telephone: '+917012052472',
          email: 'hello@marcaubi.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Technopark Phase III, Kulathoor',
            addressLocality: 'Trivandrum',
            addressRegion: 'KL',
            postalCode: '695583',
            addressCountry: 'IN',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 8.5241,
            longitude: 76.9366,
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00',
            },
          ],
        },
      ],
    },
  ],
};

/**
 * View: Full Contact & Studio Directory Page (/contact).
 * Combines 160/90 Solid Obsidian Black Hero Masthead with Whoa Mama Swiss Light Editorial
 * minimal form architecture, clean studio hub location cards, and targeted careers talent diversion.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function ContactPage() {
  return (
    <div data-client-shell="true" className={styles.pageShell}>
      {/* Structured JSON-LD Schema.org Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <ClientHeader defaultTheme="dark" />

      {/* 160/90 Solid Obsidian Black Hero Masthead (White Nav & Brandmark Contrast) */}
      <ContactHero />

      <main id="contact-main" className={styles.pageMain} data-header-theme="light">
        <div className={styles.flowContainer}>
          {/* 1. Full-Width 160/90 Intent Pills & Whoa Mama Business Enquiries Form */}
          <InquiryComposer />

          {/* 2. Full-Width Soft Pink Talent Diversion Card (Exact match of Screenshot 155749) */}
          <WantToWorkWithUs />

          {/* 3. Studio Location Hubs: Calicut & Trivandrum (Whoa Mama Screenshot 155756) */}
          <StudioCards />
        </div>
      </main>

      <MonumentalFooter />
    </div>
  );
}
