const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline,
} = require('@azure/storage-blob');

const getStream = require('into-stream');
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
const ONE_MINUTE = 60 * 1000;
const accountName = process.env.AZURE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_ACCOUNT_KEY;
const { generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

function generateSasToken(containerName, blobName, sharedKeyCredential) {
  const start = new Date();
  const expiry = new Date(start);
  expiry.setMinutes(start.getMinutes() + 525948766); // Set the expiration time to 1 year from now.

  const permissions = BlobSASPermissions.parse('r'); // Allow read access.

  const sasQueryParameters = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions,
      startsOn: start,
      expiresOn: expiry,
    },
    sharedKeyCredential
  );

  return sasQueryParameters.toString();
}

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const pipeline = newPipeline(sharedKeyCredential);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  pipeline
);

const getBlobName = originalName => {
  // Use a random number to generate a unique file name,
  // removing "0." from the start of the string.
  const identifier = Math.random()
    .toString()
    .replace(/0\./, '');
  return `${identifier}-${originalName}`;
};

module.exports = async (req, res) => {
  const blobName = getBlobName(req.file.originalname);
  const stream = getStream(req.file.buffer);
  const containerClient = blobServiceClient.getContainerClient(accountName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.uploadStream(stream, uploadOptions.bufferSize, uploadOptions.maxBuffers, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const sasToken = generateSasToken(accountName, blobName, sharedKeyCredential);
    const sasUrl = `${blockBlobClient.url}?${sasToken}`;

    return res.status(200).send({ file: { url: sasUrl, name: blobName } });
  } catch (err) {
    console.log('API call failed, reason ', err.message);
    return res.status(400).send({ error: err.message });
  }
};
