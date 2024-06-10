import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import express from "express";
import UserController from "../../src/controllers/userController";
import Authenticator from "../../src/routers/auth";
import { Role, User } from "../../src/components/user";
import ErrorHandler from "../../src/helper";
import {
  UnauthorizedUserError,
  UserAlreadyExistsError,
  UserIsAdminError,
  UserNotAdminError,
  UserNotFoundError,
} from "../../src/errors/userError";
import { param } from "express-validator";
import { DateError } from "../../src/utilities";
const baseURL = "/ezelectronics/users";
const baseAuthURL = "/ezelectronics/sessions";

jest.mock("../../src/controllers/userController");
jest.mock("../../src/routers/auth");
jest.mock("../../src/helper.ts");

function registerErrorHandler(router: express.Application) {
  router.use((err: any, req: any, res: any, next: any) => {
    return res.status(err.customCode || 503).json({
      error: err.customMessage || "Internal Server Error",
      status: err.customCode || 503,
    });
  });
}
registerErrorHandler(app);

describe("POST /: create new user", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should successfully create the user", async () => {
    const testUser = {
      username: "testUser",
      name: "test",
      surname: "user",
      password: "test",
      role: "Manager",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });
    const mockController = jest
      .spyOn(UserController.prototype, "createUser")
      .mockResolvedValueOnce(true);

    const response = await request(app).post(baseURL).send(testUser);

    expect(response.status).toBe(200);
    expect(mockController).toHaveBeenCalledTimes(1);
    expect(mockController).toHaveBeenCalledWith(
      testUser.username,
      testUser.name,
      testUser.surname,
      testUser.password,
      testUser.role
    );
  });

  test("It should fail if user already exists", async () => {
    const testUser = {
      username: "testUser",
      name: "test",
      surname: "user",
      password: "test",
      role: "Manager",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });
    const mockController = jest
      .spyOn(UserController.prototype, "createUser")
      .mockRejectedValueOnce(new UserAlreadyExistsError());

    const response = await request(app).post(baseURL).send(testUser);

    expect(response.status).toBe(new UserAlreadyExistsError().customCode);
    expect(response.body.error).toEqual(new UserAlreadyExistsError().customMessage);
    expect(mockController).toHaveBeenCalledTimes(1);
    expect(mockController).toHaveBeenCalledWith(
      testUser.username,
      testUser.name,
      testUser.surname,
      testUser.password,
      testUser.role
    );
  });

  test("It should fail if params are wrong", async () => {
    const testUser = {
      username: "",
      name: "test",
      surname: "user",
      password: "test",
      role: "Manager",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return res.status(422).json({ error: "error" });
    });
    const mockController = jest
      .spyOn(UserController.prototype, "createUser")
      .mockRejectedValueOnce(new UserAlreadyExistsError());

    const response = await request(app).post(baseURL).send(testUser);

    expect(response.status).toBe(422);
    expect(response.body.error).toEqual("error");
    expect(mockController).toHaveBeenCalledTimes(0);
  });
});

describe("GET /: get all users", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It returns an array of users", async () => {
    const mockUsers = [
      new User("testUser", "test", "user", Role.CUSTOMER, "", ""),
      new User("testAdmin", "test", "admin", Role.ADMIN, "", ""),
    ];
    jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(mockUsers);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL);

    expect(response.status).toBe(200);
    expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual(mockUsers);
  });

  test("It should fail if the user is not logged in", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "Unauthorized" });
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "User is not an admin" });
    });

    const response = await request(app).get(baseURL);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  test("It should fail if the user is not an Admin", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "User is not an admin" });
    });

    const response = await request(app).get(baseURL);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "User is not an admin" });
  });

  test("It should fail if an error occurs", async () => {
    jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error("error"));
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL);
    expect(response.status).toBe(503);
    expect(response.body.error).toEqual("Internal Server Error");
  });
});

