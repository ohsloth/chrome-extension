const React = require('react');

module.exports = React.createClass({
  style: {
    accountContainer: {
    },
    helpTxt: {
      margin: 10,
      'float': 'right'
    }
  },

  propTypes: {
    username: React.PropTypes.string,
    apiKey: React.PropTypes.string,

    updateAccount: React.PropTypes.func
  },

  getInitialState() {
    let {username, apiKey} = this.props;
    return { username, apiKey };
  },

  _onClickSave() {
    let username = this._username.value;
    let apiKey = this._apiKey.value;
    this.props.updateAccount(username, apiKey);
    this.setState({ username, apiKey });
  },
  _onClickRemove() {
    this.props.updateAccount(null, null);
    this.setState({
      username: null,
      apiKey: null
    });
  },
  render() {
    let {username, apiKey} = this.state;
    let configured = username && apiKey;

    return (
      <section style={this.style.accountContainer}>
        <section hidden={!configured}>
          <p>Configured for <b id="existingUser">{username}</b></p>
          <button onClick={this._onClickRemove} className="btn btn-warning">Remove</button>
        </section>
        <section hidden={configured}>
          <form>
            <div className="form-group">
              <label>Username</label>
              <input className="form-control" ref={c => this._username= c} placeholder="Enter username"/>
            </div>
            <div className="form-group">
              <label>API Key</label>
              <input className="form-control" ref={c => this._apiKey = c} placeholder="Enter API Key"/>
            </div>
            <button onClick={this._onClickSave} className="btn btn-success"> Save </button>
            <p style={this.style.helpTxt}>You can find these information <a href="https://cueb.io/settings" target="_blank">here</a></p>
          </form>
        </section>
      </section>
    );
  }
});
