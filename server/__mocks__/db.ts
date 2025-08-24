// Enhanced mock for drizzle db used in tests
export const pool = {};

interface MockState {
  selectResponses: any[];
  insertResponse: any[];
  updateResponse: any[];
  deleteResponse: any[];
}

// Mock state to control test responses
const mockState: MockState = {
  selectResponses: [],
  insertResponse: [],
  updateResponse: [],
  deleteResponse: [],
};

// Mock query builder that supports chaining and shifting configured responses
const createMockQuery = (operation: string) => {
  const query: any = {
    from: () => query,
    where: () => query,
    leftJoin: () => query,
    rightJoin: () => query,
    innerJoin: () => query,
    groupBy: () => query,
    orderBy: () => query,
    limit: () => query,
    offset: () => query,
    values: () => query,
    set: () => query,
    returning: () => {
      if (operation === "insert") {
        return Promise.resolve(mockState.insertResponse.slice());
      }
      if (operation === "update") {
        return Promise.resolve(mockState.updateResponse.slice());
      }
      if (operation === "delete") {
        return Promise.resolve(mockState.deleteResponse.slice());
      }
      return Promise.resolve([]);
    },
    then: (fn: any) => {
      try {
        if (operation === "select") {
          // shift one configured select response or return []
          const resp = mockState.selectResponses.shift() || [];
          return Promise.resolve(resp).then(fn);
        }
        if (operation === "insert") {
          const resp = mockState.insertResponse.slice();
          return Promise.resolve(resp).then(fn);
        }
        if (operation === "update") {
          const resp = mockState.updateResponse.slice();
          return Promise.resolve(resp).then(fn);
        }
        if (operation === "delete") {
          const resp = mockState.deleteResponse.slice();
          return Promise.resolve(resp).then(fn);
        }
        return Promise.resolve([]).then(fn);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    catch: (cb: any) => query,
  };
  return query;
};

export const db = {
  select: (fields?: any) => createMockQuery("select"),
  insert: (table: any) => createMockQuery("insert"),
  update: (table: any) => createMockQuery("update"),
  delete: (table: any) => createMockQuery("delete"),
  __mockState: mockState, // Expose for test control
};

export default db;
