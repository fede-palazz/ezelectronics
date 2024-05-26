import { Category, Product } from "../components/product";
import db from "../db/db";
import { ProductAlreadyExistsError, ProductNotFoundError } from "../errors/productError";

class ProductDAO {
  /**
   * Adds a product to the database.
   *
   * @param model - The model of the product.
   * @param category - The category of the product.
   * @param quantity - The initial quantity of the product.
   * @param details - The details of the product.
   * @param sellingPrice - The selling price of the product.
   * @param arrivalDate - The arrival date of the product.
   * @returns A promise that resolves when the product is successfully added to the database.
   * @throws If there is an error while adding the product to the database.
   */
  registerProduct(
    model: String,
    category: String,
    quantity: number,
    details: String,
    sellingPrice: number,
    arrivalDate: String
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const sql =
          "INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?,?,?,?,?,?)";
        db.run(
          sql,
          [model, category, quantity, details, sellingPrice, arrivalDate],
          function (err: Error | null) {
            if (err) {
              if (err.message.includes("UNIQUE constraint failed: products.model")) {
                //Product already existing in db
                reject(new ProductAlreadyExistsError());
                return;
              }
              reject(err);
              return;
            }
            resolve(null);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Changes the quantity of a product in the database.
   *
   * @param model - The model of the product.
   * @param newQuantity - The new quantity to be added to the current quantity.
   * @returns A promise that resolves with the new quantity.
   * @throws If there is an error while updating the quantity in the database.
   */
  async changeProductQuantity(model: string, newQuantity: number) {
    return new Promise<number>((resolve, reject) => {
      try {
        const sql = "UPDATE products SET quantity=? WHERE model=?";
        db.run(sql, [newQuantity, model], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new ProductNotFoundError());
            return;
          }
          resolve(newQuantity);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sells a product and updates the quantity in the database.
   *
   * @param model - The model of the product.
   * @param quantity - The quantity of the product to be sold.
   * @returns A promise that resolves with the remaining quantity.
   * @throws If there is an error while updating the quantity in the database.
   */
  sellProduct(model: string, quantity: number) {
    return new Promise<number>((resolve, reject) => {
      try {
        db.run(
          "UPDATE products SET quantity = quantity - ? WHERE model = ?",
          [quantity, model],
          (err) => {
            if (err) {
              reject(err);
            } else {
              db.get(
                "SELECT quantity FROM products WHERE model = ?",
                model,
                (err, row: { quantity: number }) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row.quantity);
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all products from the database.
   *
   * @returns A promise that resolves with a list of products.
   * @throws If there is an error while retrieving the products from the database.
   */
  getProducts(): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
      try {
        const sql = "SELECT * FROM products";
        db.all(sql, [], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          const products: Product[] = rows.map(
            (row: any) =>
              new Product(
                row.sellingPrice,
                row.model,
                row.category,
                row.arrivalDate,
                row.details,
                row.quantity
              )
          );
          resolve(products);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all products that belong to a certain category.
   *
   * @returns A promise that resolves with a list of products.
   * @throws If there is an error while retrieving the products from the database.
   */
  getProductsByCategory(category: string): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
      try {
        const sql = "SELECT * FROM products WHERE category=?";
        db.all(sql, [category], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          const products: Product[] = rows.map(
            (row: any) =>
              new Product(
                row.sellingPrice,
                row.model,
                row.category,
                row.arrivalDate,
                row.details,
                row.quantity
              )
          );
          resolve(products);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all available products from the database.
   *
   * @returns A promise that resolves with a list of products.
   * @throws If there is an error while retrieving the products from the database.
   */
  getAvailableProducts() {
    return new Promise<Product[]>((resolve, reject) => {
      try {
        const sql = "SELECT * FROM products WHERE quantity > 0";
        db.all(sql, [], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          const products: Product[] = rows.map(
            (row: any) =>
              new Product(
                row.sellingPrice,
                row.model,
                row.category,
                row.arrivalDate,
                row.details,
                row.quantity
              )
          );
          resolve(products);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves all available products that belong to a certain category.
   *
   * @returns A promise that resolves with a list of products.
   * @throws If there is an error while retrieving the products from the database.
   */
  getAvailableProductsByCategory(category: string): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
      try {
        const sql = "SELECT * FROM products WHERE quantity > 0 AND category=?";
        db.all(sql, [category], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          const products: Product[] = rows.map(
            (row: any) =>
              new Product(
                row.sellingPrice,
                row.model,
                row.category,
                row.arrivalDate,
                row.details,
                row.quantity
              )
          );
          resolve(products);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves a product from the database.
   *
   * @param model - The model of the product.
   * @returns A promise that resolves with the product.
   * @throws If there is an error while retrieving the product from the database.
   */
  getProduct(model: string): Promise<Product> {
    return new Promise<Product>((resolve, reject) => {
      db.get(
        "SELECT * FROM products WHERE model = ?",
        [model],
        (
          err,
          row: {
            model: string;
            category: Category;
            quantity: number;
            details: string | null;
            sellingPrice: number;
            arrivalDate: string | null;
          }
        ) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            const product = new Product(
              row.sellingPrice,
              row.model,
              row.category,
              row.arrivalDate,
              row.details,
              row.quantity
            );
            resolve(product);
          }
        }
      );
    });
  }

  /**
   * Deletes a product from the database.
   *
   * @param model - The model of the product to be deleted.
   * @returns A promise that resolves when the product is successfully deleted.
   * @throws If there is an error while deleting the product from the database.
   */
  deleteProduct(model: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const sql = "DELETE FROM products WHERE model=?";
        db.run(sql, [model], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new ProductNotFoundError());
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
   * Deletes all products from the database.
   *
   * @returns A promise that resolves when all products are successfully deleted.
   * @throws If there is an error while deleting the products from the database.
   */
  deleteAllProducts(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const sql = "DELETE FROM products";
        db.run(sql, function (err: Error | null) {
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
}

export default ProductDAO;
