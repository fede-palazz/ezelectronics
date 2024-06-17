import { Product } from "../components/product";
import ProductDAO from "../dao/productDAO";
import {
  ProductNotFoundError,
  ProductAlreadyExistsError,
  ProductSoldError,
  EmptyProductStockError,
  LowProductStockError,
} from "../errors/productError";
import { DateError } from "../utilities";

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
  private dao: ProductDAO;

  constructor() {
    this.dao = new ProductDAO();
  }

  /**
   * Registers a new product concept (model, with quantity defining the number of units available) in the database.
   * @param model The unique model of the product.
   * @param category The category of the product.
   * @param quantity The number of units of the new product.
   * @param details The optional details of the product.
   * @param sellingPrice The price at which one unit of the product is sold.
   * @param arrivalDate The optional date in which the product arrived.
   * @returns A Promise that resolves to nothing.
   */
  async registerProducts(
    model: string,
    category: string,
    quantity: number,
    details: string | null,
    sellingPrice: number,
    arrivalDate: string | null
  ): Promise<void> {
    if (arrivalDate && new Date(arrivalDate) > new Date()) {
      // Check if arrivalDate is a future date
      return Promise.reject(new DateError());
    }
    if (!arrivalDate) {
      arrivalDate = new Date().toISOString().split("T")[0];
    }
    return this.dao.registerProduct(model, category, quantity, details, sellingPrice, arrivalDate);
  }

  /**
   * Modifies the quantity of a product in the database.
   * @param model The model of the product to modify.
   * @param newQuantity The new quantity of the product.
   * @param changeDate The optional date when the change occurred.
   * @returns A Promise that resolves when the product quantity has been successfully updated.
   */
  async changeProductQuantity(
    model: string,
    newQuantity: number,
    changeDate: string | null
  ): Promise<number> {
    const product = await this.dao.getProduct(model);
    // Validate changeDate
    if (
      changeDate &&
      (new Date(changeDate) > new Date() || new Date(changeDate) < new Date(product.arrivalDate))
    ) {
      return Promise.reject(new DateError());
    }
    newQuantity = newQuantity + product.quantity;
    return this.dao.changeProductQuantity(model, newQuantity);
  }

  /**
   * Decreases the available quantity of a product through the sale of units.
   * @param model The model of the product to sell
   * @param quantity The number of product units that were sold.
   * @param sellingDate The optional date in which the sale occurred.
   * @returns A Promise that resolves to the new available quantity of the product.
   */

  async sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
    const product = await this.dao.getProduct(model);
    // Validate sellingDate
    if (
      sellingDate &&
      (new Date(sellingDate) > new Date() || new Date(sellingDate) < new Date(product.arrivalDate))
    ) {
      return Promise.reject(new DateError());
    }
    // Check quantity in stock
    if (product.quantity === 0) {
      return Promise.reject(new EmptyProductStockError());
    }
    if (quantity > product.quantity) {
      return Promise.reject(new LowProductStockError());
    }
    const newQuantity = product.quantity - quantity;
    return this.dao.changeProductQuantity(model, newQuantity);
  }

  /**
   * Returns all products in the database, with the option to filter them by category or model.
   * @param grouping An optional parameter. If present, it can be either "category" or "model".
   * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
   * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
   * @returns A Promise that resolves to an array of Product objects.
   */
  async getProducts(
    grouping: string | null,
    category: string | null,
    model: string | null
  ): Promise<Product[]> {
    switch (grouping) {
      case "model":
        return this.dao.getProduct(model).then((product) => [product]);
      case "category":
        return this.dao.getProductsByCategory(category);
      default:
        return this.dao.getProducts();
    }
  }

  /**
   * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
   * @param grouping An optional parameter. If present, it can be either "category" or "model".
   * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
   * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
   * @returns A Promise that resolves to an array of Product objects.
   */
  async getAvailableProducts(
    grouping: string | null,
    category: string | null,
    model: string | null
  ): Promise<Product[]> {
    switch (grouping) {
      case "model":
        return this.dao
          .getProduct(model)
          .then((product) => (product.quantity > 0 ? [product] : []));
      case "category":
        return this.dao.getAvailableProductsByCategory(category);
      default:
        return this.dao.getAvailableProducts();
    }
  }

  /**
   * Deletes all products from the database.
   * @returns A Promise that resolves to `true` if all products have been successfully deleted.
   */
  async deleteAllProducts(): Promise<boolean> {
    return this.dao.deleteAllProducts();
  }

  /**
   * Deletes one product, identified by its model
   * @param model The model of the product to delete
   * @returns A Promise that resolves to `true` if the product has been successfully deleted.
   */
  async deleteProduct(model: string): Promise<boolean> {
    return this.dao.deleteProduct(model);
  }
}

export default ProductController;
