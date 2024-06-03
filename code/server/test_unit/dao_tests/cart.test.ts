import { describe, test, expect, beforeAll, afterAll, jest, beforeEach, afterEach } from "@jest/globals"
import { Database, RunResult } from "sqlite3"
import CartDAO from "../../src/dao/cartDAO"
import { Cart, ProductInCart } from "../../src/components/cart"
import db from "../../src/db/db"
import { Category } from "../../src/components/product"
import { LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"
import { CartNotFoundError, ProductNotInCartError } from "../../src/errors/cartError"

jest.mock("../../src/db/db.ts")

const customer = "customer1";

describe("Cart creation and visualization", () => {
    
    let cartDAO: CartDAO;

    beforeEach(() => {
        cartDAO = new CartDAO();
    });
    

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
        
    });

   

   

    test("Cart Id correctly retrieved", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {id: 1});
            return {} as Database
        });

        const result = await cartDAO.getCurrentCartId(customer)
        expect(result).toBe(1);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Cart Id does not exist", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database
        });

        const result = await cartDAO.getCurrentCartId(customer)
        expect(result).toBe(null);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Cart id SQL error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.getCurrentCartId(customer)).rejects.toThrow("SQL error");
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Cart id db error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.getCurrentCartId(customer)).rejects.toEqual(new Error("DB error"));
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});  

describe("Create empty cart", () => {
    let cartDAO: CartDAO;
    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test("Cart correctly created", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null );
            return {} as Database
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {id: 1});
            return {} as Database
        });

        const result = await cartDAO.createEmptyCart(customer)
        expect(result).toBe(1);
        expect(mockDBRun).toHaveBeenCalledTimes(1);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Cart creation: cart created but not retrieved", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null );
            return {} as Database
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database
        });

        await expect(cartDAO.createEmptyCart(customer)).rejects.toEqual(new CartNotFoundError());
        expect(mockDBRun).toHaveBeenCalledTimes(1);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Cart creation: SQL error on get", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.createEmptyCart(customer)).rejects.toThrow("SQL error");
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Cart creation: SQL error on run", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.createEmptyCart(customer)).rejects.toThrow("SQL error");
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("Cart creation: db error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.createEmptyCart(customer)).rejects.toEqual(new Error("DB error"));
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });
});

describe("Get current Cart", () => {
    
    let cartDAO: CartDAO;
    beforeEach(() => {
        cartDAO = new CartDAO();
    });
    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test("Get current cart - success", async () => {
        const mockCart = new Cart("customer1", false, "" , 3.4, [new ProductInCart("iPhone 13", 2,Category.SMARTPHONE, 3.4)]);
        const mockRows = [
            {
                customer: "customer1",
                paid: 0,
                paymentDate: "",
                total: 3.4,
                model: "iPhone 13",
                category: Category.SMARTPHONE,
                sellingPrice: 3.4,
                quantity: 2
            }
        ];
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows);
            return {} as Database
        });

        const result = await cartDAO.getCurrentCart(customer)
        expect(result).toStrictEqual(mockCart);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Get current cart - empty or non existing", async () => {
        const mockEmptyCart = new Cart("customer1", false, "" , 0.0, []);
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, "");
            return {} as Database
        });

        const result = await cartDAO.getCurrentCart(customer)
        expect(result).toStrictEqual(mockEmptyCart);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Get current cart - SQL error", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.getCurrentCart(customer)).rejects.toThrow("SQL error");
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Get current cart - db error", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.getCurrentCart(customer)).rejects.toEqual(new Error("DB error"));
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});

