const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

const bucketName = process.env.BUCKET_NAME;
const region = process.env.BUCKET_REGION;
const accessKeyId = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function uploadFile(fileBuffer, fileName, mimetype) {
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
  };

  return s3Client.send(new PutObjectCommand(uploadParams));
}

function deleteFile(fileName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  return s3Client.send(new DeleteObjectCommand(deleteParams));
}

async function getObjectSignedUrl(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  const seconds = 60 * 60 * 24 * 7; // 7 days
  const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

  return url;
}

// async function getObjectSignedUrl(key) {
//   const cloudFrontDomain = "https://ddh5hw8mztv2d.cloudfront.net"; // Your CloudFront distribution domain

//   const url = `${cloudFrontDomain}/${key}`;
//   const signerOptions = {
//     keypairId: "E2AK86BIVS3EV3", // CloudFront Key Pair ID
//     privateKey: process.env.CLOUDFRONT_PRIVATE_KEY, // Path to your CloudFront private key
//   };

//   const signedUrl = getSignedUrl(url, signerOptions);

//   return signedUrl;
// }

module.exports = {
  uploadFile,
  deleteFile,
  getObjectSignedUrl,
};
