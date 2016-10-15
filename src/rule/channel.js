import 'isomorphic-fetch';

import _und from 'lodash';
import schema from 'schema';

import * as parser from '../content/parser';

import util from '../content/util';

function InvalidStateError(msg) {
  this.message = msg;
}

InvalidStateError.prototype = Object.create(Error.prototype);
InvalidStateError.prototype.constructor = InvalidStateError;

function findFirstMatch(input, re) {
  let matches = [];
  let match = re.exec(input);
  while (match !== null) {
    matches.push(match);
    match = re.exec(input);
  }
  return matches.shift();
}

function escapeVarname(varname) {
  return varname
    .replace('!', '\\!')
    .replace('?', '\\?')
    .replace('$', '\\$');
}

function convertIteratorToArray(iterable) {
  let out = [];
  for (let val of iterable) {
    out.push(val);
  }
  return out;
}

function looksLikeURL(input) {
  if (input.indexOf) {
    return input.indexOf('//') === 0 || input.indexOf('http') === 0;
  }
  return false;
}

export default class Channel {
  constructor(input) {
    this.data = input;
    this.hasEvaluated = false;
  }

  _getVariableValue(reference, variables, index) {
    let nextVarRef = variables;
    let fields = (reference.split('.')) || [];
    let [head, ...tail] = fields;

    if (_und.isNumber(index) && Array.isArray(nextVarRef[head])) {
      nextVarRef = nextVarRef[head][index];
    } else {
      nextVarRef = nextVarRef[head][0];
    }

    if (tail.length) {
      return tail.reduce((obj, key) => {
        if (!obj || obj[key] === undefined) return null;
        return obj[key];
      }, nextVarRef);
    }

    return nextVarRef;
  }

  _updateObj(obj, $keyReg, $vars, index) {
    Object.keys(obj).forEach(key => {
      if (_und.isString(obj[key])) {
        $keyReg.forEach((keyReg) => {
          let regex = keyReg[1];
          regex.lastIndex = 0; // reset the index obj
          let [match] = regex.exec(obj[key]) || [];
          if (match) {
            let value = this._getVariableValue(match, $vars, index);
            if (value === null) throw new InvalidStateError(`Unable to parse ${match}`);
            if (looksLikeURL(value)) {
              obj[key] = obj[key].replace(match, value);
            } else {
              obj[key] = obj[key].replace(match, value.toLowerCase && value.toLowerCase() || value);
            }
          }
        });
      }
    });
  }

  _expandRepo(repo, $keyReg, $vars, index) {
    try {
      // Update other fields
      this._updateObj(repo, $keyReg, $vars, index);
      // Update info
      this._updateObj(repo.infos, $keyReg, $vars, index);
      return repo;
    } catch (e) {
      if (e instanceof InvalidStateError) return null;
      throw e;
    }
  }

  _expandRepos(clonedRepos, $keyReg, $vars) {
    let expVar = clonedRepos[0].__expand__;
    if (expVar) {
      return $vars[expVar].map((v, index) => {
        return this._expandRepo(clonedRepos[index], $keyReg, $vars, index);
      });
    }
    return clonedRepos.map(r => this._expandRepo(r, $keyReg, $vars));
  }

  _cloneRepoDef(repoDef, $vars) {
    let expVar = repoDef.__expand__;
    if (!expVar) return [repoDef];
    let repoDefJSON = JSON.stringify(repoDef);
    let clonedRepos = Array.apply(null, {length: ($vars[expVar].length + 1)})
      .map(() => JSON.parse(repoDefJSON));
    return clonedRepos;
  }

  _evaluateSelectorVars() {
    let channelDetail = this.data.channelDetail;
    let variables = channelDetail.variables;

    let urlMatchVars = new RegExp(channelDetail.triggers.url.pop())
      .exec(window.location.href).splice(1);

    let selectorVars = Object.keys(variables)
      .filter(k => schema.VariableType.isSelector(k))
      .map(key => {
        let nodes = util.evaluateXpath(variables[key]);
        let allTxtContent = new Set(nodes.map(n => n.textContent).filter(txt => txt));
        allTxtContent = convertIteratorToArray(allTxtContent.values());
        return [key, allTxtContent];
      });

    selectorVars = _und.zipObject(selectorVars);

    // Fill out the predefined variables here
    selectorVars.$URL = [window.location.href];
    selectorVars.$TITLE = [window.document.title];
    selectorVars.$KEYWORDS = [parser.getKeywords()];

    urlMatchVars.forEach((value, index) => {
      selectorVars['$MATCH_' + index] = [value];
    });

    return selectorVars;
  }

  evaluate() {
    let channelDetail = this.data.channelDetail;
    let variables = channelDetail.variables;

    let selectorVars = this._evaluateSelectorVars();

    let resolvedUrls = Object.keys(variables)
      .filter(k => schema.VariableType.isDynamic(k))
      .map(key => {
        let varRegex = /(\??\$\w+)/g;
        let url = variables[key];
        let [varname] = findFirstMatch(url, varRegex);
        if (varname in selectorVars) {
          return [key, selectorVars[varname].map(v => url.replace(varname, v))];
        }
        return [key, url];
      });

    let remoteVars = resolvedUrls.map((input) => {
      let [varname, urls] = input;
      let pRemoteVals = urls.map(url => {
        return fetch(url).then(r => r.json());
      });
      return Promise.all(pRemoteVals).then(remoteVals => {
        return [varname, remoteVals.filter(f => f)];
      });
    });

    return Promise.all(remoteVars).then($remoteVars => {
      // Combine selector variables with remote variables
      let $vars = _und.assign(_und.zipObject($remoteVars), selectorVars);
      let results = { variables: $vars };
      let invalid = false;

      // Construct regex of the variables
      let $keyReg = Object.keys($vars).map(varname => {
        if (!$vars[varname] || _und.isEmpty($vars[varname])) invalid = true;
        return [varname, RegExp(`${escapeVarname(varname)}(\\.\\w+)*`, 'g')];
      });

      // Short circuit - if any specificed $vars does not exist, is empty, or null, STOP.
      if (invalid) {
        this.hasEvaluated = true;
        results.repos = null;
        results.serviceKey = null;
        return results;
      }

      if (Array.isArray(channelDetail.repos)) {
        let resolvedRepos = channelDetail.repos.map(repo => {
          let clonedRepos = this._cloneRepoDef(repo, $vars);
          let expandedRepos = this._expandRepos(clonedRepos, $keyReg, $vars);
          return expandedRepos;
        });
        results.repos = _und.flatten(resolvedRepos).filter(i => i);
      } else if (channelDetail.serviceKey) {
        results.serviceKey = channelDetail.serviceKey;
      }

      this.hasEvaluated = true;
      return results;
    }).catch(err => {
      console.error(err);
    });
  }

  evaluateDynamic() {
    let variables = this.data.channelDetail.variables;
    let hasWatchVar = Object.keys(variables)
      .filter(k => schema.VariableType.isWatch(k)).length;
    if (!hasWatchVar || !this.hasEvaluated) return Promise.resolve(null);
    return this.evaluate();
  }
}
