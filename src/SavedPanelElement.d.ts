/* eslint-disable no-param-reassign */
import { TemplateResult } from 'lit-element';
import { SavedListMixin } from './SavedListMixin.js';
import { RequestsPanelElement } from './RequestsPanelElement.js';
import {  customActionsTemplate,  contentActionHandler, projectSelectorTemplate, notifyProject, projectChangeHandler } from './internals.js';
import { ProjectsListConsumerMixin } from './ProjectsListConsumerMixin.js';
import { ARCProjectUpdatedEvent } from '@advanced-rest-client/arc-models';
import { ArcRequest } from '@advanced-rest-client/arc-types';

export const projectsSuggestionsValue: unique symbol;
export const projectAddKeydown: unique symbol;
export const addSelectedProject: unique symbol;
export const cancelAddProject: unique symbol;
export const projectSelectorOpenedValue: unique symbol;
export const projectOverlayClosed: unique symbol;


export declare interface SavedPanelElement extends ProjectsListConsumerMixin, SavedListMixin, RequestsPanelElement {
  requests: ArcRequest.ARCSavedRequest[];
  [projectChangeHandler](e: ARCProjectUpdatedEvent): Promise<void>;
}

export declare class SavedPanelElement {
  [notifyProject](): Promise<void>;

  [contentActionHandler](e: PointerEvent): void;

  /**
   * Listens for Enter + cmd/ctrl button to accept project selection.
   */
  [projectAddKeydown](e: KeyboardEvent): void;

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