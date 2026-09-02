const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const region = 'us-east-1';
const rds = new RDSClient({ region });
const secrets = new SecretsManagerClient({ region });

async function inspectRds() {
  const rdsRes = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: 'cloudcampus-db' }));
  const db = rdsRes.DBInstances[0];
  console.log('=== RDS INSTANCE DETAILS ===');
  console.log('DB Identifier:', db.DBInstanceIdentifier);
  console.log('Endpoint:', db.Endpoint?.Address, ':', db.Endpoint?.Port);
  console.log('Engine:', db.Engine, db.EngineVersion);
  console.log('Publicly Accessible:', db.PubliclyAccessible);
  console.log('VPC ID:', db.DBSubnetGroup?.VpcId);
  console.log('Subnets:', db.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier));
  console.log('Security Groups:', db.VpcSecurityGroups?.map(s => s.VpcSecurityGroupId));

  const secretRes = await secrets.send(new GetSecretValueCommand({ SecretId: 'cloudcampus/rds' }));
  const secretObj = JSON.parse(secretRes.SecretString);
  console.log('Secret keys:', Object.keys(secretObj));
  console.log('DB Host in secret:', secretObj.host || secretObj.endpoint);
  console.log('DB Name in secret:', secretObj.dbname || secretObj.database);
}

inspectRds().catch(console.error);
