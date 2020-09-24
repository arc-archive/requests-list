/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import { fixture, assert, html, nextFrame } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import '@advanced-rest-client/arc-models/project-model.js';
import '@advanced-rest-client/arc-models/request-model.js';
import sinon from 'sinon';
import '../saved-panel.js'
import { internals } from '../index.js';

/** @typedef {import('../').SavedPanelElement} SavedPanelElement */
/** @typedef {import('@advanced-rest-client/arc-models').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */

describe('RequestsListMixin (saved)', () => {
  const generator = new DataGenerator();

  /**
   * @returns {Promise<SavedPanelElement>}
   */
  async function noAutoFixture() {
    const el = await fixture(html`
    <div>
      <project-model></project-model>
      <request-model></request-model>
      <saved-panel noAuto></saved-panel>
    </div>
    `);
    return /** @type SavedPanelElement */ el.querySelector('saved-panel');
  }

  function projectDb() {
    return new PouchDB('legacy-projects');
  }

  describe('[projectChangeHandler]()', () => {
    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
      element.project = generator.createProjectObject();
      element.type = 'project';
    });

    it('updates the project', () => {
      const item = { ...element.project };
      item.name = 'other-name';
      ArcModelEvents.Project.State.update(document.body, {
        id: item._id,
        rev: item._rev,
        item,
      });
      assert.equal(element.project.name, 'other-name');
    });

    it('calls [updateProjectOrder]() with an argument', () => {
      const item = { ...element.project };
      item.name = 'other-name';
      const spy = sinon.spy(element, internals.updateProjectOrder);
      ArcModelEvents.Project.State.update(document.body, {
        id: item._id,
        rev: item._rev,
        item,
      });
      assert.deepEqual(spy.args[0][0], item);
    });

    it('ignores event when type is not project', () => {
      const item = { ...element.project };
      item.name = 'other-name';
      element.type = 'saved';
      ArcModelEvents.Project.State.update(document.body, {
        id: item._id,
        rev: item._rev,
        item,
      });
      assert.notEqual(element.project.name, 'other-name');
    });

    it('ignores event when project is not set', () => {
      const item = { ...element.project };
      item.name = 'other-name';
      element.project = undefined;
      ArcModelEvents.Project.State.update(document.body, {
        id: item._id,
        rev: item._rev,
        item,
      });
      assert.isUndefined(element.project);
    });

    it('does not set project if different id', () => {
      const item = { ...element.project };
      item._id = 'other-id';
      ArcModelEvents.Project.State.update(document.body, {
        id: item._id,
        rev: item._rev,
        item,
      });
      assert.notEqual(element.project._id, 'other-id');
    });
  });

  describe('[updateProjectOrder]()', () => {
    function setupRequests(element) {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const request = generator.generateSavedItem({});
        request.projects = [element.project._id];
        element.project.requests.push(request._id);
        requests.push(request);
      }
      element.requests = requests;
    }

    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
      element.project = generator.createProjectObject();
      element.type = 'project';
      element.project.requests = [];
      setupRequests(element);
    });

    it('Ignores call when no requests', () => {
      element.requests = undefined;
      const result = element[internals.updateProjectOrder](element.project);
      assert.isFalse(result);
    });

    it('Ignores call when no requests on project', () => {
      element.project.requests = undefined;
      const result = element[internals.updateProjectOrder](element.project);
      assert.isFalse(result);
    });

    it('Ignores call when requests lists are different size', () => {
      element.project.requests.splice(0, 1);
      const result = element[internals.updateProjectOrder](element.project);
      assert.isFalse(result);
    });

    it('Ignores call when request cannot be find', () => {
      element.project.requests[0] = 'test-id';
      const result = element[internals.updateProjectOrder](element.project);
      assert.isFalse(result);
    });

    it('Ignores call when request are equal', () => {
      const result = element[internals.updateProjectOrder](element.project);
      assert.isFalse(result);
    });

    it('Updates list position', () => {
      const removed = element.project.requests.splice(0, 1);
      element.project.requests.splice(2, 0, removed[0]);
      const result = element[internals.updateProjectOrder](element.project);
      assert.isTrue(result);
    });
  });

  describe('[persistRequestsOrder]()', () => {
    let project;
    let requests;
    before(async () => {
      const result = await generator.insertSavedRequestData({
        forceProject: true,
        projectsSize: 1,
        requestsSize: 3
      });
      requests = result.requests;
      [project] = result.projects;
    });
    
    after(async () => {
      await generator.destroySavedRequestData();
    });
    
    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
      element.project = project;
      element.requests = requests;
      await nextFrame();
    });

    it('does not persist if order is the same', async () => {
      await element[internals.persistRequestsOrder]();
      // change makes a copy of the object
      assert.isTrue(element.project === project);
    });

    it('throws an error when no project', async () => {
      element.project = undefined;
      let thrown = false;
      try {
        await element[internals.persistRequestsOrder]();
      } catch (_) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('persists the order', async () => {
      const items = element.requests;
      const item = items.splice(0, 1);
      items.push(item[0]);
      const newOrder = items.map((i) => i._id);
      await element[internals.persistRequestsOrder]();
      const db = projectDb();
      const dbProject = await db.get(project._id);
      assert.deepEqual(dbProject.requests, newOrder);
    });
  });

  describe('readProjectRequests()', () => {
    let project;
    let requests;
    before(async () => {
      const result = await generator.insertSavedRequestData({
        forceProject: true,
        projectsSize: 1,
        requestsSize: 3
      });
      requests = result.requests;
      [project] = result.projects;
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });


    it('reads project data when project is not set', async () => {
      const result = await element[internals.readProjectRequests](project._id);
      assert.deepEqual(result, requests);
      assert.deepEqual(element.project, project);
    });

    it('reads project data when project is set', async () => {
      element.project = project;
      const result = await element[internals.readProjectRequests](project._id);
      assert.deepEqual(result, requests);
    });
  });

  describe('[requestChangedHandler]()', () => {
    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      const data = /** @type ARCSavedRequest[] */ (generator.generateHistoryRequestsData({
        requestsSize: 2
      }));
      element = await noAutoFixture();
      element.requests = data;
      await nextFrame();
    });

    it('removes a request from the list', () => {
      const [item] = element.requests;
      ArcModelEvents.Request.State.delete(document.body, 'saved', item._id, 'test');
      const hasRequest = element.requests.some((i) => i._id === item._id);
      assert.isFalse(hasRequest);
      assert.lengthOf(element.requests, 1);
    });

    it('ignores unknown request', () => {
      ArcModelEvents.Request.State.delete(document.body, 'saved', 'test', 'test');
      assert.lengthOf(element.requests, 2);
    });

    it('ignores when no requests', () => {
      element.requests = undefined;
      ArcModelEvents.Request.State.delete(document.body, 'saved', 'test', 'test');
    });
  });

  describe('[projectRequestChanged]()', () => {
    let element = /** @type SavedPanelElement */(null);
    const projectId = 'test-project';
    beforeEach(async () => {
      element = await noAutoFixture();
      element.type = 'project';
      element.projectId = projectId;
      const requests = generator.generateRequests({
        requestsSize: 10
      });
      requests.forEach((item) => { item.projects = [projectId]; });
      element.requests = requests;
    });

    function genProjectItem() {
      const item = generator.generateSavedItem();
      // @ts-ignore
      item._rev = 'test';
      item.projects = [projectId];
      return /** @type ARCSavedRequest */ (item);
    }

    it('does nothing when no project id', () => {
      element.projectId = undefined;
      const item = genProjectItem();
      element[internals.projectRequestChanged](item);
      assert.lengthOf(element.requests, 10);
    });

    it('creates requests array', () => {
      element.requests = undefined;
      const item = genProjectItem();
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.lengthOf(element.requests, 1);
    });

    it('ignores item if not related to the project and no requests', () => {
      element.requests = undefined;
      const item = genProjectItem();
      item.projects = ['other'];
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.deepEqual(element.requests, []);
    });

    it('adds new item to requests array', () => {
      const item = genProjectItem();
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.lengthOf(element.requests, 11);
    });

    it('adds new item to requests array at position', () => {
      const item = genProjectItem();
      const project = generator.createProjectObject();
      project._id = projectId;
      project.requests = element.requests.map((item) => item._id);
      project.requests.splice(1, 0, item._id);
      element.project = project;
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.lengthOf(element.requests, 11);
      assert.deepEqual(element.requests[1], item);
    });

    it('updates existing item', () => {
      const item = { ...element.requests[2] };
      item.name = 'test-name';
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.lengthOf(element.requests, 10);
      assert.equal(element.requests[2].name, 'test-name');
    });

    it('removes item when no longer related to project', () => {
      const item = { ...element.requests[2] };
      item.projects = undefined;
      // @ts-ignore
      item.legacyProject = undefined;
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.lengthOf(element.requests, 9);
    });

    it('ignores item not related to the project', () => {
      const item = genProjectItem();
      item.projects = ['non-existing-id'];
      ArcModelEvents.Request.State.update(document.body, 'saved', {
        id: item._id,
        rev: item._rev,
        item
      });
      assert.lengthOf(element.requests, 10);
    });
  });

  describe('[requestChangedHandler]()', () => {
    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
      element.requests = generator.generateRequests({
        requestsSize: 10
      });
    });

    it('calls [requestChanged]()', async () => {
      const spy = sinon.spy(element, internals.requestChanged);
      const [item] = element.requests;
      item._rev = 'test-rev';
      ArcModelEvents.Request.State.update(document.body, 'history', {
        id: item._id,
        rev: item._rev,
        item
      });
      await nextFrame();
      assert.isTrue(spy.called);
    });

    it('calls [projectRequestChanged]() for project type', async () => {
      element.type = 'project';
      const spy = sinon.spy(element, internals.projectRequestChanged);
      const [item] = element.requests;
      item._rev = 'test-rev';
      ArcModelEvents.Request.State.update(document.body, 'history', {
        id: item._id,
        rev: item._rev,
        item
      });
      await nextFrame();
      assert.isTrue(spy.called);
    });
  });

  describe('[requestChanged]()', () => {
    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
      element.requests = generator.generateRequests({
        requestsSize: 10
      });
    });

    it('adds new request to empty list', () => {
      element.requests = undefined;
      const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      element[internals.requestChanged](item);
      assert.lengthOf(element.requests, 1);
    });

    it('adds new request existing list', () => {
      const item = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      element[internals.requestChanged](item);
      assert.lengthOf(element.requests, 11);
    });

    it('updates the request', () => {
      const item = { ...element.requests[0] };
      item.name = 'test';
      element[internals.requestChanged](item);
      assert.lengthOf(element.requests, 10);
      assert.equal(element.requests[0].name, 'test');
    });
  });

  describe('[readType]()', () => {
    let element = /** @type SavedPanelElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('returns history for history', () => {
      element.type = 'history';
      const result = element[internals.readType]();
      assert.equal(result, 'history');
    });

    it('returns saved for saved', () => {
      element.type = 'saved';
      const result = element[internals.readType]();
      assert.equal(result, 'saved');
    });

    it('returns saved for project', () => {
      element.type = 'project';
      const result = element[internals.readType]();
      assert.equal(result, 'saved');
    });
  });
});