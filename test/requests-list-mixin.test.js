import { fixture, assert, aTimeout, nextFrame } from '@open-wc/testing';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import './test-element-history.js';
import './test-element-saved.js';

describe('RequestsListMixin', function() {
  async function basicFixture() {
    return await fixture(`<test-element-history></test-element-history>`);
  }

  async function basicSavedFixture() {
    return await fixture(`<test-element-saved></test-element-saved>`);
  }

  async function defaultListFixture() {
    return await fixture(`<test-element-history listtype="default"></test-element-history>`);
  }

  async function compactListFixture() {
    return await fixture(`<test-element-history listtype="compact"></test-element-history>`);
  }

  async function comfortableListFixture() {
    return await fixture(`<test-element-history listtype="comfortable"></test-element-history>`);
  }

  function savedDb() {
    /* global PouchDB */
    return new PouchDB('saved-requests');
  }

  function historyDb() {
    return new PouchDB('history-requests');
  }

  function projectDb() {
    return new PouchDB('legacy-projects');
  }

  describe('hasRequests property', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Has default value', () => {
      assert.isFalse(element.hasRequests);
    });

    it('Is true when has requests', () => {
      element.requests = [{
        _id: 'test'
      }];
      assert.isTrue(element.hasRequests);
    });

    it('Is false when requests are cleared', async () => {
      element.requests = [{
        _id: 'test'
      }];
      await nextFrame();
      element.requests = undefined;
      assert.isFalse(element.hasRequests);
    });
  });

  describe('_dispatch()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    const eName = 'test-event';
    const eDetail = 'test-detail';
    it('Dispatches an event', () => {
      const spy = sinon.spy();
      element.addEventListener(eName, spy);
      element._dispatch(eName);
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const e = element._dispatch(eName);
      assert.typeOf(e, 'customevent');
    });

    it('Event is cancelable', () => {
      const e = element._dispatch(eName);
      assert.isTrue(e.cancelable);
    });

    it('Event is composed', () => {
      const e = element._dispatch(eName);
      if (typeof e.composed !== 'undefined') {
        assert.isTrue(e.composed);
      }
    });

    it('Event bubbles', () => {
      const e = element._dispatch(eName);
      assert.isTrue(e.bubbles);
    });

    it('Event has detail', () => {
      const e = element._dispatch(eName, eDetail);
      assert.equal(e.detail, eDetail);
    });
  });

  describe('_requestDeletedHandler()', () => {
    let element;
    it('Ignores cancelable events', async () => {
      element = await basicFixture();
      element.requests = DataGenerator.generateHistoryRequestsData({
        requestsSize: 10
      });
      element._requestDeletedHandler({
        cancelable: true,
        detail: {
          id: element.requests[0]._id
        }
      });
      assert.lengthOf(element.requests, 10);
    });

    it('Ignores the event when no requests', async () => {
      element = await basicFixture();
      element.requests = [];
      element._requestDeletedHandler({
        cancelable: true,
        detail: {
          id: 'test'
        }
      });
      assert.lengthOf(element.requests, 0);
    });

    it('Ignores the event when requests are undefined', async () => {
      element = await basicFixture();
      element._requestDeletedHandler({
        cancelable: true,
        detail: {
          id: 'test'
        }
      });
      assert.isUndefined(element.requests);
    });

    it('Calls _historyItemDeleted() when element type is "history"', async () => {
      element = await basicFixture();
      element.requests = DataGenerator.generateHistoryRequestsData({
        requestsSize: 10
      });
      const spy = sinon.spy(element, '_historyItemDeleted');
      const id = element.requests[4]._id;
      element._requestDeletedHandler({
        cancelable: false,
        detail: {
          id
        }
      });
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], id);
    });

    it('Calls _itemDeleted() when element\'s type is "saved"', async () => {
      element = await basicSavedFixture();
      element.requests = DataGenerator.generateRequests({
        requestsSize: 10
      });
      const spy = sinon.spy(element, '_itemDeleted');
      const id = element.requests[4]._id;
      element._requestDeletedHandler({
        cancelable: false,
        detail: {
          id
        }
      });
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], id);
    });
  });

  describe('_itemDeleted()', () => {
    let element;
    beforeEach(async () => {
      element = await basicSavedFixture();
      element.requests = DataGenerator.generateRequests({
        requestsSize: 10
      });
    });

    it('Removes existing item', () => {
      element._itemDeleted(element.requests[4]._id);
      assert.lengthOf(element.requests, 9);
    });

    it('Ignores item if not found', () => {
      element._itemDeleted('non-existing');
      assert.lengthOf(element.requests, 10);
    });
  });

  describe('_historyItemDeleted()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.requests = DataGenerator.generateHistoryRequestsData({
        requestsSize: 10
      });
    });

    it('Removes existing item', () => {
      element._historyItemDeleted(element.requests[4]._id);
      assert.lengthOf(element.requests, 9);
    });

    it('Ignores item if not found', () => {
      element._historyItemDeleted('non-existing');
      assert.lengthOf(element.requests, 10);
    });

    it('Adds header to next item', () => {
      const id = element.requests[4]._id;
      element.requests[4].hasHeader = true;
      element.requests[4].header = 'test-header';
      element.requests[5].hasHeader = false;
      element._historyItemDeleted(id);
      assert.lengthOf(element.requests, 9);
      const item = element.requests[4];
      assert.isTrue(item.hasHeader, 'hasHeader is set');
      assert.equal(item.header, 'test-header', 'header is set');
    });

    it('Will not update header when next item has own header', () => {
      const id = element.requests[4]._id;
      element.requests[4].hasHeader = true;
      element.requests[4].header = 'test-header';
      element.requests[5].hasHeader = true;
      element.requests[5].header = 'other-header';
      element._historyItemDeleted(id);
      assert.lengthOf(element.requests, 9);
      const item = element.requests[4];
      assert.equal(item.header, 'other-header', 'header is mot updated');
    });
  });

  describe('_requestChangedHandler()', () => {
    it('Do nothing when event is cancelable', async () => {
      const element = await basicFixture();
      element._requestChangedHandler({
        cancelable: true,
        detail: {
          request: { _id: 'test' }
        }
      });
      assert.isUndefined(element.requests);
    });

    it('Calls "_historyTypeChanged()" for history type - if exists', async () => {
      const element = await basicFixture();
      element._historyTypeChanged = () => {};
      const item = DataGenerator.generateHistoryObject();
      const spy = sinon.spy(element, '_historyTypeChanged');
      element._requestChangedHandler({
        detail: {
          request: item
        }
      });
      assert.isTrue(spy.called, 'Function was called');
      assert.deepEqual(spy.args[0][0], item, 'Argument is set');
    });

    it('Ignores call to "_historyTypeChanged()" if not exists', async () => {
      const element = await basicFixture();
      const item = DataGenerator.generateHistoryObject();
      element._requestChangedHandler({
        detail: {
          request: item
        }
      });
      // No error
    });

    it('Calls "_savedTypeChanged()" for saved type', async () => {
      const element = await basicSavedFixture();
      const item = DataGenerator.generateSavedItem();
      const spy = sinon.spy(element, '_savedTypeChanged');
      element._requestChangedHandler({
        detail: {
          request: item
        }
      });
      assert.isTrue(spy.called, 'Function was called');
      assert.deepEqual(spy.args[0][0], item, 'Argument is set');
    });

    it('Calls "_projectTypeChanged()" for saved type', async () => {
      const element = await basicSavedFixture();
      element.type = 'project';
      const item = DataGenerator.generateSavedItem();
      const spy = sinon.spy(element, '_projectTypeChanged');
      element._requestChangedHandler({
        detail: {
          request: item
        }
      });
      assert.isTrue(spy.called, 'Function was called');
      assert.deepEqual(spy.args[0][0], item, 'Argument is set');
    });
  });

  describe('_projectTypeChanged()', () => {
    let element;
    const projectId = 'test-project';
    beforeEach(async () => {
      element = await basicFixture();
      element.type = 'project';
      element.projectId = projectId;
      const requests = DataGenerator.generateRequests({
        requestsSize: 10
      });
      requests.forEach((item) => item.projects = [projectId]);
      element.requests = requests;
    });

    function genProjectItem() {
      const item = DataGenerator.generateSavedItem();
      item.projects = [projectId];
      return item;
    }

    it('Does nothing when no project id', () => {
      element.projectId = undefined;
      const item = genProjectItem();
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 10);
    });

    it('Creates requests array', () => {
      element.requests = undefined;
      const item = genProjectItem();
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 1);
    });

    it('Ignores item if not related to the project and no requests', () => {
      element.requests = undefined;
      const item = genProjectItem();
      item.projects = ['other'];
      element._projectTypeChanged(item);
      assert.isUndefined(element.requests);
    });

    it('Adds new item to requests array', () => {
      const item = genProjectItem();
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 11);
    });

    it('Adds new item to requests array at position', () => {
      const item = genProjectItem();
      const project = DataGenerator.createProjectObject();
      project._id = projectId;
      project.requests = element.requests.map((item) => item._id);
      project.requests.splice(1, 0, item._id);
      element.project = project;
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 11);
      assert.deepEqual(element.requests[1], item);
    });

    it('Updates existing item', () => {
      const item = Object.assign({}, element.requests[2]);
      item.name = 'test-name';
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 10);
      assert.equal(element.requests[2].name, 'test-name');
    });

    it('Removes item is no longer related to project', () => {
      const item = Object.assign({}, element.requests[2]);
      item.projects = undefined;
      item.legacyProject = undefined;
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 9);
    });

    it('Ignores item not related to the project', () => {
      const item = genProjectItem();
      item.projects = ['non-existing-id'];
      element._projectTypeChanged(item);
      assert.lengthOf(element.requests, 10);
    });
  });

  describe('_isProjectRequest()', () => {
    let element;
    const projectId = 'test-project';
    beforeEach(async () => {
      element = await basicFixture();
      element.type = 'project';
      element.projectId = projectId;
    });

    it('Returns false when no project id', () => {
      element.projectId = undefined;
      const item = DataGenerator.generateSavedItem();
      const result = element._isProjectRequest(item);
      assert.isFalse(result);
    });

    it('Returns false when item is not related to current project', () => {
      const item = DataGenerator.generateSavedItem();
      const result = element._isProjectRequest(item);
      assert.isFalse(result);
    });

    it('Returns false when item has other prjects', () => {
      const item = DataGenerator.generateSavedItem();
      item.projects = ['other'];
      const result = element._isProjectRequest(item);
      assert.isFalse(result);
    });

    it('Returns true when project is on projects list', () => {
      const item = DataGenerator.generateSavedItem();
      item.projects = [projectId];
      const result = element._isProjectRequest(item);
      assert.isTrue(result);
    });

    it('Returns true when project is set on legacyProject', () => {
      const item = DataGenerator.generateSavedItem();
      item.legacyProject = projectId;
      const result = element._isProjectRequest(item);
      assert.isTrue(result);
    });
  });

  describe('_savedTypeChanged()', () => {
    let element;
    beforeEach(async () => {
      element = await basicSavedFixture();
      element.requests = DataGenerator.generateRequests({
        requestsSize: 10
      });
    });

    it('Do nothing when type is not set', () => {
      element.type = undefined;
      const item = DataGenerator.generateSavedItem();
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 10);
    });

    it('Do nothing when type is not saved', () => {
      element.type = 'history';
      const item = DataGenerator.generateSavedItem();
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 10);
    });

    it('Do nothing when request type is not saved', () => {
      const item = DataGenerator.generateHistoryObject();
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 10);
    });

    it('Creates requests array when request type is "saved"', () => {
      element.requests = undefined;
      const item = DataGenerator.generateSavedItem();
      item.type = 'saved';
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 1);
    });

    it('Creates requests array when request type is "saved-requests"', () => {
      element.requests = undefined;
      const item = DataGenerator.generateSavedItem();
      item.type = 'saved-requests';
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 1);
    });

    it('Updates existing request', () => {
      const item = Object.assign({}, element.requests[2]);
      item.name = 'test-name';
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 10);
      assert.equal(element.requests[2].name, 'test-name');
    });

    it('Adds new request to the top of the list', () => {
      const item = DataGenerator.generateSavedItem();
      element._savedTypeChanged(item);
      assert.lengthOf(element.requests, 11);
      assert.deepEqual(element.requests[0], item);
    });
  });

  describe('_legacySort()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns 1 when a projectOrder is > than b projectOrder', () => {
      const result = element._legacySort({
        projectOrder: 1
      }, {
        projectOrder: 0
      });
      assert.equal(result, 1);
    });

    it('Returns -1 when a projectOrder is < than b projectOrder', () => {
      const result = element._legacySort({
        projectOrder: 0
      }, {
        projectOrder: 1
      });
      assert.equal(result, -1);
    });

    it('Returns 1 when a name is > than b name', () => {
      const result = element._legacySort({
        projectOrder: 0,
        name: 'b'
      }, {
        projectOrder: 0,
        name: 'a'
      });
      assert.equal(result, 1);
    });

    it('Returns -1 when a name is < than b name', () => {
      const result = element._legacySort({
        projectOrder: 0,
        name: 'a'
      }, {
        projectOrder: 0,
        name: 'b'
      });
      assert.equal(result, -1);
    });

    it('Returns 0 when objects equal', () => {
      const result = element._legacySort({
        projectOrder: 0,
        name: 'a'
      }, {
        projectOrder: 0,
        name: 'a'
      });
      assert.equal(result, 0);
    });
  });

  describe('_updateRequest()', () => {
    after(async () => {
      await DataGenerator.destroyHistoryData();
      await DataGenerator.destroySavedRequestData();
    });

    it('rejects when type is not set', async () => {
      const element = await basicFixture();
      const item = DataGenerator.generateHistoryObject();
      let called = false;
      try {
        element.type = 'unknown';
        await element._updateRequest(item);
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('stores an item when history type', async () => {
      const element = await basicFixture();
      const item = DataGenerator.generateHistoryObject();
      await element._updateRequest(item);
      const db = historyDb();
      const dbItem = await db.get(item._id);
      assert.ok(dbItem);
    });

    it('stores an item when saved type', async () => {
      const element = await basicSavedFixture();
      const item = DataGenerator.generateSavedItem();
      await element._updateRequest(item);
      const db = savedDb();
      const dbItem = await db.get(item._id);
      assert.ok(dbItem);
    });

    it('stores an item when saved type in a project', async () => {
      const element = await basicSavedFixture();
      const item = DataGenerator.generateSavedItem();
      element.type = 'project';
      await element._updateRequest(item);
      const db = savedDb();
      const dbItem = await db.get(item._id);
      assert.ok(dbItem);
    });
  });

  describe('_updateBulk()', () => {
    after(async () => {
      await DataGenerator.destroyHistoryData();
      await DataGenerator.destroySavedRequestData();
    });

    it('stores items when history type', async () => {
      const element = await basicFixture();
      const items = DataGenerator.generateRequests({
        requestsSize: 3
      });
      await element._updateBulk(items);
      const db = historyDb();
      const result = await db.allDocs();
      assert.lengthOf(result.rows, 3);
    });

    it('stores items when saved type', async () => {
      const element = await basicSavedFixture();
      const items = DataGenerator.generateRequests({
        requestsSize: 3
      });
      await element._updateBulk(items);
      const db = savedDb();
      const result = await db.allDocs();
      assert.lengthOf(result.rows, 3);
    });

    it('stores items when saved type in a project', async () => {
      const element = await basicSavedFixture();
      const items = DataGenerator.generateRequests({
        requestsSize: 3
      });
      element.type = 'project';
      await element._updateBulk(items);
      const db = savedDb();
      const result = await db.allDocs();
      assert.lengthOf(result.rows, 6);
    });
  });

  describe('_projectChanged()', () => {
    let element;
    beforeEach(async () => {
      element = await basicSavedFixture();
      element.project = DataGenerator.createProjectObject();
      element.type = 'project';
    });

    function fire(project, cancelable, node) {
      if (typeof cancelable === 'undefined') {
        cancelable = false;
      }
      const e = new CustomEvent('project-object-changed', {
        bubbles: true,
        cancelable,
        detail: {
          project
        }
      });
      (node || document.body).dispatchEvent(e);
      return e;
    }

    it('Updates the project', () => {
      const item = Object.assign({}, element.project);
      item.name = 'other-name';
      fire(item);
      assert.equal(element.project.name, 'other-name');
    });

    it('Calls _updateProjectOrder() with an argument', () => {
      const item = Object.assign({}, element.project);
      item.name = 'other-name';
      const spy = sinon.spy(element, '_updateProjectOrder');
      fire(item);
      assert.deepEqual(spy.args[0][0], item);
    });

    it('Ignores event when event is cancelable', () => {
      const item = Object.assign({}, element.project);
      item.name = 'other-name';
      fire(item, true);
      assert.notEqual(element.project.name, 'other-name');
    });

    it('Ignores event when type is not project', () => {
      const item = Object.assign({}, element.project);
      item.name = 'other-name';
      element.type = 'saved';
      fire(item);
      assert.notEqual(element.project.name, 'other-name');
    });

    it('Ignores event when project is not set', () => {
      const item = Object.assign({}, element.project);
      item.name = 'other-name';
      element.project = undefined;
      fire(item);
      assert.isUndefined(element.project);
    });

    it('Ignores event when disaptches by self', () => {
      const item = Object.assign({}, element.project);
      item.name = 'other-name';
      fire(item, false, element);
      assert.notEqual(element.project.name, 'other-name');
    });

    it('Will not set project if different id', () => {
      const item = Object.assign({}, element.project);
      item._id = 'other-id';
      fire(item);
      assert.notEqual(element.project._id, 'other-id');
    });
  });

  describe('_updateProjectOrder()', () => {
    function setupRequests(element) {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const request = DataGenerator.generateSavedItem({});
        request.projects = [element.project._id];
        element.project.requests.push(request._id);
        requests.push(request);
      }
      element.requests = requests;
    }

    let element;
    beforeEach(async () => {
      element = await basicSavedFixture();
      element.project = DataGenerator.createProjectObject();
      element.type = 'project';
      element.project.requests = [];
      setupRequests(element);
    });

    it('Ignores call when no requests', () => {
      element.requests = undefined;
      const result = element._updateProjectOrder(element.project);
      assert.isFalse(result);
    });

    it('Ignores call when no requests on project', () => {
      element.project.requests = undefined;
      const result = element._updateProjectOrder(element.project);
      assert.isFalse(result);
    });

    it('Ignores call when requests lists are different size', () => {
      element.project.requests.splice(0, 1);
      const result = element._updateProjectOrder(element.project);
      assert.isFalse(result);
    });

    it('Ignores call when request cannot be find', () => {
      element.project.requests[0] = 'test-id';
      const result = element._updateProjectOrder(element.project);
      assert.isFalse(result);
    });

    it('Ignores call when request are equal', () => {
      const result = element._updateProjectOrder(element.project);
      assert.isFalse(result);
    });

    it('Updates list position', () => {
      const removed = element.project.requests.splice(0, 1);
      element.project.requests.splice(2, 0, removed[0]);
      const result = element._updateProjectOrder(element.project);
      assert.isTrue(result);
    });
  });

  describe('_idsArrayEqual()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns true when both undefined', () => {
      const result = element._idsArrayEqual();
      assert.isTrue(result);
    });

    it('Returns true when both empty', () => {
      const result = element._idsArrayEqual([], []);
      assert.isTrue(result);
    });

    it('Returns true when has the same order', () => {
      const result = element._idsArrayEqual(['a', 'b'], ['a', 'b']);
      assert.isTrue(result);
    });

    it('Returns false when not the same order', () => {
      const result = element._idsArrayEqual(['b', 'a'], ['a', 'b']);
      assert.isFalse(result);
    });

    it('Returns false when different size', () => {
      const result = element._idsArrayEqual(['a'], ['a', 'b']);
      assert.isFalse(result);
    });

    it('Returns false when A is undefined', () => {
      const result = element._idsArrayEqual(undefined, ['a', 'b']);
      assert.isFalse(result);
    });

    it('Returns false when B is undefined', () => {
      const result = element._idsArrayEqual(['a', 'b'], undefined);
      assert.isFalse(result);
    });
  });

  describe('_persistRequestsOrder()', () => {
    let project;
    let requests;
    before(async () => {
      const result = await DataGenerator.insertSavedRequestData({
        forceProject: true,
        projectsSize: 1,
        requestsSize: 3
      });
      requests = result.requests;
      project = result.projects[0];
    });

    after(async () => {
      await DataGenerator.destroySavedRequestData();
    });

    let element;
    beforeEach(async () => {
      element = await basicSavedFixture();
      element.project = project;
      element.requests = requests;
      await aTimeout();
    });

    it('does not persist if order is the same', async () => {
      await element._persistRequestsOrder();
      // change makes a copy of the object
      assert.isTrue(element.project === project);
    });

    it('persists the order', async () => {
      const requests = element.requests;
      const item = requests.splice(0, 1);
      requests.push(item[0]);
      const newOrder = requests.map((i) => i._id);
      await element._persistRequestsOrder();
      const db = projectDb();
      const dbProject = await db.get(project._id);
      assert.deepEqual(dbProject.requests, newOrder);
    });
  });

  describe('List types computations', () => {
    const iconWidthProperty = '--anypoint-item-icon-width';
    const iconWidths = ['72px', '48px', '36px'];

    describe('Default list type', () => {
      it(`Icon width is ${iconWidths[0]} for default list style`, async () => {
        const element = await defaultListFixture();
        await aTimeout();
        const style = getComputedStyle(element).getPropertyValue(iconWidthProperty);
        assert.equal(style.trim(), iconWidths[0]);
      });

      it(`Icon width is ${iconWidths[0]} for inital list style`, async () => {
        const element = await basicFixture();
        await aTimeout();
        const style = getComputedStyle(element).getPropertyValue(iconWidthProperty);
        assert.equal(style.trim(), iconWidths[0]);
      });

      it('_hasTwoLines is computed for initial list type', async () => {
        const element = await basicFixture();
        assert.isTrue(element._hasTwoLines);
      });

      it('_hasTwoLines is computed for "default" list type', async () => {
        const element = await defaultListFixture();
        assert.isTrue(element._hasTwoLines);
      });

      it('Calls notifyResize() when defined', async () => {
        let called = false;
        const element = await defaultListFixture();
        element.notifyResize = () => called = true;
        element.listType = 'comfortable';
        await nextFrame();
        assert.isTrue(called);
      });
    });

    describe('Comfortable list type', () => {
      let element;
      beforeEach(async () => {
        element = await comfortableListFixture();
      });

      it('Icon width is ' + iconWidths[1], () => {
        const style = getComputedStyle(element).getPropertyValue(iconWidthProperty);
        assert.equal(style, iconWidths[1]);
      });

      it('_hasTwoLines is computed', () => {
        assert.isFalse(element._hasTwoLines);
      });
    });

    describe('Compact list type', () => {
      let element;
      beforeEach(async () => {
        element = await compactListFixture();
      });

      it('Icon width is ' + iconWidths[2], () => {
        const style = getComputedStyle(element).getPropertyValue(iconWidthProperty);
        assert.equal(style, iconWidths[2]);
      });

      it('_hasTwoLines is computed', () => {
        assert.isFalse(element._hasTwoLines);
      });
    });
  });

  describe('_dispatchExportData()', () => {
    let element;
    let opts;
    let requests;
    beforeEach(async () => {
      element = await basicFixture();
      opts = {
        options: { options: true },
        providerOptions: { providerOptions: true }
      };
      requests = [{
        id: 'test-id'
      }];
    });

    it('Calls _dispatch()', () => {
      const spy = sinon.spy(element, '_dispatch');
      element._dispatchExportData(requests, opts);
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const e = element._dispatchExportData(requests, opts);
      assert.typeOf(e, 'customevent');
    });

    it('Event has type', () => {
      const e = element._dispatchExportData(requests, opts);
      assert.equal(e.type, 'arc-data-export');
    });

    it('Event has detail', () => {
      const e = element._dispatchExportData(requests, opts);
      assert.typeOf(e.detail, 'object');
    });

    it('Detail has options', () => {
      const e = element._dispatchExportData(requests, opts);
      assert.deepEqual(e.detail.options, opts.options);
    });

    it('Detail has providerOptions', () => {
      const e = element._dispatchExportData(requests, opts);
      assert.deepEqual(e.detail.providerOptions, opts.providerOptions);
    });

    it('Detail has history', () => {
      const e = element._dispatchExportData(requests, opts);
      assert.deepEqual(e.detail.data.history, requests);
    });

    it('Detail has saved', () => {
      element.type = 'saved';
      const e = element._dispatchExportData(requests, opts);
      assert.deepEqual(e.detail.data.saved, requests);
    });

    it('Detail has saved (project type)', () => {
      element.type = 'project';
      const e = element._dispatchExportData(requests, opts);
      assert.deepEqual(e.detail.data.saved, requests);
    });

    it('Detail has projects (project type)', () => {
      element.type = 'project';
      element.project = { testProject: true };
      const e = element._dispatchExportData(requests, opts);
      assert.deepEqual(e.detail.data.projects, [element.project]);
    });

    it('Throws when "type" is not set', () => {
      element.type = undefined;
      assert.throws(() => {
        element._dispatchExportData(requests, opts);
      }, 'The "type" property is not set.');
    });
  });

  describe('_openRequest()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls _dispatch()', () => {
      const spy = sinon.spy(element, '_dispatch');
      element._openRequest('test-id');
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const e = element._openRequest('test-id');
      assert.typeOf(e, 'customevent');
    });

    it('Event has type', () => {
      const e = element._openRequest('test-id');
      assert.equal(e.type, 'navigate');
    });

    it('Event has detail', () => {
      const e = element._openRequest('test-id');
      assert.typeOf(e.detail, 'object');
    });

    it('Detail has base', () => {
      const e = element._openRequest('test-id');
      assert.equal(e.detail.base, 'request');
    });

    it('Detail has type', () => {
      const e = element._openRequest('test-id');
      assert.equal(e.detail.type, element.type);
    });

    it('Sets type to saved when project', () => {
      element.type = 'project';
      const e = element._openRequest('test-id');
      assert.equal(e.detail.type, 'saved');
    });

    it('Detail has id', () => {
      const e = element._openRequest('test-id');
      assert.equal(e.detail.id, 'test-id');
    });

    it('Throws when "type" is not set', () => {
      element.type = undefined;
      assert.throws(() => {
        element._openRequest('test-id');
      }, 'The "type" property is not set.');
    });
  });

  describe('_validateType()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Passes validation for project type', () => {
      element._validateType('project');
    });

    it('Passes validation for saved type', () => {
      element._validateType('saved');
    });

    it('Passes validation for history type', () => {
      element._validateType('history');
    });

    it('Throws otherwise type', () => {
      assert.throws(() => {
        element._validateType('other');
      }, 'The "type" property is not set.');
    });
  });

  describe('readProjectRequests()', () => {
    let project;
    let requests;
    before(async () => {
      const result = await DataGenerator.insertSavedRequestData({
        forceProject: true,
        projectsSize: 1,
        requestsSize: 3
      });
      requests = result.requests;
      project = result.projects[0];
    });

    after(async () => {
      await DataGenerator.destroySavedRequestData();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });


    it('reads project data when project is not set', async () => {
      const result = await element.readProjectRequests(project._id);
      assert.deepEqual(result, requests);
      assert.deepEqual(element.project, project);
    });

    it('reads project data when project is set', async () => {
      element.project = project;
      const result = await element.readProjectRequests(project._id);
      assert.deepEqual(result, requests);
    });
  });
});
