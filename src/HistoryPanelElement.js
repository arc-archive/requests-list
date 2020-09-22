import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import { HistoryListMixin } from './HistoryListMixin.js';
import elementStyles from './HistoryPanelStyles.js';
import listStyles from './ListStyles.js';
import {
  busyTemplate,
  unavailableTemplate,
  listTemplate,
  contentActionsTemplate,
  contentActionHandler,
  searchIconTemplate,
  searchInputTemplate,
  searchHandler,
} from './internals.js';


export class HistoryPanelElement extends HistoryListMixin(LitElement) {
  static get styles() {
    return [elementStyles, listStyles];
  }

  constructor() {
    super();
    this.listActions = true;
    this.selectable = true;
  }

  [contentActionHandler](e) {
    const { action } = e.currentTarget.dataset;
    switch (action) {
      case 'search': this.isSearch = true; break;
      default:
    }
  }

  async [searchHandler](e) {
    const { value } = e.target;
    await this.query(value);
  }

  render() {
    return html`
    ${this[busyTemplate]()}
    ${this[contentActionsTemplate]()}
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

  [contentActionsTemplate]() {
    const { dataUnavailable } = this;
    if (dataUnavailable) {
      return '';
    }
    const { selectedItems, isSearch } = this;
    const expLabel = selectedItems && selectedItems.length ? 'Export selected' : 'Export all';
    const delLabel = selectedItems && selectedItems.length ? 'Delete selected' : 'Delete all';
    return html`
    <div class="content-actions">
      <anypoint-icon-button @click="${this[contentActionHandler]}" data-action="export" title="${expLabel}">
        <arc-icon icon="archive"></arc-icon>
      </anypoint-icon-button>
      <anypoint-icon-button @click="${this[contentActionHandler]}" data-action="delete" title="${delLabel}">
        <arc-icon icon="deleteIcon"></arc-icon>
      </anypoint-icon-button>
      <div class="selection-divider"></div>
      ${isSearch ? this[searchInputTemplate]() : this[searchIconTemplate]()}
    </div>
    `;
  }

  [searchIconTemplate]() {
    return html`
    <anypoint-icon-button @click="${this[contentActionHandler]}" data-action="search" title="Search history">
      <arc-icon icon="search"></arc-icon>
    </anypoint-icon-button>`;
  }

  [searchInputTemplate]() {
    return html`
    <anypoint-input 
      type="search" 
      class="search-input" 
      noLabelFloat
      @search="${this[searchHandler]}"
    >
      <label slot="label">Search</label>
    </anypoint-input>
    `;
  }
}