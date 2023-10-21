import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

export class Client {
  private readonly S3: AWS.S3;

  constructor() {
    this.S3 = new AWS.S3({
      s3ForcePathStyle: true,
    });
  }

  async getJSONObject<T>(key: string): Promise<T | undefined> {
    const request: AWS.S3.GetObjectRequest = {
      Bucket: process.env.S3_BUCKET || '',
      Key: key,
    };

    return await this.S3.getObject(request)
      .promise()
      .then((res) => {
        if (res.Body == null) {
          return undefined;
        }
        if (typeof res.Body === 'string') {
          return JSON.parse(res.Body) as T;
        }
        if (typeof res.Body === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          const content = res.Body.toString();
          console.log('content', content);
          return JSON.parse(content) as T;
        }
        throw new Error(`Not json file. key: ${key}, typeof:${typeof res.Body}`);
      })
      .catch((err) => {
        console.warn(err);
        return undefined as T | undefined;
      });
  }

  async uploadJSONObject(key: string, content: object): Promise<PromiseResult<AWS.S3.PutObjectOutput, AWS.AWSError>> {
    const request: AWS.S3.PutObjectRequest = {
      Bucket: process.env.S3_BUCKET || '',
      Key: key,
      Body: JSON.stringify(content),
      Metadata: {
        'Content-Type': 'application/json',
      },
    };

    return await this.S3.putObject(request)
      .promise()
      .catch((err) => {
        throw err;
      });
  }

  async uploadImage(key: string, image: ArrayBuffer): Promise<PromiseResult<AWS.S3.PutObjectOutput, AWS.AWSError>> {
    const request: AWS.S3.PutObjectRequest = {
      Bucket: process.env.S3_BUCKET || '',
      Key: key,
      Body: image,
    };
    return await this.S3.putObject(request)
      .promise()
      .catch((err) => {
        throw err;
      });
  }
}
