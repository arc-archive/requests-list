# Requests list

The ARC requests list module contains an UI and logic to render requests list in various contexts (saved list. history list, project list).

This module replaces:

- [x] history-list-mixin
- [x] requests-list-mixin
- [x] saved-list-mixin
- [x] projects-list-consumer-mixin
- [x] history-panel
- [x] saved-requests-panel

[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/requests-list.svg)](https://www.npmjs.com/package/@advanced-rest-client/requests-list)

[![tests](https://github.com/advanced-rest-client/requests-listn/actions/workflows/deployment.yml/badge.svg)](https://github.com/advanced-rest-client/requests-listn/actions/workflows/deployment.yml)

## Usage

### Installation

```sh
npm install --save @advanced-rest-client/requests-list
```

### History panel

```javascript
import '@advanced-rest-client/requests-list/history-panel.js';


html`
<history-panel 
  draggableEnabled
  @details="${this.historyItemDetailsHandler}"
></history-panel>`;
```

### Saved panel

```javascript
import '@advanced-rest-client/requests-list/saved-panel.js';


html`
<saved-panel 
  draggableEnabled
  @details="${this.savedItemDetailsHandler}"
></saved-panel>`;
```

### SavedListMixin

A mixin to create an element that renders list of saved items.

```javascript
import { LitElement, html } from 'lit-element';
import { SavedListMixin, listTemplate, ListStyles } from '@advanced-rest-client/requests-list';

class ArcSavedMenuElement extends SavedListMixin(LitElement) {
  static get styles() {
    return ListStyles;
  }

  render() {
    const { requests } = this;
    if (!requests || !requests.length) {
      return html`<p>No requests on the list</p>`;
    }
    return this[listTemplate]();
  }
}

window.customElements.define('saved-menu', ArcSavedMenuElement);
```

### HistoryListMixin

A mixin to create an element that renders list of history items.

```javascript
import { LitElement, html } from 'lit-element';
import { HistoryListMixin, listTemplate, ListStyles } from '@advanced-rest-client/requests-list';

class ArcHistoryMenuElement extends HistoryListMixin(LitElement) {
  static get styles() {
    return ListStyles;
  }

  render() {
    const { requests } = this;
    if (!requests || !requests.length) {
      return html`<p>No requests on the list</p>`;
    }
    return this[listTemplate]();
  }
}

window.customElements.define('history-menu', ArcHistoryMenuElement);
```

## Development

```sh
git clone https://github.com/@advanced-rest-client/requests-list
cd requests-list
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
