import React from 'react';
import $ from 'jquery';

import '../../sass/iframe.scss';

import {Message, sendMessage} from '../chromeHelper/message.js';

import AccountPage from './AccountPage';
import IframePage from './IframePage';

function registerIframeEventListener(winRef, callback) {
  const eventMethod = winRef.addEventListener ? 'addEventListener' : 'attachEvent';
  const eventer = winRef[eventMethod];
  const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

  // Listen to message from child winRef
  eventer(messageEvent, function(e) {
    console.log('parent received message!: ', e.data);
    if (callback) callback(e.data);
  }, false);
}

module.exports = React.createClass({
  style: {
    sidebar: {
      background: 'white',
      height: '100vh',
      position: 'fixed',
      width: 450,
      border: '1px solid #CCC'
    },
    nav: {
      borderBottom: '1px solid #CCC'
    },
    firstTab: {
      borderLeftColor: 'transparent'
    },
    container: {
      padding: 20
    },
    tabContent: {
    }
  },
  propTypes: {
    username: React.PropTypes.string,
    apiKey: React.PropTypes.string,
    api: React.PropTypes.object,

    updateAccount: React.PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      cxt: null,
      username: this.props.username,
      items: []
    };
  },

  _hide(evt) {
    evt.preventDefault();
    sendMessage(Message.CLOSE_APP);
  },
  _onTabNav(evt) {
    let target = evt.target;
    if (target.href.substr(-1) !== '#') $(target).tab('show');
  },
  _updateAccount(username, apiKey) {
    this.props.updateAccount(username, apiKey);
    this.setState({ username });
  },

  render() {
    const accountPage = (
      <AccountPage
        ref="account"
        api={this.props.api}
        apiKey={this.props.apiKey}
        updateAccount={this._updateAccount}
        username={this.props.username}
      />
    );

    const tagPage = (
      <IframePage ref="tagPage"
        url="tag"
        cxt={this.state.cxt}
        username={this.props.username}
        apiKey={this.props.apiKey}
      />
    );

    const accountTabName = this.state.username || 'account';

    return (
      <section style={this.style.sidebar}>
        <ul ref="tablinks" onClick={this._onTabNav} className="nav nav-tabs" role="tablist" style={this.style.nav}>
          <li><a style={this.style.firstTab} ref={c => this._tagTab = c} href="#tags">Tags</a></li>
          <li onClick={this._hide} className="pull-right"><a href="#">&times;</a></li>
          <li className="pull-right"><a ref={c => this._accountTab = c} href="#account">{accountTabName}</a></li>
        </ul>
        <div className="tab-content">
          <div style={this.style.tabContent} role="tabpanel" className="tab-pane container" id="tags">
            {tagPage}
          </div>
          <div style={this.style.tabContent} role="tabpanel" className="tab-pane container" id="info">
          </div>
          <div style={this.style.tabContent} role="tabpanel" className="tab-pane container" id="account">
            {accountPage}
          </div>
        </div>
      </section>
    );
  },
  setup() {
    const dom = this.props.username ? this._tagTab : this._accountTab;

    // show the correct tab
    $(dom).tab('show');

    // register the iframe event listener
    registerIframeEventListener(window, (nodeKey) => {
      const currentUrl = this.state.contentUrl.url;
      const username = this.props.username;

      this.props.api.post(`@${username}/sticker`, {
        nodeKeys: [nodeKey],
        uris: [currentUrl],
      }).then(() => {
        sendMessage(Message.RERENDER);
      });
    });

    // After mount, we let the content.js know we are setup.
    sendMessage(Message.IFRAME_READY);
  },
  setContext(cxt) {
    this.setState({ cxt: cxt });
  },
  setContentUrl(details) {
    this.setState({ contentUrl: details });
  },
  setScreenshot(screenshot) {
    this.refs.stream.postMessage(screenshot);
  },
});
