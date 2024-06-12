import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";

const baseURL = "/ezelectronics/users";
const baseAuthURL = "/ezelectronics/sessions";

const customer = {
  username: "testUser",
  name: "test",
  surname: "user",
  password: "password",
  role: "Customer",
};
const admin = {
  username: "testAdmin",
  name: "test",
  surname: "admin",
  password: "password",
  role: "Admin",
};
const admin2 = {
  username: "testAdmin2",
  name: "test",
  surname: "admin",
  password: "password",
  role: "Admin",
};

// Cookies for the users. We use them to keep users logged in.
let customerCookie: string;
let adminCookie: string;

// Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
// It's an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
  await request(app).post(baseURL).send(userInfo).expect(200);
};

// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(baseAuthURL)
      .send(userInfo)
      .expect(200)
      .end((err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res.header["set-cookie"][0]);
      });
  });
};

// Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
  await cleanup();
  await postUser(admin);
  adminCookie = await login(admin);
});

//After executing tests, we remove everything from our test database
afterAll(async () => {
  await cleanup();
});

describe("POST /users", () => {
  test("It should return a 200 success code and create a new user", async () => {
    // Create a customer user
    await request(app).post(baseURL).send(customer).expect(200);

    // Get all users
    const users = await request(app).get(baseURL).set("Cookie", adminCookie).expect(200);

    expect(users.body).toHaveLength(2);

    let cust = users.body.find((user: any) => user.username === customer.username);
    expect(cust).toBeDefined();
    expect(cust.name).toBe(customer.name);
    expect(cust.surname).toBe(customer.surname);
    expect(cust.role).toBe(customer.role);
  });

  test("It should return a 409 error code if the username already exists", async () => {
    await request(app).post(baseURL).send(customer).expect(409);

    const users = await request(app).get(baseURL).set("Cookie", adminCookie).expect(200);
    expect(users.body).toHaveLength(2);
  });

  test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    await request(app)
      .post(baseURL)
      .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" })
      .expect(422);
    await request(app)
      .post(baseURL)
      .send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" })
      .expect(422);
    await request(app)
      .post(baseURL)
      .send({ username: "test", name: "test", surname: "", password: "test", role: "Customer" })
      .expect(422);
    await request(app)
      .post(baseURL)
      .send({ username: "test", name: "test", surname: "test", password: "", role: "Customer" })
      .expect(422);
    await request(app)
      .post(baseURL)
      .send({ username: "test", name: "test", surname: "test", password: "test", role: "" })
      .expect(422);
  });
});

describe("DELETE /sessions/current", () => {
  test("It should successfully log out the logged in user", async () => {
    const customerCookie = await login(customer);
    // Get current user
    await request(app)
      .get(`${baseURL}/${customer.username}`)
      .set("Cookie", customerCookie)
      .expect(200);
    // Logout
    await request(app).delete(`${baseAuthURL}/current`).set("Cookie", customerCookie).expect(200);
    // Expect to be unauthorized
    await request(app)
      .get(`${baseURL}/${customer.username}`)
      .set("Cookie", customerCookie)
      .expect(401);
  });

  test("It should fail if user is already logged out", async () => {
    const customerCookie = await login(customer);
    // Logout
    await request(app).delete(`${baseAuthURL}/current`).set("Cookie", customerCookie).expect(200);
    // Try to logout again
    await request(app).delete(`${baseAuthURL}/current`).set("Cookie", customerCookie).expect(401);
  });
});

describe("POST /sessions", () => {
  test("It should return a 200 success code if credentials are correct", async () => {
    const customerCookie = await login(customer);
    expect(customerCookie).toBeDefined();
  });

  test("It should return a 401 error code if credentials are wrong", async () => {
    const invalidCustomer = {
      username: "invalid",
      name: "invalid",
      surname: "invalid",
      password: "invalid",
      role: "Customer",
    };
    await request(app).post(baseAuthURL).send(invalidCustomer).expect(401);
  });
});

