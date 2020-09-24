/* eslint-disable no-param-reassign */
import { TemplateResult } from 'lit-element';
import { SavedListMixin } from './SavedListMixin.js';
import { RequestsPanelElement } from './RequestsPanelElement.js';
import {  customActionsTemplate,  contentActionHandler, projectSelectorTemplate, notifyProject, projectChangeHandler } from './internals.js';
import { ProjectsListConsumerMixin } from './ProjectsListConsumerMixin.js';
import { ARCProjectUpdatedEvent, ARCSavedRequest } from '@advanced-rest-client/arc-models';

export const projectsSuggestionsValue: unique symbol;
export const projectAddKeydown: unique symbol;
export const addSelectedProject: unique symbol;
export const cancelAddProject: unique symbol;
export const projectSelectorOpenedValue: unique symbol;
export const projectOverlayClosed: unique symbol;


export declare interface SavedPanelElement extends ProjectsListConsumerMixin, SavedListMixin, RequestsPanelElement {
  requests: ARCSavedRequest[];
  [projectChangeHandler](e: ARCProjectUpdatedEvent): Promise<void>;
}

export declare class SavedPanelElement {
  [notifyProject](): Promise<void>;

  /**
   * @param {PointerEvent} e
   */
  [contentActionHandler](e): void;

  /**
   * Listens for Enter + cmd/ctrl button to accept project selection.
   * @param {KeyboardEvent} e
   */
  [projectAddKeydown](e): void;

  /**
   * Updates projects for requests when confirming the change action.
   */
  [addSelectedProject](): Promise<void>;

  [cancelAddProject](): void;

  [projectOverlayClosed](): void;

  render(): TemplateResult;

  [customActionsTemplate](): TemplateResult;

  [projectSelectorTemplate](): TemplateResult;
}