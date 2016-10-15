module.exports = {
  evaluateXpath: (xpathExp) => {
    let iterator = document.evaluate(xpathExp, document, null, XPathResult.ANY_TYPE, null);
    let nodes = [];
    try {
      let node = iterator.iterateNext();
      while (node) {
        nodes.push(node);
        node = iterator.iterateNext();
      }
    } catch (e) {
      console.error( 'Error: Document tree modified during iteration ' + e );
    }
    return nodes;
  },
  getHostContainer: (prefix) => {
    let container = document.createElement('DIV');
    container.id = prefix + Math.random().toString(16).slice(2);
    document.body.appendChild(container);
    return container;
  }
};
