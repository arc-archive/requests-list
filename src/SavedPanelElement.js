import { SavedListMixin } from './SavedListMixin.js';
import { RequestsPanelElement } from './RequestsPanelElement.js';
// import {
//   toggleSelectAllValue,
//   selectedItemsValue,
//   notifySelection,
// } from './internals.js';

export class SavedPanelElement extends SavedListMixin(RequestsPanelElement) {
}