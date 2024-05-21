import dayjs from "dayjs";
import { Category, Product } from "../components/product";
import db from "../db/db";


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
    registerProduct(model: String, category: String, quantity: number, details: String, sellingPrice: number, arrivalDate: String) {
        return new Promise<void>((resolve, reject) => {
            if (!arrivalDate)
                arrivalDate = dayjs().format('YYYY-MM-DD');
            db.run("INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)", [model, category, quantity, details, sellingPrice, arrivalDate], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Changes the quantity of a product in the database.
     * 
     * @param model - The model of the product.
     * @param newQuantity - The new quantity to be added to the current quantity.
     * @param changeDate - The date when the change occurred. If provided, the arrival date of the product will be updated.
     * @returns A promise that resolves with the new quantity.
     * @throws If there is an error while updating the quantity in the database.
     */
    async changeProductQuantity(model: string, newQuantity: number) {
        return new Promise<number>((resolve, reject) => {
            const params = [newQuantity, model];
            const sql = "UPDATE products SET quantity = quantity + ? WHERE model = ?";
            db.run(sql, params, (err) => {
                if (err) {
                    reject(err);
                } else {
                    db.get("SELECT quantity FROM products WHERE model = ?", model, (err, row: { quantity: number }) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row.quantity);
                        }
                    });
                }
            });
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
            db.run("UPDATE products SET quantity = quantity - ? WHERE model = ?", [quantity, model], (err) => {
                if (err) {
                    reject(err);
                } else {
                    db.get("SELECT quantity FROM products WHERE model = ?", model, (err, row: { quantity: number }) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row.quantity);
                        }
                    });
                }
            });
        });
    }

    /**
 * Retrieves all products from the database.
 * 
 * @param grouping - The grouping criteria.
 * @param category - The category of the product.
 * @param model - The model of the product.
 * @returns A promise that resolves with the list of products.
 * @throws If there is an error while retrieving the products from the database.
 */

    getProducts(grouping: string | null, category: string | null, model: string | null) {
        return new Promise<Product[]>((resolve, reject) => {
            let query = "SELECT * FROM products";
            const params = [];

            if (grouping === "category" && category) {
                query += " WHERE category = ?";
                params.push(category);
            } else if (grouping === "model" && model) {
                query += " WHERE model = ?";
                params.push(model);
            }

            db.all(query, params, (err, rows: { model: string, category: Category, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null }[]) => {
                if (err) {
                    reject(err);
                } else {
                    const products = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                }
            });
        });
    }

    /**
 * Retrieves all available products from the database.
 * 
 * @param grouping - The grouping criteria.
 * @param category - The category of the product.
 * @param model - The model of the product.
 * @returns A promise that resolves with the list of available products.
 * @throws If there is an error while retrieving the products from the database.
 */

    getAvailableProducts(grouping: string | null, category: string | null, model: string | null) {
        return new Promise<Product[]>((resolve, reject) => {
            let query = "SELECT * FROM products WHERE quantity > 0";
            const params = [];

            if (grouping === "category" && category) {
                query += " AND category = ?";
                params.push(category);
            } else if (grouping === "model" && model) {
                query += " AND model = ?";
                params.push(model);
            }

            db.all(query, params, (err, rows: { model: string, category: Category, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null }[]) => {
                if (err) {
                    reject(err);
                } else {
                    const products = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                }
            });
        });
    }

    /**
  * Retrieves a product from the database.
  * 
  * @param model - The model of the product.
  * @returns A promise that resolves with the product.
  * @throws If there is an error while retrieving the product from the database.
  */

    getProduct(model: string) {
        return new Promise<Product | null>((resolve, reject) => {
            db.get("SELECT * FROM products WHERE model = ?", [model], (err, row: { model: string, category: Category, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null }) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    const product = new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity);
                    resolve(product);
                }
            });
        });
    }



    /**
     * Deletes a product from the database.
     * 
     * @param model - The model of the product to be deleted.
     * @returns A promise that resolves when the product is successfully deleted.
     * @throws If there is an error while deleting the product from the database.
     */
    deleteProduct(model: string) {
        return new Promise<boolean>((resolve, reject) => {
            db.run("DELETE FROM products WHERE model = ?", [model], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Deletes all products from the database.
     * 
     * @returns A promise that resolves when all products are successfully deleted.
     * @throws If there is an error while deleting the products from the database.
     */
    deleteAllProducts() {
        return new Promise<boolean>((resolve, reject) => {
            db.run("DELETE FROM products", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

}

export default ProductDAO;
