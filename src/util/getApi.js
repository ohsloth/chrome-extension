import { ApiClient } from 'api-client';

import config from '../config';

export default function getApi(apiKey) {
  return new ApiClient({host: config.API_HOST}, apiKey);
}
