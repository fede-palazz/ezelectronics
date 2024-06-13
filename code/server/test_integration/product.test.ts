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
    await startTransaction();
    await cleanup();
    await postUser(customer);
    await postUser(admin);
    customerCookie = await login(customer);
    adminCookie = await login(admin);
});

afterAll(async () => {
    await cleanup();
    await rollbackTransaction();
});

describe("POST ezelectronics/products", () => {
    test("POST /ezelectronics/products - register a new product - Scenario 6.1", async () => {
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

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product.sellingPrice,
                product.model,
                product.category,
                product.arrivalDate,
                product.details,
                product.quantity,
            ]
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

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product.sellingPrice,
                product.model,
                product.category,
                product.arrivalDate,
                product.details,
                product.quantity,
            ]
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
            .expect(404);
    });
});

describe("PATCH ezelectronics/products/:model/sell", () => {
    test("PATCH /ezelectronics/products/:model/sell - sell a product - Scenario 7.1", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product.sellingPrice,
                product.model,
                product.category,
                product.arrivalDate,
                product.details,
                product.quantity,
            ]
        );

        const quantity = 5;

        await request(app)
            .patch(`${routePath}/products/${product.model}/sell`)
            .set("Cookie", adminCookie)
            .send({ quantity: quantity })
            .expect(200);
    });

    test("PATCH /ezelectronics/products/:model/sell - product not found - Scenario 7.2", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        const quantity = 5;

        await request(app)
            .patch(`${routePath}/products/${product.model}/sell`)
            .set("Cookie", adminCookie)
            .send({ quantity: quantity })
            .expect(404);
    });

    test("PATCH /ezelectronics/products/:model/sell - product out of stock - Scenario 7.3", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            0
        );

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product.sellingPrice,
                product.model,
                product.category,
                product.arrivalDate,
                product.details,
                product.quantity,
            ]
        );

        const quantity = 5;

        await request(app)
            .patch(`${routePath}/products/${product.model}/sell`)
            .set("Cookie", adminCookie)
            .send({ quantity: quantity })
            .expect(409);
    });
});

describe("GET ezelectronics/products", () => {
    test("GET /ezelectronics/products - get a single product - Scenario 8.1", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product.sellingPrice,
                product.model,
                product.category,
                product.arrivalDate,
                product.details,
                product.quantity,
            ]
        );

        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product.model}`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product]);
            });
    });

    test("GET /ezelectronics/products - product not found - Scenario 8.2", async () => {
        const product = new Product(
            1000,
            "iPhone 13",
            Category.SMARTPHONE,
            "2021-09-24",
            "6.1-inch display",
            10
        );

        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product.model}`)
            .set("Cookie", adminCookie)
            .expect(404);
    });

    test("GET /ezelectronics/products - get all products - Scenario 8.3", async () => {
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

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product1.sellingPrice,
                product1.model,
                product1.category,
                product1.arrivalDate,
                product1.details,
                product1.quantity,
            ]
        );

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product2.sellingPrice,
                product2.model,
                product2.category,
                product2.arrivalDate,
                product2.details,
                product2.quantity,
            ]
        );

        await request(app)
            .get(`${routePath}/products`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product1, product2]);
            });
    });

    test("GET /ezelectronics/products - get all products of the same category - Scenario 8.4", async () => {
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

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product1.sellingPrice,
                product1.model,
                product1.category,
                product1.arrivalDate,
                product1.details,
                product1.quantity,
            ]
        );

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product2.sellingPrice,
                product2.model,
                product2.category,
                product2.arrivalDate,
                product2.details,
                product2.quantity,
            ]
        );

        db.run(
            "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [
                product3.sellingPrice,
                product3.model,
                product3.category,
                product3.arrivalDate,
                product3.details,
                product3.quantity,
            ]
        );

        await request(app)
            .get(`${routePath}/products?grouping=category&category=${Category.SMARTPHONE}`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([product1, product2]);
            });
    });
});
