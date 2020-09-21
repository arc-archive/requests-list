/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/

import { dedupeMixin } from '@open-wc/dedupe-mixin';
// eslint-disable-next-line no-unused-vars
import { LitElement } from 'lit-element';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/arc-models';
import { DataImportEventTypes, ArcNavigationEvents, ExportEvents } from '@advanced-rest-client/arc-events';
import { 
  projectLegacySort, 
  validateRequestType, 
  idsArrayEqual, 
  isProjectRequest, 
  hasTwoLines 
} from './Utils.js';
import {
  listTypeValue,
  hasTwoLinesValue,
  requestDeletedHandler,
  requestChangedHandler,
  projectChangeHandler,
  dataImportHandler,
  dataDestroyHandler,
  readType,
  updateBulk,
  updateRequest,
  updateListStyles,
  applyListStyles,
  persistRequestsOrder,
  projectRequestChanged,
  requestChanged,
  updateProjectOrder,
  dispatchExportData,
  openRequest,
  readProjectRequests,
  queryingValue,
  queryingProperty,
  pageTokenValue,
  makingQueryValue,
  appendItems,
  loadPage,
  prepareQuery,
  handleError,
  selectedItemsValue,
} from './internals.js';

/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestDeletedEvent} ARCRequestDeletedEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestUpdatedEvent} ARCRequestUpdatedEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCProjectUpdatedEvent} ARCProjectUpdatedEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-models').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptions} ExportOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportResult} ArcExportResult */
/** @typedef {import('@advanced-rest-client/arc-models').ARCModelStateDeleteEvent} ARCModelStateDeleteEvent */

/**
 * @param {typeof LitElement} base
 */
