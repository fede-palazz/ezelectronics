import request from "supertest";
import { app } from '../../index';
import Authenticator from "../../src/routers/auth";
import { jest, test, expect, afterEach, describe } from '@jest/globals';
import { User, Role } from "../../src/components/user";
import ErrorHandler from "../../src/helper";
import ReviewController from "../../src/controllers/reviewController";
import { ProductNotFoundError } from "../../src/errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductReview } from "../../src/components/review";
import express from 'express';

// Mock dependencies
jest.mock('../../src/controllers/reviewController');
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

const baseURL = '/ezelectronics';

const testCustomer = new User('test', 'test', 'test', Role.CUSTOMER, 'test', 'test');
const testManager = new User('test', 'test', 'test', Role.MANAGER, 'test', 'test');
const testAdmin = new User('test', 'test', 'test', Role.ADMIN, 'test', 'test');

describe("ReviewRoutes", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe("POST /reviews/:model", () => {
        test("should add a review", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.mock("express-validator", () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));


            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(() => Promise.resolve());

            const response = await request(app)
                .post(baseURL + "/reviews/test")
                .send({ score: 5, comment: "Great product!" });

            expect(response.status).toBe(200);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("test", testCustomer, 5, "Great product!");
        });

        test("should return 401 if user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .post(baseURL + "/reviews/test-model")
                .send({ score: 5, comment: "Great product!" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated user", status: 401 });
        });

        test("should return 401 if user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app)
                .post(baseURL + "/reviews/test-model")
                .send({ score: 5, comment: "Great product!" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "User is not a customer", status: 401 });
        });

        test("Add a review - product not found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.mock("express-validator", () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));


            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(() => Promise.reject(new ProductNotFoundError()));

            const response = await request(app)
                .post(baseURL + "/reviews/test-model")
                .send({ score: 5, comment: "Great product!" });

            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("test-model", testCustomer, 5, "Great product!");
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not found", status: 404 });
        });

        test("Add a review - existing review", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.mock("express-validator", () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(() => Promise.reject(new ExistingReviewError()));

            const response = await request(app)
                .post(baseURL + "/reviews/test-model")
                .send({ score: 5, comment: "Great product!" });

            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("test-model", testCustomer, 5, "Great product!");
            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: "You have already reviewed this product", status: 409 });
        });
    });

    describe("GET /reviews/:model", () => {
        test("should return reviews for a product", async () => {
            const testReviews: ProductReview[] = [
                new ProductReview("test-model-1", testCustomer.username, 5, "2023-06-09", "Amazing product!"),
                new ProductReview("test-model-2", testCustomer.username, 4, "2023-06-08", "Very good!"),
                new ProductReview("test-model-3", testCustomer.username, 3, "2023-06-07", "It's okay."),
                new ProductReview("test-model-4", testCustomer.username, 2, "2023-06-06", "Not as expected."),
                new ProductReview("test-model-5", testCustomer.username, 1, "2023-06-05", "Terrible product!")
            ];

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockImplementation(() => Promise.resolve(testReviews));

            const response = await request(app).get(baseURL + "/reviews/test-model").send();

            expect(response.status).toBe(200);
            expect(response.body).toEqual(testReviews);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith("test-model");
        });

        test("should return 401 if user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .get(baseURL + "/reviews/test-model");
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated user", status: 401 });
        });

        test("should return 404 if product not found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockImplementation(() => Promise.reject(new ProductNotFoundError()));

            const response = await request(app).get(baseURL + "/reviews/test-model");
            console.log(response);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not found", status: 404 });
        });
    });


    describe("DELETE /reviews/:model", () => {
        test("should delete a review", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReview").mockImplementation(() => Promise.resolve(null));

            const response = await request(app).delete(baseURL + "/reviews/test-model");

            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("test-model", testCustomer);
        });

        test("should return 401 if user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .delete(baseURL + "/reviews/test-model")
                ;

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated user", status: 401 });
        });

        test("should return 401 if user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).delete(baseURL + "/reviews/test-model");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "User is not a customer", status: 401 });
        });

        test("should return 404 if review not found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                req.user = testCustomer;
                next();
            });
            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReview").mockImplementation(() => Promise.reject(new NoReviewProductError()));

            const response = await request(app).delete(baseURL + "/reviews/test-model");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "You have not reviewed this product", status: 404 });
        });
    });

    describe("DELETE /reviews/:model/all", () => {
        test("should delete all reviews of a product", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
                req.user = testManager; // or testAdmin
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockImplementation(() => Promise.resolve(null));

            const response = await request(app).delete(baseURL + "/reviews/test-model/all");

            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("test-model");
        });

        test("should return 401 if user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app).delete(baseURL + "/reviews/test-model/all");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated user", status: 401 });
        });

        test("should return 401 if user is not admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "User is not an admin or manager", status: 401 });
            });

            const response = await request(app).delete(baseURL + "/reviews/test-model/all");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "User is not an admin or manager", status: 401 });
        });

        test("should return 404 if product not found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
                req.user = testManager; // or testAdmin;
                next();
            });

            jest.mock("express-validator", () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => { },
                    isIn: () => { },
                    notEmpty: () => { },
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockImplementation(() => Promise.reject(new ProductNotFoundError()));

            const response = await request(app).delete(baseURL + "/reviews/test-model/all");


            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not found", status: 404 });
        });
    });

    describe("DELETE /reviews", () => {
        test("should delete all reviews", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
                req.user = testAdmin; // or testManager;
                next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockImplementation(() => Promise.resolve(null));

            const response = await request(app).delete(baseURL + "/reviews");


            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled();
        });

        test("should return 401 if user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app).delete(baseURL + "/reviews");


            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated user", status: 401 });
        });

        test("should return 401 if user is not admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
                res.status(401).json({ error: "User is not an admin or manager", status: 401 });
            });

            const response = await request(app).delete(baseURL + "/reviews");


            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "User is not an admin or manager", status: 401 });
        });
    });

    test("should handle errors", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
            req.user = testAdmin; // or testManager;
            next();
        });

        const errorMessage = "Internal Server Error";
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockImplementation(() => Promise.reject(new Error(errorMessage)));

        const response = await request(app).delete(baseURL + "/reviews");


        expect(response.status).toBe(503);
        expect(response.body).toEqual({ error: errorMessage, status: 503 });
    });
});
