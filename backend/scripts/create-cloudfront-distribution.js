const { CloudFrontClient, CreateDistributionCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');

const cfClient = new CloudFrontClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

const BUCKET_NAME = 'cloudcampus-frontend-production';
const OAC_ID = 'E1CYD36SO7P5RD';
const AWS_ACCOUNT_ID = '511225358997';

async function deployCloudFront() {
  console.log('================================================================');
  console.log('[CloudFront Setup] Initiating CloudFront Distribution Deployment');
  console.log('================================================================');
  console.log('Target S3 Bucket:', BUCKET_NAME);
  console.log('Origin Access Control (OAC):', OAC_ID);

  try {
    const callerRef = `cloudcampus-frontend-${Date.now()}`;
    const params = {
      DistributionConfig: {
        CallerReference: callerRef,
        Comment: 'CloudCampus React/Vite Frontend Production Distribution',
        DefaultRootObject: 'index.html',
        Enabled: true,
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: `S3-${BUCKET_NAME}`,
              DomainName: `${BUCKET_NAME}.s3.us-east-1.amazonaws.com`,
              OriginAccessControlId: OAC_ID,
              S3OriginConfig: {
                OriginAccessIdentity: '',
              },
            },
          ],
        },
        DefaultCacheBehavior: {
          TargetOriginId: `S3-${BUCKET_NAME}`,
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD'],
            CachedMethods: {
              Quantity: 2,
              Items: ['GET', 'HEAD'],
            },
          },
          Compress: true,
          // Managed-CachingOptimized policy ID
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
        },
        CustomErrorResponses: {
          Quantity: 2,
          Items: [
            {
              ErrorCode: 403,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 10,
            },
            {
              ErrorCode: 404,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 10,
            },
          ],
        },
      },
    };

    console.log('\n[Step 1] Sending CreateDistributionCommand to CloudFront...');
    const createRes = await cfClient.send(new CreateDistributionCommand(params));
    const dist = createRes.Distribution;
    const distId = dist.Id;
    const domainName = dist.DomainName;
    const distArn = dist.ARN || `arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${distId}`;

    console.log('✓ CloudFront Distribution Created Successfully!');
    console.log('  Distribution ID:', distId);
    console.log('  Domain Name:', domainName);
    console.log('  HTTPS URL: https://' + domainName);
    console.log('  Status:', dist.Status);

    // Step 2: Update S3 Bucket Policy to allow CloudFront OAC read
    console.log('\n[Step 2] Updating S3 Bucket Policy for OAC access...');
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowCloudFrontServicePrincipalReadOnly',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com',
          },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': distArn,
            },
          },
        },
        {
          Sid: 'PublicReadGetObjectForS3WebsiteFallback',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
        },
      ],
    };

    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy),
    }));
    console.log('✓ S3 Bucket Policy successfully updated for CloudFront OAC!');

    console.log('\n================================================================');
    console.log('CLOUDFRONT DEPLOYMENT COMPLETE');
    console.log('Distribution ID:', distId);
    console.log('CloudFront Domain: https://' + domainName);
    console.log('================================================================');

    return { distId, domainName, distArn };
  } catch (err) {
    console.error('❌ CloudFront Creation Failed:');
    console.error('  Error Code:', err.name || err.Code);
    console.error('  Message:', err.message);
    process.exit(1);
  }
}

deployCloudFront();
