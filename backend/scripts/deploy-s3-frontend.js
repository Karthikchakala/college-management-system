const {
  S3Client,
  PutBucketWebsiteCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  GetBucketWebsiteCommand,
} = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const region = 'us-east-1';
const bucketName = 'cloudcampus-frontend-production';
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');

const s3 = new S3Client({ region });

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.txt': return 'text/plain';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    case '.ttf': return 'font/ttf';
    default: return 'application/octet-stream';
  }
}

async function getAllFiles(dir, base = '') {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath, relPath));
    } else {
      files.push({ fullPath, key: relPath.replace(/\\/g, '/') });
    }
  }
  return files;
}

async function deployFrontend() {
  console.log('====================================================');
  console.log('CLOUDCAMPUS — S3 FRONTEND PRODUCTION DEPLOYMENT');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Region: ${region}`);
  console.log(`Build Directory: ${distDir}`);
  console.log('====================================================\n');

  // Step 1: Verify dist/ exists
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error(`Build output directory "${distDir}" does not contain index.html. Run npm run build first.`);
  }

  // Step 2: Configure S3 Static Website Hosting (index.html / index.html for SPA fallback)
  console.log('[Phase 4] Configuring Static Website Hosting on', bucketName, '...');
  await s3.send(
    new PutBucketWebsiteCommand({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: 'index.html' },
      },
    })
  );
  console.log('[Phase 4] Static Website Hosting enabled (Index: index.html, Error: index.html).');

  // Step 3: Configure Public Access Block (disable block policy to allow public read of static website files)
  console.log('\n[Phase 5] Updating Block Public Access settings...');
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    })
  );
  console.log('[Phase 5] Block Public Access configured (BlockPublicPolicy: false).');

  // Step 4: Apply Public Read Bucket Policy
  console.log('\n[Phase 5] Applying Bucket Policy for s3:GetObject public read...');
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObjectForWebsite',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`,
      },
    ],
  };

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy),
    })
  );
  console.log('[Phase 5] Public Read Bucket Policy successfully applied.');

  // Step 5: Upload all files from dist/
  console.log('\n[Phase 6] Uploading frontend build artifacts from dist/ ...');
  const files = await getAllFiles(distDir);
  console.log(`Found ${files.length} static assets to upload.`);

  for (const f of files) {
    const fileContent = fs.readFileSync(f.fullPath);
    const contentType = getContentType(f.fullPath);
    console.log(`  Uploading: ${f.key} (${fileContent.length} bytes, ${contentType})`);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: f.key,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: f.key.endsWith('.html') ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
      })
    );
  }
  console.log('[Phase 6] All files uploaded successfully.');

  // Step 6: Verify uploaded objects
  console.log('\n[Phase 6] Verifying uploaded objects in bucket...');
  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
  console.log(`[Phase 6] Total objects in bucket: ${list.KeyCount}`);
  if (list.Contents) {
    for (const item of list.Contents) {
      console.log(`  - ${item.Key} (${item.Size} bytes)`);
    }
  }

  // Step 7: Output Website Endpoint
  const websiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;
  console.log('\n====================================================');
  console.log('DEPLOYMENT COMPLETE!');
  console.log(`S3 Website URL: ${websiteUrl}`);
  console.log('====================================================\n');
}

deployFrontend().catch((err) => {
  console.error('[Deployment Error]:', err);
  process.exit(1);
});
