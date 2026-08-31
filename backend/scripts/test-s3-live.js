const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function runLiveS3Test() {
  const bucketName = process.env.AWS_S3_BUCKET || 'cloudcampus-511225358997';
  const region = process.env.AWS_REGION || 'us-east-1';
  const testKey = 'cloudcampus-integration-test.txt';
  const testContent = 'CloudCampus S3 integration test';

  console.log(`[Live S3 Test] Initializing S3 client for bucket "${bucketName}" in region "${region}"...`);

  const s3 = new S3Client({ region });

  try {
    // 1. Upload test object
    console.log(`[Live S3 Test] Step 1: Uploading test object "${testKey}"...`);
    const putRes = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: Buffer.from(testContent, 'utf-8'),
        ContentType: 'text/plain',
      })
    );
    console.log(`[Live S3 Test] Step 1 SUCCESS: Uploaded with ETag ${putRes.ETag}`);

    // 2. Verify existence
    console.log(`[Live S3 Test] Step 2: Verifying object existence via HeadObject...`);
    const headRes = await s3.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    console.log(`[Live S3 Test] Step 2 SUCCESS: Object exists, size: ${headRes.ContentLength} bytes, ContentType: ${headRes.ContentType}`);

    // 3. Download & verify content
    console.log(`[Live S3 Test] Step 3: Downloading object content via GetObject...`);
    const getRes = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    const downloadedContent = await streamToString(getRes.Body);
    console.log(`[Live S3 Test] Step 3 SUCCESS: Downloaded content = "${downloadedContent}"`);

    if (downloadedContent !== testContent) {
      throw new Error(`Content mismatch! Expected "${testContent}", received "${downloadedContent}"`);
    }

    // 4. Delete test object
    console.log(`[Live S3 Test] Step 4: Deleting test object "${testKey}"...`);
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    console.log(`[Live S3 Test] Step 4 SUCCESS: Delete command executed`);

    // 5. Verify deletion
    console.log(`[Live S3 Test] Step 5: Verifying deletion via HeadObject...`);
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
      throw new Error(`Object "${testKey}" still exists after deletion!`);
    } catch (headErr) {
      if (headErr.name === 'NotFound' || headErr.$metadata?.httpStatusCode === 404) {
        console.log(`[Live S3 Test] Step 5 SUCCESS: Verified object is no longer present (HTTP 404 NotFound).`);
      } else {
        throw headErr;
      }
    }

    console.log(`\n========================================`);
    console.log(`ALL S3 LIVE INTEGRATION TESTS PASSED 100%`);
    console.log(`========================================\n`);
    process.exit(0);
  } catch (err) {
    console.error(`[Live S3 Test] FAILED:`, err.message || err);
    process.exit(1);
  }
}

runLiveS3Test();
