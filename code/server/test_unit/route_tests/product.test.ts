import { jest, test, expect, beforeEach, afterEach, describe } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";

import Authenticator from "../../src/routers/auth";
import ProductController from "../../src/controllers/productController";
import { Role, User } from "../../src/components/user";
import ErrorHandler from "../../src/helper";
import { Category, Product } from "../../src/components/product";
import {
    EmptyProductStockError,
    LowProductStockError,
    ProductAlreadyExistsError,
    ProductNotFoundError,
} from "../../src/errors/productError";
import { DateError } from "../../src/utilities";
import { group } from "console";

jest.mock("../../src/controllers/productController");
jest.mock("../../src/routers/auth");

const baseURL = "/ezelectronics";

const testAdmin = new User("test", "test", "test", Role.ADMIN, "test", "test");

const mockProduct = new Product(
    99.99,
    "testModel",
    Category.APPLIANCE,
    "2024-01-01",
    "Test Details",
    100
);

describe("POST /", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Register products", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
                custom: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce();

        const response = await request(app).post(`${baseURL}/products`).send({
            model: mockProduct.model,
            category: mockProduct.category,
            quantity: mockProduct.quantity,
            details: mockProduct.details,
            sellingPrice: mockProduct.sellingPrice,
            arrivalDate: mockProduct.arrivalDate,
        });

        expect(response.status).toBe(200);

        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
            mockProduct.model,
            mockProduct.category,
            mockProduct.quantity,
            mockProduct.details,
            mockProduct.sellingPrice,
            mockProduct.arrivalDate
        );
    });

    test("Register products - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app).post(`${baseURL}/products`).send({
            model: mockProduct.model,
            category: mockProduct.category,
            quantity: mockProduct.quantity,
            details: mockProduct.details,
            sellingPrice: mockProduct.sellingPrice,
            arrivalDate: mockProduct.arrivalDate,
        });

        expect(response.status).toBe(401);
    });

    test("Register products - Not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => res.status(401).json({ error: "Unauthorized user", status: 401 })
        );

        const response = await request(app).post(`${baseURL}/products`).send({
            model: mockProduct.model,
            category: mockProduct.category,
            quantity: mockProduct.quantity,
            details: mockProduct.details,
            sellingPrice: mockProduct.sellingPrice,
            arrivalDate: mockProduct.arrivalDate,
        });

        expect(response.status).toBe(401);
    });

    test("Register products - Invalid request", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => {
                throw new Error("Invalid request");
            }),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => res.status(422).json({ error: "Invalid request", status: 422 })
        );

        const response = await request(app).post(`${baseURL}/products`).send({
            model: "",
            category: mockProduct.category,
            quantity: mockProduct.quantity,
            details: mockProduct.details,
            sellingPrice: mockProduct.sellingPrice,
            arrivalDate: mockProduct.arrivalDate,
        });

        expect(response.status).toBe(422);

        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0);
    });

    test("Register products - Model already present", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
                custom: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(
            new ProductAlreadyExistsError()
        );

        const response = await request(app).post(`${baseURL}/products`).send({
            model: mockProduct.model,
            category: mockProduct.category,
            quantity: mockProduct.quantity,
            details: mockProduct.details,
            sellingPrice: mockProduct.sellingPrice,
            arrivalDate: mockProduct.arrivalDate,
        });

        expect(response.status).toBe(409);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
    });

    test("Register products - Invalid arrival date", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => res.status(422).json({ error: "Invalid request", status: 422 })
        );

        jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(
            new DateError()
        );

        const response = await request(app).post(`${baseURL}/products`).send({
            model: mockProduct.model,
            category: mockProduct.category,
            quantity: mockProduct.quantity,
            details: mockProduct.details,
            sellingPrice: mockProduct.sellingPrice,
            arrivalDate: "2100-01-01",
        });

        expect(response.status).toBe(400);
    });
});

