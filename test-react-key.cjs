const React = require('react');
const ReactDOMServer = require('react-dom/server');

function App() {
  const items = [{name: 'A'}, {name: 'B'}];
  return React.createElement('div', null, items.map(item => React.createElement('div', {key: item.id}, item.name)));
}

console.log(ReactDOMServer.renderToString(React.createElement(App)));
