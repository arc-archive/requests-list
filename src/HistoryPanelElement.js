import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@material/mwc-snackbar';
import '@advanced-rest-client/bottom-sheet/bottom-sheet.js';
import '@advanced-rest-client/arc-ie/export-options.js';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { ExportEvents } from '@advanced-rest-client/arc-events';
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
  searchEmptyTemplate,
  toggleSelectAllValue,
  selectedItemsValue,
  listScrollHandler,
  confirmDeleteAllTemplate,
  deleteAllDialogValue,
  deleteAction,
  deleteSelected,
  deleteAll,
  deleteCancel,
  deleteConfirm,
  notifySelection,
  deleteLatestList,
  deleteUndoOpened,
  deleteUndoTemplate,
  deleteUndoAction,
  snackbarClosedHandler,
  exportAction,
  exportAll,
  exportSelected,
  exportOptionsTemplate,
  exportOptionsOpened,
  exportOverlayClosed,
  exportCancel,
  exportAccept,
  driveExportedTemplate,
} from './internals.js';

/** @typedef {import('@advanced-rest-client/arc-ie').ExportOptionsElement} ExportOptionsElement */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptions} ExportOptions */

export class HistoryPanelElement extends HistoryListMixin(LitElement) {
  static get styles() {
    return [elementStyles, listStyles];
  }

  constructor() {
    super();
    this.listActions = true;
    this.selectable = true;
  }

  /**
   * Toggles selection of all items on the list.
   */
  toggleSelection() {
    this[toggleSelectAllValue] = !this[toggleSelectAllValue];
    this[selectedItemsValue] = /** @type string[] */ ([]);
    if (this[toggleSelectAllValue]) {
      (this.requests || []).forEach((item) => {
        item.requests.forEach((requestItem) => {
          this[selectedItemsValue].push(requestItem.item._id);
        });
      });
    }
    this[notifySelection]();
    this.requestUpdate();
  }

  [contentActionHandler](e) {
    const { action } = e.currentTarget.dataset;
    switch (action) {
      case 'search': this.isSearch = true; break;
      case 'refresh': this.refresh(); break;
      case 'toggle-all': this.toggleSelection(); break;
      case 'delete': this[deleteAction](); break;
      case 'export': this[exportAction](); break;
      default:
    }
  }

  /**
   * @param {CustomEvent} e
   */
  async [searchHandler](e) {
    const node = /** @type  HTMLInputElement */ (e.target);
    const { value } = node;
    await this.query(value);
  }

  /**
   * @param {Event} e
   */
  [listScrollHandler](e) {
    const node = /** @type HTMLDivElement */ (e.target);
    const delta = node.scrollHeight - (node.scrollTop + node.offsetHeight);
    if (delta < 120) {
      this.loadNext();
    }
  }

  [deleteAction]() {
    const selected = /** @type string[] */(this[selectedItemsValue]);
    if (!Array.isArray(selected) || !selected.length) {
      this[deleteAll]();
    } else {
      this[deleteSelected]();
    }
  }

  async [deleteSelected]() {
    const selected = /** @type string[] */(this[selectedItemsValue]);
    this[deleteLatestList] = await ArcModelEvents.Request.deleteBulk(this, 'history', selected);
    this[selectedItemsValue] = undefined;
    this[notifySelection]();
    this[deleteUndoOpened] = true;
    this.requestUpdate();
  }

  [deleteAll]() {
    this[deleteAllDialogValue] = true;
    this.requestUpdate();
  }

  [deleteCancel]() {
    this[deleteAllDialogValue] = false;
    this.requestUpdate();
  }

  async [deleteConfirm]() {
    ArcModelEvents.destroy(this, ['history']);
    this[deleteCancel]();
    if (this[selectedItemsValue]) {
      this[selectedItemsValue] = undefined;
      this[notifySelection]();
    }
  }

  async [deleteUndoAction]() {
    const deleted = this[deleteLatestList];
    if (!deleted || !deleted.length) {
      return;
    }
    await ArcModelEvents.Request.undeleteBulk(this, 'history', deleted);
    this[deleteLatestList] = undefined;
    this.requestUpdate();
  }

  [snackbarClosedHandler]() {
    this[deleteUndoOpened] = false;
  }

  [exportAction]() {
    this[exportOptionsOpened] = true;
    this.requestUpdate();
  }

  [exportOverlayClosed]() {
    this[exportOptionsOpened] = false;
    this.requestUpdate();
  }

  /**
   * @param {CustomEvent} e
   */
  [exportAccept](e) {
    this[exportOverlayClosed]();
    const selected = /** @type string[] */(this[selectedItemsValue]);
    const { exportOptions, providerOptions } = e.detail;
    if (!Array.isArray(selected) || !selected.length) {
      this[exportAll](exportOptions, providerOptions);
    } else {
      this[exportSelected](selected, exportOptions, providerOptions);
    }
  }