const mxFunction = base => {
  class RequestsListMixinImpl extends base {
    static get properties() {
      return {
        /**
         * The list of request to render.
         * It can be either saved, history or project items.
         */
        requests: { type: Array },
        /**
         * Requests list type. Can be one of:
         * - saved
         * - history
         * - project
         *
         * Depending on the the type request change event is handled differently.
         * For saved and history requests corresponding type is processed.
         * For project requests list only request that has project id in the
         * projects list is processed.
         *
         * This property must be set.
         */
        type: { type: String },
        /**
         * Project datastore ID to display.
         * This should be set only when type is `project`
         */
        projectId: { type: String },
        /**
         * Changes information density of list items.
         * By default it uses material's list item with two lines (72px height)
         * Possible values are:
         *
         * - `default` or empty - regular list view
         * - `comfortable` - enables MD single line list item vie (52px height)
         * - `compact` - enables list that has 40px height (touch recommended)
         */
        listType: { type: String, reflect: true },
        /**
         * A project object associated with requests.
         * This is only valid when `type` is set to `project`. It is set automatically
         * when `readProjectRequests()` is called.
         */
        project: { type: Object },
        /**
         * Single page query limit.
         */
        pageLimit: { type: Number },
        /**
         * When set this component is in search mode.
         * This means that the list won't be loaded automatically and
         * some operations not related to search are disabled.
         */
        isSearch: { type: Boolean },
        /**
         * When set it won't query for data automatically when attached to the DOM.
         */
        noAuto: { type: Boolean },
        /**
         * When set the datastore query is performed with `detailed` option
         */
        detailedSearch: { type: Boolean },
        /**
         * Adds draggable property to the request list item element.
         * The `dataTransfer` object has `arc/request-object` mime type with
         * serialized JSON with request model.
         */
        draggableEnabled: { type: Boolean },
        /**
         * Enables compatibility with Anypoint platform
         */
        compatibility: { type: Boolean },
        /**
         * When set the selection controls are rendered
         */
        selectable: { type: Boolean },
        /**
         * When set it adds action buttons into the list elements.
         */
        listActions: { type: Boolean },
      };
    }

    /**
     * Computed value, true when the project has requests.
     * @return {Boolean}
     */
    get hasRequests() {
      const { requests } = this;
      return !!(requests && requests.length);
    }

    get listType() {
      return this[listTypeValue];
    }

    set listType(value) {
      const old = this[listTypeValue];
      /* istanbul ignore if */
      if (old === value) {
        return;
      }
      this[listTypeValue] = value;
      if (this.requestUpdate) {
        this.requestUpdate('listType', old);
      }
      this[hasTwoLinesValue] = hasTwoLines(value);
      this[updateListStyles](value);
    }

    /**
     * @returns {boolean} True if the list item should be consisted of two lines of description.
     */
    get hasTwoLines() {
      return this[hasTwoLinesValue];
    }

    /**
     * @return {boolean} True when the element is querying the database for the data.
     */
    get querying() {
      return this[queryingValue];
    }
  
    get [queryingProperty]() {
      return this.querying;
    }
  
    set [queryingProperty](value) {
      const old = this[queryingProperty];
      /* istanbul ignore if */
      if (old === value) {
        return;
      }
      this[queryingValue] = value;
      this.requestUpdate();
      this.dispatchEvent(new CustomEvent('queryingchange'));
    }
  
    /**
     * True when there's no requests after refreshing the state.
     * @return {Boolean}
     */
    get dataUnavailable() {
      const { requests, querying, isSearch } = this;
      return !isSearch && !querying && !(requests && requests.length);
    }

    /**
     * Computed value. True when the query has been performed and no items
     * has been returned. It is different from `listHidden` where less
     * conditions has to be checked. It is set to true when it doesn't
     * have items, is not loading and is search.
     *
     * @return {boolean}
     */
    get searchListEmpty() {
      const { requests, querying, isSearch } = this;
      return !!isSearch && !querying && !(requests && requests.length);
    }

    /**
     * @returns {string[]|null} List of selected ids when `selectable` is set or `null` otherwise
     */
    get selectedItems() {
      if (!this.selectable) {
        return null;
      }
      return this[selectedItemsValue] || [];
    }

    /**
     * @param {string[]} value List of requests to select in the view. This has no effect when `selectable` is not set. 
     */
    set selectedItems(value) {
      const old = this[selectedItemsValue] || [];
      if (idsArrayEqual(old, value)) {
        return;
      }
      this[selectedItemsValue] = value;
      this.requestUpdate();
    }

    constructor() {
      super();
      this[requestDeletedHandler] = this[requestDeletedHandler].bind(this);
      this[requestChangedHandler] = this[requestChangedHandler].bind(this);
      this[projectChangeHandler] = this[projectChangeHandler].bind(this);
      this[dataImportHandler] = this[dataImportHandler].bind(this);
      this[dataDestroyHandler] = this[dataDestroyHandler].bind(this);

      this[hasTwoLinesValue] = true;
      /**
       * @type {'saved'|'history'|'project'}
       */
      this.type = undefined;
      /**
       * @type {(ARCHistoryRequest|ARCSavedRequest)[]}
       */
      this.requests = undefined;
      /**
       * @type {ARCProject}
       */
      this.project = undefined;
      /**
       * @type {string}
       */
      this.projectId = undefined;
      
  
      this.pageLimit = 150;
      this.detailedSearch = false;
      this.noAuto = false;
      this.isSearch = false;
      this.draggableEnabled = false;
      this.compatibility = false;
      this.selectable = false;
      this.listActions = false;
    }
    

    connectedCallback() {
      super.connectedCallback();
      window.addEventListener(ArcModelEventTypes.Request.State.delete, this[requestDeletedHandler]);
      window.addEventListener(ArcModelEventTypes.Request.State.update, this[requestChangedHandler]);
      window.addEventListener(ArcModelEventTypes.Project.State.update, this[projectChangeHandler]);
      window.addEventListener(DataImportEventTypes.dataimported, this[dataImportHandler]);
      window.addEventListener(ArcModelEventTypes.destroyed, this[dataDestroyHandler]);
      if (!this.noAuto && !this.querying && !this.requests) {
        this.loadNext();
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener(ArcModelEventTypes.Request.State.delete, this[requestDeletedHandler]);
      window.removeEventListener(ArcModelEventTypes.Request.State.update, this[requestChangedHandler]);
      window.removeEventListener(ArcModelEventTypes.Project.State.update, this[projectChangeHandler]);
      window.removeEventListener(DataImportEventTypes.dataimported, this[dataImportHandler]);
      window.removeEventListener(ArcModelEventTypes.destroyed, this[dataDestroyHandler]);
    }

    /**
     * Refreshes the data from the datastore.
     * It resets the query options, clears requests and makes a query to the datastore.
     */
    refresh() {
      this.reset();
      this.loadNext();
    }

    /**
     * Resets the state of the variables.
     */
    reset() {
      this[pageTokenValue] = undefined;
      this.isSearch = false;
      this[queryingProperty] = false;
      this.requests = undefined;
    }

    /**
     * Loads next page of results. It runs the task in a debouncer set to
     * next render frame so it's safe to call it more than once at the time.
     */
    loadNext() {
      if (this.isSearch) {
        return;
      }
      if (this[makingQueryValue]) {
        return;
      }
      this[makingQueryValue] = true;
      setTimeout(() => {
        this[makingQueryValue] = false;
        this[loadPage]();
      });
    }

    /**
     * Queries for the request data,
     *
     * @param {string} query The query term
     * @return {Promise} Resolved promise when the query ends.
     */
    async query(query) {
      if (!query) {
        if (this.isSearch) {
          this.refresh();
        }
        return;
      }
      this.isSearch = true;
      this[queryingProperty] = true;
      this.requests = undefined;
  
      try {
        const term = this[prepareQuery](query);
        const result = await ArcModelEvents.Request.query(this, term, this.type, this.detailedSearch);
        this[appendItems](result);
        this[queryingProperty] = false;
      } catch (e) {
        this[queryingProperty] = false;
        this[handleError](e);
      }
      // This helps prioritize search development
      this.dispatchEvent(new CustomEvent('send-analytics', {
        bubbles: true,
        composed: true,
        detail: {
          type: 'event',
          category: 'Content search',
          action: `${this.type} search`
        }
      }));
    }

    /**
     * Handler for `request-object-deleted` event. Removes request from the list
     * if it existed.
     * @param {ARCRequestDeletedEvent} e
     */
    [requestDeletedHandler](e) {
      const { requests=[] } = this;
      if (!Array.isArray(requests) || !requests.length) {
        return;
      }
      const { id } = e;
      const index = requests.findIndex((r) => r._id === id);
      if (index === -1) {
        return;
      }
      requests.splice(index, 1);
      this.requestUpdate();
    }

    /**
     * Handler for the request update event.
     * 
     * Depending on the `type` property it updates / adds / removes item from the requests list.
     * @param {ARCRequestUpdatedEvent} e
     */
    async [requestChangedHandler](e) {
      if (e.cancelable) {
        return;
      }
      const type = this[readType]();
      const record = e.changeRecord;
      let item;
      if (!record.item) {
        item = await ArcModelEvents.Request.read(this, type, record.id);
      } else {
        item = record.item;
      }
      if (type === 'project') {
        this[projectRequestChanged](/** @type ARCSavedRequest */ (item));
      } else {
        this[requestChanged](item);
      }
    }

    /**
     * Handler for `data-imported` custom event.
     * Refreshes data state.
     */
    [dataImportHandler]() {
      this.refresh();
    }

    /**
     * Handler for the `datastore-destroyed` custom event.
     * If one of destroyed databases is history store then it refreshes the sate.
     * @param {ARCModelStateDeleteEvent} e
     */
    [dataDestroyHandler](e) {
      const { store } = e;
      if (![this.type, 'all'].includes(store)) {
        return;
      }
      this.refresh();
    }

    /**
     * Handles request change when type is project.
     * @param {ARCSavedRequest} request Changed request object.
     */
    [projectRequestChanged](request) {
      const { projectId } = this;
      if (!projectId) {
        return;
      }
      const isProject = isProjectRequest(request, projectId);
      if (!Array.isArray(this.requests)) {
        this.requests = [];
      }
      const { requests } = this;
      if (!requests.length) {
        if (isProject) {
          this.requests = [request];
        }
        return;
      }
      const index = requests.findIndex((r) => r._id === request._id);
      if (index !== -1) {
        const saved = /** @type ARCSavedRequest */ (requests[index]);
        if (isProjectRequest(saved, projectId)) {
          requests[index] = request;
        } else {
          requests.splice(index, 1);
        }
        this.requestUpdate();
        return;
      }
      if (!isProject) {
        return;
      }
      if (this.project) {
        const pRequest = this.project.requests || [];
        const i = pRequest.indexOf(request._id);
        requests.splice(i, 0, request);
      } else {
        requests.push(request);
      }
      this.requestUpdate();
    }

    /**
     * Handles request change when type is project.
     * @param {ARCSavedRequest|ARCHistoryRequest} request Changed request object.
     */
    [requestChanged](request) {
      if (!Array.isArray(this.requests)) {
        this.requests = [];
      }
      const { requests } = this;
      const index = requests.findIndex((r) => r._id === request._id);
      if (index === -1) {
        // add to the beginning of the list
        requests.unshift(request);
      } else {
        requests[index] = request;
      }
      this.requestUpdate();
    }

    /**
     * A function to read request data for a project.
     * 
     * @param {string} id Project ID
     * @return {Promise<ARCSavedRequest[]>} Promise resolved to the list of project requests.
     */
    async [readProjectRequests](id) {
      const currentProject = this.project;
      let project;
      if (currentProject && currentProject._id === id) {
        project = currentProject;
      } else {
        project = await ArcModelEvents.Project.read(this, id);
        this.project = project;
      }
      const requests = /** @type ARCSavedRequest[] */ (await ArcModelEvents.Request.projectlist(this, project._id, {
        restorePayload: false,
      }));
      if (!project.requests && requests) {
        requests.sort(projectLegacySort);
      }
      return requests;
    }

    /**
     * @returns {string} The type used in the ARC request model.
     */
    [readType]() {
      const { type } = this;
      validateRequestType(type);
      if (type === 'history') {
        return type;
      }
      return 'saved';
    }
    
    /**
     * Updates requests in a bulk operation.
     * 
     * @param {(ARCSavedRequest|ARCHistoryRequest)[]} items Request items to save
     * @return {Promise<ARCEntityChangeRecord[]>}
     */
    async [updateBulk](items) {
      const type = this[readType]();
      return ArcModelEvents.Request.updateBulk(this, type, items);
    }

    /**
     * Dispatches request update event.
     * 
     * @param {ARCSavedRequest|ARCHistoryRequest} request The request to update.
     * @return {Promise<ARCEntityChangeRecord>} Promise resolved when the request object is updated.
     */
    async [updateRequest](request) {
      const type = this[readType]();
      return ArcModelEvents.Request.update(this, type, request);
    }

    /**
     * Updates icon size CSS variable and notifies resize on the list when
     * list type changes.
     * 
     * @param {string} type
     */
    [updateListStyles](type) {
      let size;
      switch (type) {
        case 'comfortable':
          size = 48;
          break;
        case 'compact':
          size = 36;
          break;
        default:
          size = 72;
          break;
      }
      this[applyListStyles](size);
    }
    
    /**
     * Applies `--anypoint-item-icon-width` CSS variable.
     * 
     * @param {number} size Icon width in pixels.
     * @param {HTMLElement=} target The target to apply styling. Default to this.
     */
    [applyListStyles](size, target=this) {
      const value = `${size}px`;
      target.style.setProperty('--anypoint-item-icon-width', value);
      // @ts-ignore
      if (typeof target.notifyResize === 'function') {
        // @ts-ignore
        target.notifyResize();
      }
    }
    
    /**
     * Stores current order of requests in the project.
     * 
     * @return {Promise<ARCEntityChangeRecord|undefined>} Change record or undefined when it has the same order
     */
    async [persistRequestsOrder]() {
      const { project } = this;
      if (project) {
        throw new Error('"project" is not set');
      }
      const { requests } = this;
      const newOrder = requests.map((item) => item._id);
      const copy = { ...project };
      if (idsArrayEqual(copy.requests, newOrder)) {
        return undefined;
      }
      copy.requests = newOrder;
      this.project = copy;
      return ArcModelEvents.Project.update(this, copy);
    }

    /**
     * Handler for the project change event.
     * 
     * @param {ARCProjectUpdatedEvent} e
     */
    async [projectChangeHandler](e) {
      if (this.type !== 'project' || !this.project) {
        return;
      }
      const rec = e.changeRecord;
      if (rec.id !== this.project._id) {
        return;
      }
      let item;
      if (rec.item) {
        item = rec.item;
      } else {
        item = await ArcModelEvents.Project.read(this, rec.id);
      }
      this.project = item;
      this[updateProjectOrder](item);
    }

    /**
     * Updates requests order when project changed.
     * It reorder requests array for changed project order. It won't change
     * requests array when order is the same. It also won't change order when
     * request list is different that project's requests list.
     * @param {ARCProject} project Changed project
     * @return {Boolean} True when order has changed
     */
    [updateProjectOrder](project) {
      const { requests } = this;
      if (!Array.isArray(requests) || !project.requests) {
        return false;
      }
      if (requests.length !== project.requests.length) {
        // request is being added or removed
        return false;
      }
      const newOrder = [];
      let changed = false;
      for (let i = 0, len = project.requests.length; i < len; i++) {
        const id = project.requests[i];
        const rPos = requests.findIndex((item) => item._id === id);
        if (rPos === -1) {
          // unknown state, better quit now
          return false;
        }
        newOrder[i] = requests[rPos];
        if (i !== rPos) {
          changed = true;
        }
      }
      if (changed) {
        this.requests = newOrder;
      }
      return changed;
    }

    /**
     * Dispatches export event
     * 
     * @param {(ARCSavedRequest|ARCHistoryRequest)[]} requests List of request to export.
     * @param {ExportOptions} exportOptions Export configuration options
     * @param {ProviderOptions} providerOptions Provider configuration options.
     * @return {Promise<ArcExportResult>} A promise resolved to the provider's return value.
     */
    async [dispatchExportData](requests, exportOptions, providerOptions) {
      validateRequestType(this.type);
      const data = {};
      switch (this.type) {
        case 'history':
          data.history = requests;
          break;
        case 'project':
          data.saved = requests;
          data.projects = [this.project];
          break;
        case 'saved':
          data.saved = requests;
          break;
        default:
      }
      return ExportEvents.nativeData(this, data, exportOptions, providerOptions);
    }

    /**
     * Dispatches navigate event to open a request
     * @param {string} id The id of the request to open.
     */
    [openRequest](id) {
      const type = this[readType]();
      ArcNavigationEvents.navigateRequest(this, id, type);
    }

    /**
     * Loads next page of results from the datastore.
     * Pagination used here has been described in PouchDB pagination strategies
     * document.
     * @return {Promise}
     */
    async [loadPage]() {
      if (this.isSearch || this.querying) {
        return;
      }
      this[queryingProperty] = true;
      try {
        const token = this[pageTokenValue];
        const response = await ArcModelEvents.Request.list(this, this.type, {
          nextPageToken: token,
          limit: this.pageLimit,
        });
        if (response.nextPageToken) {
          this[pageTokenValue] = response.nextPageToken;
        }
        this[queryingProperty] = false;
        this[appendItems](response.items);
      } catch (e) {
        this[queryingProperty] = false;
        this[handleError](e);
      }
    }

    /**
     * Prepares a query string to search the data store.
     * @param {string} query User search term
     * @return {string} Processed query
     */
    [prepareQuery](query) {
      let result = String(query);
      result = result.toLowerCase();
      if (result[0] === '_') {
        result = result.substr(1);
      }
      return result;
    }

    /**
     * Handles any error.
     * @param {Error} cause
     */
    [handleError](cause) {
      this.dispatchEvent(new CustomEvent('send-analytics', {
        bubbles: true,
        composed: true,
        detail: {
          type: 'exception',
          description: cause.message,
          fatal: false
        }
      }));
      throw cause;
    }
  }
  return RequestsListMixinImpl;
};
/**
 * A mixin to be used with elements that consumes lists of requests.
 * It implements event listeners related to requests data change.
 *
 * @mixin
 */
export const RequestsListMixin = dedupeMixin(mxFunction);
