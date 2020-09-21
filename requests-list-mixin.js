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
import { html } from 'lit-element';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import '@advanced-rest-client/arc-models/url-indexer.js';
/**
 * A mixin to be used with elements that consumes lists of requests.
 * It implements event listeners related to requests data change.
 *
 * @mixinFunction
 * @memberof ArcComponents
 * @param {Class} base
 * @return {Class}
 */
export const RequestsListMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * The list of request to render.
       * It can be eirther saved, history or project items.
       * @type {Array<Object>}
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
       * By default it uses material's peper item with two lines (72px heigth)
       * Possible values are:
       *
       * - `default` or empty - regular list view
       * - `comfortable` - enables MD single line list item vie (52px heigth)
       * - `compact` - enables list that has 40px heigth (touch recommended)
       */
      listType: { type: String, reflect: true },
      /**
       * Computed value if the list item should be consisted of two lines of
       * description.
       */
      _hasTwoLines: { type: Boolean },
      /**
       * A project object associated with requests.
       * This is only valid when `type` is set to `project`. It is set automatically
       * when `readProjectRequests()` is called.
       */
      project: { type: Object }
    };
  }
  /**
   * Computed value, true when the project has requests.
   * @return {Boolean}
   */
  get hasRequests() {
    const r = this.requests;
    return !!(r && r.length);
  }

  get listType() {
    return this._listType;
  }

  set listType(value) {
    const old = this._listType;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._listType = value;
    if (this.requestUpdate) {
      this.requestUpdate('listType', old);
    }
    this._hasTwoLines = this._computeHasTwoLines(value);
    this._updateListStyles(value);
  }

  get modelTemplate() {
    return html`
      <request-model></request-model>
      <project-model></project-model>
      <url-indexer></url-indexer>
    `;
  }

  get requestModel() {
    if (!this.__rmodel) {
      this.__rmodel = this.shadowRoot.querySelector('request-model');
    }
    return this.__rmodel;
  }

  get projectModel() {
    if (!this.__pmodel) {
      this.__pmodel = this.shadowRoot.querySelector('project-model');
    }
    return this.__pmodel;
  }

  constructor() {
    super();
    this._requestDeletedHandler = this._requestDeletedHandler.bind(this);
    this._requestChangedHandler = this._requestChangedHandler.bind(this);
    this._projectChanged = this._projectChanged.bind(this);

    this._hasTwoLines = true;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    window.addEventListener('request-object-deleted', this._requestDeletedHandler);
    window.addEventListener('request-object-changed', this._requestChangedHandler);
    window.addEventListener('project-object-changed', this._projectChanged);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    window.removeEventListener('request-object-deleted', this._requestDeletedHandler);
    window.removeEventListener('request-object-changed', this._requestChangedHandler);
    window.removeEventListener('project-object-changed', this._projectChanged);
    this.__rmodel = null;
    this.__pmodel = null;
  }
  /**
   * Dispatches bubbling and composed custom event.
   * By default the event is cancelable until `cancelable` property is set to false.
   * @param {String} type Event type
   * @param {?any} detail A detail to set
   * @param {?Boolean} cancelable True if the event is cancelable (default value).
   * @return {CustomEvent}
   */
  _dispatch(type, detail, cancelable) {
    if (typeof cancelable !== 'boolean') {
      cancelable = true;
    }
    const e = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      cancelable,
      detail
    });
    this.dispatchEvent(e);
    return e;
  }
  /**
   * Handler for `request-object-deleted` event. Removes request from the list
   * if it existed.
   * @param {CustomEvent} e
   */
  _requestDeletedHandler(e) {
    const { requests } = this;
    if (e.cancelable || !requests || !requests.length) {
      return;
    }
    const deleteId = e.detail.id;
    switch (this.type) {
      case 'history':
        this._historyItemDeleted(deleteId);
        break;
      default:
        this._itemDeleted(deleteId);
        break;
    }
  }
  /**
   * Removes an item from the list by given id.
   * @param {String} id Request ID to remove
   */
  _itemDeleted(id) {
    const items = this.requests || [];
    let updated = false;
    for (let i = 0, len = items.length; i < len; i++) {
      if (items[i]._id === id) {
        items.splice(i, 1);
        updated = true;
        break;
      }
    }
    if (updated) {
      this.requests = [...items];
    }
  }
  /**
   * Removes a history item from the list by given id.
   * @param {String} id Request ID to remove
   */
  _historyItemDeleted(id) {
    const items = this.requests || [];
    let updated = false;
    for (let i = 0, len = items.length; i < len; i++) {
      if (items[i]._id === id) {
        const old = items[i];
        const nextIndex = i + 1;
        const next = items[nextIndex];
        if (old.hasHeader && next && !next.hasHeader) {
          next.header = old.header;
          next.hasHeader = old.hasHeader;
        }
        items.splice(i, 1);
        updated = true;
        break;
      }
    }
    if (updated) {
      this.requests = [...items];
    }
  }
  /**
   * Handler for `request-object-changed` custom event.
   * Depending on the `type` property it updates / adds / removes item from
   * the requests list.
   * @param {CustomEvent} e
   */
  _requestChangedHandler(e) {
    if (e.cancelable) {
      return;
    }
    const request = e.detail.request;
    switch (this.type) {
      case 'history':
        if (this._historyTypeChanged) {
          this._historyTypeChanged(request);
        }
        break;
      case 'saved':
        this._savedTypeChanged(request);
        break;
      case 'project':
        this._projectTypeChanged(request);
        break;
    }
  }
  /**
   * Handles request change when type is project.
   * @param {Object} request Changed request object.
   */
  _projectTypeChanged(request) {
    const { projectId } = this;
    if (!projectId) {
      return;
    }
    const items = this.requests || [];
    if (!items.length) {
      if (this._isProjectRequest(request)) {
        this.requests = [request];
      }
      return;
    }
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i]._id === request._id) {
        if (this._isProjectRequest(request)) {
          items[i] = request;
        } else {
          items.splice(i, 1);
        }
        this.requests = [...items];
        return;
      }
    }
    if (this._isProjectRequest(request)) {
      if (this.project) {
        const pRequest = this.project.requests || [];
        const index = pRequest.indexOf(request._id);
        items.splice(index, 0, request);
      } else {
        items.push(request);
      }
      this.requests = [...items];
    }
  }
  /**
   * Checks if requests is related to current project.
   * `projectId` has to be set on the element.
   * @param {Object} request
   * @return {Boolean}
   */
  _isProjectRequest(request) {
    const projectId = this.projectId;
    if (!projectId) {
      return false;
    }
    if (request.projects && request.projects.indexOf(projectId) !== -1) {
      return true;
    } else if (request.legacyProject === projectId) {
      return true;
    }
    return false;
  }
  /**
   * Handles request change when type is saved or history.
   * @param {Object} request Changed request object.
   */
  _savedTypeChanged(request) {
    const t = this.type;
    if (t !== 'saved') {
      return;
    }
    if (['saved', 'saved-requests'].indexOf(request.type) === -1) {
      return;
    }
    const items = this.requests || [];
    let updated = false;
    if (!items.length) {
      items[items.length] = request;
      updated = true;
    } else {
      for (let i = 0, len = items.length; i < len; i++) {
        if (items[i]._id === request._id) {
          items[i] = request;
          updated = true;
          break;
        }
      }
    }
    if (!updated) {
      items.unshift(request);
    }
    this.requests = [...items];
  }
  /**
   * A function to read request data for a project.
   * @param {String} projectId Project ID
   * @return {Promise} Promise.resolved to requests list.
   */
  async readProjectRequests(projectId) {
    const currentProject = this.project;
    let project;
    if (currentProject && currentProject._id === projectId) {
      project = currentProject;
    } else {
      const model = this.projectModel;
      project = await model.readProject(projectId);
      this.project = project;
    }
    const model = this.requestModel;
    const requests = await model.readProjectRequests(project._id);
    if (!project.requests && requests) {
      requests.sort(this._legacySort);
    }
    return requests;
  }

  /**
   * Sorts requests list by `projectOrder` property
   *
   * @param {Object} a
   * @param {Object} b
   * @return {Number}
   */
  _legacySort(a, b) {
    if (a.projectOrder > b.projectOrder) {
      return 1;
    }
    if (a.projectOrder < b.projectOrder) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    if (a.name < b.name) {
      return -1;
    }
    return 0;
  }

  _getCurrentType() {
    this._validateType(this.type);
    let type;
    switch (this.type) {
      case 'saved':
      case 'project':
        type = 'saved';
        break;
      case 'history':
        type = 'history';
        break;
    }
    return type;
  }
  /**
   * Updates requests in bulk opeartion.
   * @param {Array<object>} items Request items to save
   * @return {Promise}
   */
  async _updateBulk(items) {
    const model = this.requestModel;
    return await model.updateBulk(this._getCurrentType(), items);
  }
  /**
   * Sends the `request-object-changed` custom event for each request on the list.
   * @param {Object} request Request object.
   * @return {Promise} Promise resolved when the request object is updated.
   */
  async _updateRequest(request) {
    const model = this.requestModel;
    return await model.update(this._getCurrentType(), request);
  }

  /**
   * Computes value for `_hasTwoLines` property.
   * @param {?String} listType Selected list type.
   * @return {Boolean}
   */
  _computeHasTwoLines(listType) {
    if (!listType || listType === 'default') {
      return true;
    }
    return false;
  }
  /**
   * Updates icon size CSS variable and notifies resize on the list when
   * list type changes.
   * @param {?String} type
   */
  _updateListStyles(type) {
    let size;
    switch (type) {
      case 'comfortable': size = 48; break;
      case 'compact': size = 36; break;
      default: size = 72; break;
    }
    this._applyListStyles(size);
  }
  /**
   * Applies `--paper-item-icon-width` variable.
   * @param {Number} size Icon width in pixels.
   * @param {?Element} target The target to apply styling. Default to this.
   */
  _applyListStyles(size, target) {
    target = target || this;
    const value = `${size}px`;
    target.style.setProperty('--anypoint-item-icon-width', value);
    if (target.notifyResize) {
      target.notifyResize();
    }
  }
  /**
   * Stores current order of requests in the project.
   * This shouls be only called wshen `project` property is set.
   * @return {Promise}
   */
  async _persistRequestsOrder() {
    if (!this.project) {
      throw new Error('"project" is not set');
    }
    const items = this.requests;
    const newOrder = items.map((item) => item._id);
    const project = Object.assign({}, this.project);
    if (this._idsArrayEqual(project.requests, newOrder)) {
      return;
    }
    project.requests = newOrder;
    this.project = project;
    delete project.opened;
    const model = this.projectModel;
    return await model.updateProject(project);
  }
  /**
   * Tests if two arrays has the same order of ids (strings).
   * @param {Array<String>} a1 Array a
   * @param {Array<String>} a2 Array b
   * @return {Boolean} True when elements are ordered the same way.
   */
  _idsArrayEqual(a1, a2) {
    if (!a1 && !a2) {
      return true;
    }
    if (!a1 || !a2) {
      return false;
    }
    if (a1.length !== a2.length) {
      return false;
    }
    for (let i = 0, len = a1.length; i < len; i++) {
      if (a1[i] !== a2[i]) {
        return false;
      }
    }
    return true;
  }
  /**
   * Handler for the `project-object-changed` event.
   * @param {CustomEvent} e
   * @return {Boolean} False if the event was not handled.
   */
  _projectChanged(e) {
    if (e.cancelable || this.type !== 'project' || !this.project ||
      e.composedPath()[0] === this) {
      return false;
    }
    const { project } = e.detail;
    if (this.project._id !== project._id) {
      return false;
    }
    this.project = project;
    this._updateProjectOrder(project);
    return true;
  }
  /**
   * Updates requests order when project changed.
   * It reorder requests array for changed project order. It won't change
   * requests array when order is the same. It also won't change order when
   * request list is different that project's requests list.
   * @param {Object} project Changed project
   * @return {Boolean} True when order has changed
   */
  _updateProjectOrder(project) {
    const requests = this.requests;
    if (!requests || !project.requests) {
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
   * Dispatches `export-data` event and returns it.
   * @param {Array<Object>} requests List of request to export.
   * @param {Object} opts
   * @return {CustomEvent}
   */
  _dispatchExportData(requests, opts) {
    this._validateType(this.type);
    const data = {};
    switch (this.type) {
      case 'history': data.history = requests; break;
      case 'project':
        data.saved = requests;
        data.projects = [this.project];
        break;
      case 'saved': data.saved = requests; break;
    }
    return this._dispatch('arc-data-export', {
      options: opts.options,
      providerOptions: opts.providerOptions,
      data
    });
  }
  /**
   * Dispatches navigate event to open a request
   * @param {[type]} id [description]
   * @return {[type]} [description]
   */
  _openRequest(id) {
    let type = this.type;
    this._validateType(type);
    if (type === 'project') {
      type = 'saved';
    }
    return this._dispatch('navigate', {
      base: 'request',
      type,
      id
    });
  }
  /**
   * Throws an error when type is not set.
   * @param {String} type Passed to the function type
   */
  _validateType(type) {
    if (['project', 'history', 'saved'].indexOf(type) === -1) {
      throw new TypeError('The "type" property is not set.');
    }
  }
}
