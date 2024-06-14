import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import {cleanup} from "../src/db/cleanup"
import { Category } from "../src/components/product"

const routePath = "/ezelectronics"

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }

let customerCookie: string
let adminCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    const us = userInfo.username
    const psw = userInfo.password
    const userCredentials = { username: us, password: psw }
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userCredentials)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    await postUser(admin)
    customerCookie = await login(customer)
    adminCookie = await login(admin)
})

afterAll(async () => {
    await cleanup();
})


describe("GET ezelectronics/carts", () => {
    test("GET /ezelectronics/carts - success - Scenario 10.1", async () => {
        db.run("INSERT INTO carts (id, paid, customer, paymentDate, total) VALUES (?, ?, ?, ?, ?)", [1, 0, "customer", "", 0])
        await request(app)
            .get(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual(
                    {
                        customer: "customer",
                        paid: false,
                        paymentDate: "",
                        total: 0,
                        products: []
                    }
                )
            });            
    })

});


describe("GET /ezelectronics/carts/history", () => {
 
    test("GET /ezelectronics/carts/history - success - Scenario 10.2", async () => {
        db.run("INSERT INTO carts (id, paid, customer, paymentDate, total) VALUES (?, ?, ?, ?, ?)", [2, 1, "customer", "2021-01-01", 0])
        db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?,?, ?)", ["Oppo Reno 5", Category.SMARTPHONE, 999.99, "2021-01-01", "details", 10])
        db.run("INSERT INTO productsInCarts(cart_id, product_model, quantity_in_cart) VALUES (?, ?, ?)", [2, "Oppo Reno 5", 1])
        await request(app)
        .get(`${routePath}/carts/history`)
        .set("Cookie", customerCookie)
        .expect(200)
        .expect((res) => {
            expect(res.body).toEqual( 
               [
                {
                    customer: "customer",
                    paid: true,
                    paymentDate: "2021-01-01",
                    total: 999.99,
                    products: [
                        {
                            model: "Oppo Reno 5",
                            category: "Smartphone",
                            price: 999.99,
                            quantity: 1
                        }
                    ]
                },
               ]
            );
        });
    });
});

