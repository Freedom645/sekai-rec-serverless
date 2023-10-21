import type { AWS } from '@serverless/typescript';

import musicDataUpdater from '@functions/music-data-updater';

const serverlessConfiguration: AWS = {
  service: 'sekai-rec-serverless',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-dotenv-plugin'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: '${opt:stage, self:custom.defaultStage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      S3_BUCKET: '${env:S3_BUCKET}',
      SEKAI_MASTER_URL: '${env:SEKAI_MASTER_URL}',
      SEKAI_STORAGE_URL: '${env:SEKAI_STORAGE_URL}',
    },
    region: 'ap-northeast-1',
  },
  functions: {
    musicDataUpdater,
  },
  package: { individually: true },
  resources: {
    Resources: {
      Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.S3_BUCKET}',
        },
      },
      S3IamPolicy: {
        Type: 'AWS::IAM::Policy',
        DependsOn: ['Bucket'],
        Properties: {
          PolicyName: 'lambda-s3',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: 'arn:aws:s3:::${self:provider.environment.S3_BUCKET}/*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: 'arn:aws:s3:::${self:provider.environment.S3_BUCKET}',
              },
            ],
          },
          Roles: [{ Ref: 'IamRoleLambdaExecution' }],
        },
      },
    },
  },
  custom: {
    defaultStage: 'dev',
    dotenv: {
      path: 'env',
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
