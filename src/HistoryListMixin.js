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
import { LitElement, html } from 'lit-element';
import {classMap} from 'lit-html/directives/class-map.js';
import '@anypoint-web-components/anypoint-selector/anypoint-selector.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@api-components/http-method-label/http-method-label.js';
import '@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '@anypoint-web-components/anypoint-item/anypoint-item-body.js';
import '@anypoint-web-components/anypoint-collapse/anypoint-collapse.js';
import '@github/time-elements';
import {
  appendItems,
  createHistoryGroup,
  createGroupHeaderLabel,
  createGroupDay,
  createGroupListItem,
  findGroupInsertPosition,
  findHistoryInsertPosition,
  requestChanged,
  listTemplate,
  historyGroupHeaderTemplate,
  toggleHistoryGroupHandler,
  requestItemTemplate,
  requestItemBodyTemplate,
  requestItemLabelTemplate,
} from './internals.js';
import { midnightTimestamp } from './Utils.js';
import { RequestsListMixin } from './RequestsListMixin.js';

/** @typedef {import('@advanced-rest-client/arc-models').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCModelStateDeleteEvent} ARCModelStateDeleteEvent */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('./types').HistoryListItem} HistoryListItem */
/** @typedef {import('./types').HistoryGroup} HistoryGroup */
/** @typedef {import('./types').HistoryDayItem} HistoryDayItem */

/**
 * @param {typeof LitElement} base
 */
