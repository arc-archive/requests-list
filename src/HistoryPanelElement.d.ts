import { HistoryListMixin } from './HistoryListMixin';
import { RequestsPanelElement } from './RequestsPanelElement';
import { requestChanged } from './internals';
import { ArcRequest } from '@advanced-rest-client/arc-types';
import { HistoryGroup } from './types';

export declare class HistoryPanelElement {
  /**
   * Toggles selection of all items on the list.
   */
  toggleSelection(): void;
}

export declare interface HistoryPanelElement extends HistoryListMixin, RequestsPanelElement {
  requests: HistoryGroup[];
  /**
   * Handles request model change when the type is history.
   * This assumes that this mixin is used with the combination with the `RequestsListMixin`.
   * If not then register an event listener for the request change handler.
   * 
   * @param request Changed request object.
   */
  [requestChanged](request: ArcRequest.ARCHistoryRequest): void;
}