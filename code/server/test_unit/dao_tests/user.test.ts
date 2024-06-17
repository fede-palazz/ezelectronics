import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import UserDAO from "../../src/dao/userDAO";
import crypto from "crypto";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError";
import { Role, User } from "../../src/components/user";

jest.mock("crypto");
jest.mock("../../src/db/db.ts");

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

let userDAO: UserDAO;

describe("User authentication", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Correct credentials", async () => {
    const mockUser = {
      username: "testUser",
      password: "hashedPassword",
      salt: "salt",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockUser);
      return {} as Database;
    });

    // Save the original implementation of Buffer.from
    const originalBufferFrom = Buffer.from;
    const mockBuffer = jest.spyOn(Buffer, "from").mockImplementation((str, encoding) => {
      return originalBufferFrom("hashedPassword");
    });
    const mockScryptSync = jest
      .spyOn(crypto, "scryptSync")
      .mockImplementation((password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });

    const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((a, b) => {
      return true;
    });

    const result = await userDAO.getIsUserAuthenticated("testUser", "hashedPassword");

    expect(mockDBGet).toBeCalled();
    expect(mockBuffer).toHaveBeenCalledTimes(2);
    expect(mockScryptSync).toBeCalled();
    expect(mockScryptSync).toHaveBeenCalledWith("hashedPassword", mockUser.salt, 16);
    expect(mockTimingSafeEqual).toHaveBeenCalledWith(
      Buffer.from("hashedPassword"),
      Buffer.from("hashedPassword")
    );
    expect(result).toBe(true);
  });

  test("Invalid credentials", async () => {
    const mockUser = {
      username: "testUser",
      password: "hashedPassword",
      salt: "salt",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockUser);
      return {} as Database;
    });

    // Save the original implementation of Buffer.from
    const originalBufferFrom = Buffer.from;
    const mockBuffer = jest.spyOn(Buffer, "from").mockImplementation((str, encoding) => {
      return originalBufferFrom("hashedPassword");
    });
    const mockScryptSync = jest
      .spyOn(crypto, "scryptSync")
      .mockImplementation((password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });

    const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((a, b) => {
      return false;
    });

    const result = await userDAO.getIsUserAuthenticated("testUser", "wrongPassword");

    expect(mockDBGet).toBeCalled();
    expect(mockBuffer).toHaveBeenCalledTimes(2);
    expect(mockScryptSync).toBeCalled();
    expect(mockScryptSync).toHaveBeenCalledWith("wrongPassword", mockUser.salt, 16);
    expect(mockTimingSafeEqual).toHaveBeenCalledWith(
      Buffer.from("hashedPassword"),
      Buffer.from("wrongPassword")
    );
    expect(result).toBe(false);
  });

  test("User not found", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, null);
      return {} as Database;
    });
    const result = await userDAO.getIsUserAuthenticated("testUser", "wrongPassword");
    expect(result).toBeFalsy();
    expect(mockDBGet).toBeCalled();
  });

  test("DB error", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });
    const result = userDAO.getIsUserAuthenticated("testUser", "wrongPassword");
    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBGet).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"), null);
      return {} as Database;
    });
    const result = userDAO.getIsUserAuthenticated("testUser", "wrongPassword");
    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBGet).toBeCalled();
  });
});

describe("Create account", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("User successfully registered", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
      return Buffer.from("salt");
    });
    const mockScryptSync = jest
      .spyOn(crypto, "scryptSync")
      .mockImplementation((password, salt, keylen) => {
        return Buffer.from("hashedPassword");
      });

    const result = await userDAO.createUser("testUser", "test", "user", "password", "Customer");

    expect(mockRandomBytes).toBeCalled();
    expect(mockScryptSync).toBeCalled();
    expect(mockDBRun).toBeCalled();
    expect(result).toBe(true);
  });

  test("Username already in use", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("UNIQUE constraint failed: users.username"));
      return {} as Database;
    });

    const result = userDAO.createUser("testUser", "test", "user", "password", "Customer");

    await expect(result).rejects.toEqual(new UserAlreadyExistsError());
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("DB error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });

    const result = userDAO.createUser("testUser", "test", "user", "password", "Customer");

    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBRun).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });

    const result = userDAO.createUser("testUser", "test", "user", "password", "Customer");

    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBRun).toBeCalled();
  });
});

