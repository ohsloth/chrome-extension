const schema = require('schema');

export const MAP_RULE = {
  name: 'google_map',
  domainGlob: '*google.com/maps/place/*',
  defaults: {
    contexts: [{
      triggerType: schema.Context.TriggerType.GEO,
      infodata: [{
        name: 'lat',
        path: [{
          type : 'regex',
          path : 'google\.com\/maps\/place\/.*\/@(.*),.*,.*\/',
        }]
      },
      {
        name: 'lon',
        path: [{
          type : 'regex',
          path : 'google\.com\/maps\/place\/.*\/@.*,(.*),.*\/',
        }]
      }],
    }],
    name: [{
      type: 'css',
      path: '#cards div.cards-entity-left > div > div:nth-child(1) > div.cards-alias-entity-location > h1 > span'
    }],
    description: [],
    coverUrl: [{
      type: 'css',
      path: '#cards div.cards-show-expanded.cards-disable-text-selection.cards-social-space-before > button:nth-child(2) > div.imagery-entry-point-image'
    }],
    infodata: [{
      name: 'link',
      path: [{
        type: 'css',
        path: '#cards div.cards-entity-right > div.hideable-element > div:nth-child(4) > a > span',
      }]
    }]
  }
};

export default class ImportRule {
  constructor(rule) {
    this.rule = rule;
  }

  isActive() {
    let inputUri = window.location.href;
    if (__DEV__) console.log('Testing: ', inputUri, 'with', this.rule.domainGlob.replace(/\//g, "\/").replace(/\*/g, ".*").replace(/\?/g, '\\\?'));
    let reg = new RegExp(this.rule.domainGlob.replace(/\//g, "\/").replace(/\*/g, ".*").replace(/\?/g, '\\\?'));
    return reg.test(inputUri);
  }

  _evaluateContexts(doc, contexts) {
    return contexts.map(context => {
      let contextBlob = {
        name: 'auto trigger - ' + context.triggerType,
        triggers: []
      };
      let trigger = {
        type: context.triggerType
      };
      context.infodata.forEach(info => {
        trigger[info.name] = this._evaluateRule(doc, info.path);
      });
      contextBlob.triggers.push(trigger);
      return contextBlob;
    });
  }

  _evaulateCover(doc, rules) {
    let result = this._evaluateRule(doc, rules);
    // try to find an image url
    if (!result) return '';
    if (result.tagName === 'img') return result.getAttribute('src');

    // Not an image, try to find a background URL
    let style = window.getComputedStyle(result);
    let bgImage = style['background-image'] || '';
    return bgImage.indexOf('url(') === 0 && bgImage.replace(/url\(/, '').slice(0, -1) || '';
  }

  _evaluateRule(doc, rules) {
    // The rule could contains a series of 2 things
    // regex, cssPath; the result is passed from top to next.
    // If regex appears first, use current URL
    let inputUri = window.location.href;

    let result = rules.reduce((input, rule) => {
      if (rule.type === 'regex') {
        let regex = new RegExp(rule.path);
        let groups = regex.exec(input);
        return groups && groups.length >= 1 && groups[1];
      } else if (rule.type === 'css') {
        let target = document.body.querySelector(rule.path);
        return target;
      }
    }, inputUri);

    return result;
  }

  getTextContentOrBlank(dom) {
    return dom && dom.textContent || '';
  }

  evaluate() {
    let doc = document;
    let ruleSet = this.rule.defaults;

    let coverUrl = this._evaulateCover(doc, ruleSet.coverUrl) || '';

    let name = this._evaluateRule(doc, ruleSet.name);
    name = this.getTextContentOrBlank(name);

    let description = this._evaluateRule(doc, ruleSet.description);
    description = this.getTextContentOrBlank(description);

    let contexts = this._evaluateContexts(doc, ruleSet.contexts);

    return {
      name,
      coverUrl,
      description,
      contexts
    };
  }
}
