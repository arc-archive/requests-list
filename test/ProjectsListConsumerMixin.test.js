import { fixture, assert, aTimeout, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ImportEvents } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import './projects-consumer-element.js';
import {
  projectsValue,
  computeProjectsAutocomplete,
  computeProjectSelection,
  refreshProjectsList,
  makingQueryValue,
} from '../src/internals.js';

/** @typedef {import('./projects-consumer-element').ProjectsConsumerElement} ProjectsConsumerElement */

describe('ProjectsListConsumerMixin', () => {
  const generator = new DataGenerator();

  /**
   * @returns {Promise<ProjectsConsumerElement>}
   */
  async function noAutoFixture() {
    return fixture(`<projects-consumer-element noautoprojects></projects-consumer-element>`);
  }

  /**
   * @returns {Promise<ProjectsConsumerElement>}
   */
  async function modelFixture() {
    const elm = await fixture(`
    <div>
      <request-model></request-model>
      <project-model></project-model>
      <projects-consumer-element noautoprojects></projects-consumer-element>
    </div>
    `);
    return /** @type ProjectsConsumerElement */ (elm.querySelector('projects-consumer-element'));
  }

  /**
   * @returns {Promise<ProjectsConsumerElement>}
   */
  async function projectsFixture() {
    const elm = await fixture(`
    <div>
      <request-model></request-model>
      <project-model></project-model>
      <projects-consumer-element></projects-consumer-element>
    </div>
    `);
    const returnElement = /** @type ProjectsConsumerElement */ (elm.querySelector('projects-consumer-element'));
    if (returnElement.projects) {
      return returnElement;
    }
    await oneEvent(returnElement, 'projectschange');
    return returnElement;
  }

  describe('[dataImportHandler]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('Calls refreshProjects() when import event is dispatched', async () => {
      let called = false;
      element.refreshProjects = async () => { called = true };
      ImportEvents.dataimported(document.body);
      await aTimeout(0);
      assert.isTrue(called);
    });
  });

  describe('[dataDestroyHandler]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('resets projects with "legacy-projects" datastore', () => {
      element[projectsValue] = generator.generateProjects();
      ArcModelEvents.destroyed(document.body, 'legacy-projects');
      assert.isUndefined(element[projectsValue]);
    });

    it('resets projects with "all" datastore', () => {
      element[projectsValue] = generator.generateProjects();
      ArcModelEvents.destroyed(document.body, 'all');
      assert.isUndefined(element[projectsValue]);
    });

    it('resets projects with "projects" datastore', () => {
      element[projectsValue] = generator.generateProjects();
      ArcModelEvents.destroyed(document.body, 'projects');
      assert.isUndefined(element[projectsValue]);
    });

    it('ignores other stores', () => {
      element[projectsValue] = generator.generateProjects();
      ArcModelEvents.destroyed(document.body, 'saved');
      assert.typeOf(element[projectsValue], 'array');
    });
  });

  describe('[computeProjectsAutocomplete]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('returns undefined when no argument', () => {
      const result = element[computeProjectsAutocomplete](undefined);
      assert.isUndefined(result);
    });

    it('returns undefined when passed array is empty', () => {
      const result = element[computeProjectsAutocomplete]([]);
      assert.isUndefined(result);
    });

    it('returns undefined when argument is not an array', () => {
      // @ts-ignore
      const result = element[computeProjectsAutocomplete](123);
      assert.isUndefined(result);
    });

    it('Returns list of suggestions', () => {
      const result = element[computeProjectsAutocomplete]([{
        name: 't1',
        _id: 'i1',
        order: 1
      }, {
        name: 't2',
        _id: 'i2',
        order: 2
      }]);
      assert.deepEqual(result, [{
        value: 't1',
        id: 'i1'
      }, {
        value: 't2',
        id: 'i2'
      }]);
    });  
  });

  describe('[computeProjectSelection]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('Returns object when no argument', () => {
      const result = element[computeProjectSelection](undefined);
      assert.typeOf(result, 'object');
    });

    it('Returns object when argument is empty', () => {
      const result = element[computeProjectSelection]([]);
      assert.typeOf(result, 'object');
    });

    it('Object has empty "add" list', () => {
      const result = element[computeProjectSelection]([]);
      assert.typeOf(result.add, 'array');
      assert.lengthOf(result.add, 0);
    });

    it('Object has empty "existing" list', () => {
      const result = element[computeProjectSelection]([]);
      assert.typeOf(result.existing, 'array');
      assert.lengthOf(result.existing, 0);
    });

    it('Add projects to "add" property when projects do not exist', () => {
      const result = element[computeProjectSelection](['a', 'b']);
      assert.deepEqual(result.add, ['a', 'b']);
      assert.lengthOf(result.existing, 0);
    });

    it('Skips empty names', () => {
      const result = element[computeProjectSelection](['a', '', 'b']);
      assert.deepEqual(result.add, ['a', 'b']);
      assert.lengthOf(result.existing, 0);
    });

    it('Add projects to "existing" property when projects exist', () => {
      element[projectsValue] = [{
        name: 'a',
        _id: 'aId'
      }, {
        name: 'b',
        _id: 'bId'
      }];
      const result = element[computeProjectSelection](['aId', 'bId']);
      assert.deepEqual(result.existing, ['aId', 'bId']);
      assert.lengthOf(result.add, 0);
    });
  });

  describe('refreshProjects()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await noAutoFixture();
    });

    it('eventually calls [refreshProjectsList]()', async () => {
      let called = false;
      element[refreshProjectsList] = async () => { called = true };
      element.refreshProjects();
      await aTimeout(0);
      assert.isTrue(called);
    });

    it('Sets [makingQueryValue] flag', async () => {
      element[refreshProjectsList] = async () => { };
      element.refreshProjects();
      assert.isTrue(element[makingQueryValue]);
      await aTimeout(0);
    });

    it('Clears [makingQueryValue] flag after callback', async () => {
      element[refreshProjectsList] = async () => { };
      element.refreshProjects();
      await aTimeout(0);
      assert.isFalse(element[makingQueryValue]);
    });

    it('does nothing when [makingQueryValue] flag is set', async () => {
      let called = false;
      element[refreshProjectsList] = async () => { called = true };
      element[makingQueryValue] = true;
      element.refreshProjects();
      await aTimeout(0);
      assert.isFalse(called);
    });
  });

  describe('[refreshProjectsList]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await modelFixture();
    });

    before(async () => {
      await generator.insertProjectsData({
        projectsSize: 20,
        autoRequestId: true
      });
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('updates projects list', async () => {
      element[refreshProjectsList]();
      await oneEvent(element, 'projectschange');
      assert.typeOf(element.projects, 'array');
      assert.lengthOf(element.projects, 20);
    });

    it('calls notifyResize()', async () => {
      // @ts-ignore
      element.notifyResize = () => {};
      // @ts-ignore
      const spy = sinon.spy(element, 'notifyResize');
      element[refreshProjectsList]();
      await oneEvent(element, 'projectschange');
      await aTimeout(0);
      assert.isTrue(spy.called);
    });

    it('sets hasProjects property', async () => {
      element[refreshProjectsList]();
      await oneEvent(element, 'projectschange');
      assert.isTrue(element.hasProjects);
    });
  });

  describe('[projectChangeHandler]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await projectsFixture();
    });

    before(async () => {
      await generator.insertProjectsData({
        projectsSize: 20,
        autoRequestId: true
      });
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('updates project on the list of projects', async () => {
      const project = { ...element.projects[0] };
      project.name = 'test-name';
      const record = {
        id: project._id,
        rev: project._rev,
        item: project,
      };
      ArcModelEvents.Project.State.update(document.body, record);
      assert.equal(element.projects[0].name, 'test-name');
    });

    it('adds new project to the list', async () => {
      const project = generator.generateProjects({ projectsSize: 1 })[0];
      const record = {
        id: project._id,
        rev: 'test-rev',
        item: project,
      };
      ArcModelEvents.Project.State.update(document.body, record);
      assert.isTrue(element.projects.some((p) => p._id === project._id));
    });

    it('adds new project when no projects', async () => {
      element[projectsValue] = undefined;
      const project = generator.generateProjects({ projectsSize: 1 })[0];
      const record = {
        id: project._id,
        rev: 'test-rev',
        item: project,
      };
      ArcModelEvents.Project.State.update(document.body, record);
      assert.typeOf(element.projects, 'array');
      assert.lengthOf(element.projects, 1);
    });
    
    it('reads project data when missing', async () => {
      const projects = await generator.insertProjectsData({
        projectsSize: 1,
      });
      const record = {
        id: projects[0]._id,
        rev: projects[0]._rev,
      };
      ArcModelEvents.Project.State.update(document.body, record);
      await oneEvent(element, 'projectschange');
      assert.isTrue(element.projects.some((p) => p._id === projects[0]._id));
    });
  });

  describe('[projectDeleteHandler]()', () => {
    let element = /** @type ProjectsConsumerElement */(null);
    beforeEach(async () => {
      element = await projectsFixture();
    });

    before(async () => {
      await generator.insertProjectsData({
        projectsSize: 20,
        autoRequestId: true
      });
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('removes a project from the list', () => {
      const project = { ...element.projects[0] };
      ArcModelEvents.Project.State.delete(document.body, project._id, project._rev);
      assert.isFalse(element.projects.some((p) => p._id === project._id));
    });

    it('sets hasProjects to false when removing last project', () => {
      const project = { ...element.projects[0] };
      element[projectsValue] = [element.projects[0]];
      ArcModelEvents.Project.State.delete(document.body, project._id, project._rev);
      assert.isFalse(element.hasProjects);
    });
    
    it('ignores when no projects', () => {
      const project = { ...element.projects[0] };
      element[projectsValue] = undefined;
      ArcModelEvents.Project.State.delete(document.body, project._id, project._rev);
      assert.isUndefined(element.projects);
    });

    it('ignores when unknown project', () => {
      ArcModelEvents.Project.State.delete(document.body, 'a', 'b');
      assert.isFalse(element.projects.some((p) => p._id === 'a'));
    });
  });
});