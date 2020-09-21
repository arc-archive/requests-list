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
import {
  appendItems,
} from './internals.js';
import { savedSort } from './Utils.js';
import { RequestsListMixin } from './RequestsListMixin.js';

/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */

/**
 * @param {typeof LitElement} base
 */
const mxFunction = base => {
  class SavedListMixinImpl extends RequestsListMixin(base) {

    constructor() {
      super();
      
      /**
       * @type {ARCSavedRequest[]}
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
     * @param {ARCSavedRequest[]} requests
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
        if (item._id.startsWith('_design')) {
          return;
        }
        current.push(item);
      });
      current.sort(savedSort);
      this.requestUpdate();
      // @ts-ignore
      if (this.notifyResize) {
        // @ts-ignore
        this.notifyResize();
      }
    }
  }
  return SavedListMixinImpl;
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
export const SavedListMixin = dedupeMixin(mxFunction);