describe("GET /users", () => {
  test("It should return an array of users", async () => {
    const users = await request(app).get(baseURL).set("Cookie", adminCookie).expect(200);
    expect(users.body).toHaveLength(2);

    const cust = users.body.find((user: any) => user.username === customer.username);
    expect(cust).toBeDefined();
    expect(cust.name).toBe(customer.name);
    expect(cust.surname).toBe(customer.surname);
    expect(cust.role).toBe(customer.role);

    const adm = users.body.find((user: any) => user.username === admin.username);
    console.log(adm);
    expect(adm).toBeDefined();
    expect(adm.name).toBe(admin.name);
    expect(adm.surname).toBe(admin.surname);
    expect(adm.role).toBe(admin.role);
  });

  test("It should return a 401 error code if the user is not an Admin", async () => {
    customerCookie = await login(customer);
    await request(app).get(baseURL).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
    await request(app).get(baseURL).expect(401); // We can also call the route without any cookie. The result should be the same
  });
});

describe("GET /users/roles/:role", () => {
  test("It should return an array of users with a specific role", async () => {
    const admins = await request(app)
      .get(`${baseURL}/roles/Admin`)
      .set("Cookie", adminCookie)
      .expect(200);
    expect(admins.body).toHaveLength(1);

    let adm = admins.body[0];
    expect(adm.username).toBe(admin.username);
    expect(adm.name).toBe(admin.name);
    expect(adm.surname).toBe(admin.surname);
  });

  test("It should return a 422 error code if the role is not valid", async () => {
    await request(app).get(`${baseURL}/roles/Invalid`).set("Cookie", adminCookie).expect(422);
  });

  test("It should return a 401 error code if the user is not an Admin", async () => {
    customerCookie = await login(customer);
    await request(app).get(`${baseURL}/roles/Admin`).set("Cookie", customerCookie).expect(401);
  });

  test("It should return a 401 error code if the user is not logged in", async () => {
    await request(app).get(`${baseURL}/roles/Admin`).expect(401);
  });
});

describe("GET /users/:username", () => {
  test("It should return a user corresponding to the username", async () => {
    const response = await request(app)
      .get(`${baseURL}/${customer.username}`)
      .set("Cookie", customerCookie)
      .expect(200);
    expect(response.body).toBeDefined();

    const user = response.body;
    expect(user.username).toBe(customer.username);
    expect(user.name).toBe(customer.name);
    expect(user.surname).toBe(customer.surname);
  });

  test("It should return any user corresponding to the username if the requesting user is an Admin", async () => {
    const response = await request(app)
      .get(`${baseURL}/${customer.username}`)
      .set("Cookie", adminCookie)
      .expect(200);
    expect(response.body).toBeDefined();

    const user = response.body;
    expect(user.username).toBe(customer.username);
    expect(user.name).toBe(customer.name);
    expect(user.surname).toBe(customer.surname);
  });

  test("It should return a 404 error code if the username is not valid", async () => {
    await request(app).get(`${baseURL}/Invalid`).set("Cookie", adminCookie).expect(404);
  });

  test("It should return a 401 error code if the user is not an Admin and the target user has a different username", async () => {
    customerCookie = await login(customer);
    await request(app)
      .get(`${baseURL}/${admin.username}`)
      .set("Cookie", customerCookie)
      .expect(401);
  });

  test("It should return a 401 error code if the user is not logged in", async () => {
    await request(app).get(`${baseURL}/${customer.username}`).expect(401);
  });
});

