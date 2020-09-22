/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCProject} ARCProject */

/**
 * Sort function used to sort projects in order.
 * @param {ARCProject} a
 * @param {ARCProject} b
 * @return {number}
 */
export function projectsSortFn(a, b) {
  if (a.order > b.order) {
    return 1;
  }
  if (a.order < b.order) {
    return -1;
  }
  return 0;
}

/**
 * Sorts requests list by `projectOrder` property
 *
 * @param {any} a
 * @param {any} b
 * @return {number}
 */
export function projectLegacySort(a, b) {
  if (a.projectOrder > b.projectOrder) {
    return 1;
  }
  if (a.projectOrder < b.projectOrder) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  if (a.name < b.name) {
    return -1;
  }
  return 0;
}

/**
 * Sorts the query results by name
 *
 * @param {ARCSavedRequest} a
 * @param {ARCSavedRequest} b
 * @return {number}
 */
export function savedSort(a, b) {
  if (!a.name && !b.name) {
    return 0;
  }
  if (!a.name) {
    return -1;
  }
  if (!b.name) {
    return 1;
  }
  return a.name.localeCompare(b.name);
}

/**
 * Throws an error when type is not set.
 * @param {string} type Passed to the function type
 * @throws {Error} An error when the passed type is invalid.
 */
export function validateRequestType(type) {
  if (['project', 'history', 'saved'].indexOf(type) === -1) {
    throw new TypeError('The "type" property is not set.');
  }
}

/**
 * Tests if two arrays has the same order of ids (strings).
 * @param {Array<string>} a1 Array a
 * @param {Array<string>} a2 Array b
 * @return {Boolean} True when elements are ordered the same way.
 */
export function idsArrayEqual(a1, a2) {
  if (!a1 && !a2) {
    return true;
  }
  if (!a1 || !a2) {
    return false;
  }
  if (a1.length !== a2.length) {
    return false;
  }
  for (let i = 0, len = a1.length; i < len; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }
  return true;
}


/**
 * Checks if requests is related to the project by project's id.
 * 
 * @param {ARCSavedRequest} request The request to test
 * @param {string} id Project id
 * @return {boolean}
 */
export function isProjectRequest(request, id) {
  if (!id) {
    return false;
  }
  const { projects } = request;
  if (Array.isArray(projects) && projects.includes(id)) {
    return true;
  }
  // @ts-ignore
  if (request.legacyProject === id) {
    return true;
  }
  return false;
}

 /**
  * Computes value for the `hasTwoLines` property.
  * 
  * @param {string} listType Selected list type.
  * @return {boolean}
  */
export function hasTwoLines(listType) {
  if (!listType || listType === 'default') {
    return true;
  }
  return false;
}

/**
 * Creates a timestamp fot today, midnight
 * @return {number}
 */
export function midnightTimestamp() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}