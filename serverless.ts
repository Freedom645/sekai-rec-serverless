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
    Conditions: {
      ProdCondition: { 'Fn::Equals': ['${self:provider.stage}', 'production'] },
    },
    Resources: {
      /** S3バケット */
      Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.S3_BUCKET}',
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['http://localhost:5173', 'https://app.sekai-rec.net'],
                MaxAge: 3000,
              },
            ],
          },
        },
      },
      /** S3 IAMポリシー */
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
      /** オリジンアクセス */
      S3CloudFrontOriginAccessControl: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
          OriginAccessControlConfig: {
            Name: 'origin-access-control-${self:provider.stage}',
            OriginAccessControlOriginType: 's3',
            SigningBehavior: 'always',
            SigningProtocol: 'sigv4',
          },
        },
      },
      /** ディストリビューション */
      S3CloudFrontDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Enabled: true,
            Origins: [
              {
                Id: 'S3Origin',
                DomainName: {
                  'Fn::Join': ['.', [{ Ref: 'Bucket' }, 's3', { Ref: 'AWS::Region' }, { Ref: 'AWS::URLSuffix' }]],
                },
                OriginAccessControlId: { Ref: 'S3CloudFrontOriginAccessControl' },
                S3OriginConfig: { OriginAccessIdentity: '' },
              },
            ],
            DefaultCacheBehavior: {
              TargetOriginId: 'S3Origin',
              ViewerProtocolPolicy: 'https-only',
              ForwardedValues: {
                QueryString: false,
              },
              // Ref: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-policy-mediapackage
              CachePolicyId: '08627262-05a9-4f76-9ded-b50ca2e3a84f',
              // Ref: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html#managed-origin-request-policy-cors-s3
              OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
            },
            Aliases: {
              'Fn::If': ['ProdCondition', ['${env:S3_BUCKET}'], { Ref: 'AWS::NoValue' }],
            },
            ViewerCertificate: {
              'Fn::If': [
                'ProdCondition',
                {
                  SslSupportMethod: 'sni-only',
                  MinimumProtocolVersion: 'TLSv1.1_2016',
                  AcmCertificateArn: {
                    'Fn::Sub':
                      'arn:aws:acm:us-east-1:${AWS::AccountId}:certificate/${self:custom.secret.CFSSLCertificateId}',
                  },
                },
                { Ref: 'AWS::NoValue' },
              ],
            },
            HttpVersion: 'http2',
          },
        },
      },
      /** S3バケットポリシー */
      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        DependsOn: ['Bucket', 'S3CloudFrontDistribution'],
        Properties: {
          Bucket: { Ref: 'Bucket' },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'cloudfront.amazonaws.com' },
                Action: ['s3:GetObject'],
                Resource: 'arn:aws:s3:::${self:provider.environment.S3_BUCKET}/*',
                Condition: {
                  StringEquals: {
                    'AWS:SourceArn': {
                      'Fn::Sub': 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${S3CloudFrontDistribution}',
                    },
                  },
                },
              },
            ],
          },
        },
      },
      EventBridgeRule: {
        Type: 'AWS::Events::Rule',
        Properties: {
          EventBusName: 'default',
          Name: 'music-updater-event-rule-${self:provider.stage}',
          ScheduleExpression: 'cron(0 0,3,4,5,6,6,7,8,9,12,15 * * ? *)',
          State: {
            'Fn::If': ['ProdCondition', 'ENABLED', 'DISABLED'],
          },
          Targets: [
            {
              Arn: { 'Fn::GetAtt': ['MusicDataUpdaterLambdaFunction', 'Arn'] },
              Id: 'MusicDataUpdaterLambdaFunction',
              Input: JSON.stringify({ headers: { 'Content-Type': 'application/json' }, body: '{}' }),
            },
          ],
        },
      },
      PermissionForEventsToInvokeLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: 'MusicDataUpdaterLambdaFunction' },
          Action: 'lambda:InvokeFunction',
          Principal: 'events.amazonaws.com',
          SourceArn: { 'Fn::GetAtt': ['EventBridgeRule', 'Arn'] },
        },
      },
    },
  },
  custom: {
    defaultStage: 'dev',
    secret: {
      CFSSLCertificateId: '${env:CFSSLCertificateId}',
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
