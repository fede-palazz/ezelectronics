import { test, expect, jest } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import { UserAlreadyExistsError } from "../../src/errors/userError";
import { Role, User } from "../../src/components/user";

jest.mock("../../src/dao/userDAO");

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

let userController: UserController;

describe("Create new user", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("User successfully created", async () => {
    const mockUser = {
      username: "testUser",
      name: "test",
      surname: "user",
      password: "test",
      role: "Manager",
    };
    const mockFunction = jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true);

    const result = await userController.createUser(
      mockUser.username,
      mockUser.name,
      mockUser.surname,
      mockUser.password,
      mockUser.role
    );

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      mockUser.username,
      mockUser.name,
      mockUser.surname,
      mockUser.password,
      mockUser.role
    );
    expect(result).toBeTruthy();
  });

  test("Username already registered", async () => {
    const mockUser = {
      username: "testUser",
      name: "test",
      surname: "user",
      password: "test",
      role: "Manager",
    };
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "createUser")
      .mockRejectedValueOnce(new UserAlreadyExistsError());

    const result = userController.createUser(
      mockUser.username,
      mockUser.name,
      mockUser.surname,
      mockUser.password,
      mockUser.role
    );

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(
      mockUser.username,
      mockUser.name,
      mockUser.surname,
      mockUser.password,
      mockUser.role
    );
    await expect(result).rejects.toEqual(new UserAlreadyExistsError());
  });
});

describe("Get users", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Users successfully retrieved", async () => {
    const mockUsers: User[] = [
      new User("testUser1", "test1", "user1", Role.MANAGER, "", ""),
      new User("testUser2", "test2", "user2", Role.MANAGER, "", ""),
    ];
    const mockFunction = jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(mockUsers);

    const result = await userController.getUsers();

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockUsers);
  });

  test("General error", async () => {
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUsers")
      .mockRejectedValueOnce(new Error("Error"));

    const result = userController.getUsers();

    expect(mockFunction).toHaveBeenCalledTimes(1);
    await expect(result).rejects.toEqual(new Error("Error"));
  });
});

describe("Get users by role", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Users successfully retrieved", async () => {
    const mockUsers: User[] = [
      new User("testUser1", "test1", "user1", Role.MANAGER, "", ""),
      new User("testUser2", "test2", "user2", Role.MANAGER, "", ""),
    ];
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUsersByRole")
      .mockResolvedValueOnce(mockUsers);

    const result = await userController.getUsersByRole("Manager");

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockUsers);
  });

  test("General error", async () => {
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUsersByRole")
      .mockRejectedValueOnce(new Error("Error"));

    const result = userController.getUsersByRole("Manager");

    expect(mockFunction).toHaveBeenCalledTimes(1);
    await expect(result).rejects.toEqual(new Error("Error"));
  });
});
