import React, {PropTypes} from 'react';
import Draggable from 'react-draggable';

import config from '../config';

import iFrameResizer from '../vendor/iframeResizer.min.js';

const Sticker = React.createClass({
  style: {
    container: {
      cursor: 'auto',
      display: 'block',
      width: 150,
      zIndex: 99999999999,
    },
    xBtn: {
      position: 'absolute',
      fontSize: 15,
      cursor: 'pointer',
    },
    handle: {
      cursor: 'move',
      display: 'block',
      fontSize: 20,
      textAlign: 'center',
    },
    iframeStyle: {
      backgroundColor: 'transparent',
      border: 0,
      overflow: 'hidden',
      width: 150,
    },
    img: {
      border: 0,
      overflow: 'hidden',
      width: 150,
    },
  },
  props: {
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    iframeId: PropTypes.string,
  },
  getInitialState() {
    return {
      opacity: 0.5,
    };
  },
  componentDidMount() {
    iFrameResizer({
      checkOrigin: false,
      bodyBackground: 'transparent',
    }, `#cueb-iframe-${this.props.iframeId}`);
  },
  _onMouseOver() {
    this.setState({
      opacity: 1,
    });
  },
  _onMouseLeave() {
    this.setState({
      opacity: 0.5,
    });
  },

  render() {
    const {name, url, assetUrl, link} = this.props;
    return (
      <Draggable key={name} handle="span">
        <div className="cueb-noselect" style={this.style.container} onMouseOver={this._onMouseOver} onMouseLeave={this._onMouseLeave}>
          <span className="cueb-noselect" style={Object.assign({}, this.style.handle, this.state)}>{'#' + name}</span>
          <span style={this.style.xBtn} hidden={this.state.opacity !== 1} onClick={this.props.onDelete}>x</span>
          <a href={link} target="_blank">
            <img style={this.style.img} src={assetUrl} alt=""/>
          </a>
          {/**
          <iframe className="cueb-noselect"  frameborder="0" scrolling="no"
            id={`cueb-iframe-${this.props.iframeId}`}
            style={Object.assign({}, this.style.iframeStyle, this.state)}
            src={url}
          />
          **/}
        </div>
      </Draggable>
    );
  },
});

export default React.createClass({
  propTypes: {
    stickers: PropTypes.array.isRequired,
    apiKey: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    api: PropTypes.object.isRequired,
  },
  getInitialState() {
    return {
      isDeleted: {
      },
    };
  },

  _onDelete(idx) {
    const sticker = this.props.stickers[idx];
    this.props.api.post(`@${this.props.username}/sticker`, {
      uris: [window.location.href],
      nodeKeys: [sticker.nodeKey],
      operation: 'delete',
    });

    this.setState({
      isDeleted: Object.assign({[idx]: true}, this.state.isDeleted),
    });
  },

  _renderSticker(sticker, idx) {
    if (this.state.isDeleted[idx]) return null;

    const {username, apiKey} = this.props;
    const iframeUrl = `${config.EMBED_HOST}/tag/${sticker.name}?accessToken=${username}:${apiKey}`;

    return <Sticker onDelete={this._onDelete.bind(this, idx)} url={iframeUrl} iframeId={idx} {...sticker}/>;
  },
  render() {
    return <div>{this.props.stickers.map(this._renderSticker)}</div>;
  },
});
