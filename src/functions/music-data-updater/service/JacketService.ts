export interface IJacketApi {
  getMusicJacket: (musicId: number) => Promise<ArrayBuffer>;
}

export interface IJacketS3 {
  uploadMusicJacket: (musicId: number, image: ArrayBuffer) => Promise<void>;
}

export class JacketService {
  constructor(
    private readonly api: IJacketApi,
    private readonly s3: IJacketS3
  ) {}

  async forwardJacket(musicId: number): Promise<void> {
    const image = await this.api.getMusicJacket(musicId);
    await this.s3.uploadMusicJacket(musicId, image);
  }
}
