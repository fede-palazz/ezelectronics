import { test, expect, jest } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import {
  UnauthorizedUserError,
  UserAlreadyExistsError,
  UserIsAdminError,
  UserNotAdminError,
  UserNotFoundError,
} from "../../src/errors/userError";
import { Role, User } from "../../src/components/user";
import { DateError, Utility } from "../../src/utilities";

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
    jest.resetAllMocks();
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
    jest.resetAllMocks();
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
    jest.resetAllMocks();
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

describe("Get user by username", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Non admin user should retrieve his own information", async () => {
    const mockUser: User = new User("testUser", "test", "user", Role.MANAGER, "", "");
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);

    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = await userController.getUserByUsername(mockUser, "testUser");

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockUser);
  });

  test("Non admin user shouldn't retrieve other users' information", async () => {
    const mockUser: User = new User("testUser1", "test", "user", Role.MANAGER, "", "");
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = userController.getUserByUsername(mockUser, "testUser2");

    expect(mockFunction).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(1);
    await expect(result).rejects.toEqual(new UnauthorizedUserError());
  });

  test("Admin user should retrieve his own information", async () => {
    const mockUser: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(true);

    const result = await userController.getUserByUsername(mockUser, "adminUser");

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockUser);
  });

  test("Admin user should retrieve other users' information", async () => {
    const mockUser: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(true);

    const result = await userController.getUserByUsername(mockUser, "testUser");

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(mockUser);
  });
});

