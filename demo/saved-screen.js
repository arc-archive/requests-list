import { LitElement, html } from 'lit-element';
import {
  SavedListMixin,
  listTemplate,
  ListStyles
} from '../index.js';

export class SavedScreenElement extends SavedListMixin(LitElement) {
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

window.customElements.define('saved-screen', SavedScreenElement);