export interface Jacket {
  musicId: number;
  extension: string;
  content: ArrayBuffer;
  hash?: string;
}

export type JacketHashJson = Array<JacketHash>;

export interface JacketHash {
  musicId: number;
  hash: string;
}
