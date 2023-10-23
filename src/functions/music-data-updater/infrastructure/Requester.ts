import axios, { AxiosInstance } from 'axios';
import { IJacketApi } from '../service/JacketService';
import { zeroPadding } from '../utils/Formatter';
import { IMusicApi } from '../service/MusicService';
import { Music } from '../model/Music';
import { Jacket } from '../model/Jacket';

const SEKAI_STORAGE_URL = process.env['SEKAI_STORAGE_URL'];
const SEKAI_MASTER_URL = process.env['SEKAI_MASTER_URL'];

export class Requester implements IJacketApi, IMusicApi {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'image/webp',
      },
    });
  }

  async getMusicJson(): Promise<Music[]> {
    return await axios.get<Music[]>(`${SEKAI_MASTER_URL}/musics.json`).then((res) => res.data);
  }

  async getMusicJacket(musicId: number): Promise<Jacket> {
    const pad = zeroPadding(musicId, 3);
    const url = `${SEKAI_STORAGE_URL}/sekai-assets/music/jacket/jacket_s_${pad}_rip/jacket_s_${pad}.png`;
    return await this.apiClient.get<ArrayBuffer>(url).then((res) => ({
      musicId: musicId,
      content: res.data,
      extension: 'png',
    }));
  }
}
