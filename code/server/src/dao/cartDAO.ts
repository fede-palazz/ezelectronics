import { Cart, ProductInCart } from "../components/cart";
import db from "../db/db";
import { ProductNotFoundError, LowProductStockError } from "../errors/productError";
import { CartNotFoundError, ProductNotInCartError } from "../errors/cartError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
  /**
   * Retrieves the current cart for a specific user.
   *
   * @param username - The username for whom to retrieve the cart.
   * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
   */
  getCurrentCart(username: string): Promise<Cart> {
    return new Promise<Cart>((resolve, reject) => {
      try {
        const sql =
          "SELECT C.*, P.model, P.category, P.sellingPrice, PC.quantity_in_cart AS quantity \
            FROM carts C, productsInCarts PC, products P \
            WHERE C.id=PC.cart_id AND PC.product_model=P.model AND C.customer=? AND C.paid=0";
        db.all(sql, [username], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!rows || rows.length === 0) {
            // Empty cart or non existing one
            resolve(new Cart(username, false, null, 0.0, []));
            return;
          }
          const products: ProductInCart[] = rows.map((row: any) => {
            return new ProductInCart(row.model, row.quantity, row.category, row.sellingPrice);
          });
          resolve(
            new Cart(
              rows[0].customer,
              !!rows[0].paid, // convert to boolean
              rows[0].paymentDate,
              rows[0].total,
              products
            )
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a non paid empty cart for the specified user.
   *
   * @param username - The user for whom to create the empty cart.
   * @returns A Promise that resolves to the empty cart's id.
   */
  createEmptyCart(username: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        let sql = "INSERT INTO carts (paid, customer, total) VALUES (0, ?, 0.0)";
        db.run(sql, [username], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          sql = "SELECT id FROM carts WHERE paid=0 AND customer = ?";
          db.get(sql, [username], (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (!row) {
              reject(new CartNotFoundError());
              return;
            }
            resolve(row.id);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves the cart id of the current non paid cart of a certain user.
   *
   * @param username - The user for whom to retrieve the current cart id.
   * @returns A Promise that resolves to the current cart id if there is one, otherwise null.
   */
  getCurrentCartId(username: string): Promise<number | null> {
    return new Promise<number | null>((resolve, reject) => {
      try {
        const sql = "SELECT id FROM carts WHERE customer=? AND paid=0";
        db.get(sql, [username], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          row ? resolve(row.id) : resolve(null);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Adds a single unit of product to the user's cart.
   *
   * @param cartId - The id of the cart to which the product should be added.
   * @param product - The model of the product to add.
   * @returns A Promise that resolves to `true` if the product was successfully added.
   */
  addProductToCart(cartId: number, product: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [product], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          // Check quantity in stock
          if (row.quantity === 0) {
            reject(new LowProductStockError());
            return;
          }
          sql =
            "INSERT INTO productsInCarts (cart_id, product_model, quantity_in_cart) VALUES (?,?,1)";
          db.run(sql, [cartId, product], function (err: Error | null) {
            if (err) {
              reject(err);
              return;
            }
            resolve(true);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Remove a single unit of product from the user's cart.
   *
   * @param cartId - The id of the cart to which the product should be removed.
   * @param product - The model of the product to remove.
   * @returns A Promise that resolves to `true` if the product was successfully removed.
   */
  removeProductFromCart(cartId: number, product: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        // Check if product exists
        let sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [product], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          sql = "DELETE FROM productsInCarts WHERE cart_id=? AND product_model=?";
          db.run(sql, [cartId, product], function (err: Error | null) {
            if (err) {
              reject(err);
              return;
            }
            if (this.changes === 0) {
              reject(new ProductNotInCartError());
              return;
            }
            resolve(true);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Remove a single unit of product from the user's cart.
   *
   * @param cartId - The id of the cart to which the product should be removed.
   * @param product - The model of the product to remove.
   * @returns A Promise that resolves to `true` if the product was successfully removed.
   */
  modifyProductQuantity(product: string, cartId: number, quantityToAdd: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [product], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          // Check quantity in stock
          if (row.quantity - quantityToAdd < 0) {
            reject(new LowProductStockError());
            return;
          }
          sql = `UPDATE productsInCarts SET quantity_in_cart=quantity_in_cart+? 
                    WHERE cart_id=? AND product_model=?`;
          db.run(sql, [quantityToAdd, cartId, product], function (err: Error | null) {
            if (err) {
              reject(err);
              return;
            }
            if (this.changes === 0) {
              reject(new ProductNotInCartError());
              return;
            }
            resolve(true);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all paid carts for a specific customer.
   *
   * @param username - The username for whom to retrieve the past paid carts.
   * @returns A Promise that resolves to an array of carts belonging to the customer.
   */
  getPaidCarts(username: string): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        const carts: Cart[] = [];
        let currentCartId = -1;
        let cart: Cart;
        const sql = `SELECT C.*,P.model, P.category,P.sellingPrice, PC.quantity_in_cart AS quantity 
          FROM carts C, productsInCarts PC, products P 
          WHERE C.id=PC.cart_id AND PC.product_model=P.model AND C.customer=? AND C.paid=1
          ORDER BY C.id`;
        db.all(sql, [username], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Create cart objects
          for (const row of rows) {
            if (currentCartId !== row.id) {
              cart = new Cart(row.customer, !!row.paid, row.paymentDate, row.total, []);
              carts.push(cart);
              currentCartId = row.id;
            }
          }
          // Populate products in carts
          let index = -1;
          currentCartId = -1;
          for (const row of rows) {
            const product = new ProductInCart(
              row.model,
              row.quantity,
              row.category,
              row.sellingPrice
            );
            if (row.id !== currentCartId) {
              currentCartId = row.id;
              index++;
            }
            carts[index].products.push(product);
          }
          resolve(carts);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes all carts of all users.
   *
   * @returns A Promise that resolves to `true` if all carts were successfully deleted.
   */
  deleteAllCarts(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "DELETE FROM carts ";
        db.run(sql, [], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all carts in the database.
   *
   * @returns A Promise that resolves to an array of carts.
   */
  getAllCarts(): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        const carts: Cart[] = [];
        let currentCartId = -1;
        let cart: Cart;
        const sql = `SELECT C.*, P.model, P.category, P.sellingPrice, PC.quantity_in_cart AS quantity 
                     FROM carts C LEFT JOIN productsInCarts PC ON C.id=PC.cart_id 
                     LEFT JOIN products P ON PC.product_model=P.model 
                     ORDER BY C.id`;
        db.all(sql, (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Create cart objects
          for (const row of rows) {
            if (currentCartId !== row.id) {
              cart = new Cart(row.customer, row.paid, row.paymentDate, row.total, []);
              carts.push(cart);
              currentCartId = row.id;
            }
          }
          // Second pass: populate products in carts
          let index = -1;
          currentCartId = -1;
          for (const row of rows) {
            const product = new ProductInCart(
              row.model,
              row.quantity,
              row.category,
              row.sellingPrice
            );
            if (row.id !== currentCartId) {
              currentCartId = row.id;
              index++;
            }
            carts[index].products.push(product);
          }
          resolve(carts);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Removes all products from the specified cart.
   *
   * @param cartId - The id of the cart to which the products should be removed.
   * @returns A Promise that resolves to `true` if the cart was successfully cleared.
   */
  deleteProductsInCart(cartId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "DELETE FROM productsInCarts WHERE cart_id=?";
        db.run(sql, [cartId], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Determines whether the quantity of each product inside the specified cart exceedes the stock availability.
   *
   * @param cartId - The id of the cart to which the products availability will be checked.
   * @returns A Promise that resolves to `true` if all the products are available in the selected quantity, `false` otherwise.
   */
  areProductsInCartAvailable(cartId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const sql = `SELECT * FROM products P, productsInCarts PC
                      WHERE P.model=PC.product_model AND PC.cart_id=? AND P.quantity < PC.quantity_in_cart`;
        db.all(sql, [cartId], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          rows.length > 0 ? resolve(false) : resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Checks out the specified cart.
   *
   * @param cartId - The id of the cart that should be checked out.
   * @returns A Promise that resolves to `true` if the cart was successfully checked out.
   */
  checkoutCurrentCart(cartId: number, cart: Cart): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const currentDate = new Date().toISOString().split("T")[0];
        let sql = "UPDATE carts SET paid=1, paymentDate=? WHERE id=?";
        db.run(sql, [currentDate, cartId], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          // Update products availability
          for (const product of cart.products) {
            sql = `UPDATE products SET quantity = quantity - ? WHERE model=?`;
            db.run(sql, [product.quantity, product.model], function (err: Error | null) {
              if (err) {
                reject(err);
                return;
              }
            });
            resolve(true);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default CartDAO;
