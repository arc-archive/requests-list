import { LitElement, html } from 'lit-element';
import {
  RestApiListMixin,
  internals,
  ListStyles,
  RestApiStyles,
} from '../index.js';

export class RestapisScreenElement extends RestApiListMixin(LitElement) {
  static get styles() {
    return [ListStyles, RestApiStyles];
  }

  render() {
    return html`
    ${this[internals.dropTargetTemplate]()}
    ${this[internals.busyTemplate]()}
    ${this[internals.unavailableTemplate]()}
    ${this[internals.listTemplate]()}
    `;
  }
}

window.customElements.define('restapis-screen', RestapisScreenElement);