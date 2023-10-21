import middy from '@middy/core';
import middyJsonBodyParser from '@middy/http-json-body-parser';

export const middyfy = (handler) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return middy(handler).use(middyJsonBodyParser());
};
