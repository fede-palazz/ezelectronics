import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import db from "../src/db/db";
import { cleanup, rollbackTransaction, startTransaction } from "../src/db/cleanup";
import { Product } from "../src/components/product";
import { Category } from "../src/components/product";
import { afterEach, beforeEach } from "node:test";

const routePath = "/ezelectronics";

const customer = {
    username: "customer",
    name: "customer",
    surname: "customer",
    password: "customer",
    role: "Customer",
};

const admin = {
    username: "admin",
    name: "admin",
    surname: "admin",
    password: "admin",
    role: "Admin",
};

let customerCookie: string;
let adminCookie: string;

const postUser = async (userInfo: any) => {
    await request(app).post(`${routePath}/users`).send(userInfo).expect(200);
};

const login = async (userInfo: any) => {
    const us = userInfo.username;
    const psw = userInfo.password;
    const userCredentials = { username: us, password: psw };
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userCredentials)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                } else resolve(res.header["set-cookie"][0]);
            });
    });
};

beforeAll(async () => {
    await cleanup();
    await postUser(customer);
    await postUser(admin);
    customerCookie = await login(customer);
    adminCookie = await login(admin);
});

afterAll(async () => {
    await cleanup();
});

const product1 = new Product(
    1000,
    "iPhone 13",
    Category.SMARTPHONE,
    "2021-09-24",
    "6.1-inch display",
    10
);

const product2 = new Product(
    500,
    "iPhone 12",
    Category.SMARTPHONE,
    "2020-09-24",
    "6.1-inch display",
    5
);
const product3 = new Product(
    200,
    "MacBook Air",
    Category.LAPTOP,
    "2021-09-24",
    "13-inch display",
    3
);

describe("POST ezelectronics/products", () => {
    test("POST /ezelectronics/products - register a new product - Scenario 6.1", async () => {
        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", adminCookie)
            .send(product1)
            .expect(200);
    });

    test("POST /ezelectronics/products - product already existing - Scenario 6.2", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", adminCookie)
            .send(product)
            .expect(409);
    });

    test("POST /ezelectronics/products - product with invalid parameters - Scenario 6.3", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            -10
        );

        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", adminCookie)
            .send(product)
            .expect(422);
    });
});

describe("GET ezelectronics/products", () => {
    test("GET /ezelectronics/products - get a single product - Scenario 8.1", async () => {
        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product1.model}`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product1]);
            });
    });

    test("GET /ezelectronics/products - product not found - Scenario 8.2", async () => {
        await request(app)
            .get(`${routePath}/products?grouping=model&model=${"iPhone 14"}`)
            .set("Cookie", adminCookie)
            .expect(404);
    });

    test("GET /ezelectronics/products - get all products - Scenario 8.3", async () => {
        const product2 = new Product(
            500,
            "iPhone 12",
            Category.SMARTPHONE,
            "2020-09-24",
            "6.1-inch display",
            5
        );

        await request(app).post(`${routePath}/products`).set("Cookie", adminCookie).send(product2);

        await request(app)
            .get(`${routePath}/products`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product1, product2]);
            });
    });

    test("GET /ezelectronics/products - get all products of the same category - Scenario 8.4", async () => {
        await request(app).post(`${routePath}/products`).set("Cookie", adminCookie).send(product3);

        await request(app)
            .get(`${routePath}/products?grouping=category&category=${Category.SMARTPHONE}`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product1, product2]);
            });
    });

    test("GET /ezelectronics/products - category not found - Scenario 8.5", async () => {
        await request(app)
            .get(`${routePath}/products?grouping=category&category=${"Tablet"}`)
            .set("Cookie", adminCookie)
            .expect(422);
    });

    test("GET /ezelectronics/products - get all products of the same model - Scenario 8.6", async () => {
        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product1.model}`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product1]);
            });
    });
});

describe("PATCH ezelectronics/products/:model", () => {
    test("PATCH /ezelectronics/products/:model - change product quantity - Scenario 6.4", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        const newQuantity = 20;

        await request(app)
            .patch(`${routePath}/products/${product.model}`)
            .set("Cookie", adminCookie)
            .send({ quantity: newQuantity })
            .expect(200);
    });

    test("PATCH /ezelectronics/products/:model - product not found - Scenario 6.5", async () => {
        const product = new Product(
            1000,
            "iPhone 14",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        const newQuantity = 20;

        await request(app)
            .patch(`${routePath}/products/${product.model}`)
            .set("Cookie", adminCookie)
            .send({ quantity: newQuantity })
            .expect(404);
    });
});

describe("PATCH ezelectronics/products/:model/sell", () => {
    test("PATCH /ezelectronics/products/:model/sell - sell a product - Scenario 7.1", async () => {
        const quantity = 30;

        await request(app)
            .patch(`${routePath}/products/${product1.model}/sell`)
            .set("Cookie", adminCookie)
            .send({ quantity: quantity })
            .expect(200);
    });

    test("PATCH /ezelectronics/products/:model/sell - product not found - Scenario 7.2", async () => {
        const quantity = 5;

        await request(app)
            .patch(`${routePath}/products/${"iPhone 14"}/sell`)
            .set("Cookie", adminCookie)
            .send({ quantity: quantity })
            .expect(404);
    });

    test("PATCH /ezelectronics/products/:model/sell - product out of stock - Scenario 7.3", async () => {
        const quantity = 5;

        await request(app)
            .patch(`${routePath}/products/${product1.model}/sell`)
            .set("Cookie", adminCookie)
            .send({ quantity: quantity })
            .expect(409);
    });
});

describe("GET ezelectronics/products/available", () => {
    test("GET /ezelectronics/products - get all available products - Scenario 8.7", async () => {
        await request(app)
            .get(`${routePath}/products/available`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product2, product3]);
            });
    });

    test("GET /ezelectronics/products - get all available products of the same category - Scenario 8.8", async () => {
        await request(app)
            .get(
                `${routePath}/products/available?grouping=category&category=${Category.SMARTPHONE}`
            )
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product2]);
            });
    });

    test("GET /ezelectronics/products - get all available products of the same model - Scenario 8.9", async () => {
        await request(app)
            .get(`${routePath}/products/available?grouping=model&model=${product2.model}`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product2]);
            });
    });
});

describe("DELETE ezelectronics/products/:model", () => {
    test("DELETE /ezelectronics/products/:model - delete a product - Scenario 6.6", async () => {
        await request(app)
            .delete(`${routePath}/products/${product1.model}`)
            .set("Cookie", adminCookie)
            .expect(200);
    });

    test("DELETE /ezelectronics/products/:model - product not found - Scenario 6.7", async () => {
        await request(app)
            .delete(`${routePath}/products/${product1.model}`)
            .set("Cookie", adminCookie)
            .expect(404);
    });
});
