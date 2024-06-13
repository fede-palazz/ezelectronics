import {jest, test, expect, beforeEach, afterEach, describe} from '@jest/globals';
import request from 'supertest';
import {app} from '../../index';

import CartController from '../../src/controllers/cartController';
import Authenticator from '../../src/routers/auth';
import { Cart, ProductInCart } from '../../src/components/cart';
import { Category } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import ErrorHandler from "../../src/helper"
import { LowProductStockError, ProductNotFoundError } from '../../src/errors/productError';
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from '../../src/errors/cartError';
import express, {  Router } from 'express';
import { body, param} from 'express-validator';

jest.mock('../../src/controllers/cartController');
jest.mock('../../src/routers/auth');



const baseURL = '/ezelectronics';

const testCustomer = new User('test', 'test', 'test', Role.CUSTOMER, 'test', 'test');
const testManager = new User('test', 'test', 'test', Role.MANAGER, 'test', 'test'); 
const testAdmin = new User('test', 'test', 'test', Role.ADMIN, 'test', 'test');

describe("GET /", () => {

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Get current user cart", async () => {
        const mockCart = new Cart("test", false, "", 2.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 2.0)]);

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => next());

        // Mock the getCart method
        jest.spyOn(CartController.prototype, "getCart").mockImplementation(() => Promise.resolve(mockCart));
        
        const response = await request(app).get(baseURL + "/carts");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCart);
        expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Get current user cart - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });        });
        const response = await request(app).get(baseURL + "/carts");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });

    test("Get current user cart - not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            req.user = { username: "test" }; // Add user to the request
            next();
        });        
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });       
        const response = await request(app).get(baseURL + "/carts");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Get current user cart - error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });        
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());       
        jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error("Test error"));
        const response = await request(app).get(baseURL + "/carts");
        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1);
    });
});

describe("POST /", () => {

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });
    
        test("Add product to cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
                req.user = testCustomer;
                next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
          
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(() => Promise.resolve(true));
            const response = await request(app).post(baseURL + "/carts").send({ model: "testProduct"});
            expect(response.status).toBe(200);
            expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.addToCart).toHaveBeenCalledWith(testCustomer, "testProduct");
        });

        test("Add product to cart - not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            const response = await request(app).post(baseURL + "/carts").send({ model: "testProduct"});
            expect(response.status).toBe(401);
        });

        test("Add product to cart - not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });
            const response = await request(app).post(baseURL + "/carts").send({ model: "testProduct"});
            expect(response.status).toBe(401);
        });

        test("Add product to cart - product not found", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(() => Promise.reject(new ProductNotFoundError()));
            const response = await request(app).post(baseURL + "/carts").send({ model: "testProduct"});
            expect(response.status).toBe(404);
            expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
        });

        test("Add product to cart - Low stock", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "addToCart").mockImplementation(() => Promise.reject(new LowProductStockError()));
            const response = await request(app).post(baseURL + "/carts").send({ model: "testProduct"});
            expect(response.status).toBe(409);
            expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
        });

        test("Add product to cart - validation error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Test error", status: 422 });
            });
            const response = await request(app).post(baseURL + "/carts").send({ model: ""});
            expect(response.status).toBe(422);
        });
        
        test("Add product to cart - error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new Error("Test error"));
            const response = await request(app).post(baseURL + "/carts").send({ model: "testProduct"});
            expect(response.status).toBe(503);
        });
});

describe("PATCH / ", () => {

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Checkout cart - success", async () => {   
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(CartController.prototype, "checkoutCart").mockImplementation(() => Promise.resolve(true));
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(200);
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart - not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart - error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error("Test error"));
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart - no unpaid cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockImplementation(() => Promise.reject(new CartNotFoundError()));
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart - empty cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockImplementation(() => Promise.reject(new EmptyCartError()));
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(400);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart - Low stock", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError());
        const response = await request(app).patch(baseURL + "/carts/").send({ user: testCustomer });
        expect(response.status).toBe(409);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

});     

describe("GET /history", () => {

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Get customer carts - success", async () => {
        const mockCarts = [new Cart("test", true, "", 2.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 2.0)])];
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockImplementation(() => Promise.resolve(mockCarts));
        const response = await request(app).get(baseURL + "/carts/history");
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCarts);
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Get customer carts - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).get(baseURL + "/carts/history");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });

    test("Get customer carts - not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });
        const response = await request(app).get(baseURL + "/carts/history");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Get customer carts - error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error("Test error"));
        const response = await request(app).get(baseURL + "/carts/history");
        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });
});

describe("DELETE /product/:model", () => {

   

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Delete product from cart - success", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());  
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(() => Promise.resolve(true));
        const response = await request(app).delete(baseURL + "/carts/products/testProduct");
        expect(response.status).toBe(200);
    });

    test("Delete product from cart - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/carts/products/testProduct");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });
    
    test("Delete product from cart - not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/carts/products/testProduct");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Delete product from cart - product not found", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(() => Promise.reject(new ProductNotFoundError()));
        const response = await request(app).delete(baseURL + "/carts/products/testProduct");
        expect(response.status).toBe(404);
    });

    test("Delete product from cart - Product not in cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(() => Promise.reject(new ProductNotInCartError()));
        const response = await request(app).delete(baseURL + "/carts/products/testProduct");
        expect(response.status).toBe(404);
    });

    test("Delete product from cart - no cart", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
            })),
        }));
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(() => Promise.reject(new CartNotFoundError()));
        const response = await request(app).delete(baseURL + "/carts/products/testProduct");
        expect(response.status).toBe(404);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1);
    });

});

describe("DELETE /current", () => {

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Clear cart - success", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(CartController.prototype, "clearCart").mockImplementation(() => Promise.resolve(true));
        const response = await request(app).delete(baseURL + "/carts/current");
        expect(response.status).toBe(200);
        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Clear cart - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/carts/current");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });

    test("Clear cart - not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/carts/current");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    });

    test("Clear cart - error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error("Test error"));
        const response = await request(app).delete(baseURL + "/carts/current");
        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1);
    });
});

describe('DELETE /', () => { 

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Delete all carts - success", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockImplementation(() => Promise.resolve(true));
        const response = await request(app).delete(baseURL + "/carts/");
        expect(response.status).toBe(200);
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    });

    test("Delete all carts - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/carts/");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });

    test("Delete all carts - not an admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an admin or manager", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/carts/");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    });

    test("Delete all carts - error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error("Test error"));
        const response = await request(app).delete(baseURL + "/carts/");
        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
    });
 });

 describe('GET /all', () => { 
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Get all carts - success", async () => {
        const mockCarts = [new Cart("test", true, "", 2.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 2.0)])];
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementationOnce((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getAllCarts").mockImplementation(() => Promise.resolve(mockCarts));
        const response = await request(app).get(baseURL + "/carts/all");
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCarts);
        expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    });

    test("Get all carts - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).get(baseURL + "/carts/all");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
    });

    test("Get all carts - not an admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an admin or manager", status: 401 });
        });
        const response = await request(app).get(baseURL + "/carts/all");
        expect(response.status).toBe(401);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    });

    test("Get all carts - error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
        jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error("Test error"));
        const response = await request(app).get(baseURL + "/carts/all");
        expect(response.status).toBe(503);
        expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
        expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
        expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1);
    });
  });