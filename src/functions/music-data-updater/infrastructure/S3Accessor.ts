import { Jacket, JacketHashJson } from '../model/Jacket';
import { MusicDifficultyJson, MusicsJson } from '../model/Music';
import { IJacketS3 } from '../service/JacketService';
import { IMusicS3 } from '../service/MusicService';
import { zeroPadding } from '../utils/Formatter';
import { Client } from '../utils/S3Client';

export class S3Accessor implements IJacketS3, IMusicS3 {
  constructor(private readonly s3: Client) {}

  async uploadMusicJacket(jacket: Jacket): Promise<void> {
    const key = `music/jacket/jacket_${zeroPadding(jacket.musicId, 3)}.${jacket.extension}`;
    await this.s3.uploadImage(key, jacket.content);
  }

  async getJacketHashJson(): Promise<JacketHashJson | undefined> {
    const key = `music/jacket_hash.json`;
    return await this.s3.getJSONObject(key);
  }

  async uploadJacketHashJson(data: JacketHashJson): Promise<void> {
    const key = `music/jacket_hash.json`;
    await this.s3.uploadJSONObject(key, data);
  }

  async getMusicJson(): Promise<MusicsJson | undefined> {
    const key = 'music/musics.json';
    return await this.s3.getJSONObject<MusicsJson>(key);
  }

  async uploadMusicJson(json: MusicsJson): Promise<void> {
    const key = 'music/musics.json';
    await this.s3.uploadJSONObject(key, json);
  }

  async getMusicDifficultiesJson(): Promise<MusicDifficultyJson> {
    const key = 'music/musicDifficulties.json';
    return await this.s3.getJSONObject<MusicDifficultyJson>(key);
  }

  async uploadMusicDifficultiesJson(json: MusicDifficultyJson): Promise<void> {
    const key = 'music/musicDifficulties.json';
    await this.s3.uploadJSONObject(key, json);
  }
}
