import { LitElement, html } from 'lit-element';
import { HistoryListMixin } from './HistoryListMixin.js';
import elementStyles from './HistoryPanelStyles.js';
import {
  busyTemplate,
  unavailableTemplate,
  listTemplate,
} from './internals.js';


export class HistoryPanelElement extends HistoryListMixin(LitElement) {
  static get styles() {
    return elementStyles;
  }

  render() {
    return html`
    ${this[busyTemplate]()}
    <div class="list">
    ${this[listTemplate]()}
    </div>
    `;
  }

  [busyTemplate]() {
    if (!this.querying) {
      return '';
    }
    return html`<progress></progress>`;
  }

  [unavailableTemplate]() {
    const { dataUnavailable } = this;
    if (!dataUnavailable) {
      return '';
    }
    return html`
      <p class="empty-info">The requests list is empty.</p>
      <p class="empty-info">Send a request from the request panel and it will appear here.</p>
    `;
  }
}