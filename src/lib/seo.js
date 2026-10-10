/**
 * SEO Configuration — Single source of truth.
 * Import from here in all metadata exports to avoid duplication.
 */

export const siteConfig = {
  name: "AMARDokan",
  url: "https://amardokan-two.vercel.app",
  /** Bengali tagline */
  tagline: "আপনার অনলাইন দোকান তৈরি করুন সহজেই",
  description:
    "AMARDokan দিয়ে শুরু করুন আপনার ই-কমার্স ব্যবসা। বাংলা বাল্ক ইনভয়েস প্রিন্ট, অর্ডার ম্যানেজমেন্ট, স্টক ট্র্যাকিং, কুরিয়ার ইন্টিগ্রেশন — সব এক জায়গায়।",
  descriptionEn:
    "Bangladesh's #1 e-commerce automation platform. Bulk invoice printing, order management, stock tracking, courier integration — all in one dashboard.",
  keywords: [
    "ই-কমার্স",
    "অনলাইন দোকান",
    "বাংলাদেশ",
    "বাংলা",
    "ইকমার্স প্লাটফর্ম",
    "AMARDokan",
    "অনলাইন ব্যবসা",
    "পণ্য বিক্রয়",
    "bulk invoice print",
    "Bangladesh e-commerce",
    "order management",
    "stock tracking",
    "Daraz automation",
    "e-commerce automation",
  ],
  author: "AMARDokan Team",
  twitter: "@amardokan",
  locale: "bn_BD",
  /** Social profiles for sameAs in JSON-LD */
  social: {
    facebook: "https://facebook.com/amardokan",
    twitter: "https://twitter.com/amardokan",
    youtube: "https://youtube.com/@amardokan",
  },
  images: {
    og: "/og-image.jpg",
    twitter: "/twitter-image.jpg",
    logo: "/logo.png",
  },
};

/**
 * Build a full canonical URL from a path.
 * @param {string} path - e.g. "/registration"
 */
export const getCanonicalUrl = (path = "/") =>
  `${siteConfig.url}${path === "/" ? "" : path}`;

/**
 * Shared Open Graph image block reused across every page.
 */
export const defaultOgImages = [
  {
    url: siteConfig.images.og,
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} — ই-কমার্স প্লাটফর্ম`,
    type: "image/jpeg",
  },
];

/**
 * Build complete, non-duplicated metadata for a given page.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   path?: string,
 *   noIndex?: boolean,
 *   keywords?: string[],
 *   ogType?: string,
 *   ogImage?: string,
 * }} options
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
  keywords = [],
  ogType = "website",
  ogImage = siteConfig.images.og,
} = {}) {
  const canonicalUrl = getCanonicalUrl(path);
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const allKeywords = [...siteConfig.keywords, ...keywords];

  return {
    // Avoid template duplication — provide a pre-built title
    title: { absolute: fullTitle },
    description,
    keywords: allKeywords.join(", "),
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
          type: "image/jpeg",
        },
      ],
      locale: siteConfig.locale,
      type: ogType,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [siteConfig.images.twitter || ogImage],
      creator: siteConfig.twitter,
      site: siteConfig.twitter,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    formatDetection: { email: false, address: false, telephone: false },
    category: "ecommerce",
  };
}

/* ─── JSON-LD Helpers ─── */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}${siteConfig.images.logo}`,
    },
    description: siteConfig.descriptionEn,
    sameAs: Object.values(siteConfig.social),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["Bengali", "English"],
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.descriptionEn,
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "0",
        priceCurrency: "BDT",
        description: "Free forever plan — up to 100 orders/month",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "2999",
        priceCurrency: "BDT",
        description: "For growing e-commerce businesses ready to scale",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2000",
      bestRating: "5",
    },
  };
}

export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function webPageSchema({ title, description, path, dateModified }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${getCanonicalUrl(path)}#webpage`,
    url: getCanonicalUrl(path),
    name: title,
    description,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    about: { "@id": `${siteConfig.url}/#organization` },
    dateModified: dateModified || new Date().toISOString(),
    inLanguage: "bn-BD",
    breadcrumb: { "@id": `${getCanonicalUrl(path)}#breadcrumb` },
  };
}
