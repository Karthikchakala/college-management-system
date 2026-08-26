module.exports = {
  apps: [
    {
      name: 'cloudcampus-backend',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        AWS_REGION: 'us-east-1',
        AWS_S3_BUCKET: 'cloudcampus-511225358997',
        AWS_SECRET_NAME: 'cloudcampus/rds',
        COGNITO_USER_POOL_ID: 'us-east-1_Ic9huqJjL',
        COGNITO_CLIENT_ID: '3kv2vgpkklqtlpfom2t72dn29n',
        COGNITO_ISSUER: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/cloudcampus/backend-error.log',
      out_file: '/var/log/cloudcampus/backend-out.log',
      merge_logs: true,
    },
  ],
};
