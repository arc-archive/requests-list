import { ARCSavedRequest } from '@advanced-rest-client/arc-models';
import { TemplateResult } from 'lit-element';
import {
  appendItems,
  listTemplate,
  requestItemTemplate,
  requestItemBodyTemplate,
  dragStartHandler,
  draggableEnabledValue,
  draggableChanged,
  addDraggableEvents,
  removeDraggableEvents,
  dragOverHandler,
  dragLeaveHandler,
  dropHandler,
  isValidDragTarget,
  unavailableTemplate,
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
  [draggableEnabledValue]: boolean;

  connectedCallback(): void;
  disconnectedCallback(): void;

  [draggableChanged](value: boolean): void;

  [addDraggableEvents](): void;

  [removeDraggableEvents](): void;

  /**
   * Checks whether the dragged target is a valid candidate for the drop.
   * 
   * @returns True when dragged element can be dropped here.
   */
  [isValidDragTarget](e: DragEvent): boolean;

  /**
   * Handler for `dragover` event on this element. If the dragged item is compatible
   * it renders drop message.
   */
  [dragOverHandler](e: DragEvent): void;

  /**
   * Handler for `dragleave` event on this element. If the dragged item is compatible
   * it hides drop message.
   */
  [dragLeaveHandler](e: DragEvent): void;

  /**
   * Handler for `drag` event on this element. If the dragged item is compatible
   * it adds request to saved requests.
   */
  [dropHandler](e: DragEvent): Promise<void>;

  /**
   * Overrides the RequestListMixin's drag start function to add `arc/saved` property
   */
  [dragStartHandler](e: DragEvent): void;

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

  [unavailableTemplate](): string|TemplateResult;
}