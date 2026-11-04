import React from 'react';
import { serializeJsonLd } from '../lib/seo';

/**
 * Renders one or more JSON-LD <script> blocks. Server component: use it from page.jsx files.
 *   <JsonLd data={breadcrumbSchema([...])} />
 *   <JsonLd data={[webPageSchema({...}), faqSchema(items)]} />
 */
export function JsonLd({ data, id }) {
    const list = (Array.isArray(data) ? data : [data]).filter(Boolean);
    if (!list.length) return null;
    return (<>
      {list.map((item, i) => (<script key={id ? `${id}-${i}` : i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}/>))}
    </>);
}

export default JsonLd;