describe('POST /ezelectronics/carts', () => { 

    test("POST /ezelectronics/carts - success - Scenario 10.3", async () => {
        db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?,?, ?)", ["iPhone 12", Category.SMARTPHONE, 999.99, "2021-01-01", "details", 10])
        await request(app)
            .post(`${routePath}/carts`)
            .set('Cookie', customerCookie)
            .send({ model: "iPhone 12" })
            .expect(200)
    });

    test('POST /ezelectronics/carts - product not found - Scenario 10.4', async () => {
        await request(app)
            .post(`${routePath}/carts`)
            .set('Cookie', customerCookie)
            .send({ model: "iPhone 13" })
            .expect(404)
    });

    test('POST /ezelectronics/carts - product out of stock - Scenario 10.5', async () => {
        
        db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?,?, ?)", ["iPhone 13", Category.SMARTPHONE, 999.99, "2021-01-01", "details", 0])

        await request(app)
        .post(`${routePath}/carts`)
        .set('Cookie', customerCookie)
        .send({ model: "iPhone 13" })
        .expect(409)
    });
 })

 describe("PATCH /ezelectronics/carts", () => {

    test("PATCH /ezelectronics/carts - success - Scenario 10.6", async () => {
        //Payment for cart with id 1
        await request(app)
        .patch(`${routePath}/carts`)
        .set("Cookie", customerCookie)
        .expect(200)
    });

    test("PATCH /ezelectronics/carts - cart does not exist - Scenario 10.8", async () => {
        //No current unpaid cart
        await request(app)
        .patch(`${routePath}/carts`)
        .set("Cookie", customerCookie)
        .expect(404)
    });

    test("PATCH /ezelectronics/carts - empty cart - Scenario 10.7", async () => {
        db.run("INSERT INTO carts (id, paid, customer, paymentDate, total) VALUES (?, ?, ?, ?, ?)", [3, 0, "customer", "", 0])
        await request(app)
        .patch(`${routePath}/carts`)
        .set("Cookie", customerCookie)
        .expect(400)
    });

   
 });

 describe("DELETE /ezelectronics/carts/products/:model", () => {

    test ("DELETE /ezelectronics/carts/products/:model - success - Scenario 10.9", async () => {
        db.run("INSERT INTO productsInCarts(cart_id, product_model, quantity_in_cart) VALUES (?, ?, ?)", [3, "iPhone 12", 1])
        await request(app)
        .delete(`${routePath}/carts/products/iPhone 12`)
        .set("Cookie", customerCookie)
        .expect(200)
    });

    test("DELETE /ezelectronics/carts/products/:model - product does not exist - Scenario 10.10", async () => {
        //iPhone 14 is not in the database
        await request(app)
        .delete(`${routePath}/carts/products/iPhone 14`)
        .set("Cookie", customerCookie)
        .expect(404)
    });

    test("DELETE /ezelectronics/carts/products/:model - product not in cart - Scenario 10.12", async () => {
        //iPhone 13 exists but not in cart
        await request(app)
        .delete(`${routePath}/carts/products/iPhone 13`)
        .set("Cookie", customerCookie)
        .expect(404)
    });

    test("DELETE /ezelectronics/carts/products/:model - cart does not exist - Scenario 10.11", async () => {
        db.run("DELETE FROM carts WHERE id = 4")
        await request(app)
        .delete(`${routePath}/carts/products/iPhone 12`)
        .set("Cookie", customerCookie)
        .expect(404)
    });

 });

 describe("DELETE /ezelectronics/carts/current", () => {

    test("DELETE /ezelectronics/carts/current - success - Scenario 11.1", async () => {
        db.run("INSERT INTO carts (id, paid, customer, paymentDate, total) VALUES (?, ?, ?, ?, ?)", [4, 0, "customer", "", 999.99])
        await request(app)
        .delete(`${routePath}/carts/current`)
        .set("Cookie", customerCookie)
        .expect(200)
    });

    test("DELETE /ezelectronics/carts/current - cart does not exist - Scenario 11.2", async () => {
        db.run("DELETE FROM carts ")
        db.run("DELETE FROM carts WHERE id = 5")
        await request(app)
        .delete(`${routePath}/carts/current`)
        .set("Cookie", customerCookie)
        .expect(404)
    });
 });

 describe("GET /ezelectronics/carts/all", () => {
    
        test("GET /ezelectronics/carts/all - success - Scenario 15.1", async () => {
            db.serialize(() => {
                db.run("DELETE FROM productsInCarts")
                db.run("DELETE FROM products")
                db.run("DELETE FROM carts")
                db.run("INSERT INTO carts (id, paid, customer, paymentDate, total) VALUES (?, ?, ?, ?, ?)", [5, 1, "customer", "2023-12-02",0])
                db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?,?, ?)", ["Oppo Reno 5", Category.SMARTPHONE, 999.99, "2021-01-01", "details", 10])
                db.run("INSERT INTO productsInCarts(cart_id, product_model, quantity_in_cart) VALUES (?, ?, ?)", [5, "Oppo Reno 5", 1])
            });
            await request(app)
            .get(`${routePath}/carts/all`)
            .set("Cookie", adminCookie)
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual(
                    [
                        {
                            customer: "customer",
                            paid: true,
                            paymentDate: "2023-12-02",
                            total: 999.99,
                            products: [
                                {
                                    model: "Oppo Reno 5",
                                    category: "Smartphone",
                                    price: 999.99,
                                    quantity: 1
                                }
                            ]
                        }
                    ]
                )
            });
        });
    
 });

 describe("DELETE /ezelectronics/carts", () => {

    test("DELETE /ezelectronics/carts - success - Scenario 16.1", async () => {
        await request(app)
        .delete(`${routePath}/carts`)
        .set("Cookie", adminCookie)
        .expect(200)
    });
 })