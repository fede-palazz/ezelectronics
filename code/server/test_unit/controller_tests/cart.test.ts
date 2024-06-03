import { test, expect, jest,describe,  beforeEach, afterEach } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import { Cart } from "../../src/components/cart"
import { ProductInCart } from "../../src/components/cart"
import { Category } from "../../src/components/product"
import { Role, User } from "../../src/components/user"
import { CartNotFoundError, EmptyCartError } from "../../src/errors/cartError"
import { LowProductStockError } from "../../src/errors/productError"

jest.mock("../../src/dao/cartDAO")

const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

describe("Add to cart", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Add to cart: add a new product successfully", async () => {

        const mockCart = new Cart("customer1", false, "", 0.0, []);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        jest.spyOn(CartDAO.prototype, "addProductToCart").mockResolvedValueOnce(true);
        const response = await controller.addToCart(testUser, "testProduct")
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });

    test("Add to cart: increase product quantity successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        jest.spyOn(CartDAO.prototype, "modifyProductQuantity").mockResolvedValueOnce(true);
        const response = await controller.addToCart(testUser, "testProduct")
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.modifyProductQuantity).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });

    test("Add to cart: create new cart and add product successfully", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(null);
        jest.spyOn(CartDAO.prototype, "createEmptyCart").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "addProductToCart").mockResolvedValueOnce(true);
        const response = await controller.addToCart(testUser, "testProduct")
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.createEmptyCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.addProductToCart).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });
});

describe("Get cart", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Get cart: get current cart successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        const response = await controller.getCart(testUser)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(response).toBe(mockCart)
    });
});

describe("Checkout cart", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Checkout cart: checkout cart successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        jest.spyOn(CartDAO.prototype, "areProductsInCartAvailable").mockResolvedValueOnce(true);
        jest.spyOn(CartDAO.prototype, "checkoutCurrentCart").mockResolvedValueOnce(true);
        const response = await controller.checkoutCart(testUser)
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.areProductsInCartAvailable).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.checkoutCurrentCart).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });

    test("Checkout cart: empty cart", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, []);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        await expect(controller.checkoutCart(testUser)).rejects.toEqual(new EmptyCartError());
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart: cart not found", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(null);
        await expect(controller.checkoutCart(testUser)).rejects.toEqual(new CartNotFoundError());
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1);
    });

    test("Checkout cart: low product stock", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        jest.spyOn(CartDAO.prototype, "areProductsInCartAvailable").mockResolvedValueOnce(false);
        await expect(controller.checkoutCart(testUser)).rejects.toEqual(new LowProductStockError());
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.areProductsInCartAvailable).toHaveBeenCalledTimes(1);
    });
});

describe("Get customers carts", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Get customers paid carts: get customers carts successfully", async () => {
        const mockCart = new Cart("customer1", true, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getPaidCarts").mockResolvedValueOnce([mockCart]);
        const response = await controller.getCustomerCarts(testUser)
        expect(CartDAO.prototype.getPaidCarts).toHaveBeenCalledTimes(1)
        expect(response).toEqual([mockCart])
    });
});

describe("Remove product from cart", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Remove product from cart: remove product successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
        const response = await controller.removeProductFromCart(testUser, "testProduct")
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });

    test("Remove product from cart: remove product and decrease quantity successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 2, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(mockCart);
        jest.spyOn(CartDAO.prototype, "modifyProductQuantity").mockResolvedValueOnce(true);
        const response = await controller.removeProductFromCart(testUser, "testProduct")
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.modifyProductQuantity).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });

    test("Remove product from cart: cart not found", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(null);
        await expect(controller.removeProductFromCart(testUser, "testProduct")).rejects.toEqual(new CartNotFoundError());
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1);
    });

});

describe("Clear cart", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Clear cart: clear cart successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
        jest.spyOn(CartDAO.prototype, "deleteProductsInCart").mockResolvedValueOnce(true);
        const response = await controller.clearCart(testUser)
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1)
        expect(CartDAO.prototype.deleteProductsInCart).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });

    test("Clear cart: cart not found", async () => {
        jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(null);
        await expect(controller.clearCart(testUser)).rejects.toEqual(new CartNotFoundError());
        expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledTimes(1);
    });
});

describe("Delete all carts", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Delete all carts: delete all carts successfully", async () => {
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
        const response = await controller.deleteAllCarts()
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1)
        expect(response).toBe(true)
    });
});

describe("Get all carts", () => {
    let controller: CartController
    beforeEach(() => {
        controller = new CartController()
    });

    afterEach(() => {
        jest.resetAllMocks()
    });

    test("Get all carts: get all carts successfully", async () => {
        const mockCart = new Cart("customer1", false, "", 0.0, [new ProductInCart("testProduct", 1, Category.APPLIANCE, 32.0)]);

        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([mockCart]);
        const response = await controller.getAllCarts()
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1)
        expect(response).toEqual([mockCart])
    });
});