  [exportCancel]() {
    this[exportOverlayClosed]();
  }

  /**
   * @param {ExportOptions} exportOptions
   * @param {ProviderOptions} providerOptions
   */
  async [exportAll](exportOptions, providerOptions) {
    const result = await ExportEvents.nativeData(this, { history: true }, exportOptions, providerOptions);
    if (!result.interrupted && exportOptions.provider === 'drive') {
      // @ts-ignore
      this.shadowRoot.querySelector('#driveExport').open = true;
    }
  }

  /**
   * @param {string[]} selected
   * @param {ExportOptions} exportOptions
   * @param {ProviderOptions} providerOptions
   */
  async [exportSelected](selected, exportOptions, providerOptions) {
    const requests = await ArcModelEvents.Request.readBulk(this, 'history', selected);
    const data = {
      history: requests,
    };
    const result = await ExportEvents.nativeData(this, data, exportOptions, providerOptions);
    if (!result.interrupted && exportOptions.provider === 'drive') {
      // @ts-ignore
      this.shadowRoot.querySelector('#driveExport').open = true;
    }
  }

  render() {
    return html`
    ${this[busyTemplate]()}
    ${this[contentActionsTemplate]()}
    ${this[unavailableTemplate]()}
    ${this[searchEmptyTemplate]()}
    <div class="list" @scroll="${this[listScrollHandler]}">
    ${this[listTemplate]()}
    </div>
    ${this[confirmDeleteAllTemplate]()}
    ${this[deleteUndoTemplate]()}
    ${this[exportOptionsTemplate]()}
    ${this[driveExportedTemplate]()}
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
    <div class="list-empty">
      <p class="empty-info"><b>The requests list is empty.</b></p>
      <p class="empty-info">Send a request from the request panel and it will appear here.</p>
    </div>
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
      <anypoint-icon-button @click="${this[contentActionHandler]}" data-action="refresh" title="Reload the list">
        <arc-icon icon="refresh"></arc-icon>
      </anypoint-icon-button>
      <anypoint-icon-button @click="${this[contentActionHandler]}" data-action="toggle-all" title="Toggle selection all">
        <arc-icon icon="selectAll"></arc-icon>
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

  [searchEmptyTemplate]() {
    if (!this.isSearch || !this.searchListEmpty) {
      return '';
    }
    return html`
    <div class="search-empty">
      <p><b>No results.</b> Try to change the search query.</p>
    </div>
    `;
  }

  [confirmDeleteAllTemplate]() {
    if (!this[deleteAllDialogValue]) {
      return '';
    }
    return html`
    <div class="delete-container">
      <div class="delete-all-overlay"></div>
      <div class="delete-all-dialog dialog">
        <h2>Confirm delete all</h2>
        <p>All requests from the data store will be permanently deleted.</p>
        <p>Do you wish to continue?</p>
        <div class="buttons">
          <anypoint-button>Make backup</anypoint-button>
          <anypoint-button class="right-button" @click="${this[deleteCancel]}">Cancel</anypoint-button>
          <anypoint-button @click="${this[deleteConfirm]}">Delete</anypoint-button>
        </div>
      </div>
    </div>
    `;
  }

  [deleteUndoTemplate]() {
    const opened = this[deleteUndoOpened];
    const cnt = (this[deleteLatestList] || []).length || 0;
    return html`
    <mwc-snackbar 
      labelText="${cnt} requests were deleted." 
      ?open="${opened}" 
      timeoutMs="8000"
      @MDCSnackbar:closed="${this[snackbarClosedHandler]}"
    >
      <anypoint-button 
        class="snackbar-button" 
        slot="action" 
        @click="${this[deleteUndoAction]}"
      >Undo</anypoint-button>
      <anypoint-icon-button 
        aria-label="Activate to close this message"
        title="Close this message"
        slot="dismiss"
        class="snackbar-button"
      >
        <arc-icon icon="close" class="snackbar-button"></arc-icon>
      </anypoint-icon-button>
    </mwc-snackbar>
    `;
  }

  [exportOptionsTemplate]() {
    const opened = this[exportOptionsOpened];
    const {
      compatibility,
    } = this;
    return html`
    <bottom-sheet
      withBackdrop
      .opened="${opened}"
      @overlay-closed="${this[exportOverlayClosed]}"
    >
      <export-options
        ?compatibility="${compatibility}"
        withEncrypt
        file="arc-history-list.arc"
        provider="file"
        @accept="${this[exportAccept]}"
        @cancel="${this[exportCancel]}"
      ></export-options>
    </bottom-sheet>`;
  }

  [driveExportedTemplate]() {
    return html`
    <mwc-snackbar id="driveExport" labelText="Data saved on Google Drive."></mwc-snackbar>
    `;
  }
}