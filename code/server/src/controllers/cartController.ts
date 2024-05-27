import { User } from "../components/user";
import { Cart } from "../components/cart";
import CartDAO from "../dao/cartDAO";
import { CartNotFoundError, EmptyCartError } from "../errors/cartError";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
  private dao: CartDAO;

  constructor() {
    this.dao = new CartDAO();
  }

  /**
   * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
   * If the product is not in the cart, it should be added with a quantity of 1.
   * If there is no current unpaid cart in the database, then a new cart should be created.
   * @param user - The user to whom the product should be added.
   * @param productId - The model of the product to add.
   * @returns A Promise that resolves to `true` if the product was successfully added.
   */
  async addToCart(user: User, product: string): Promise<Boolean> {
    try {
      let cartExists = await this.dao.cartExists(user.username);
      if (cartExists === 0) {
        cartExists = await this.dao.createEmptyCart(user.username);
      }
      return this.dao.addCurrentCart(product, user.username, cartExists);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Retrieves the current cart for a specific user.
   * @param user - The user for whom to retrieve the cart.
   * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
   */
  async getCart(user: User): Promise<Cart> {
    try {
      let cartId = await this.dao.cartExists(user.username);
      //se cartid è uguale a 0 vuol dire che non esiste
      if (cartId === 0) {
        return new Cart(user.username, false, null, 0, []);
      } else return this.dao.getCurrentCartByUsername(user.username);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
   * @param user - The user whose cart should be checked out.
   * @returns A Promise that resolves to `true` if the cart was successfully checked out.
   *
   */
  async checkoutCart(user: User): Promise<boolean> {
    try {
      const cartId = await this.dao.cartExists(user.username);
      if (cartId === 0) {
        return Promise.reject(new CartNotFoundError());
      }
      const cart = await this.dao.getCurrentCartByUsername(user.username);
      if (cart.products.length <= 0) {
        return Promise.reject(new EmptyCartError());
      }
      for (let i = 0; i < cart.products.length; i++) {
        await this.dao.checkQuantity(cart.products[i].model, cart.products[i].quantity);
      }
      return this.dao.checkoutCurrentCart(cartId);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Retrieves all paid carts for a specific customer.
   * @param user - The customer for whom to retrieve the carts.
   * @returns A Promise that resolves to an array of carts belonging to the customer.
   * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
   */
  async getCustomerCarts(user: User): Promise<Cart[]> {
    return this.dao.getPaidCartsByUsername(user.username);
  }

  /**
   * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
   * @param user The user who owns the cart.
   * @param product The model of the product to remove.
   * @returns A Promise that resolves to `true` if the product was successfully removed.
   */
  async removeProductFromCart(user: User, product: string): Promise<boolean> {
    try {
      const cartId = await this.dao.cartExists(user.username);
      if (cartId === 0) {
        return Promise.reject(new CartNotFoundError());
      }
      return this.dao.removeProductFromCurrentCart(cartId, product);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Removes all products from the current cart.
   * @param user - The user who owns the cart.
   * @returns A Promise that resolves to `true` if the cart was successfully cleared.
   */
  async clearCart(user: User): Promise<Boolean> {
    try {
      const cartId = await this.dao.cartExists(user.username);
      if (cartId === 0) {
        return Promise.reject(new CartNotFoundError());
      }
      return this.dao.deleteProductsCart(cartId);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Deletes all carts of all users.
   * @returns A Promise that resolves to `true` if all carts were successfully deleted.
   */
  async deleteAllCarts(): Promise<boolean> {
    return this.dao.deleteAllCarts();
  }

  /**
   * Retrieves all carts in the database.
   * @returns A Promise that resolves to an array of carts.
   */
  async getAllCarts(): Promise<Cart[]> {
    return this.dao.getAllCarts();
  }
}

export default CartController;