describe("Add product to cart", () => {
    
    let cartDAO: CartDAO;
    
    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test("Product correctly added to cart", async () => {
        const mockProductRow = [
            {
                model: "iPhone 13",
                category: Category.SMARTPHONE,
                sellingPrice: 3.4,
                arrivalDate: "2022-01-01",
                details: "256GB",
                quantity: 10
            }
        ];

        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, true);
            return {} as Database
        });

        const result = await cartDAO.addProductToCart(1, "iPhone 13")
        expect(result).toBe(true);
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("Add product: product does not exist", async () => {

        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database
        });

        await expect(cartDAO.addProductToCart(1, "iPhone 13")).rejects.toEqual(new ProductNotFoundError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Add product: quantity not available", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 0
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        await expect(cartDAO.addProductToCart(1, "iPhone 13")).rejects.toEqual(new LowProductStockError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
    }, 10000);

    test("Add product: SQL error on get", async () => {
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.addProductToCart(1, "iPhone 13")).rejects.toThrow("SQL error");
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Add product: SQL error on run", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };

        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.addProductToCart(1, "iPhone 13")).rejects.toThrow("SQL error");
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("Add product: db error", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };

        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });


        await expect(cartDAO.addProductToCart(1, "iPhone 13")).rejects.toEqual(new Error("DB error"));
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });
});

describe("Remove product from cart", () => {
    
    let cartDAO: CartDAO;

    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });


    test("Remove product: successfully removed from cart", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        const mockDBrun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
            return {} as Database;
          });
          
    
        const result = await cartDAO.removeProductFromCart(1, "iPhone 13");
        expect(result).toBe(true);
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledTimes(1);
    });

    test("Remove product: product not exists", async () => {
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database
        });

        await expect(cartDAO.removeProductFromCart(1, "iPhone 13")).rejects.toEqual(new ProductNotFoundError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Remove product: product not in cart", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        const mockDBrun = jest.spyOn(db, "run").mockImplementation(( sql, params, callback) => {
            callback.call({ changes: 0 }, null);
            return {} as Database;
        });

    
        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toEqual(new ProductNotFoundError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledTimes(1);
    });

    test("Remove product: SQL error on get", async () => {
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.removeProductFromCart(1, "iPhone 13")).rejects.toThrow("SQL error");
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Remove product: SQL error on run", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        const mockDBrun = jest.spyOn(db, "run").mockImplementation(function (this: RunResult, sql: string, params: any[], callback: (err: Error | null) => void) {
            callback(new Error("SQL error"));
            return {} as Database;
        });
    
        await expect(cartDAO.removeProductFromCart(1, "iPhone 13")).rejects.toThrow("SQL error");
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledTimes(1);
    });

    test("Remove product: db error", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });
    
        await expect(cartDAO.removeProductFromCart(1, "iPhone 13")).rejects.toEqual(new Error("DB error"));
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });
});

describe("Modify product quantity in cart", () => {

    let cartDAO: CartDAO;

    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test("Modify product quantity: successfully modified", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        const mockDBrun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
            return {} as Database;
        });
    
        const result = await cartDAO.modifyProductQuantity("iPhone 13", 1, 5);
        expect(result).toBe(true);
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledTimes(1);
    });

    test("Modify product quantity: product not exists", async () => {
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database
        });

        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toEqual(new ProductNotFoundError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Modify product quantity: product not in cart", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        const mockDBrun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) =>{
            callback.call({ changes: 0 }, null);
            return {} as Database;
        });
    
        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toEqual(new ProductNotFoundError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledTimes(1);
    });

    test("Modify product quantity: SQL error on get", async () => {
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toThrow("SQL error");
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Modify product quantity: SQL error on run", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
        const mockDBrun = jest.spyOn(db, "run").mockImplementation(function (this: RunResult, sql: string, params: any[], callback: (err: Error | null) => void) {
            callback(new Error("SQL error"));
            return {} as Database;
        });
    
        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toThrow("SQL error");
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledTimes(1);
    });


    test("Modify product quantity: Low stock", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 1
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockProductRow);
            return {} as Database
        });
    
    
        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toEqual(new LowProductStockError());
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });

    test("Modify product quantity: db error", async () => {
        const mockProductRow = {
            model: "iPhone 13",
            category: Category.SMARTPHONE,
            sellingPrice: 3.4,
            arrivalDate: "2022-01-01",
            details: "256GB",
            quantity: 10
        };
    
        const mockDBget = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });
    
        await expect(cartDAO.modifyProductQuantity("iPhone 13", 1, 5)).rejects.toEqual(new Error("DB error"));
        expect(mockDBget).toHaveBeenCalledTimes(1);
    });
});

