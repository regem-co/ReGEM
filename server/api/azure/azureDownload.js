const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline,
} = require('@azure/storage-blob');

var fs = require('fs');

const accountName = process.env.AZURE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const pipeline = newPipeline(sharedKeyCredential);

const blobServiceClient = new BlobServiceClient(
  //`https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  `https://${accountName}.blob.core.windows.net`,
  pipeline
);

module.exports = async (req, res) => {
  const blobName = req.query.fileName;
  const containerClient = blobServiceClient.getContainerClient(accountName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  var dir = './tempDownloads';
  var localPath = dir + '/' + req.query.fileName;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  try {
    await blockBlobClient.downloadToFile(localPath);

    // var data = fs.readFileSync(localPath);

    //async version:

    fs.readFile(localPath, function(err, data) {
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename=${req.query.fileName}`);
      res.set('Content-Length', data.length); //data.length - 1 ?

      var response = res.status(200).send(data);

      //delete file
      fs.unlinkSync(localPath);

      return response;
    });

    //return res.status(200).send({ localPath: localPath });
  } catch (err) {
    console.log('API call failed, reason ', err.message);
    return res.status(400).send({ error: err.message });
  }
};
