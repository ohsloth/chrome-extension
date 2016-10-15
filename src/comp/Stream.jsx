import React from 'react';
import merge from 'lodash/merge';
import omit from 'lodash/omit';

import config from '../config';

module.exports = React.createClass({
  style: {
    iframe: {
      height: '95vh',
      marginLeft: -13,
      marginTop: -20,
      width: 450
    }
  },
  propTypes: {
    apiKey: React.PropTypes.string.isRequired,
    cxt: React.PropTypes.object.isRequired,
    username: React.PropTypes.string.isRequired
  },
  getInitialState() {
    return { uri: '' };
  },
  render() {
    const {username, apiKey, cxt} = this.props;
    const webCxtId = cxt.id;
    return (
      <iframe
        ref={c => this._iframe = c}
        frameBorder="0"
        src={`${config.EMBED_HOST}stream?webCxtId=${webCxtId}#${username}:${apiKey}`}
        style={this.style.iframe}
      />
    );
  },
  postMessage(screenshot) {
    const iframe = this._iframe;
    const data = {
      screenshot,
      cxt: this.props.cxt
    };

    iframe.contentWindow.postMessage(data, '*');
  }
});
