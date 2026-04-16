const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline,
} = require('@azure/storage-blob');

const accountName = process.env.AZURE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const pipeline = newPipeline(sharedKeyCredential);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  pipeline
);

module.exports = async (req, res) => {
  const blobName = req.query.fileName;
  const containerClient = blobServiceClient.getContainerClient(accountName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    // Delete the blob
    await blockBlobClient.delete();

    // Send a success response
    return res.status(200).send({ message: 'File deleted successfully.' });
  } catch (err) {
    console.log('API call failed, reason ', err.message);
    return res.status(400).send({ error: err.message });
  }
};