describe("GET /roles/:role: retrieve all users of a specific role", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It returns an array of users with a specific role if user is an Admin", async () => {
    const testAdmin = new User("testAdmin", "test", "admin", Role.ADMIN, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUsersByRole")
      .mockResolvedValueOnce([testAdmin]);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL + "/roles/Admin");

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith("Admin");
    expect(response.body).toEqual([testAdmin]);
  });

  test("It should fail if the role is not valid", async () => {
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUsersByRole")
      .mockRejectedValueOnce(new UserNotFoundError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => {
        throw new Error("Invalid value");
      }),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return res.status(422).json({ error: "error" });
    });

    const response = await request(app).get(baseURL + "/roles/Invalid");
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("error");
    expect(mockFunction).toBeCalledTimes(0);
  });

  test("It should fail if user is not an Admin", async () => {
    const testAdmin = new User("testAdmin", "test", "admin", Role.ADMIN, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUsersByRole")
      .mockResolvedValueOnce([testAdmin]);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "User is not an admin" });
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL + "/roles/Admin");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("User is not an admin");
    expect(mockFunction).toBeCalledTimes(0);
  });

  test("It should fail if there is an error", async () => {
    const testAdmin = new User("testAdmin", "test", "admin", Role.ADMIN, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUsersByRole")
      .mockRejectedValueOnce(new Error("error"));
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL + "/roles/Admin");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("Internal Server Error");
    expect(mockFunction).toBeCalledTimes(1);
  });
});

describe("GET /:username: retrieve a user by its username", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("A user should be able to retrieve its own data", async () => {
    const reqUser = {
      username: "testUser",
    };
    const testUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUserByUsername")
      .mockResolvedValueOnce(testUser);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL + "/testUser");

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "testUser");
    expect(response.body).toEqual(testUser);
  });

  test("A user shouldn't be able to retrieve other users' data", async () => {
    const reqUser = {
      username: "testUser1",
    };
    const testUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUserByUsername")
      .mockRejectedValueOnce(new UnauthorizedUserError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL + "/testUser2");

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual(new UnauthorizedUserError().customMessage);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "testUser2");
  });

  test("It should return an error if param is wrong", async () => {
    const reqUser = {
      username: "testUser",
    };
    // const testUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUserByUsername")
      .mockRejectedValueOnce(new UserNotFoundError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => {
        throw new Error("Invalid username");
      }),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return res.status(422).json({ error: "Invalid username" });
    });

    const response = await request(app).get(baseURL + "/invalid");

    expect(response.status).toBe(422);
    expect(response.body.error).toEqual("Invalid username");
    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  test("An Admin should be able to retrieve other users' data", async () => {
    const reqUser = {
      username: "testAdmin",
    };
    const testUser = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "getUserByUsername")
      .mockResolvedValueOnce(testUser);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).get(baseURL + "/testUser");

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "testUser");
    expect(response.body).toEqual(testUser);
  });
});

