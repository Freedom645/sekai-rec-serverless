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

const requester = new Requester();
const s3Accessor = new S3Accessor(new Client());

const jacketService = new JacketService(requester, s3Accessor);
const musicService = new MusicService(requester, s3Accessor);

const musicDataUpdater: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  try {
    const { preJson, nowJson } = await musicService.getMusicJson();
    const diff = musicService.detectUpdateDiff(preJson ?? [], nowJson);

    console.log('更新楽曲ID: ', diff);
    if (diff.length === 0) {
      console.log('更新楽曲が無かったため、正常終了しました。');
      return formatJSONResponse({
        result: 'success',
      });
    }

    diff.splice(30);

    const chunkTask = chunkArray(diff, 10);
    for (const tasks of chunkTask) {
      await Promise.all(tasks.map((musicId) => jacketService.forwardJacket(musicId)));
    }

    const savedJson = (preJson ?? []).concat(nowJson.filter((music) => diff.some((id) => id === music.id)));
    await musicService.saveMusicJson(savedJson);

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
