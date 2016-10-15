import util from './util';

function getDomain() {
  return document.domain;
}

function getTagKW(tagName) {
  return util.evaluateXpath(`/html/body//${tagName}`).map(node => {
    return node.textContent.trim();
  }).join(' ');
}

export function getTitleKW() {
  return document.title;
}

function getH1KW() {
  return getTagKW('h1');
}

function getH2KW() {
  return getTagKW('h2');
}

export function getKeywords() {
  const h1KW = getH1KW();
  const h2KW = getH2KW();
  const titleKW = getTitleKW();
  const combined = getDomain() + ' ' + h1KW + ' ' + h2KW + ' ' + titleKW;
  return combined.trim();
}
