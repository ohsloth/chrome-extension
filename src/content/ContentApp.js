import React from 'react';
import ReactDOM from 'react-dom';
import Rx from 'rx-dom';

import Channel from '../rule/channel';
import Stickers from '../comp/Stickers';
import getApi from '../util/getApi';
import {Message, sendMessage} from '../chromeHelper/message';

import * as parser from './parser';

const TIMEOUT = 1200;

export default class ContentApp {
  constructor(config) {
    this.api = getApi(config.apiKey);
    this.config = config;

    this.pageObs = Rx.DOM.fromMutationObserver(document.body, {
      attributes: true,
      childList: true
    }).debounce(750 /* ms */);
    this.subscribers = [];

    this._initialize();
  }

  _initialize() {
    console.log('contentapp init');
    //this.pWebCxt = new Promise((resolve, reject) => {
      //this.resolveWebCxt = resolve;
      //this.rejectWebCxt = reject;
    //});
    //setTimeout(() => this.evaluate(), TIMEOUT);
  }

  _pushChanResultToRemote(cxtId, chanId, chanResults) {
    const {repos, serviceKey, variables} = chanResults;
    if (repos && repos.length) {
      return this.api.triggerChannelMsg(cxtId, chanId, repos).catch(err => {
        console.error(err);
      });
    } else if (serviceKey) {
      return this.api.triggerChannelService(cxtId, chanId, variables).catch(err => {
        console.error(err);
      });
    }
  }

  _evalChannel(cxtId, c) {
    const sub = this.pageObs.subscribe(() => {
      c.evaluateDynamic().then(chanResults => {
        if (!chanResults) return;
        const chanId = c.data.id;
        this._pushChanResultToRemote(cxtId, chanId, chanResults);
      });
    });
    this.subscribers.push(sub);
  }

  _renderStickers({json, response}) {
    if (json.length) {
      const{username} = this.config;
      const stickerContainer = document.getElementById('cueb-extension-stickers');
      const stickers = json;
      ReactDOM.render(<Stickers stickers={stickers} api={this.api} {...this.config}/>, stickerContainer);
    }
  }

  updateWebCxt() {
    const url = window.location.href;

    sendMessage(Message.CONTENT_URL, {
      url: window.location.href,
      keywords: parser.getKeywords(),
      title: parser.getTitleKW(),
    });

    this.api.get(`@${this.config.username}/sticker?uri=${url}`).then(stickers => {
      this._renderStickers(stickers);
    });

    this.api.post(`@${this.config.username}/signal`, {
      uri: {
        uri: window.location.href,
        keywords: parser.getKeywords(),
        title: parser.getTitleKW(),
      },
    });
  }

  getWebCxt(refresh) {
    if (!refresh) return this.pWebCxt;
    this._initialize();
    return this.pWebCxt;
  }

  evaluate() {
    this.evaluateContext().then(cxtId => {
       this.evaluateChannel(cxtId);
    });
  }

  evaluateContext() {
    debugger;
    return this.api.fetchContext({
      keywords: parser.getKeywords(),
      title: parser.getTitleKW(),
      uri: window.location.href
    })
    .then(webCxt => {
      this.resolveWebCxt(webCxt);
      return webCxt.id;
    })
    .catch(err => this.rejectWebCxt(err));
  }

  evaluateChannel(cxtId) {
    debugger;
    return this.api.fetchChannel(window.location.href).then(chans => {
      const channels = chans.map(c => new Channel(c));
      const ps = Promise.all(channels.map(c => {
        // Subscribe the channel to future page update
        this.pageObs.subscribe(this._evalChannel(cxtId, c));
        // But evaluate channel right now
        return c.evaluate();
      })).then(channelResults => {
        if (__DEV__) console.info('Received chanResults: ', channelResults);
        channelResults.forEach((results, idx) => {
          const chanId = channels[idx].data.id;
          this._pushChanResultToRemote(cxtId, chanId, results);
        });
      }).catch(err => {
        console.error(err);
      });
      return ps;
    });
  }
}
