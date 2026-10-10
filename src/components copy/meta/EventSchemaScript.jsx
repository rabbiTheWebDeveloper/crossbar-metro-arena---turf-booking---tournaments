const EventSchemaScript = ({ event }) => {

  const formattedData = { 
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": event?.title,
    "image": [
     ...event?.image
     ],
    "description":event?.description,
    "sku": event?.title,
    "mpn": "925872",
    "brand": {
      "@type": "Brand",
      "name": "USED AC"
    },
 
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(formattedData),
        }}
      />
    </>
  );
};

export default EventSchemaScript;