describe("DELETE /:username: delete a user by its username", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should return an error if user does not exist", async () => {
    const reqUser = {
      username: "testUser",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteUser")
      .mockRejectedValueOnce(new UserNotFoundError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/invalidUser");

    expect(response.status).toBe(404);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "invalidUser");
    expect(response.body.error).toBe(new UserNotFoundError().customMessage);
  });

  test("Non admin users should delete their own accounts", async () => {
    const reqUser = {
      username: "testUser",
      role: "Customer",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteUser")
      .mockResolvedValueOnce(true);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/testUser");

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "testUser");
  });

  test("Non admin users should not delete other users' accounts", async () => {
    const reqUser = {
      username: "testUser1",
      role: "Manager",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteUser")
      .mockRejectedValueOnce(new UnauthorizedUserError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/testUser2");

    expect(response.status).toBe(401);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "testUser2");
    expect(response.body.error).toBe(new UnauthorizedUserError().customMessage);
  });

  test("Admin users can't be deleted", async () => {
    const reqUser = {
      username: "testUser",
      role: "Admin",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteUser")
      .mockRejectedValueOnce(new UserIsAdminError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/adminUser");

    expect(response.status).toBe(401);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "adminUser");
    expect(response.body.error).toBe(new UserIsAdminError().customMessage);
  });

  test("Admin users should delete other non admin users' accounts", async () => {
    const reqUser = {
      username: "adminUser",
      role: "Admin",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteUser")
      .mockResolvedValueOnce(true);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser; // Mock incoming user data
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/testUser");

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(reqUser, "testUser");
  });
});

describe("DELETE /: delete all non Admin users", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should return an error if user is not an Admin", async () => {
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteAll")
      .mockRejectedValueOnce(false);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "User is not an Admin" });
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("User is not an Admin");
    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  test("Admin users should delete all users", async () => {
    const reqUser = {
      username: "adminUser",
      role: "Admin",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteAll")
      .mockResolvedValueOnce(true);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/");

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  test("It should fail if there is an error", async () => {
    const reqUser = {
      username: "adminUser",
      role: "Admin",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "deleteAll")
      .mockRejectedValueOnce(new Error("error"));
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/");

    expect(response.status).toBe(503);
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});

describe("PATCH /:username: update user info", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should return an error if params are wrong", async () => {
    const reqUser = {
      username: "testUser",
      role: "Customer",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockRejectedValueOnce(false);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => {
        throw new Error("Invalid params");
      }),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return res.status(422).json({ error: "The parameters are not formatted properly" });
    });

    const response = await request(app).delete(baseURL + "/testUser");

    expect(response.status).toBe(422);
    expect(response.body.error).toBe("The parameters are not formatted properly");
    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  test("It should return an error if user is not logged in", async () => {
    const reqUser = {
      username: "testUser",
      role: "Customer",
    };
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockRejectedValueOnce(false);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "Unauthorized" });
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseURL + "/testUser");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  test("It should return an error if user does not exist", async () => {
    const reqUser = {
      username: "testUser",
      role: "Customer",
    };
    const updatedUser = new User("testUser", "new", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockRejectedValueOnce(new UserNotFoundError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        isDate: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app)
      .patch(baseURL + "/invalidUser")
      .send(updatedUser);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe(new UserNotFoundError().customMessage);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      reqUser,
      updatedUser.name,
      updatedUser.surname,
      updatedUser.address,
      updatedUser.birthdate,
      "invalidUser"
    );
  });

  test("It should return an error if birthdate is a future date", async () => {
    const reqUser = {
      username: "testUser",
      role: "Customer",
    };
    const updatedUser = new User("testUser", "new", "user", Role.CUSTOMER, "", "2067-03-02");
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockRejectedValueOnce(new DateError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        isDate: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app)
      .patch(baseURL + "/testUser")
      .send(updatedUser);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(new DateError().customMessage);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      reqUser,
      updatedUser.name,
      updatedUser.surname,
      updatedUser.address,
      updatedUser.birthdate,
      "testUser"
    );
  });

  test("Non Admin users should not modify other users data", async () => {
    const reqUser = {
      username: "testUser1",
      role: "Customer",
    };
    const updatedUser = new User("testUser2", "new", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockRejectedValueOnce(new UserNotAdminError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        isDate: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app)
      .patch(baseURL + "/testUser2")
      .send(updatedUser);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe(new UserNotAdminError().customMessage);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      reqUser,
      updatedUser.name,
      updatedUser.surname,
      updatedUser.address,
      updatedUser.birthdate,
      "testUser2"
    );
  });

  test("Admin users should not modify other admin users' data", async () => {
    const reqUser = {
      username: "adminUser1",
      role: "Admin",
    };
    const updatedUser = new User("adminUser2", "new", "user", Role.ADMIN, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockRejectedValueOnce(new UnauthorizedUserError());
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        isDate: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app)
      .patch(baseURL + "/adminUser2")
      .send(updatedUser);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe(new UnauthorizedUserError().customMessage);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      reqUser,
      updatedUser.name,
      updatedUser.surname,
      updatedUser.address,
      updatedUser.birthdate,
      "adminUser2"
    );
  });

  test("Non Admin users should update their own data", async () => {
    const reqUser = {
      username: "testUser",
      role: "Customer",
    };
    const updatedUser = new User("testUser", "new", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockResolvedValueOnce(updatedUser);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        isDate: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app)
      .patch(baseURL + "/testUser")
      .send(updatedUser);

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      reqUser,
      updatedUser.name,
      updatedUser.surname,
      updatedUser.address,
      updatedUser.birthdate,
      "testUser"
    );
  });

  test("Non Admin users should update their own data", async () => {
    const reqUser = {
      username: "admin1",
      role: "Admin",
    };
    const updatedUser = new User("testUser", "new", "user", Role.CUSTOMER, "", "");
    const mockFunction = jest
      .spyOn(UserController.prototype, "updateUserInfo")
      .mockResolvedValueOnce(updatedUser);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = reqUser;
      return next();
    });
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        isDate: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app)
      .patch(baseURL + "/testUser")
      .send(updatedUser);

    expect(response.status).toBe(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      reqUser,
      updatedUser.name,
      updatedUser.surname,
      updatedUser.address,
      updatedUser.birthdate,
      "testUser"
    );
  });
});

