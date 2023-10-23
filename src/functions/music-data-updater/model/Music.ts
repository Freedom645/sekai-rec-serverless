export type MusicsJson = Array<Music>;

export interface Music {
  id: number;
  seq: number;
  releaseConditionId: number;
  categories: string[];
  title: string;
  pronunciation: string;
  creatorArtistId: number;
  lyricist: string;
  composer: string;
  arranger: string;
  dancerCount: number;
  selfDancerPosition: number;
  assetbundleName: string;
  liveTalkBackgroundAssetbundleName: string;
  publishedAt: number;
  releasedAt: number;
  liveStageId: number;
  fillerSec: number;
  isNewlyWrittenMusic: boolean;
  musicCollaborationId?: number;
}

export type MusicDifficultyJson = Array<MusicDifficulty>;

export interface MusicDifficulty {
  id: number;
  musicId: number;
  musicDifficulty: string;
  playLevel: number;
  releaseConditionId: number;
  totalNoteCount: number;
}