const mxFunction = base => {
  class HistoryListMixinImpl extends RequestsListMixin(base) {
    constructor() {
      super();
      /**
       * @type {HistoryGroup[]}
      */  
      this.requests = undefined;
    }
  
    connectedCallback() {
      if (!this.type) {
        this.type = 'history';
      }
      super.connectedCallback();
    }

    /**
     * Appends a list of requests to the history list.
     * 
     * @param {ARCHistoryRequest[]} requests
     */
    async [appendItems](requests) {
      if (!Array.isArray(requests) || !requests.length) {
        return;
      }
      if (!this.requests) {
        this.requests = [];
      }
      const current = this.requests;
      requests.forEach((item) => {
        const { midnight } = item;
        const index = current.findIndex((i) => i.day.midnight === midnight);
        if (index === -1) {
          const group = this[createHistoryGroup](item);
          const insertPosition = this[findGroupInsertPosition](group.day.midnight);
          current.splice(insertPosition, 0, group);
        } else {
          const insertPosition = this[findHistoryInsertPosition](current[index].requests, item);
          current[index].requests.splice(insertPosition, 0, this[createGroupListItem](item));
        }
      });
      this.requestUpdate();
      // @ts-ignore
      if (this.notifyResize) {
        // @ts-ignore
        this.notifyResize();
      }
    }

    /**
     * Finds a place in the items array where to put a group giving it's timestamp.
     * @param {number} midnight The midnight timestamp of a group
     * @returns {number} The index at which to put the group in the requests array.
     */
    [findGroupInsertPosition](midnight) {
      const items = this.requests;
      for (let i = 0, len = items.length; i < len; i++) {
        const group = items[i];
        if (group.day.midnight < midnight) {
          return i;
        }
      }
      return items.length;
    }

    /**
     * Finds a place in the requests list where to put a history item.
     * 
     * @param {HistoryListItem[]} requests The list of requests
     * @param {ARCHistoryRequest} request The request to be inserted into the array.
     * @returns {number} The index at which to put the group in the requests array.
     */
    [findHistoryInsertPosition](requests, request) {
      for (let i = 0, len = requests.length; i < len; i++) {
        const item = requests[i];
        if (item.item.updated < request.updated) {
          return i;
        }
      }
      return requests.length;
    }

    /**
     * Creates a group of history items.
     * @param {ARCHistoryRequest} request
     * @returns {HistoryGroup}
     */
    [createHistoryGroup](request) {
      const day = this[createGroupDay](request);
      const item = this[createGroupListItem](request);
      return {
        day,
        opened: true,
        requests: [item],
      };
    }

    /**
     * Creates a day definition for a history group.
     * @param {ARCHistoryRequest} request
     * @returns {HistoryDayItem}
     */
    [createGroupDay](request) {
      const { midnight } = request;
      const label = this[createGroupHeaderLabel](request);
      return {
        label,
        midnight,
      };
    }

    /**
     * Creates a list item definition
     * @param {ARCHistoryRequest} request
     * @returns {HistoryListItem}
     */
    [createGroupListItem](request) {
      const { updated, created } = request;
      const date = updated || created || Date.now();
      const d = new Date(date);
      const iso = d.toISOString();
      return {
        isoTime: iso,
        item: request,
      };
    }

    /**
     * Computes a label to be put for a history group item.
     * @param {ARCHistoryRequest} request
     * @returns {string}
     */
    [createGroupHeaderLabel](request) {
      const { midnight, updated, created } = request;
      const today = midnightTimestamp();
      if (midnight === today) {
        return 'Today';
      }
      const yesterday = today - 86400000; // 24 h in milliseconds
      if (midnight === yesterday) {
        return 'Yesterday';
      }
      const date = updated || created || Date.now();
      const d = new Date(date);
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(d);
    }
  
    /**
     * Handles request model change when the type is history.
     * This assumes that this mixin is used with the combination with the `RequestsListMixin`.
     * If not then register an event listener for the request change handler.
     * 
     * @param {ARCHistoryRequest} request Changed request object.
     */
    [requestChanged](request) {
      if (this.type !== 'history') {
        return;
      }
      if (['history', 'history-requests'].indexOf(request.type) === -1) {
        return;
      }
      const { requests } = this;
      if (!requests) {
        this[appendItems]([request]);
        return;
      }
      for (let i = 0, len = requests.length; i < len; i++) {
        const group = requests[i];
        const index = group.requests.findIndex((item) => item.item._id === request._id);
        if (index !== -1) {
          group.requests.splice(index, 1);
          if (group.requests.length === 0) {
            requests.splice(i);
          }
          this.requestUpdate();
          return;
        }
      }
    }

    /**
     * @param {PointerEvent} e Toggle visibility of the history group
     */
    [toggleHistoryGroupHandler](e) {
      const node = /** @type HTMLElement */ (e.currentTarget);
      const index = Number(node.dataset.index);
      if (Number.isNaN(index)) {
        return;
      }
      this.requests[index].opened = !this.requests[index].opened;
      this.requestUpdate();
    }

    /**
     * @returns {TemplateResult|string} Template for the list items.
     */
    [listTemplate]() {
      const { requests } = this;
      if (!requests || !requests.length) {
        return '';
      }
      return html`
      <anypoint-selector
        selectable=".request-list-item"
      >
      ${requests.map((item, index) => this[historyGroupHeaderTemplate](item, index))}
      </anypoint-selector>
      `;
    }

    /**
     * @param {HistoryGroup} group A group to render
     * @param {number} index The index of the group in the list
     * @returns {TemplateResult}
     */
    [historyGroupHeaderTemplate](group, index) {
      const groupClasses = { 
        opened: group.opened,
        'history-group': true,
      };
      return html`
      <div class=${classMap(groupClasses)}>
        <span class="history-group-label">${group.day.label}</span>
        <anypoint-icon-button
          title="Press to toggle group"
          aria-label="Activate to toggle group visibility"
          class="history-group-toggle"
          data-index="${index}"
          @click="${this[toggleHistoryGroupHandler]}"
        >
          <arc-icon class="toggle-icon" icon="keyboardArrowDown"></arc-icon>
        </anypoint-icon-button>
      </div>
      <anypoint-collapse .opened="${group.opened}">
        ${group.requests.map((item, ri) => this[requestItemTemplate](item, index, ri))}
      </anypoint-collapse>
      `;
    }

    /**
     * @param {HistoryListItem} item The request to render
     * @param {number} groupIndex Index of the history group
     * @param {number} requestIndex Index of the request in the group
     * @returns {TemplateResult} Template for a single request object
     */
    [requestItemTemplate](item, groupIndex, requestIndex) {
      const { compatibility } = this;
      const request = item.item;
      return html`
      <anypoint-icon-item
        data-group="${groupIndex}"
        data-index="${requestIndex}"
        data-id="${request._id}"
        class="request-list-item"
        title="${request.url}"
        role="menuitem"
        ?compatibility="${compatibility}"
      >
        ${this[requestItemLabelTemplate](request)}
        ${this[requestItemBodyTemplate](item)}
      </anypoint-icon-item>
      `;
    }

    /**
     * @param {HistoryListItem} item The request to render
     * @returns {TemplateResult} Template for a request's content
     */
    [requestItemBodyTemplate](item) {
      const { compatibility, hasTwoLines } = this;
      return html`
      <anypoint-item-body
        ?twoline="${hasTwoLines}"
        ?compatibility="${compatibility}"
      >
        <div class="url">${item.item.url}</div>
        <div secondary>
          <relative-time datetime="${item.isoTime}">${item.isoTime}</relative-time>
        </div>
      </anypoint-item-body>
      `;
    }

    /**
     *  @param {ARCHistoryRequest} request The request to render
     * @returns {TemplateResult} Template for a request's http label
     */
    [requestItemLabelTemplate](request) {
      return html`<http-method-label method="${request.method}" slot="item-icon"></http-method-label>`;
    }
  }
  return HistoryListMixinImpl;
}

/**
 * A mixin to be applied to a list that renders history requests.
 * It contains methods to query for history list and to search history.
 * 
 * History list is an immutable list of requests that happened in the past.
 * 
 * Each element on the list is a group containing list requests made the same day.
 *
 * @mixin
 */
export const HistoryListMixin = dedupeMixin(mxFunction);
