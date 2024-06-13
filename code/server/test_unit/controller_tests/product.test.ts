import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals";
import { Role, User } from "../../src/components/user";
import ProductController from "../../src/controllers/productController";
import { Category, Product } from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO";
import {
    EmptyProductStockError,
    LowProductStockError,
    ProductAlreadyExistsError,
} from "../../src/errors/productError";
import { DateError } from "../../src/utilities";
import { mock } from "node:test";

jest.mock("../../src/dao/productDAO");

const mockProduct = new Product(
    99.99,
    "testModel",
    Category.APPLIANCE,
    "2024-01-01",
    "Test Details",
    100
);

describe("Register products", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Register a product with valid information", async () => {
        jest.spyOn(ProductDAO.prototype, "registerProduct").mockResolvedValueOnce(undefined);

        const response = await controller.registerProducts(
            mockProduct.model,
            mockProduct.category,
            mockProduct.quantity,
            mockProduct.details,
            mockProduct.sellingPrice,
            mockProduct.arrivalDate
        );
        expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledTimes(1);
        expect(response).toBeUndefined();
    });

    test("Register a product with invalid arrivalDate", async () => {
        const mockProduct = new Product(
            99.99,
            "testModel",
            Category.APPLIANCE,
            "2100-01-01",
            "Test Details",
            100
        );

        await expect(
            controller.registerProducts(
                mockProduct.model,
                mockProduct.category,
                mockProduct.quantity,
                mockProduct.details,
                mockProduct.sellingPrice,
                mockProduct.arrivalDate
            )
        ).rejects.toBeInstanceOf(DateError);
        expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledTimes(0);
    });
});

describe("Change product quantity", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Change product quantity with valid information", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(
            new Product(99.99, "testModel", Category.APPLIANCE, "2024-01-01", "Test Details", 100)
        );
        jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(101);

        await expect(controller.changeProductQuantity("testModel", 1, "2024-01-01")).resolves.toBe(
            101
        );
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith("testModel", 101);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
    });

    test("Change product quantity with changeDate in the future", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(
            controller.changeProductQuantity(mockProduct.model, 1, "2100-01-01")
        ).rejects.toBeInstanceOf(DateError);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
    });

    test("Change product quantity with changeDate before arrivalDate", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(
            controller.changeProductQuantity(mockProduct.model, 1, "2023-01-01")
        ).rejects.toBeInstanceOf(DateError);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
    });
});

describe("Sell product", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Sell a product successfully", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);
        jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(99);

        await expect(controller.sellProduct("testModel", 1, "2024-01-02")).resolves.toBe(99);
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith("testModel", 99);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(mockProduct.model);
    });

    test("Sell a product with sellingDate in the future", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(
            controller.sellProduct(mockProduct.model, 1, "2100-01-01")
        ).rejects.toBeInstanceOf(DateError);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(mockProduct.model);
    });

    test("Sell a product with sellingDate before arrivalDate", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(
            controller.sellProduct(mockProduct.model, 1, "2023-01-01")
        ).rejects.toBeInstanceOf(DateError);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(mockProduct.model);
    });

    test("Sell a product with quantity equal to 0", async () => {
        const mockProduct = new Product(
            99.99,
            "testModel",
            Category.APPLIANCE,
            "2024-01-01",
            "Test Details",
            0
        );

        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(
            controller.sellProduct(mockProduct.model, 1, "2024-01-02")
        ).rejects.toBeInstanceOf(EmptyProductStockError);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(mockProduct.model);
    });

    test("Sell a product with quantity less than requested", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(
            controller.sellProduct(mockProduct.model, 101, "2024-01-02")
        ).rejects.toBeInstanceOf(LowProductStockError);

        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(0);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith(mockProduct.model);
    });
});

describe("Get products", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Get all products", async () => {
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

        await expect(controller.getProducts(null, null, null)).resolves.toEqual([mockProduct]);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
    });

    test("Get products by category", async () => {
        jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([
            mockProduct,
        ]);

        await expect(controller.getProducts("category", "Appliance", null)).resolves.toEqual([
            mockProduct,
        ]);

        expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith("Appliance");
    });

    test("Get products by model", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(controller.getProducts("model", null, "testModel")).resolves.toEqual([
            mockProduct,
        ]);

        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith("testModel");
    });
});

describe("Get available products", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Get all available products", async () => {
        jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([
            mockProduct,
        ]);

        await expect(controller.getAvailableProducts(null, null, null)).resolves.toEqual([
            mockProduct,
        ]);

        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    });

    test("Get available products by category", async () => {
        jest.spyOn(ProductDAO.prototype, "getAvailableProductsByCategory").mockResolvedValueOnce([
            mockProduct,
        ]);

        await expect(
            controller.getAvailableProducts("category", "Appliance", null)
        ).resolves.toEqual([mockProduct]);

        expect(ProductDAO.prototype.getAvailableProductsByCategory).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getAvailableProductsByCategory).toHaveBeenCalledWith(
            "Appliance"
        );
    });

    test("Get available products by model", async () => {
        jest.spyOn(ProductDAO.prototype, "getProduct").mockResolvedValueOnce(mockProduct);

        await expect(controller.getAvailableProducts("model", null, "testModel")).resolves.toEqual([
            mockProduct,
        ]);

        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProduct).toHaveBeenCalledWith("testModel");
    });
});

describe("Delete all products", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Delete all products", async () => {
        jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

        await expect(controller.deleteAllProducts()).resolves.toBe(true);

        expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    });
});

describe("Delete product", () => {
    let controller: ProductController;
    beforeEach(() => {
        controller = new ProductController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Delete product", async () => {
        jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);

        await expect(controller.deleteProduct("testModel")).resolves.toBe(true);

        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith("testModel");
    });
});