describe("Get paid carts", () => {
    let cartDAO: CartDAO;
    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test("Get paid carts: successfully retrieved", async () => {

        const mockRows = [
            { id: 1, customer: "customer1", paid: 1, paymentDate: "2022-05-31", total: 100.0, model: "Product1", category: Category.LAPTOP, sellingPrice: 10.0, quantity: 2 },
            { id: 1, customer: "customer1", paid: 1, paymentDate: "2022-05-31", total: 100.0, model: "Product2", category: Category.APPLIANCE, sellingPrice: 20.0, quantity: 1 },
            { id: 2, customer: "customer1", paid: 1, paymentDate: "2022-06-01", total: 50.0, model: "Product3", category: Category.SMARTPHONE, sellingPrice: 25.0, quantity: 1 }
        ];


        const mockCarts = [
            new Cart("customer1", true, "2022-05-31", 100.0, [new ProductInCart("Product1", 2, Category.LAPTOP, 10.0), new ProductInCart("Product2", 1, Category.APPLIANCE, 20.0)]),
            new Cart("customer1", true, "2022-06-01", 50.0, [new ProductInCart("Product3", 1, Category.SMARTPHONE, 25.0)])
        ];
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows);
            return {} as Database
        });

        const result = await cartDAO.getPaidCarts(customer)
        expect(result).toStrictEqual(mockCarts);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Get paid carts: no paid carts", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, "");
            return {} as Database
        });

        const result = await cartDAO.getPaidCarts(customer)
        expect(result).toStrictEqual([]);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Get paid carts: SQL error", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.getPaidCarts(customer)).rejects.toThrow("SQL error");
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Get paid carts: db error", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.getPaidCarts(customer)).rejects.toEqual(new Error("DB error"));
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});

describe('Delete all carts', () => { 
    let cartDAO: CartDAO;
    beforeEach(() => {
        cartDAO = new CartDAO();
    });
    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test('Delete all carts: successfully deleted', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null );
            return {} as Database
        });

        const result = await cartDAO.deleteAllCarts()
        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test('Delete all carts: SQL error', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toThrow("SQL error");
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test('Delete all carts: db error', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.deleteAllCarts()).rejects.toEqual(new Error("DB error"));
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

});

describe('Get all carts', () => {
    let cartDAO: CartDAO;

    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test('Get all carts: successfully retrieved', async () => {
        const mockRows = [
            { id: 1, customer: "customer1", paid: 0, paymentDate: "", total: 6.8, model: "iPhone 13", category: Category.SMARTPHONE, sellingPrice: 3.4, quantity: 2 },
            { id: 2, customer: "customer1", paid: 0, paymentDate: "", total: 5.1, model: "Iphone 15", category: Category.SMARTPHONE, sellingPrice: 5.1, quantity: 1 }
        ];

        const mockCarts = [
            new Cart("customer1", false, "", 6.8, [new ProductInCart("iPhone 13", 2, Category.SMARTPHONE, 3.4)]),
            new Cart("customer1", false, "", 5.1, [new ProductInCart("Iphone 15", 1, Category.SMARTPHONE, 5.1)])
        ];
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, mockRows);
            return {} as Database
        });

        const result = await cartDAO.getAllCarts()
        expect(result).toStrictEqual(mockCarts);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test('Get all carts: no carts', async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, "");
            return {} as Database
        });

        const result = await cartDAO.getAllCarts()
        expect(result).toStrictEqual([]);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test('Get all carts: SQL error', async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.getAllCarts()).rejects.toThrow("SQL error");
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test('Get all carts: db error', async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.getAllCarts()).rejects.toEqual(new Error("DB error"));
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});

