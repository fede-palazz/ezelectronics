"use strict";

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM users", (err) => {
        if (err) return reject();
        db.run("DELETE FROM carts", (err) => {
          if (err) return reject();
          db.run("DELETE FROM products", (err) => {
            if (err) return reject();
            db.run("DELETE FROM productsInCarts", (err) => {
              if (err) return reject();
              db.run("DELETE FROM reviews", (err) => {
                if (err) return reject();
                resolve();
              });
            });
          });
        });
      });
    });
  });
}