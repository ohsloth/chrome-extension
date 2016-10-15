import assign from 'lodash/assign';

export const Message = {
  // App actions
  OPEN_APP: 'open_app',
  CLOSE_APP: 'close_app',
  TOGGLE_APP: 'toggle_app',
  GET_ALL_TABS: 'get_all_tabs',

  // App state
  SCREENSHOT: 'screenshot',
  CONTENT_URL: 'content_url',
  CONTEXT_UPDATE: 'context_update',
  IFRAME_READY: 'iframe_ready',
  URL_CHANGE: 'url_change',
  ALL_TABS: 'all_tabs',

  // badge
  UPDATE_BADGE: 'update_badge',
  RESET_BADGE: 'reset_badge',

  RERENDER: 'rerender',
  DEFAULT: 'default',
};

export function createMessageHandler(map, env) {
  return function messageHandler(msg, sender) {
    if (__DEV__) console.log(`${env}: `, msg);
    if (typeof map[msg.action] === 'function') {
      if (__DEV__) console.log(`${env}: operated on`, msg);
      return map[msg.action](msg, sender);
    }
    if (typeof map[Message.DEFAULT] === 'function') {
      if (__DEV__) console.log(`${env}: operated on`, msg);
      return map[Message.DEFAULT](msg, sender);
    }
    if (__DEV__) console.log('msg not handled: ', msg, ' by ', env);
  };
}

export function sendMessage(msg, data) {
  chrome.runtime.sendMessage(assign({
    action: msg
  }, data || {}));
}
