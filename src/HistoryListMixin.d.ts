import { TemplateResult } from 'lit-element';
import {
  ARCHistoryRequest,
} from '@advanced-rest-client/arc-models';
import {
  appendItems,
  createHistoryGroup,
  createGroupHeaderLabel,
  createGroupDay,
  createGroupListItem,
  findGroupInsertPosition,
  findHistoryInsertPosition,
  requestChanged,
  historyGroupHeaderTemplate,
} from './internals';
import { HistoryGroup } from './types';
import { RequestsListMixinConstructor, RequestsListMixin } from './RequestsListMixin';

declare function HistoryListMixin<T extends new (...args: any[]) => {}>(base: T): T & HistoryListMixinConstructor & RequestsListMixinConstructor;

export {HistoryListMixinConstructor};
export {HistoryListMixin};

declare interface HistoryListMixinConstructor {
  new(...args: any[]): HistoryListMixin;
}

declare interface HistoryListMixin extends RequestsListMixin {
  requests: HistoryGroup[];

  connectedCallback(): void;

  /**
   * Appends a list of requests to the history list.
   */
  [appendItems](requests: ARCHistoryRequest[]): Promise<void>;

  /**
   * Finds a place in the items array where to put a group giving it's timestamp.
   * @param midnight The midnight timestamp of a group
   * @returns The index at which to put the group in the requests array.
   */
  [findGroupInsertPosition](midnight: number): number;

  /**
   * Finds a place in the requests list where to put a history item.
   * 
   * @param requests The list of requests
   * @param request The request to be inserted into the array.
   * @returns The index at which to put the group in the requests array.
   */
  [findHistoryInsertPosition](requests: HistoryListItem[], request: ARCHistoryRequest): number;

  /**
   * Creates a group of history items.
   */
  [createHistoryGroup](request: ARCHistoryRequest): HistoryGroup;

  /**
   * Creates a day definition for a history group.
   */
  [createGroupDay](request: ARCHistoryRequest): HistoryDayItem;

  /**
   * Creates a list item definition
   */
  [createGroupListItem](request: ARCHistoryRequest): HistoryListItem;

  /**
   * Computes a label to be put for a history group item.
   */
  [createGroupHeaderLabel](request: ARCHistoryRequest): string;

  /**
   * Handles request model change when the type is history.
   * This assumes that this mixin is used with the combination with the `RequestsListMixin`.
   * If not then register an event listener for the request change handler.
   * 
   * @param request Changed request object.
   */
  [requestChanged](request: ARCHistoryRequest): void;

  /**
   * @param group A group to render
   * @returns Template for the history group item.
   */
  [historyGroupHeaderTemplate](group: HistoryGroup): TemplateResult;
}