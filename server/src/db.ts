import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Declare top-level bindings and assign per environment
let pool: any;
let db: any;

if (process.env.NODE_ENV === "test") {
  // Optionally allow tests to use a real database by setting TEST_REAL_DB=true
  if (process.env.TEST_REAL_DB === "true") {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
  } else {
    class MockQuery {
      private rows: any[];
      constructor(rows: any[] = []) {
        this.rows = rows;
      }
      // Chainable query builder methods used across routes
      from() {
        return this;
      }
      where() {
        return this;
      }
      leftJoin() {
        return this;
      }
      rightJoin() {
        return this;
      }
      innerJoin() {
        return this;
      }
      groupBy() {
        return this;
      }
      orderBy() {
        return this;
      }
      limit() {
        return this;
      }
      offset() {
        return this;
      }
      then(fn: any) {
        return Promise.resolve(this.rows).then(fn);
      }
      catch() {
        return this;
      }
    }

    const __mockState = {
      selectResponses: [] as any[],
      insertResponse: [] as any[],
      updateResponse: [] as any[],
      deleteResponse: [] as any[],
    };

    const dbMock: any = {
      __mockState,
      select: (sel?: any) => {
        if (sel && typeof sel === "object" && "count" in sel) {
          const resp = __mockState.selectResponses.shift() || [{ count: 0 }];
          return {
            from: () => ({ then: (fn: any) => Promise.resolve(resp).then(fn) }),
          };
        }
        let resp = __mockState.selectResponses.shift();
        if (resp === undefined) {
          // Fallback: if nothing queued, but we have insert/update data, return that
          if (
            __mockState.insertResponse &&
            __mockState.insertResponse.length > 0
          ) {
            resp = __mockState.insertResponse.slice();
          } else if (
            __mockState.updateResponse &&
            __mockState.updateResponse.length > 0
          ) {
            resp = __mockState.updateResponse.slice();
          } else {
            resp = [];
          }
        }
        return new MockQuery(resp);
      },
      // Capture values provided to insert and return a sensible default when tests
      // didn't seed __mockState.insertResponse. Also seed selectResponses so
      // subsequent selects find the newly inserted rows.
      insert: () => {
        let providedValues: any = [];
        return {
          values: (vals: any) => {
            providedValues = Array.isArray(vals) ? vals : [vals];
            return {
              returning: () => {
                if (
                  __mockState.insertResponse &&
                  __mockState.insertResponse.length > 0
                ) {
                  // return a copy
                  return Promise.resolve(__mockState.insertResponse.slice());
                }
                // fabricate inserted rows with incremental ids starting at 1
                const rows = providedValues.map((v: any, i: number) => ({
                  id: i + 1,
                  ...v,
                }));
                // seed selectResponses so subsequent selects can find these rows
                // push multiple copies so a few selects will still see the row
                __mockState.selectResponses.push(rows.slice());
                __mockState.selectResponses.push(rows.slice());
                __mockState.selectResponses.push(rows.slice());
                __mockState.insertResponse = rows.slice();
                return Promise.resolve(rows);
              },
            };
          },
        };
      },
      update: () => {
        let updatePayload: any = {};
        return {
          set: (upd: any) => {
            updatePayload = upd;
            return {
              where: () => ({
                returning: () => {
                  if (
                    __mockState.updateResponse &&
                    __mockState.updateResponse.length > 0
                  ) {
                    return Promise.resolve(__mockState.updateResponse.slice());
                  }
                  // fabricate an updated row; tests usually call update by id
                  const updated = [
                    {
                      id: (updatePayload && updatePayload.id) || 1,
                      ...updatePayload,
                    },
                  ];
                  // seed selectResponses so subsequent selects return updated row
                  __mockState.selectResponses.push(updated.slice());
                  __mockState.selectResponses.push(updated.slice());
                  __mockState.updateResponse = updated.slice();
                  return Promise.resolve(updated);
                },
              }),
            };
          },
        };
      },
      delete: () => ({
        where: () => ({
          returning: () => {
            if (
              __mockState.deleteResponse &&
              __mockState.deleteResponse.length > 0
            ) {
              return Promise.resolve(__mockState.deleteResponse.slice());
            }
            const deleted = [{ id: 1 }];
            __mockState.deleteResponse = deleted.slice();
            return Promise.resolve(deleted);
          },
        }),
      }),
    };

    pool = {};
    db = dbMock;
  }
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { pool, db };
export default db;
