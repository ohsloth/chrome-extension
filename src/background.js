import {Message, createMessageHandler} from './chromeHelper/message';

const BADGE_COLOR = [46, 204, 113, 255];

function takeTabScreenShot(cb) {
  chrome.tabs.captureVisibleTab(null, {format: 'png'}, cb);
}

function sendScreenshot() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    takeTabScreenShot((data) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: Message.SCREENSHOT,
        screenshot: data
      });
    });
  });
}

function sendToggleMsg() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: Message.TOGGLE_APP
    });
  });
}

chrome.runtime.onMessage.addListener(createMessageHandler({
  [Message.UPDATE_BADGE]: (msg, sender) => {
    chrome.browserAction.setBadgeBackgroundColor({color: BADGE_COLOR, tabId: sender.tab.id});
    return chrome.browserAction.setBadgeText({text: msg.count.toString(), tabId: sender.tab.id});
  },
  [Message.RESET_BADGE]: (msg, sender) => {
    return chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0], tabId: sender.tab.id});
  },
  [Message.GET_ALL_TABS]: (msg, sender) => {
    return chrome.tabs.query({currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: Message.ALL_TABS,
        tabUrls: tabs.map(t => t.url),
      });
    });
  },
  // Simply forward the message - this is how iframe and content script communicate
  [Message.DEFAULT]: (msg, sender) => {
    return chrome.tabs.sendMessage(sender.tab.id, msg);
  }
}, 'background'));

chrome.runtime.onInstalled.addListener((detail) => {
  if (detail.reason === 'install') {
    chrome.tabs.create({ url: chrome.extension.getURL('firstinstall.html') });
  }
});

(function init() {
  if (__DEV__) console.info('background init');

  chrome.browserAction.onClicked.addListener(() => {
    if (__DEV__) console.info('background.js browser icon clicked.');
    sendToggleMsg();
    //sendScreenshot();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (__DEV__) {
      console.group('TabUpdate');
      console.info('TabId: ', tabId);
      console.info('ChangeInfo: ', changeInfo);
      console.info('Tab: ', tab);
      console.groupEnd();
    }
    chrome.tabs.sendMessage(tab.id, {
      action: Message.URL_CHANGE
    });
  });
})();