describe('Delete all products from a cart', () => {
    let cartDAO: CartDAO;
    beforeEach(() => {
        cartDAO = new CartDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test('Delete all products: successfully deleted', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null );
            return {} as Database
        });

        const result = await cartDAO.deleteProductsInCart(1)
        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test('Delete all products: SQL error', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.deleteProductsInCart(1)).rejects.toThrow("SQL error");
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test('Delete all products: db error', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.deleteProductsInCart(1)).rejects.toEqual(new Error("DB error"));
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });
});

describe("Check availability of products in cart", () => {
    let cartDAO: CartDAO;

    beforeEach(() => {
        cartDAO = new CartDAO();
    });
    afterEach(() => {   
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test("Check availability: products available", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, "");
            return {} as Database
        });

        const result = await cartDAO.areProductsInCartAvailable(1)
        expect(result).toBe(true);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Check availability: products not available", async () => {
        const mockRows = [
            { 
                model: "Product1",
                quantity: 10,
                category: Category.LAPTOP,
                details: "15.6",
                arrivalDate: "2022-05-01",
                sellinPrice: 100.0,
                cart_id: 1,
                product_model: "Product1",
                quantity_in_cart: 15
            },
            {
                model: "Product2",
                quantity: 20,
                category: Category.SMARTPHONE,
                details: "64GB",
                arrivalDate: "2022-05-01",
                sellinPrice: 200.0,
                cart_id: 1,
                product_model: "Product2",
                quantity_in_cart: 10
            }
        ];

        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockRows);
            return {} as Database
        });

        const result = await cartDAO.areProductsInCartAvailable(1)
        expect(result).toBe(false);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Check availability: SQL error", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.areProductsInCartAvailable(1)).rejects.toThrow("SQL error");
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Check availability: db error", async () => {
        const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.areProductsInCartAvailable(1)).rejects.toEqual(new Error("DB error"));
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});

describe('Checkout current cart', () => {
    let cartDAO: CartDAO;
    beforeEach(() => {
        cartDAO = new CartDAO();
    });
    afterEach(() => {
        jest.clearAllMocks();   // Invoke the function to clear all mocks
        jest.restoreAllMocks(); // Invoke the function to restore all mocks
    });

    test('Checkout cart: successfully checked out', async () => {
        const mockCart = new Cart("customer1", false, "" , 3.4, [new ProductInCart("iPhone 13", 2,Category.SMARTPHONE, 3.4)]);
        const mockDBRun = jest.spyOn(db, "run");

       mockDBRun.mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database
        }
        ).mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        const result = await cartDAO.checkoutCurrentCart(1, mockCart);
        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledTimes(2);
    });

    test('Checkout cart: SQL error on run1', async () => {
        const mockCart = new Cart("customer1", false, "" , 3.4, [new ProductInCart("iPhone 13", 2,Category.SMARTPHONE, 3.4)]);
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.checkoutCurrentCart(1, mockCart)).rejects.toThrow("SQL error");
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test('Checkout cart: SQL error on run2', async () => {
        const mockCart = new Cart("customer1", false, "" , 3.4, [new ProductInCart("iPhone 13", 2,Category.SMARTPHONE, 3.4)]);
        const mockDBRun = jest.spyOn(db, "run")

        mockDBRun.mockImplementationOnce((sql, params, callback) => {
            callback(null);
            return {} as Database
        }
        ).mockImplementationOnce((sql, params, callback) => {
            callback(new Error("SQL error"));
            return {} as Database
        });

        await expect(cartDAO.checkoutCurrentCart(1, mockCart)).rejects.toThrow("SQL error");
        expect(mockDBRun).toHaveBeenCalledTimes(2);
    });

    test('Checkout cart: db error', async () => {
        const mockCart = new Cart("customer1", false, "" , 3.4, [new ProductInCart("iPhone 13", 2,Category.SMARTPHONE, 3.4)]);
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error");
            return {} as Database
        });

        await expect(cartDAO.checkoutCurrentCart(1, mockCart)).rejects.toEqual(new Error("DB error"));
        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });
});