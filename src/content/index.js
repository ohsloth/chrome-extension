import {Message, createMessageHandler, sendMessage} from '../chromeHelper/message';
import {createStorageOnChangeHandler} from '../chromeHelper/storage';

import config from '../config';
import ContentApp from './ContentApp';

let app;
let iframe;
let divContainer;

function createIframe() {
  const extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
  if (__DEV__) console.info('Contentjs: ', location);
  if (location.ancestorOrigins.contains(extensionOrigin)) return;
  iframe = document.createElement('iframe');
  iframe.classList.add('cueb-extension');
  iframe.src = chrome.extension.getURL('iframe.html');
  iframe.id = 'cueb-extension';
  iframe.className = 'cueb-extension';
  iframe.frameBorder = 0;
  document.body.insertAdjacentElement('beforeBegin', iframe);
}

function createDivContainer() {
  const extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
  if (__DEV__) console.info('Contentjs: ', location);
  if (location.ancestorOrigins.contains(extensionOrigin)) return;
  divContainer = document.createElement('div');
  divContainer.classList.add('cueb-extension-stickers-container');
  divContainer.id = 'cueb-extension-stickers';
  document.body.insertAdjacentElement('beforeBegin', divContainer);
}

function showIframe() {
  if (iframe) iframe.removeAttribute('hidden');
}

function hideIframe() {
  if (iframe) iframe.setAttribute('hidden', true);
}

function toggleIframe() {
  if (iframe) {
    const hiddenState = iframe.getAttribute('hidden');
    if (hiddenState) return showIframe();
    return hideIframe();
  }
}

function updateContext(forceUpdate) {
  if (app) {
    app.updateWebCxt(forceUpdate);
    //app.getWebCxt(forceUpdate).then(webCxt => {
      //sendMessage(Message.CONTEXT_UPDATE, webCxt);
    //});
  }
}

chrome.runtime.onMessage.addListener(createMessageHandler({
  [Message.CLOSE_APP]: () => { hideIframe(); },
  [Message.URL_CHANGE]: () => { updateContext(true /* force update */); },
  [Message.IFRAME_READY]: () => { updateContext(); },
  [Message.RERENDER]: () => { updateContext(); },
  [Message.OPEN_APP]: () => { showIframe(); },
  [Message.TOGGLE_APP]: () => { toggleIframe(); },
}, 'content'));

chrome.storage.sync.get(null, (storage) => {
  let {apiKey, username} = storage;
  if (apiKey && username) app = new ContentApp({apiKey, username});
});

chrome.storage.onChanged.addListener(createStorageOnChangeHandler(new Set([
  'sync:apiKey',
  'sync:username'
]), (changed) => {
  let {apiKey, username} = changed;
  if (apiKey && username) app = new ContentApp({apiKey, username});
}));

(function init() {
  sendMessage(Message.RESET_BADGE);
  createIframe();
  createDivContainer();
  hideIframe();

  console.debug('Cueb debug info', {
    'Git SHA1': __GITSHA1__,
    'config': config
  });
})();
