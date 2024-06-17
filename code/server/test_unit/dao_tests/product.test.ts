import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals";
import ProductDAO from "../../src/dao/productDAO";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { Category, Product } from "../../src/components/product";
import { ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";

jest.mock("../../src/db/db.ts");

const mockProduct = new Product(
    99.99,
    "testModel",
    Category.APPLIANCE,
    "2024-01-01",
    "Test Details",
    100
);

describe("Register product", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Product registration successful", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(
            productDAO.registerProduct(
                mockProduct.model,
                mockProduct.category,
                mockProduct.quantity,
                mockProduct.details || "",
                mockProduct.sellingPrice,
                mockProduct.arrivalDate || ""
            )
        ).resolves.toBe(null);

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("Product already exists", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: products.model"), null);
            return {} as Database;
        });

        await expect(
            productDAO.registerProduct(
                mockProduct.model,
                mockProduct.category,
                mockProduct.quantity,
                mockProduct.details || "",
                mockProduct.sellingPrice,
                mockProduct.arrivalDate || ""
            )
        ).rejects.toBeInstanceOf(ProductAlreadyExistsError);

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(
            productDAO.registerProduct(
                mockProduct.model,
                mockProduct.category,
                mockProduct.quantity,
                mockProduct.details || "",
                mockProduct.sellingPrice,
                mockProduct.arrivalDate || ""
            )
        ).rejects.toThrow("SQL error");

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });
});

describe("Change product quantity", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Product quantity change successful", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
            return {} as Database;
        });

        await expect(productDAO.changeProductQuantity(mockProduct.model, 50)).resolves.toBe(50);

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("Product not found", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 0 }, null);
            return {} as Database;
        });

        await expect(
            productDAO.changeProductQuantity(mockProduct.model, 50)
        ).rejects.toBeInstanceOf(ProductNotFoundError);

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.changeProductQuantity(mockProduct.model, 50)).rejects.toThrow(
            "SQL error"
        );

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });
});

describe("Sell product", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Product sale successful", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call(null, null);
            return {} as Database;
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 50 });
            return {} as Database;
        });

        await expect(productDAO.sellProduct(mockProduct.model, 50)).resolves.toBe(50);

        expect(mockDBRun).toHaveBeenCalledTimes(1);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("DB run error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 50 });
            return {} as Database;
        });

        await expect(productDAO.sellProduct(mockProduct.model, 50)).rejects.toThrow("SQL error");

        expect(mockDBRun).toHaveBeenCalledTimes(1);
        expect(mockDBGet).toHaveBeenCalledTimes(0);
    });

    test("DB get error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.sellProduct(mockProduct.model, 50)).rejects.toThrow("SQL error");

        expect(mockDBRun).toHaveBeenCalledTimes(1);
        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});

describe("Get products", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Get all products", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                {
                    model: mockProduct.model,
                    category: mockProduct.category,
                    quantity: mockProduct.quantity,
                    sellingPrice: mockProduct.sellingPrice,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                },
            ]);
            return {} as Database;
        });

        await expect(productDAO.getProducts()).resolves.toEqual([mockProduct]);

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.getProducts()).rejects.toThrow("SQL error");

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });
});

describe("Get products by category", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Get products by category", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                {
                    model: mockProduct.model,
                    category: mockProduct.category,
                    quantity: mockProduct.quantity,
                    sellingPrice: mockProduct.sellingPrice,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                },
            ]);
            return {} as Database;
        });

        await expect(productDAO.getProductsByCategory(mockProduct.category)).resolves.toEqual([
            mockProduct,
        ]);

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.getProductsByCategory(mockProduct.category)).rejects.toThrow(
            "SQL error"
        );

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });
});

describe("Get available products", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Get available products", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                {
                    model: mockProduct.model,
                    category: mockProduct.category,
                    quantity: mockProduct.quantity,
                    sellingPrice: mockProduct.sellingPrice,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                },
            ]);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts()).resolves.toEqual([mockProduct]);

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts()).rejects.toThrow("SQL error");

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });
});

describe("Get available products by category", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Get available products by category", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                {
                    model: mockProduct.model,
                    category: mockProduct.category,
                    quantity: mockProduct.quantity,
                    sellingPrice: mockProduct.sellingPrice,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                },
            ]);
            return {} as Database;
        });

        await expect(
            productDAO.getAvailableProductsByCategory(mockProduct.category)
        ).resolves.toEqual([mockProduct]);

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(
            productDAO.getAvailableProductsByCategory(mockProduct.category)
        ).rejects.toThrow("SQL error");

        expect(mockDBAll).toHaveBeenCalledTimes(1);
    });
});

describe("Get product", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Get product", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {
                model: mockProduct.model,
                category: mockProduct.category,
                quantity: mockProduct.quantity,
                sellingPrice: mockProduct.sellingPrice,
                arrivalDate: mockProduct.arrivalDate,
                details: mockProduct.details,
            });
            return {} as Database;
        });

        await expect(productDAO.getProduct(mockProduct.model)).resolves.toEqual(mockProduct);

        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("Product not found", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined);
            return {} as Database;
        });

        await expect(productDAO.getProduct(mockProduct.model)).rejects.toBeInstanceOf(
            ProductNotFoundError
        );

        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.getProduct(mockProduct.model)).rejects.toThrow("SQL error");

        expect(mockDBGet).toHaveBeenCalledTimes(1);
    });
});

describe("Delete product", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Delete product", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 1 }, null);
            return {} as Database;
        });

        await expect(productDAO.deleteProduct(mockProduct.model)).resolves.toBe(true);

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("Product not found", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call({ changes: 0 }, null);
            return {} as Database;
        });

        await expect(productDAO.deleteProduct(mockProduct.model)).rejects.toBeInstanceOf(
            ProductNotFoundError
        );

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("SQL error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.deleteProduct(mockProduct.model)).rejects.toThrow("SQL error");

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });
});

describe("Delete all products", () => {
    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("Delete all products", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.deleteAllProducts()).resolves.toBe(true);

        expect(mockDBRun).toHaveBeenCalledTimes(2);
    });

    test("SQL error on first run", async () => {
        const mockDBRun = jest.spyOn(db, "run")

        mockDBRun.mockImplementationOnce((sql, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.deleteAllProducts()).rejects.toThrow("SQL error");

        expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("SQL error on second run", async () => {
        const mockDBRun = jest.spyOn(db, "run")

        mockDBRun.mockImplementationOnce((sql, callback) => {
            callback(null, null);
            return {} as Database;
        }).mockImplementationOnce((sql, callback) => {
            callback(new Error("SQL error"), null);
            return {} as Database;
        });

        await expect(productDAO.deleteAllProducts()).rejects.toThrow("SQL error");

        expect(mockDBRun).toHaveBeenCalledTimes(2);
    });
});
