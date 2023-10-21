import { ResponseMusic } from '../model/Music';

export interface IMusicApi {
  getMusicJson: () => Promise<ResponseMusic[]>;
}

export interface IMusicS3 {
  getMusicJson: () => Promise<ResponseMusic[]>;
  uploadMusicJson: (json: ResponseMusic[]) => Promise<void>;
}

export class MusicService {
  constructor(
    private readonly api: IMusicApi,
    private readonly s3: IMusicS3
  ) {}

  async getMusicJson() {
    const tasks = [this.s3.getMusicJson(), this.api.getMusicJson()] as const;
    const [preJson, nowJson] = await Promise.all(tasks);
    return { preJson, nowJson };
  }

  detectUpdateDiff(preJson: ResponseMusic[], nowJson: ResponseMusic[]): number[] {
    const idSet = preJson.reduce((set, music) => set.add(music.id), new Set<number>());
    return nowJson.flatMap((music) => (idSet.has(music.id) ? [] : [music.id]));
  }

  async saveMusicJson(json: ResponseMusic[]) {
    await this.s3.uploadMusicJson(json);
  }
}
