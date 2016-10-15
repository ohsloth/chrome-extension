const api = {
  prod: {
    host: 'https://cueb.io/api/v1/',
    embed: 'https://cueb.io/embed/',
    webRoot: 'https://cueb.io/'
  },
  dev: {
    host: 'https://localhost:3443/',
    embed: 'https://localhost:5443/embed/',
    webRoot: 'https://localhost:5443/'
  }
};

const env = __DEV__ ? 'dev' : 'prod';

const config = {
  API_HOST: api[env].host,
  EMBED_HOST: api[env].embed,
  WEB_ROOT: api[env].webRoot
};

export default config;