describe("Delete user by username", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Non admin user should delete his own account", async () => {
    const mockUser: User = new User("testUser", "test", "user", Role.MANAGER, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValue(mockUser);
    const mockdeleteUser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = await userController.deleteUser(mockUser, "testUser");

    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockdeleteUser).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(2);
    expect(result).toBeTruthy();
  });

  test("Non admin user shouldn't delete other users' accounts", async () => {
    const mockUser1: User = new User("testUser1", "test1", "user1", Role.MANAGER, "", "");
    const mockUser2: User = new User("testUser2", "test2", "user2", Role.MANAGER, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser2);
    const mockdeleteUser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = userController.deleteUser(mockUser1, "testUser2");

    await expect(result).rejects.toEqual(new UnauthorizedUserError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockdeleteUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(2);
  });

  test("Admin user shouldn't delete his own account", async () => {
    const adminUser: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(adminUser);
    const mockdeleteUser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(true);

    const result = userController.deleteUser(adminUser, "adminUser");

    await expect(result).rejects.toEqual(new UserIsAdminError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockdeleteUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(1);
  });

  test("Admin user should delete other non admin users' accounts", async () => {
    const adminUser: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    const mockUser: User = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);
    const mockdeleteUser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const mockUtility = jest
      .spyOn(Utility, "isAdmin")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const result = await userController.deleteUser(adminUser, "testUser");

    expect(result).toBeTruthy();
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockdeleteUser).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(2);
  });

  test("Admin user shouldn't delete other admin users' accounts", async () => {
    const adminUser1: User = new User("adminUser1", "admin1", "user1", Role.ADMIN, "", "");
    const adminUser2: User = new User("adminUser2", "admin2", "user2", Role.ADMIN, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(adminUser2);
    const mockdeleteUser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValueOnce(true);

    const result = userController.deleteUser(adminUser1, "adminUser2");

    await expect(result).rejects.toEqual(new UserIsAdminError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockdeleteUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(1);
  });

  test("It should return an error if username does not exist", async () => {
    const testUser: User = new User("testUser", "test", "user", Role.CUSTOMER, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockRejectedValueOnce(new UserNotFoundError());
    const mockdeleteUser = jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValueOnce(false);

    const result = userController.deleteUser(testUser, "testUser");

    await expect(result).rejects.toEqual(new UserNotFoundError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockdeleteUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(0);
  });
});

describe("Delete user by username", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Admin user should delete all users in the db", async () => {
    const mockFunction = jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true);

    const result = await userController.deleteAll();

    expect(result).toBeTruthy();
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  test("General error", async () => {
    const mockFunction = jest
      .spyOn(UserDAO.prototype, "deleteAll")
      .mockRejectedValue(new Error("error"));

    const result = userController.deleteAll();

    expect(result).rejects.toEqual(new Error("error"));
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});

describe("Update user information", () => {
  beforeEach(() => {
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.resetAllMocks();
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("It should throw an error if birthdate is a future date", async () => {
    const mockUser: User = new User("testUser", "test", "user", Role.MANAGER, "", "2060-05-21");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValue(mockUser);
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockResolvedValueOnce(mockUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = userController.updateUserInfo(
      mockUser,
      mockUser.name,
      mockUser.surname,
      mockUser.address,
      mockUser.birthdate,
      mockUser.username
    );

    await expect(result).rejects.toEqual(new DateError());
    expect(mockgetUser).toHaveBeenCalledTimes(0);
    expect(mockUpdateUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(0);
  });

  test("It should throw an error if username is incorrect", async () => {
    const mockUser: User = new User("testUser", "test", "user", Role.MANAGER, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockRejectedValueOnce(new UserNotFoundError());
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockResolvedValueOnce(mockUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = userController.updateUserInfo(
      mockUser,
      mockUser.name,
      mockUser.surname,
      mockUser.address,
      mockUser.birthdate,
      mockUser.username
    );

    await expect(result).rejects.toEqual(new UserNotFoundError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(0);
  });

  test("Non admin user should update his own information", async () => {
    const mockUser: User = new User("testUser", "test", "user", Role.MANAGER, "", "");
    const mockUpdatedUser: User = new User(
      "testUser",
      "test_updated",
      "user_updated",
      Role.MANAGER,
      "",
      ""
    );
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockResolvedValueOnce(mockUpdatedUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = await userController.updateUserInfo(
      mockUser,
      mockUser.name,
      mockUser.surname,
      mockUser.address,
      mockUser.birthdate,
      mockUser.username
    );

    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(2);
    expect(result).toStrictEqual(mockUpdatedUser);
  });

  test("Non admin user shouldn't update other users' information", async () => {
    const mockUser: User = new User("testUser", "test", "user", Role.MANAGER, "", "");
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockUser);
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockResolvedValueOnce(mockUser);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(false);

    const result = userController.updateUserInfo(
      mockUser,
      mockUser.name,
      mockUser.surname,
      mockUser.address,
      mockUser.birthdate,
      "anotherUser"
    );

    expect(result).rejects.toEqual(new UserNotAdminError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(0);
  });

  test("Admin user should update his own information", async () => {
    const mockAdmin: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    const mockUpdatedAdmin: User = new User(
      "adminUser",
      "admin_updated",
      "user_updated",
      Role.ADMIN,
      "",
      ""
    );
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockAdmin);
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockResolvedValueOnce(mockUpdatedAdmin);
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(true);

    const result = await userController.updateUserInfo(
      mockAdmin,
      mockAdmin.name,
      mockAdmin.surname,
      mockAdmin.address,
      mockAdmin.birthdate,
      "adminUser"
    );

    expect(result).toStrictEqual(mockUpdatedAdmin);
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(3);
  });

  test("Admin user shouldn't update other admin users' information", async () => {
    const mockAdmin: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    // const mockUpdatedAdmin: User = new User(
    //   "adminUser",
    //   "admin_updated",
    //   "user_updated",
    //   Role.ADMIN,
    //   "",
    //   ""
    // );
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockAdmin);
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockRejectedValueOnce(new UnauthorizedUserError());
    const mockUtility = jest.spyOn(Utility, "isAdmin").mockReturnValue(true);

    const result = userController.updateUserInfo(
      mockAdmin,
      mockAdmin.name,
      mockAdmin.surname,
      mockAdmin.address,
      mockAdmin.birthdate,
      "anotherAdminUser"
    );

    await expect(result).rejects.toEqual(new UnauthorizedUserError());
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledTimes(0);
    expect(mockUtility).toHaveBeenCalledTimes(3);
  });

  test("Admin user should update other non admin users' information", async () => {
    const mockAdmin: User = new User("adminUser", "admin", "user", Role.ADMIN, "", "");
    const mockUpdatedUser: User = new User(
      "testUser",
      "test_updated",
      "user_updated",
      Role.MANAGER,
      "",
      ""
    );
    const mockgetUser = jest
      .spyOn(UserDAO.prototype, "getUserByUsername")
      .mockResolvedValueOnce(mockAdmin);
    const mockUpdateUser = jest
      .spyOn(UserDAO.prototype, "updateUserInfo")
      .mockResolvedValueOnce(mockUpdatedUser);
    const mockUtility = jest
      .spyOn(Utility, "isAdmin")
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const result = await userController.updateUserInfo(
      mockAdmin,
      mockUpdatedUser.name,
      mockUpdatedUser.surname,
      mockUpdatedUser.address,
      mockUpdatedUser.birthdate,
      mockUpdatedUser.username
    );

    expect(result).toStrictEqual(mockUpdatedUser);
    expect(mockgetUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUtility).toHaveBeenCalledTimes(3);
  });
});
