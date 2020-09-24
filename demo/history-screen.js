import { LitElement, html } from 'lit-element';
import {
  HistoryListMixin,
  internals,
  ListStyles
} from '../index.js';

export class HistoryScreenElement extends HistoryListMixin(LitElement) {
  static get styles() {
    return ListStyles;
  }

  render() {
    const { requests } = this;
    if (!requests || !requests.length) {
      return html`<p>No requests on the list</p>`;
    }
    return this[internals.listTemplate]();
  }
}

window.customElements.define('history-screen', HistoryScreenElement);