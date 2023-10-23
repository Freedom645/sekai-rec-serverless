import * as Jimp from 'jimp';
import { Jacket, JacketHash, JacketHashJson } from '../model/Jacket';

export interface IJacketApi {
  getMusicJacket: (musicId: number) => Promise<Jacket>;
}

export interface IJacketS3 {
  uploadMusicJacket: (data: Jacket) => Promise<void>;
  getJacketHashJson: () => Promise<JacketHashJson | undefined>;
  uploadJacketHashJson: (data: JacketHashJson) => Promise<void>;
}

export class JacketService {
  constructor(
    private readonly api: IJacketApi,
    private readonly s3: IJacketS3
  ) {}

  async getJacket(musicId: number): Promise<Jacket> {
    const jacket = await this.api.getMusicJacket(musicId);

    const image = await Jimp.read(jacket.content as Buffer);
    jacket.hash = image.hash();

    return jacket;
  }

  async saveJacket(jacket: Jacket): Promise<void> {
    await this.s3.uploadMusicJacket(jacket);
  }

  async mergeJacketHashJson(jacketHash: JacketHash[]): Promise<void> {
    const json = (await this.s3.getJacketHashJson()) ?? [];
    json.push(...jacketHash);
    await this.s3.uploadJacketHashJson(json);
  }
}
