import { ARCHistoryRequest } from '@advanced-rest-client/arc-models';

export declare interface HistoryDayItem {
  /**
   * The midnight timestamp for the day
   */
  midnight: number;
  /**
   * A label to render in the group
   */
  label: string;
}

export declare interface HistoryListItem {
  /**
   * The history item
   */
  item: ARCHistoryRequest;
  /**
   * History's ISO time value.
   */
  isoTime: string;
}

export declare interface HistoryGroup {
  /**
   * Group's day definition
   */
  day: HistoryDayItem;
  /**
   * Requests in the group
   */
  requests: HistoryListItem[];
  /**
   * Whether a group is collapsed or opened.
   */
  opened: boolean;
}