import {
  appendItems,
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
}