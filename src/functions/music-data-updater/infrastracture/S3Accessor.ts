import { ResponseMusic } from '../model/Music';
import { IJacketS3 } from '../service/JacketService';
import { IMusicS3 } from '../service/MusicService';
import { zeroPadding } from '../utils/Formatter';
import { Client } from '../utils/S3Client';

export class S3Accessor implements IJacketS3, IMusicS3 {
  constructor(private readonly s3: Client) {}

  async uploadMusicJacket(musicId: number, image: ArrayBuffer): Promise<void> {
    const key = `music/jacket/jacket_${zeroPadding(musicId, 3)}.webp`;
    await this.s3.uploadImage(key, image);
  }

  async getMusicJson(): Promise<ResponseMusic[]> {
    const key = 'music/musics.json';
    return await this.s3.getJSONObject<ResponseMusic[]>(key);
  }

  async uploadMusicJson(json: ResponseMusic[]): Promise<void> {
    const key = 'music/musics.json';
    await this.s3.uploadJSONObject(key, json);
  }
}
