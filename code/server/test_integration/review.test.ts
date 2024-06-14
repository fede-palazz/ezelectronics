import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import db from "../src/db/db";
import { cleanup } from "../src/db/cleanup";

const routePath = "/ezelectronics";

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };

let customerCookie: string;
let adminCookie: string;

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

const login = async (userInfo: any) => {
    const userCredentials = { username: userInfo.username, password: userInfo.password };
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userCredentials)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
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

describe("POST /reviews/:model", () => {
    test("should add a review - Scenario 17.1", async () => {

        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)", ["testModel", "TestCategory", 99.99, "2023-01-01", "details", 100], (err) => {
                if (err) {
                    console.error("Error inserting product:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Effettua la richiesta per aggiungere una recensione
        await request(app)
            .post(routePath + "/reviews/testModel")
            .set("Cookie", customerCookie)
            .send({ score: 5, comment: "Great product!" })
            .expect(200)

        // Verifica che la recensione sia stata aggiunta nel database
        const review = await new Promise<any>((resolve, reject) => {
            db.get("SELECT * FROM reviews WHERE product = ? AND user = ?", ["testModel", customer.username], (err, row) => {
                if (err) {
                    console.error("Error fetching review:", err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        // Controlla i dettagli della recensione
        expect(review).not.toBeNull();
        expect(review.score).toBe(5);
        expect(review.comment).toBe("Great product!");
    });

    test("should return 404 if product does not exist", async () => {
        await request(app)
            .post(routePath + "/reviews/nonExistingModel")
            .set("Cookie", customerCookie)
            .send({ score: 5, comment: "Great product!" })
            .expect(404);
    });

    test("should return 409 if customer already reviewed the product", async () => {
        await request(app)
            .post(routePath + "/reviews/testModel")
            .set("Cookie", customerCookie)
            .send({ score: 5, comment: "Great product!" })
            .expect(409);
    });

    test("should return 422 if score is out of range", async () => {
        await request(app)
            .post(routePath + "/reviews/testModel")
            .set("Cookie", customerCookie)
            .send({ score: 6, comment: "Great product!" })
            .expect(422);
    });

    test("should return 422 if comment is null", async () => {
        await request(app)
            .post(routePath + "/reviews/testModel")
            .set("Cookie", customerCookie)
            .send({ score: 5, comment: null })
            .expect(422);
    });

    test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
        await request(app)
            .post(routePath + "/reviews/testModel")
            .set("Cookie", customerCookie)
            .send({ score: "", comment: "Great product!" })
            .expect(422);
        await request(app)
            .post(routePath + "/reviews/testModel")
            .set("Cookie", customerCookie)
            .send({ score: 5, comment: "" })
            .expect(422);
    });

});

describe("DELETE /reviews/:model", () => {
    test("should delete a review - Scenario 17.2", async () => {

        const response = await request(app)
            .delete(`${routePath}/reviews/testModel`)
            .set("Cookie", customerCookie);

        expect(response.status).toBe(200);

        const review = await new Promise<any>((resolve, reject) => {
            db.get("SELECT * FROM reviews WHERE product = ? AND user = ?", ["testModel", customer.username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        expect(review).toBeUndefined();
    });

    test("should return 404 if product does not exist", async () => {
        const response = await request(app)
            .delete(`${routePath}/reviews/nonExistingModel`)
            .set("Cookie", customerCookie);

        expect(response.status).toBe(404);
    });

    test("should return 404 if customer has no review for the product", async () => {
        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)", ["anotherModel", "TestCategory", 99.99, "2023-01-01", "details", 100], (err) => {
                if (err) {
                    console.error("Error inserting product:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const response = await request(app)
            .delete(`${routePath}/reviews/anotherModel`)
            .set("Cookie", customerCookie);

        expect(response.status).toBe(404);
    });
});

describe("GET /reviews/:model", () => {
    test("should return reviews for a product - Scenario 18.1", async () => {

        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO reviews (user, product, score, date, comment) VALUES (?, ?, ?, ?, ?)", [customer.username, "testModel", 5, "2023-06-09", "Amazing product!"], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const response = await request(app)
            .get(`${routePath}/reviews/testModel`)
            .set("Cookie", customerCookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            { user: customer.username, model: "testModel", score: 5, date: "2023-06-09", comment: "Amazing product!" }
        ]);
    });

    test("should return 404 if product does not exist", async () => {
        const response = await request(app)
            .get(`${routePath}/reviews/notamodel`)
            .set("Cookie", customerCookie);

        expect(response.status).toBe(404);

    });

});

describe("DELETE /reviews/:model/all", () => {
    test("should delete all reviews of a product - Scenario 19.1", async () => {

        const response = await request(app)
            .delete(`${routePath}/reviews/testModel/all`)
            .set("Cookie", adminCookie);

        expect(response.status).toBe(200);

        const reviews = await new Promise<any[]>((resolve, reject) => {
            db.all("SELECT * FROM reviews WHERE product = ?", ["testModel"], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        expect(reviews.length).toBe(0);
    });

    test("should return 404 if product does not exist", async () => {
        const response = await request(app)
            .delete(`${routePath}/reviews/nonExistingModel/all`)
            .set("Cookie", adminCookie);

        expect(response.status).toBe(404);
    });
});

describe("DELETE /reviews", () => {
    test("should delete all reviews - Scenario 19.2", async () => {
        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)", ["testModel1", "TestCategory", 99.99, "2023-01-01", "details", 100], (err) => {
                if (err) {
                    console.error("Error inserting product:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)", ["testModel2", "TestCategory", 99.99, "2023-01-01", "details", 100], (err) => {
                if (err) {
                    console.error("Error inserting product:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO reviews (user, product, score, date, comment) VALUES (?, ?, ?, ?, ?)", [customer.username, "testModel1", 5, "2023-06-09", "Amazing product!"], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO reviews (user, product, score, date, comment) VALUES (?, ?, ?, ?, ?)", [customer.username, "testModel2", 4, "2023-06-08", "Very good!"], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const response = await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie", adminCookie);

        expect(response.status).toBe(200);

        const reviews = await new Promise<any[]>((resolve, reject) => {
            db.all("SELECT * FROM reviews", (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        expect(reviews.length).toBe(0);
    });
});
