import React from 'react';
import ReactDOM from 'react-dom';

import Cueb from './comp/Cueb';
import getApi from './util/getApi';
import {Message, createMessageHandler} from './chromeHelper/message';
import {createStorageOnChangeHandler} from './chromeHelper/storage';

let app;
let api;

function toggleHiddenState(hiddenState) {
  if (hiddenState) chrome.runtime.sendMessage({action: Message.CLOSE_APP});
}

function updateAccount(username, apiKey) {
  chrome.storage.sync.set({apiKey, username});
}

function initApp(apiKey, username) {
  api = getApi(apiKey);
  app = ReactDOM.render(
    <Cueb
      api={api}
      apiKey={apiKey}
      updateAccount={updateAccount}
      username={username}
    />, document.getElementById('container')
  );

  toggleHiddenState(true /* hiddenstate */);

  // HACK
  setTimeout(() => {
    app.setup();
  }, 0);
}

chrome.runtime.onMessage.addListener(createMessageHandler({
  [Message.CONTENT_URL]: (msg) => app.setContentUrl(msg),
  [Message.CONTEXT_UPDATE]: (msg) => app.setContext(msg),
  [Message.SCREENSHOT]: (msg) => app.setScreenshot(msg.screenshot)
}, 'iframe'));

// Will execute on load
chrome.storage.sync.get(null, (storage) => {
  if (__DEV__) console.log('init iframe app with apiKey: ', storage.apiKey);
  initApp(storage.apiKey, storage.username);
});

// Register handler to handle info update
chrome.storage.onChanged.addListener(createStorageOnChangeHandler(new Set([
  'sync:apiKey',
  'sync:username'
]), (changed) => {
  const {apiKey, username} = changed;
  if (apiKey && username) initApp(apiKey, username);
}));
