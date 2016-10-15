/* jslint node: true */

'use strict';

const React = require('react');

const
  DataForm = require('data-form'),
  schema   = require('schema');

const config = require('../config');

module.exports = React.createClass({
  style: {
    inputBtn: {
      marginBottom: 5,
      marginTop: -5,
    },
    infoDataContainer: {
      marginTop: 5,
      padding: '5px 20px',
    },
    createBtn: {
      marginBottom: 10
    },
    loading: {
      display: 'flex',
      fontSize: 32,
      fontWeight: 300,
      justifyContent: 'center',
      padding: 15,
    },
  },
  _getRepoData() {
    let getter = (refName) => this.refs[refName].getDOMNode().value || '';

    let infodata = [];

    this.refs.dataForm.read().forEach(kvp => {
      let [name, value] = kvp;
      infodata.push({name, value});
    });

    return {
      name        : getter('name'),
      description : getter('description'),
      coverUrl    : getter('coverUrl'),
      collections : getter('collections'),
      contexts    : this.contexts,
      infos       : infodata,
    };
  },
  _createRepo(repoData) {
    let api = this.props.api;
    api.post(`repos/${this.props.username}`, repoData).then(data => {
      let omnikey = schema.omnikey.get({
        username: data.owner,
        reponame: data.name,
      });
      this.resetSuccess(omnikey);
    }).catch(err => {
      this.showErrorMsg();
    });
  },
  _clickImport() {
    this.props.onImport();
  },
  _clickAddDataRow() {
    this.refs.dataForm.add();
  },
  _clickCreate() {
    let repoData = this._getRepoData();
    this._createRepo(repoData);
    this.setState({ loading: true, });
  },
  _dismissAlert() {
    this.setState({ created: null, failed: false });
  },
  _clearInput(refName) {
    let ref = this.refs[refName];
    if (ref) ref.getDOMNode().value = '';
  },
  fill(values) {
    for (let k in values) {
      if (this.refs[k]) this.refs[k].getDOMNode().value = values[k];
    }
    this.contexts = values.contexts;
  },
  resetSuccess(omnikey) {
    this.setState({loading: false, created: omnikey});
    this._clearInput('name');
    this._clearInput('description');
    this._clearInput('coverUrl');
    this._clearInput('collections');
  },
  showErrorMsg() {
    this.setState({loading: false, failed: true});
  },
  getInitialState() {
    return {
      created: null,
      failed: false,
      loading: false,
    };
  },
  render() {
    let dataForm = <DataForm key={Math.random().toString()} ref="dataForm" />;
    return (
      <section>
        <div style={this.style.loading} hidden={!this.state.loading}>
          Creating...
        </div>
        <div className="alert alert-success" hidden={!this.state.created}>
          <button type="button" className="close" onClick={this._dismissAlert}>
            <span>&times;</span>
          </button>
          Success. <a target="_blank" href={`${config.WEB_ROOT}${this.state.created}`}>{this.state.created}</a>
        </div>
        <div className="alert alert-danger" hidden={!this.state.failed}>
          <button type="button" className="close" onClick={this._dismissAlert}>
            <span>&times;</span>
          </button>
          Something went wrong. Please try again later.
        </div>
        <div hidden={this.state.loading}>
          <ul className="page-importer" onClick={this._clickImport}>
            <li><button className="btn btn-default">Import from Google Map</button></li>
          </ul>
          <div className="form-group">
            <label><i className="fa fa-pencil-square-o"> Snippet Name</i> </label>
            <input ref="name" type="text" className="form-control" placeholder="Snippet name"/>
            <span className="help-block">Unique name for this card</span>
          </div>
          <div className="form-group">
            <button style={this.style.inputBtn}
              className="pull-right btn btn-sm btn-info hidden"> <i className="fa fa-plus-circle"> Pick on page</i> </button>
            <label><i className="fa fa-pencil-square-o"> Cover Image</i> </label>
            <input ref="coverUrl" type="text" className="form-control" placeholder="image URL"/>
            <span className="help-block">An image URL to use as cover for the card.</span>
          </div>
          <div className="form-group">
            <label><i className="fa fa-pencil-square-o"> Description</i> </label>
            <input ref="description" type="text" className="form-control" placeholder="Description"/>
            <span className="help-block">A short summary describing the content. Max 140 characters.</span>
          </div>
          <div className="form-group">
            <div>
              <label><i className="fa fa-lg fa-list-ul"> Infodata</i> </label>
              <button onClick={this._clickAddDataRow}
                style={this.style.inputBtn}
                className="pull-right btn btn-sm btn-info"> Add </button>
              <div className="well well-sm" style={this.style.infoDataContainer}>
                {dataForm}
              </div>
            </div>
          </div>
          <section className="editor-toolbar">
            <hr/>
            <div className="col-md-10 deck-input">
              <div className="input-group">
                <span className="input-group-btn">
                  <button className="btn btn-default" type="button" disabled>Tags</button>
                </span>
                <input ref="collections" type="text" className="form-control"
                       placeholder="ex #events, #party"/>
              </div>
            </div>
            <div className="visible-sm visible-xs"><hr/></div>
            <div className="col-md-2" style={this.style.createBtn}>
              <button ref="createBtn" onClick={this._clickCreate} className="btn-block btn-success btn">Create</button>
            </div>
          </section>
        </div>
      </section>
    );
  }
});
