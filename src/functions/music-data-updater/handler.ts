import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';
import { JacketService } from './service/JacketService';
import { MusicService } from './service/MusicService';
import { S3Accessor } from './infrastructure/S3Accessor';
import { Client } from './utils/S3Client';
import { Requester } from './infrastructure/Requester';
import { chunkArray } from './utils/Formatter';
import { JacketHash } from './model/Jacket';

const requester = new Requester();
const s3Accessor = new S3Accessor(new Client());

const jacketService = new JacketService(requester, s3Accessor);
const musicService = new MusicService(requester, s3Accessor);

const musicDataUpdater: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  try {
    const { preJson, nowJson } = await musicService.getMusicJson();
    const diff = musicService.detectUpdateDiff(preJson ?? [], nowJson);

    console.log('更新差分の楽曲ID: ', diff);
    if (diff.length === 0) {
      console.log('更新楽曲が無かったため、正常終了しました。');
      return formatJSONResponse({
        result: 'success',
      });
    }

    diff.splice(20);
    console.log('更新対象の楽曲ID: ', diff);

    const chunkTask = chunkArray(diff, 10);
    const hashList: JacketHash[] = [];
    for (const tasks of chunkTask) {
      const res = await Promise.all(
        tasks.map(async (musicId) => {
          const jacket = await jacketService.getJacket(musicId);
          await jacketService.saveJacket(jacket);

          if (jacket.hash == null) {
            throw new Error(
              `ジャケット画像のハッシュ値が設定されていません。楽曲ID:${jacket.musicId}, 拡張子:${jacket.extension}`
            );
          }

          return {
            musicId: jacket.musicId,
            hash: jacket.hash,
          };
        })
      );

      hashList.push(...res);
    }

    const savedJson = (preJson ?? [])
      .concat(nowJson.filter((music) => diff.some((id) => id === music.id)))
      .sort((left, right) => left.id - right.id);
    await musicService.saveMusicJson(savedJson);

    hashList.sort((left, right) => left.musicId - right.musicId);
    await jacketService.mergeJacketHashJson(hashList);

    return formatJSONResponse({
      result: 'success',
    });
  } catch (e) {
    console.error(e);
    return formatJSONResponse({
      result: 'failed',
    });
  }
};

export const main = middyfy(musicDataUpdater);
