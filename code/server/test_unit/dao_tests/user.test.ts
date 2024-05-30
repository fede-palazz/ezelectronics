import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals";

import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import crypto from "crypto";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { UserAlreadyExistsError } from "../../src/errors/userError";
import { beforeEach } from "node:test";

jest.mock("crypto");
jest.mock("../../src/db/db.ts");

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("User registration", () => {
  let userDAO: UserDAO;
  beforeEach(() => {
    userDAO = new UserDAO();
  });
  test("User correctly registered", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    // const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
    //   return Buffer.from("salt");
    // });
    // const mockScrypt = jest
    //   .spyOn(crypto, "scrypt")
    //   .mockImplementation(async (password, salt, keylen) => {
    //     return Buffer.from("hashedPassword");
    //   });
    const result = await userDAO.createUser("username", "name", "surname", "password", "role");
    expect(result).toBe(true);
    mockDBRun.mockRestore();
    // mockRandomBytes.mockRestore();
    // mockScrypt.mockRestore();
  });

  test("Username already in use", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("UNIQUE constraint failed: users.username"));
      return {} as Database;
    });

    const result = userDAO.createUser("username", "name", "surname", "password", "role");
    await expect(result).rejects.toEqual(new UserAlreadyExistsError());
    expect(mockDBRun).toHaveBeenCalled();
    expect(mockDBRun).toHaveBeenCalledWith("username", "name", "surname", "password", "role");
    mockDBRun.mockRestore();
  });

  test("User provides empty parameters", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("UNIQUE constraint failed: users.username"));
      return {} as Database;
    });

    const result = userDAO.createUser("username", "name", "surname", "password", "role");
    await expect(result).rejects.toEqual(new UserAlreadyExistsError());
    expect(mockDBRun).toHaveBeenCalled();
    expect(mockDBRun).toHaveBeenCalledWith("username", "name", "surname", "password", "role");
    mockDBRun.mockRestore();
  });
});
