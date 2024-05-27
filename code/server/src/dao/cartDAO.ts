import { Cart, ProductInCart } from "../components/cart";
import db from "../db/db";
import { ProductNotFoundError, LowProductStockError } from "../errors/productError";
import { ProductNotInCartError } from "../errors/cartError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
  createEmptyCart(customer: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        let sql = "INSERT INTO carts (paid, customer, total) VALUES (0, ?, 0)";
        db.run(sql, [customer], function (err) {
          if (err) {
            reject(err);
            return;
          }
          sql = "SELECT * FROM carts WHERE paid=0 AND customer = ?";
          db.get(sql, [customer], (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(row.id);
          });
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  cartExists(customer: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        const sql = "SELECT id FROM carts WHERE customer = ? AND paid = 0";
        db.get(sql, [customer], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (row === undefined) {
            resolve(0);
          } else resolve(row.id);
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  addCurrentCart(product: string, username: string, cartid: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [product], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (row === undefined) {
            reject(new ProductNotFoundError());
            return;
          } else if (row.quantity === 0) {
            reject(new LowProductStockError());
            return;
          } else {
            sql = "SELECT * FROM productsInCarts WHERE cart_id = ? AND product_model = ?";
            db.get(sql, [cartid, product], (err: Error | null, row: any) => {
              if (err) {
                reject(err);
                return;
              }
              if (row === undefined) {
                sql =
                  "INSERT INTO productsInCarts (cart_id, product_model, quantity_in_cart) VALUES (?,?,?) ";
                db.run(sql, [cartid, product, 1], function (err) {
                  if (err) {
                    reject(err);
                    return;
                  } else resolve(true);
                });
              } else {
                sql =
                  "UPDATE productsInCarts SET  quantity_in_cart = quantity_in_cart + 1 WHERE cart_id=? AND product_model=?";
                db.run(sql, [cartid, product], function (err) {
                  if (err) {
                    reject(err);
                    return;
                  } else resolve(true);
                });
              }
            });
          }
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  getCurrentCartByUsername(username: string): Promise<Cart> {
    return new Promise<Cart>((resolve, reject) => {
      try {
        const sql =
          "SELECT C.*, P.model, P.category,P.sellingPrice, PC.quantity_in_cart AS quantity FROM carts C,productsInCarts PC, products P WHERE C.id=PC.cart_id AND PC.product_model=P.model AND C.customer = ? AND C.paid=0";
        db.all(sql, [username], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (rows.length > 0) {
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
          }
          resolve(new Cart(username, false, null, 0, []));
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  getPaidCartsByUsername(username: string): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        const carts: Cart[] = [];
        let currentCartId = -1;
        let cart: Cart;
        const sql =
          "SELECT C.*,P.model, P.category,P.sellingPrice, PC.quantity_in_cart AS quantity FROM carts C,productsInCarts PC,products P WHERE C.id=PC.cart_id AND PC.product_model=P.model AND C.customer = ? AND C.paid=1 ORDER BY C.id";
        db.all(sql, [username], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          for (const row of rows) {
            if (currentCartId !== row.id) {
              cart = new Cart(row.customer, !!row.paid, row.paymentDate, row.total, []);
              carts.push(cart);
              currentCartId = row.id;
            }
          }
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
        return;
      }
    });
  }

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
        return;
      }
    });
  }

  getAllCarts(): Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject) => {
      try {
        const carts: Cart[] = [];
        let currentCartId = -1;
        let cart: Cart;
        const sql = `SELECT C.*, P.model, P.category, P.sellingPrice, PC.quantity_in_cart AS quantity 
                     FROM carts C 
                     LEFT JOIN productsInCarts PC ON C.id = PC.cart_id 
                     LEFT JOIN products P ON PC.product_model = P.model 
                     ORDER BY C.id`;
        db.all(sql, (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          // First pass: create cart objects
          for (const row of rows) {
            if (currentCartId !== row.id) {
              cart = new Cart(row.customer, row.paid, row.paymentDate, row.total, []);
              carts.push(cart);
              currentCartId = row.id;
            }
          }
          // Second pass: populate products in carts
          currentCartId = -1;
          let index = -1;
          for (const row of rows) {
            if (row.cart_id !== currentCartId) {
              currentCartId = row.cart_id;
              index++;
            }
            if (row.model !== null) {
              const product = new ProductInCart(
                row.model,
                row.quantity,
                row.category,
                row.sellingPrice
              );
              carts[index].products.push(product);
            }
          }
          resolve(carts);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteProductsCart(cartId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "DELETE FROM productsInCarts WHERE cart_id = ?";
        db.run(sql, [cartId], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve(true);
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  checkoutCurrentCart(cartId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const currentDate = new Date().toISOString().split("T")[0];
        const sql = "UPDATE carts SET paid = 1, paymentDate = ? WHERE id = ?";
        db.run(sql, [currentDate, cartId], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve(true);
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  removeProductFromCurrentCart(cartid: number, product: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        let sql = "SELECT * FROM productsInCarts WHERE cart_id = ? AND product_model = ?";
        db.get(sql, [cartid, product], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (row === undefined) {
            reject(new ProductNotInCartError());
          } else {
            if (row.quantity_in_cart == 1) {
              sql = "DELETE FROM productsInCarts WHERE cart_id=? AND product_model=?";
              db.run(sql, [cartid, product], function (err: Error | null) {
                if (err) {
                  reject(err);
                  return;
                } else resolve(true);
              });
            } else {
              sql =
                "UPDATE productsInCarts SET  quantity_in_cart = quantity_in_cart - 1 WHERE cart_id=? AND product_model=?";
              db.run(sql, [cartid, product], function (err: Error | null) {
                if (err) {
                  reject(err);
                  return;
                } else resolve(true);
              });
            }
          }
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  checkQuantity(model: string, quantity: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (row.quantity > quantity && row.quantity > 0) {
            resolve(true);
            return;
          }
          reject(new LowProductStockError());
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
  }
}

export default CartDAO;
