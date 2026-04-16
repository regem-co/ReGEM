const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

// function generateUUID(id) {
//   return id.replace(/[xy]/g, function (c) {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16)
//   });
// }

function slugify(text) {
  return text
    .toLowerCase() // Step 1: Convert to lowercase
    .replace(/\s+/g, '-') // Step 2: Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Step 3: Remove unwanted characters
    .replace(/--+/g, '-') // Remove duplicate hyphens (if any)
    .trim(); // Remove leading/trailing hyphens
}

module.exports = async (req, res) => {
  const allListings = [];
  let totalPages;
  let page = 1;

  try {
    do {
      const response = await integrationSdk.listings.query({
        states: 'published',
        page: page,
        perPage: 100,
      });

      const items = response.data.data || [];
      totalPages = response.data.meta.paginationLimit;
      allListings.push(...items);
      page++;
    } while (page <= totalPages);

    // res.send({
    //   status: 200,
    //   statusText: "OK",
    //   data: allListings, // Sending all collected listings
    // });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n
    <rss
      xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n
      <channel>\n
        <title>ReGEM</title>\n
        <link>https://www.joinrefind.com</link>\n
        <description>JoinREFIND is a platform created by jewelry enthusiasts aimed at connecting jewelry lovers. It offers a space for members to shop for and sell fine jewelry, with a focus on sustainability by promoting circular and preloved items. Users can also learn about trends and engage in a community that encourages collaboration and growth.</description>\n`;

    let slug;
    let additonalImageLink;
    let imageLink;
    let gender;

    allListings.forEach(product => {
      slug = slugify(product.attributes.title);
      // additonalImageLink = (Array.isArray(product.attributes.publicData.imagesOrder) && product.attributes.publicData.imagesOrder.length > 1)
      //   ? product.attributes.publicData.imagesOrder.slice(1).map(item => item.image).join(',')
      //   : null;
      imageLink =
        Array.isArray(product.attributes.publicData.imagesOrder) &&
        product.attributes.publicData.imagesOrder.length > 0
          ? product.attributes.publicData.imagesOrder[0].image
          : null;
      gender = product.attributes.publicData.style?.join(', ');

      xml += `
      <item>
        <g:id>${product.id.uuid}</g:id>
        <g:title><![CDATA[${product.attributes.title}]]></g:title>
        <g:description><![CDATA[${product.attributes.description}]]></g:description>
        <g:link>https://www.joinrefind.com/l/${slug}/${product.id.uuid}</g:link>
        <title><![CDATA[${product.attributes.title}]]></title>
        <description><![CDATA[${product.attributes.description}]]></description>
        <link>https://www.joinrefind.com/l/${slug}/${product.id.uuid}</link>
        <g:image_link><![CDATA[${imageLink}]]></g:image_link>
        <g:availability>in stock</g:availability>
        <g:price>${product.attributes.price.amount / 100} USD</g:price>
        <g:google_product_category>${
          product.attributes.publicData.category
        }</g:google_product_category>
        <g:brand><![CDATA[${
          product.attributes.publicData.branded === 'branded'
            ? product.attributes.publicData.brandName
            : 'unknown'
        }]]></g:brand>
        <g:identifier_exists>no</g:identifier_exists>
        <g:condition>new</g:condition>
        <g:adult>no</g:adult>
        <g:is_bundle>yes</g:is_bundle>
        <g:age_group>adult</g:age_group>
        <g:color>${product.attributes.privateData.color}</g:color>
        <g:gender>female</g:gender>
        <g:material>${product.attributes.publicData.materials?.join(', ')}</g:material>
        <g:tax>
          <g:country>US</g:country>
          <g:region>CA</g:region>
          <g:rate>5.00</g:rate>
          <g:tax_ship>yes</g:tax_ship>
        </g:tax>
      </item>\n`;
    });
    xml += `</channel>\n</rss>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error fetching listings:', error);

    res.status(500).send({
      status: 500,
      statusText: 'Internal Server Error',
      message: 'Could not fetch listings',
    });
  }
};
