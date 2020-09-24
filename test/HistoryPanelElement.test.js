import { fixture, assert, html } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '../history-panel.js'
import { internals } from '../index.js';

/** @typedef {import('../').HistoryPanelElement} HistoryPanelElement */
/** @typedef {import('@advanced-rest-client/arc-models').ARCHistoryRequest} ARCHistoryRequest */

describe('HistoryPanelElement', () => {
  const generator = new DataGenerator();

  /**
   * @returns {Promise<HistoryPanelElement>}
   */
  async function noAutoFixture() {
    return fixture(html`<history-panel noAuto></history-panel>`);
  }

  describe('toggleSelection()', () => {
    let element = /** @type HistoryPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('does nothing when no requests', () => {
      element.toggleSelection();
      assert.deepEqual(element.selectedItems, []);
    });

    it('sets [toggleSelectAllValue] value', () => {
      element.toggleSelection();
      assert.isTrue(element[internals.toggleSelectAllValue]);
    });

    it('sets selects all items', () => {
      const items = /** @type ARCHistoryRequest[] */ (generator.generateHistoryRequestsData());
      element[internals.appendItems](items);
      element.toggleSelection();
      assert.lengthOf(element.selectedItems, items.length);
    });

    it('overrides previous selection', () => {
      const items = /** @type ARCHistoryRequest[] */ (generator.generateHistoryRequestsData());
      element[internals.appendItems](items);
      element.selectedItems = [items[0]._id];
      element.toggleSelection();
      assert.lengthOf(element.selectedItems, items.length);
    });

    it('clears the selection', () => {
      const items = /** @type ARCHistoryRequest[] */ (generator.generateHistoryRequestsData());
      element[internals.appendItems](items);
      element[internals.toggleSelectAllValue] = true;
      element.toggleSelection();
      assert.lengthOf(element.selectedItems, 0);
    });
  });
});