import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";

const routePath = "/ezelectronics"; //Base route path for the API

// Default user information. We use them to create users and evaluate the returned values
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

// Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string;
let adminCookie: string;

// Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
// It's an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
  await request(app).post(`${routePath}/users`).send(userInfo).expect(200);
};

// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(`${routePath}/sessions`)
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
    await request(app).post(`${routePath}/users`).send(customer).expect(200);

    const users = await request(app)
      .get(`${routePath}/users`)
      .set("Cookie", adminCookie)
      .expect(200);

    expect(users.body).toHaveLength(2);

    let cust = users.body.find((user: any) => user.username === customer.username);
    expect(cust).toBeDefined();
    expect(cust.name).toBe(customer.name);
    expect(cust.surname).toBe(customer.surname);
    expect(cust.role).toBe(customer.role);
  });

  test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    await request(app)
      .post(`${routePath}/users`)
      .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" })
      .expect(422);
    await request(app)
      .post(`${routePath}/users`)
      .send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" })
      .expect(422);
  });
});

describe("GET /users", () => {
  test("It should return an array of users", async () => {
    const users = await request(app)
      .get(`${routePath}/users`)
      .set("Cookie", adminCookie)
      .expect(200);
    expect(users.body).toHaveLength(2);
    let cust = users.body.find((user: any) => user.username === customer.username);
    expect(cust).toBeDefined();
    expect(cust.name).toBe(customer.name);
    expect(cust.surname).toBe(customer.surname);
    expect(cust.role).toBe(customer.role);
    let adm = users.body.find((user: any) => user.username === admin.username);
    expect(adm).toBeDefined();
    expect(adm.name).toBe(admin.name);
    expect(adm.surname).toBe(admin.surname);
    expect(adm.role).toBe(admin.role);
  });

  test("It should return a 401 error code if the user is not an Admin", async () => {
    customerCookie = await login(customer);
    await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401); //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
    await request(app).get(`${routePath}/users`).expect(401); //We can also call the route without any cookie. The result should be the same
  });
});

describe("GET /users/roles/:role", () => {
  test("It should return an array of users with a specific role", async () => {
    //Route parameters are set in this way by placing directly the value in the path
    //It is not possible to send an empty value for the role (/users/roles/ will not be recognized as an existing route, it will return 404)
    //Empty route parameters cannot be tested in this way, but there should be a validation block for them in the route
    const admins = await request(app)
      .get(`${routePath}/users/roles/Admin`)
      .set("Cookie", adminCookie)
      .expect(200);
    expect(admins.body).toHaveLength(1); //In this case, we expect only one Admin user to be returned
    let adm = admins.body[0];
    expect(adm.username).toBe(admin.username);
    expect(adm.name).toBe(admin.name);
    expect(adm.surname).toBe(admin.surname);
  });

  test("It should fail if the role is not valid", async () => {
    //Invalid route parameters can be sent and tested in this way. The 'expect' block should contain the corresponding code
    await request(app)
      .get(`${routePath}/users/roles/Invalid`)
      .set("Cookie", adminCookie)
      .expect(422);
  });
});