/**
 * AUTHENTICATOR TESTS
 */

describe("POST /: user login", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should successfully log in a user if credentials are correct", async () => {
    const testUser = {
      username: "testUser",
      password: "test",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });
    const mockController = jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(null);

    const response = await request(app).post(baseAuthURL).send(testUser);

    expect(response.status).toBe(200);
    expect(mockController).toHaveBeenCalledTimes(1);
  });

  test("It should return an error if params are wrong", async () => {
    const testUser = {
      username: "testUser",
      name: "test",
      surname: "user",
      password: "test",
      role: "Manager",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => {
        throw new Error("Invalid params");
      }),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return res.status(422).json({ error: "The parameters are not formatted properly" });
    });
    const mockController = jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(null);

    const response = await request(app).post(baseAuthURL).send(testUser);

    expect(response.status).toBe(422);
    expect(mockController).toHaveBeenCalledTimes(0);
  });

  test("It should return an error if credentials are wrong", async () => {
    const testUser = {
      username: "testUser",
      password: "test",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });
    const mockController = jest
      .spyOn(Authenticator.prototype, "login")
      .mockRejectedValue(new Error("Invalid credentials"));

    const response = await request(app).post(baseAuthURL).send(testUser);

    expect(response.status).toBe(401);
    expect(mockController).toHaveBeenCalledTimes(1);
  });

  test("It should return an error if user does not exist", async () => {
    const testUser = {
      username: "testUser",
      password: "test",
    };
    jest.mock("express-validator", () => ({
      body: jest.fn().mockImplementation(() => ({
        isString: () => {},
        isIn: () => {},
        notEmpty: () => {},
      })),
    }));
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
      return next();
    });
    const mockController = jest
      .spyOn(Authenticator.prototype, "login")
      .mockRejectedValue(new Error("Invalid username"));

    const response = await request(app).post(baseAuthURL).send(testUser);

    expect(response.status).toBe(401);
    expect(mockController).toHaveBeenCalledTimes(1);
  });
});

describe("DELETE /current: user logout", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should successfully log out a user if it is logged in", async () => {
    const mockController = jest
      .spyOn(Authenticator.prototype, "logout")
      .mockResolvedValueOnce(null);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseAuthURL + "/current");

    expect(response.status).toBe(200);
    expect(mockController).toHaveBeenCalledTimes(1);
  });

  test("It should return an error if user is not logged in", async () => {
    const mockController = jest
      .spyOn(Authenticator.prototype, "logout")
      .mockResolvedValueOnce(null);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "User is not logged in" });
    });

    const response = await request(app).delete(baseAuthURL + "/current");

    expect(response.status).toBe(401);
    expect(mockController).toHaveBeenCalledTimes(0);
  });

  test("It should fail if there is an error", async () => {
    const mockController = jest
      .spyOn(Authenticator.prototype, "logout")
      .mockRejectedValueOnce(new Error("error"));
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return next();
    });

    const response = await request(app).delete(baseAuthURL + "/current");

    expect(response.status).toBe(503);
    expect(mockController).toHaveBeenCalledTimes(1);
  });
});

describe("GET /current: user logout", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should successfully log out a user if it is logged in", async () => {
    const currentUser = {
      username: "testUser",
      role: "Customer",
    };
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      req.user = currentUser;
      return next();
    });

    const response = await request(app).get(baseAuthURL + "/current");

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(currentUser);
  });

  test("It should return an error if user is not logged in", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
      return res.status(401).json({ error: "User is not logged in" });
    });

    const response = await request(app).get(baseAuthURL + "/current");

    expect(response.status).toBe(401);
  });
});