describe("Get user by username", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("User successfully retrieved", async () => {
    const mockUser = {
      username: "testUser",
      name: "test",
      surname: "user",
      role: "Customer",
      address: "",
      birthdate: "",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockUser);
      return {} as Database;
    });

    const result = await userDAO.getUserByUsername("testUser");

    expect(mockDBGet).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(
      new User(
        mockUser.username,
        mockUser.name,
        mockUser.surname,
        Role.CUSTOMER,
        mockUser.address,
        mockUser.birthdate
      )
    );
  });

  test("User not found", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, null);
      return {} as Database;
    });

    const result = userDAO.getUserByUsername("testUser");

    expect(mockDBGet).toHaveBeenCalledTimes(1);
    await expect(result).rejects.toEqual(new UserNotFoundError());
  });

  test("DB error", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });
    const result = userDAO.getUserByUsername("testUser");
    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBGet).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"), null);
      return {} as Database;
    });
    const result = userDAO.getUserByUsername("testUser");
    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBGet).toBeCalled();
  });
});

describe("Get all users", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Users successfully retrieved", async () => {
    const mockUsers = [
      {
        username: "testUser1",
        name: "test1",
        surname: "user1",
        role: "Customer",
        address: "",
        birthdate: "",
      },
      {
        username: "testUser2",
        name: "test2",
        surname: "user2",
        role: "Customer",
        address: "",
        birthdate: "",
      },
    ];
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, mockUsers);
      return {} as Database;
    });

    const result = await userDAO.getUsers();

    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(
      mockUsers.map(
        (user) =>
          new User(
            user.username,
            user.name,
            user.surname,
            Role.CUSTOMER,
            user.address,
            user.birthdate
          )
      )
    );
  });

  test("Empty user database", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, []);
      return {} as Database;
    });

    const result = await userDAO.getUsers();

    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual([]);
  });

  test("DB error", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });
    const result = userDAO.getUsers();
    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBAll).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"), []);
      return {} as Database;
    });
    const result = userDAO.getUsers();
    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBAll).toBeCalled();
  });
});

describe("Get users by role", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Users successfully retrieved", async () => {
    const mockUsers = [
      {
        username: "testUser1",
        name: "test1",
        surname: "user1",
        role: "Manager",
        address: "",
        birthdate: "",
      },
      {
        username: "testUser2",
        name: "test2",
        surname: "user2",
        role: "Manager",
        address: "",
        birthdate: "",
      },
    ];
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, mockUsers);
      return {} as Database;
    });

    const result = await userDAO.getUsersByRole("Manager");

    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(
      mockUsers.map(
        (user) =>
          new User(
            user.username,
            user.name,
            user.surname,
            Role.MANAGER,
            user.address,
            user.birthdate
          )
      )
    );
  });

  test("No user matches the role", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, []);
      return {} as Database;
    });

    const result = await userDAO.getUsersByRole("Manager");

    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual([]);
  });

  test("DB error", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });
    const result = userDAO.getUsersByRole("Customer");
    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBAll).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"), []);
      return {} as Database;
    });
    const result = userDAO.getUsersByRole("Customer");
    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBAll).toBeCalled();
  });
});

describe("Delete user by username", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("User successfully deleted", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({ changes: 1 }, null);
      return {} as Database;
    });

    const result = await userDAO.deleteUser("testUser");

    expect(mockDBRun).toBeCalled();
    expect(result).toBe(true);
  });

  test("Username not found", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({ changes: 0 }, null);
      return {} as Database;
    });

    const result = userDAO.deleteUser("testUser");

    await expect(result).rejects.toEqual(new UserNotFoundError());
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("DB error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });

    const result = userDAO.deleteUser("testUser");

    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBRun).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });

    const result = userDAO.deleteUser("testUser");

    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBRun).toBeCalled();
  });
});

describe("Delete all users", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Users successfully deleted", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

    const result = await userDAO.deleteAll();

    expect(mockDBRun).toBeCalled();
    expect(result).toBe(true);
  });

  test("DB error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });

    const result = userDAO.deleteAll();

    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBRun).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });

    const result = userDAO.deleteAll();

    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBRun).toBeCalled();
  });
});

describe("Update user info", () => {
  beforeEach(() => {
    userDAO = new UserDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("User info successfully updated", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({ changes: 1 }, null);
      return {} as Database;
    });

    const result = await userDAO.updateUserInfo("test", "user", Role.CUSTOMER, "", "", "testUser");

    expect(mockDBRun).toBeCalled();
    expect(result).toStrictEqual(new User("testUser", "test", "user", Role.CUSTOMER, "", ""));
  });

  test("User not found", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({ changes: 0 }, null);
      return {} as Database;
    });

    const result = userDAO.updateUserInfo("test", "user", Role.CUSTOMER, "", "", "testUser");

    expect(mockDBRun).toBeCalled();
    await expect(result).rejects.toEqual(new UserNotFoundError());
  });

  test("DB error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });

    const result = userDAO.updateUserInfo("test", "user", Role.CUSTOMER, "", "", "testUser");

    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBRun).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });

    const result = userDAO.updateUserInfo("test", "user", Role.CUSTOMER, "", "", "testUser");

    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBRun).toBeCalled();
  });
});
