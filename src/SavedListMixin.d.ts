import { ARCSavedRequest } from '@advanced-rest-client/arc-models';
import { TemplateResult } from 'lit-element';
import {
  appendItems,
  listTemplate,
  requestItemTemplate,
  requestItemBodyTemplate,
  selectedItemsValue,
  itemClickHandler,
  requestItemSelectionTemplate,
  requestItemLabelTemplate,
  requestItemActionsTemplate,
} from './internals';
import { RequestsListMixinConstructor, RequestsListMixin } from './RequestsListMixin';

declare function SavedListMixin<T extends new (...args: any[]) => {}>(base: T): T & SavedListMixinConstructor & RequestsListMixinConstructor;

export {SavedListMixinConstructor};
export {SavedListMixin};

declare interface SavedListMixinConstructor {
  new(...args: any[]): SavedListMixin;
}

declare interface SavedListMixin extends RequestsListMixin {
  requests: ARCSavedRequest[];

  connectedCallback(): void;

  /**
   * Appends a list of requests to the history list.
   */
  [appendItems](requests: ARCSavedRequest[]): Promise<void>;

  /**
   * @returns Template for the list items.
   */
  [listTemplate](): TemplateResult|string;

  /**
   * @param request The request to render
   * @param index Index of the history group
   * @returns Template for a single request object
   */
  [requestItemTemplate](request: ARCSavedRequest, index: number): TemplateResult;

  /**
   * @param {ARCSavedRequest} request The request to render
   * @returns {TemplateResult} Template for a request's content
   */
  [requestItemBodyTemplate](request: ARCSavedRequest): TemplateResult;
}