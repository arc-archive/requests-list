import { 
  ARCSavedRequest, 
  ARCHistoryRequest, 
  ARCProject, 
  ARCRequestDeletedEvent,
  ARCRequestUpdatedEvent,
  ARCEntityChangeRecord,
  ARCProjectUpdatedEvent,
  ARCModelStateDeleteEvent,
} from '@advanced-rest-client/arc-models';
import {
  DataExport
} from '@advanced-rest-client/arc-types';
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
} from './internals.js';

declare function RequestsListMixin<T extends new (...args: any[]) => {}>(base: T): T & RequestsListMixinConstructor;

export {RequestsListMixinConstructor};
export {RequestsListMixin};

declare interface RequestsListMixinConstructor {
  new(...args: any[]): RequestsListMixin;
}

declare interface RequestsListMixin {
  /**
   * The list of request to render.
   * It can be either saved, history or project items.
   */
  requests: any[];
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
  type: 'saved'|'history'|'project';

  /**
   * Project datastore ID to display.
   * This should be set only when type is `project`
   */
  projectId?: string;
  /**
   * Changes information density of list items.
   * By default it uses material's list item with two lines (72px height)
   * Possible values are:
   *
   * - `default` or empty - regular list view
   * - `comfortable` - enables MD single line list item vie (52px height)
   * - `compact` - enables list that has 40px height (touch recommended)
   */
  listType: string;
  /**
   * A project object associated with requests.
   * This is only valid when `type` is set to `project`. It is set automatically
   * when `readProjectRequests()` is called.
   */
  project?: ARCProject;

  /**
   * Computed value, true when the project has requests.
   */
  readonly hasRequests: boolean;
  /**
   * True if the list item should be consisted of two lines of description.
   */
  readonly hasTwoLines: boolean;
  [listTypeValue]: string;
  [hasTwoLinesValue]: boolean;
  /**
   * Single page query limit.
   */
  pageLimit: number;
  /**
   * When set the datastore query is performed with `detailed` option
   */
  detailedSearch: number;
  /**
   * When set it won't query for data automatically when attached to the DOM.
   */
  noAuto: boolean;
  /**
   * When set this component is in search mode.
   * This means that the list won't be loaded automatically and
   * some operations not related to search are disabled.
   */
  isSearch: boolean;

  /**
   * True when the element is querying the database for the data.
   */
  readonly querying: boolean;
  [queryingValue]: boolean;
  [queryingProperty]: boolean;
  [pageTokenValue]: string;
  [makingQueryValue]: boolean;

  /**
   * Adds draggable property to the request list item element.
   * The `dataTransfer` object has `arc/request-object` mime type with
   * serialized JSON with request model.
   */
  draggableEnabled: boolean;
  /**
   * Enables compatibility with Anypoint platform
   */
  compatibility: boolean;

  connectedCallback(): void;
  disconnectedCallback(): void;
  /**
   * Refreshes the data from the datastore.
   * It resets the query options, clears requests and makes a query to the datastore.
   */
  refresh(): void;

  /**
   * Resets the state of the variables.
   */
  reset(): void;

  /**
   * Loads next page of results. It runs the task in a debouncer set to
   * next render frame so it's safe to call it more than once at the time.
   */
  loadNext(): void;

  /**
   * Queries for the request data,
   *
   * @param query The query term
   * @returns Resolved promise when the query ends.
   */
  query(query: string): Promise<void>;

  /**
   * Handler for `request-object-deleted` event. Removes request from the list
   * if it existed.
   * @param {} e
   */
  [requestDeletedHandler](e: ARCRequestDeletedEvent): void;

  /**
   * Handler for the request update event.
   * 
   * Depending on the `type` property it updates / adds / removes item from the requests list.
   */
  [requestChangedHandler](e: ARCRequestUpdatedEvent): Promise<void>;

  /**
   * Handler for `data-imported` custom event.
   * Refreshes data state.
   */
  [dataImportHandler](): void;

  /**
   * Handler for the `datastore-destroyed` custom event.
   * If one of destroyed databases is history store then it refreshes the sate.
   */
  [dataDestroyHandler](e: ARCModelStateDeleteEvent): void;

  /**
   * Handles request change when type is project.
   * @param request Changed request object.
   */
  [projectRequestChanged](request: ARCSavedRequest): void;

  /**
   * Handles request change when type is project.
   * @param request Changed request object.
   */
  [requestChanged](request: ARCSavedRequest|ARCHistoryRequest): void;

  /**
   * A function to read request data for a project.
   * 
   * @param id Project ID
   * @returns Promise resolved to the list of project requests.
   */
  [readProjectRequests](id: string): Promise<ARCSavedRequest[]>;

  /**
   * @returns The type used in the ARC request model.
   */
  [readType](): string;
  
  /**
   * Updates requests in a bulk operation.
   * 
   * @param items Request items to save
   */
  [updateBulk](items: (ARCSavedRequest|ARCHistoryRequest)[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

  /**
   * Dispatches request update event.
   * 
   * @param {} request The request to update.
   * @return {} Promise resolved when the request object is updated.
   */
  [updateRequest](request: ARCSavedRequest|ARCHistoryRequest): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

  /**
   * Updates icon size CSS variable and notifies resize on the list when
   * list type changes.
   */
  [updateListStyles](type: string): void;
  
  /**
   * Applies `--anypoint-item-icon-width` CSS variable.
   * 
   * @param size Icon width in pixels.
   * @param target The target to apply styling. Default to this.
   */
  [applyListStyles](size: number, target?: HTMLElement): void;
  
  /**
   * Stores current order of requests in the project.
   * 
   * @return Change record or undefined when it has the same order
   */
  [persistRequestsOrder](): Promise<ARCEntityChangeRecord<ARCProject>|undefined>;

  /**
   * Handler for the project change event.
   * 
   * @param {ARCProjectUpdatedEvent} e
   */
  [projectChangeHandler](e: ARCProjectUpdatedEvent): void;

  /**
   * Updates requests order when project changed.
   * It reorder requests array for changed project order. It won't change
   * requests array when order is the same. It also won't change order when
   * request list is different that project's requests list.
   * @param {ARCProject} project Changed project
   * @return {Boolean} True when order has changed
   */
  [updateProjectOrder](project: ARCProject): boolean;

  /**
   * Dispatches export event
   * 
   * @param requests List of request to export.
   * @param exportOptions Export configuration options
   * @param providerOptions Provider configuration options.
   * @returns A promise resolved to the provider's return value.
   */
  [dispatchExportData](requests: (ARCSavedRequest|ARCHistoryRequest)[], exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;

  /**
   * Dispatches navigate event to open a request
   * @param id The id of the request to open.
   */
  [openRequest](id: string): void;

  /**
   * Loads next page of results from the datastore.
   * Pagination used here has been described in PouchDB pagination strategies
   * document.
   */
  [loadPage](): Promise<void>;

  /**
   * Handles any error.
   */
  [handleError](cause: Error): void;

  /**
   * Appends a list of requests to the history list.
   */
  [appendItems](requests: any[]): Promise<void>;
}