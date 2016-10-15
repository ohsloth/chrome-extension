'use strict';

const React = require('react');

module.exports = React.createClass({
  style: {
    cuebCard: {
      margin: '8px 5px',
      minHeight: 15,
      maxHeight: 250,
      position: 'relative',
    },
    iframeStyle: {
      backgroundColor: 'transparent',
      border: 0,
      marginLeft: 15,
      minHeight: 200,
      overflow: 'hidden',
      width: '100%',
    },
  },

  render() {
    let embedUrl = this.props.url + '?renderMode=sticker';
    let count = 10;

    return (
      <div className="cueb-card" style={this.style.cuebCard}>
        <span ref="xBtn" hidden={true} style={this.style.removeCuebIcon}
          onClick={this._clickRemoveHandler}>&times;</span>
        <div className="vote btn btn-default">
          <span className="up-arrow"></span>
          <span className="count">{count}</span>
        </div>
        <iframe style={this.style.iframeStyle}
          ref="content"
          frameborder="0"
          scrolling="no"
          src={ embedUrl }></iframe>
      </div>
    );
  }
});