describe("PATCH /users/:username", () => {
  test("It should return a 200 success code and the updated information about the user", async () => {
    const newCustomer = {
      username: "testUser",
      name: "new",
      surname: "new",
      password: "password",
      role: "Customer",
      birthdate: "2000-12-03",
      address: "new",
    };
    const customerCookie = await login(customer);
    const response = await request(app)
      .patch(`${baseURL}/${customer.username}`)
      .send(newCustomer)
      .set("Cookie", customerCookie)
      .expect(200);
    const receivedCustomer = response.body;
    expect(receivedCustomer.username).toBe(newCustomer.username);
    expect(receivedCustomer.name).toBe(newCustomer.name);
    expect(receivedCustomer.surname).toBe(newCustomer.surname);
    expect(receivedCustomer.birthdate).toBe(newCustomer.birthdate);
    expect(receivedCustomer.address).toBe(newCustomer.address);
  });

  test("It should return a 404 error code if the username is invalid", async () => {
    const newCustomer = {
      username: "testUser",
      name: "new",
      surname: "new",
      password: "password",
      role: "Customer",
      birthdate: "2000-12-03",
      address: "new",
    };
    const customerCookie = await login(customer);
    await request(app)
      .patch(`${baseURL}/invalid`)
      .send(newCustomer)
      .set("Cookie", customerCookie)
      .expect(404);
  });

  test("It should return a 401 error code if username does not correspond to the one of the logged in user (if it is not an Admin)", async () => {
    const newCustomer = {
      username: "testUser2",
      name: "test",
      surname: "test",
      password: "password",
      role: "Customer",
      birthdate: "2000-12-03",
      address: "test",
    };
    postUser(newCustomer); // Create new customer

    const customerCookie = await login(newCustomer);
    await request(app)
      .patch(`${baseURL}/testUser`)
      .send(newCustomer)
      .set("Cookie", customerCookie)
      .expect(401);
  });

  test("It should return a 400 error code if birthdate is a future date", async () => {
    const newCustomer = {
      username: "testUser2",
      name: "test",
      surname: "test",
      password: "password",
      role: "Customer",
      birthdate: "2036-12-03",
      address: "test",
    };
    const customerCookie = await login(newCustomer);
    await request(app)
      .patch(`${baseURL}/testUser2`)
      .send(newCustomer)
      .set("Cookie", customerCookie)
      .expect(400);
  });

  test("It should return a 200 success code if an Admin wants to modify a user", async () => {
    const newCustomer = {
      username: "testUser2",
      name: "test",
      surname: "test",
      password: "password",
      role: "Customer",
      birthdate: "2000-12-03",
      address: "test",
    };
    await request(app)
      .patch(`${baseURL}/testUser2`)
      .send(newCustomer)
      .set("Cookie", adminCookie)
      .expect(200);
  });

  test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    const customerCookie = await login(customer);
    await request(app)
      .patch(`${baseURL}/${customer.username}`)
      .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" })
      .set("Cookie", customerCookie)
      .expect(422);
    await request(app)
      .patch(`${baseURL}/${customer.username}`)
      .send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" })
      .set("Cookie", customerCookie)
      .expect(422);
    await request(app)
      .patch(`${baseURL}/${customer.username}`)
      .send({ username: "test", name: "test", surname: "", password: "test", role: "Customer" })
      .set("Cookie", customerCookie)
      .expect(422);
    await request(app)
      .patch(`${baseURL}/${customer.username}`)
      .send({ username: "test", name: "test", surname: "test", password: "", role: "Customer" })
      .set("Cookie", customerCookie)
      .expect(422);
    await request(app)
      .patch(`${baseURL}/${customer.username}`)
      .send({ username: "test", name: "test", surname: "test", password: "test", role: "" })
      .set("Cookie", customerCookie)
      .expect(422);
  });
});

describe("DELETE /users/:username", () => {
  test("It should return a 401 error code if a non Admin user try to delete another user", async () => {
    const customerCookie = await login(customer);
    await request(app).delete(`${baseURL}/testUser2`).set("Cookie", customerCookie).expect(401);
  });

  test("It should return a 400 error code if username is invalid", async () => {
    const customerCookie = await login(customer);
    await request(app).delete(`${baseURL}/Invalid`).set("Cookie", customerCookie).expect(404);
  });

  test("It should return a 401 error code if user is not logged in", async () => {
    await request(app).delete(`${baseURL}/testUser`).expect(401);
  });

  test("It should return a 401 error when the calling user is an Admin and username represents a different Admin user", async () => {
    await postUser(admin2);
    await request(app).delete(`${baseURL}/testAdmin2`).set("Cookie", adminCookie).expect(401);
  });

  test("It should return a 200 success code if a user try to delete its own account", async () => {
    const customerCookie = await login(customer);
    await request(app).delete(`${baseURL}/testUser`).set("Cookie", customerCookie).expect(200);

    await request(app)
      .get(`${baseURL}/${customer.username}`)
      .set("Cookie", adminCookie)
      .expect(404);
  });
});

describe("DELETE /users", () => {
  test("It should return a 401 error code if user is not an Admin", async () => {
    await postUser(customer);
    const customerCookie = await login(customer);
    await request(app).delete(`${baseURL}`).set("Cookie", customerCookie).expect(401);
  });

  test("It should return a 401 error code if user is not logged in", async () => {
    await request(app).delete(`${baseURL}`).expect(401);
  });

  test("It should return a 200 success code if user is an Admin", async () => {
    await request(app).delete(`${baseURL}`).set("Cookie", adminCookie).expect(200);

    // Get all users
    const users = await request(app).get(baseURL).set("Cookie", adminCookie).expect(200);
    expect(users.body).toHaveLength(2);
  });
});