describe("PATCH /:model", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Change product quantity", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
                custom: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(100);

        const response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            quantity: 100,
            changeDate: "2024-01-01",
        });

        expect(response.status).toBe(200);

        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(
            mockProduct.model,
            100,
            "2024-01-01"
        );
    });

    test("Change product quantity - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            model: mockProduct.model,
            quantity: 100,
            changeDate: "2024-01-01",
        });

        expect(response.status).toBe(401);
    });

    test("Change product quantity - Not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => res.status(401).json({ error: "Unauthorized user", status: 401 })
        );

        const response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            model: mockProduct.model,
            quantity: 100,
            changeDate: "2024-01-01",
        });

        expect(response.status).toBe(401);
    });

    test("Change product quantity - Invalid request", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => {
                throw new Error("Invalid request");
            }),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) =>
            res.status(422).json({ error: "Invalid request", status: 422 })
        );

        let response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            quantity: 0,
            changeDate: "2024-01-01",
        });

        expect(response.status).toBe(422);

        response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            quantity: 100,
            changeDate: "000",
        });

        expect(response.status).toBe(422);

        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
    });

    test("Change product quantity - Model not found", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
                custom: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(
            new ProductNotFoundError()
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${"modelNotExisting"}`)
            .send({
                quantity: 100,
                changeDate: "2024-01-01",
            });

        expect(response.status).toBe(404);
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    });

    test("Change product quantity - Invalid change date (after current date)", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => res.status(422).json({ error: "Invalid request", status: 422 })
        );

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(
            new DateError()
        );

        const response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            quantity: 100,
            changeDate: "2100-01-01",
        });

        expect(response.status).toBe(400);

        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    });

    test("Change product quantity - Invalid change date (before arrivalDate)", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => res.status(422).json({ error: "Invalid request", status: 422 })
        );

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(
            new DateError()
        );

        const response = await request(app).patch(`${baseURL}/products/${mockProduct.model}`).send({
            quantity: 100,
            changeDate: "2023-01-01",
        });

        expect(response.status).toBe(400);

        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    });
});

describe("PATCH /:model/sell", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Sell product", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
                custom: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(100);

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(200);

        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(
            mockProduct.model,
            100,
            "2024-01-01"
        );
    });

    test("Sell product - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(401);
    });

    test("Sell product - Not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => res.status(401).json({ error: "Unauthorized user", status: 401 })
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(401);
    });

    test("Sell product - Invalid request", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => {
                throw new Error("Invalid request");
            }),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) =>
            res.status(422).json({ error: "Invalid request", status: 422 })
        );

        let response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 0,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(422);

        response = await request(app).patch(`${baseURL}/products/${mockProduct.model}/sell`).send({
            quantity: 100,
            sellingDate: "000",
        });

        expect(response.status).toBe(422);

        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0);
    });

    test("Sell product - Model not found", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
                custom: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(
            new ProductNotFoundError()
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${"modelNotExisting"}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(404);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    });

    test("Sell product - Invalid selling date (after current date)", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => res.status(422).json({ error: "Invalid request", status: 422 })
        );

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(
            new DateError()
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2100-01-01",
            });

        expect(response.status).toBe(400);

        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    });

    test("Sell product - Invalid selling date (before arrivalDate)", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => res.status(422).json({ error: "Invalid request", status: 422 })
        );

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(
            new DateError()
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2023-01-01",
            });

        expect(response.status).toBe(400);

        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    });

    test("Sell product - Empty stock", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(
            new EmptyProductStockError()
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(409);

        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    });

    test("Sell product - Low stock", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );
        jest.mock("express-validator", () => ({
            body: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockReturnThis(),
                isString: jest.fn().mockReturnThis(),
                isLength: jest.fn().mockReturnThis(),
                isInt: jest.fn().mockReturnThis(),
                isFloat: jest.fn().mockReturnThis(),
                isCurrency: jest.fn().mockReturnThis(),
                isURL: jest.fn().mockReturnThis(),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(
            new LowProductStockError()
        );

        const response = await request(app)
            .patch(`${baseURL}/products/${mockProduct.model}/sell`)
            .send({
                quantity: 100,
                sellingDate: "2024-01-01",
            });

        expect(response.status).toBe(409);

        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    });
});

describe("GET /", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Get all products", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

        const response = await request(app).get(`${baseURL}/products`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([mockProduct]);

        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
    });

    test("Get all products - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app).get(`${baseURL}/products`);

        expect(response.status).toBe(401);
    });

    test("Get all products - Not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => res.status(401).json({ error: "Unauthorized user", status: 401 })
        );

        const response = await request(app).get(`${baseURL}/products`);

        expect(response.status).toBe(401);
    });

    test("Get all products - Error: Grouping null and category or product not null", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

        const response = await request(app).get(
            `${baseURL}/products?grouping=null&category=APPLIANCE`
        );

        expect(response.status).toBe(422);

        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
    });

    test("Get all products - Error: Grouping is category and category is null OR model is not null", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue([mockProduct]);

        let response = await request(app).get(`${baseURL}/products?grouping=category`);

        expect(response.status).toBe(422);

        response = await request(app).get(`${baseURL}/products?grouping=category&model=testModel`);

        expect(response.status).toBe(422);

        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
    });

    test("Get all products - Error: Grouping is model and model is null OR category is not null", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue([mockProduct]);

        let response = await request(app).get(`${baseURL}/products?grouping=model`);

        expect(response.status).toBe(422);

        response = await request(app).get(`${baseURL}/products?grouping=model&category=APPLIANCE`);

        expect(response.status).toBe(422);

        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
    });

    test("Get all products - Model not found", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => next()
        );

        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(
            new ProductNotFoundError()
        );

        const response = await request(app).get(`${baseURL}/products`);

        expect(response.status).toBe(404);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
    });
});

describe("GET /available", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Get all available products", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([
            mockProduct,
        ]);

        const response = await request(app).get(`${baseURL}/products/available`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([mockProduct]);

        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    });

    test("Get all available products - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app).get(`${baseURL}/products/available`);

        expect(response.status).toBe(401);
    });

    test("Get all available products - Error: Grouping null and category or product not null", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([
            mockProduct,
        ]);

        let response = await request(app).get(
            `${baseURL}/products/available?grouping=null&category=APPLIANCE`
        );

        expect(response.status).toBe(422);

        response = await request(app).get(
            `${baseURL}/products/available?grouping=null&model=testModel`
        );

        expect(response.status).toBe(422);

        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
    });

    test("Get all available products - Error: Grouping is category and category is null OR model is not null", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue([
            mockProduct,
        ]);

        let response = await request(app).get(`${baseURL}/products/available?grouping=category`);

        expect(response.status).toBe(422);

        response = await request(app).get(
            `${baseURL}/products/available?grouping=category&model=testModel`
        );

        expect(response.status).toBe(422);

        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
    });

    test("Get all available products - Error: Grouping is model and model is null OR category is not null", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) =>
            next()
        );

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue([
            mockProduct,
        ]);

        let response = await request(app).get(`${baseURL}/products/available?grouping=model`);

        expect(response.status).toBe(422);

        response = await request(app).get(
            `${baseURL}/products/available?grouping=model&category=APPLIANCE`
        );

        expect(response.status).toBe(422);

        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
    });

    test("Get all available products - Model not found", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(
            new ProductNotFoundError()
        );

        const response = await request(app).get(`${baseURL}/products/available`);

        expect(response.status).toBe(404);
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    });
});

describe("DELETE /", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Delete all products", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );

        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

        const response = await request(app).delete(`${baseURL}/products`);

        expect(response.status).toBe(200);

        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    });

    test("Delete all products - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app).delete(`${baseURL}/products`);

        expect(response.status).toBe(401);
    });

    test("Delete all products - Not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => res.status(401).json({ error: "Unauthorized user", status: 401 })
        );

        const response = await request(app).delete(`${baseURL}/products`);

        expect(response.status).toBe(401);
    });
});

describe("DELETE /:model", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Delete product", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );

        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

        const response = await request(app).delete(`${baseURL}/products/${mockProduct.model}`);

        expect(response.status).toBe(200);

        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    });

    test("Delete product - Not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            res.status(401).json({ error: "Unauthenticated user", status: 401 })
        );

        const response = await request(app).delete(`${baseURL}/products/${mockProduct.model}`);

        expect(response.status).toBe(401);
    });

    test("Delete product - Not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => res.status(401).json({ error: "Unauthorized user", status: 401 })
        );

        const response = await request(app).delete(`${baseURL}/products/${mockProduct.model}`);

        expect(response.status).toBe(401);
    });

    test("Delete product - Model not found", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) =>
            next()
        );
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce(
            (req, res, next) => {
                req.user = testAdmin;
                next();
            }
        );

        jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(
            new ProductNotFoundError()
        );

        const response = await request(app).delete(`${baseURL}/products/${mockProduct.model}`);

        expect(response.status).toBe(404);
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    });
});
