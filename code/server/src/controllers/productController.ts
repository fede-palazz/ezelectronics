import ProductDAO from "../dao/productDAO";
import dayjs from "dayjs";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../errors/productError"
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
  ) /**:Promise<void> */ {
    if (arrivalDate && !/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate)) {
      throw new DateError();
    }

    if (arrivalDate && dayjs(arrivalDate).isAfter(dayjs())) {
      throw new DateError();
    }

    const product = await this.dao.getProduct(model);
    if (!product) {
      return this.dao.registerProduct(model, category, quantity, details, sellingPrice, arrivalDate);
    } else {
      throw new ProductAlreadyExistsError();
    }
  }


  /**
   * Modifies the quantity of a product in the database.
   * @param model The model of the product to modify.
   * @param newQuantity The new quantity of the product.
   * @param changeDate The optional date when the change occurred.
   * @returns A Promise that resolves when the product quantity has been successfully updated.
   */
  async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null) {
    const product = await this.dao.getProduct(model);
    if (!product) {
      throw new ProductNotFoundError();
    } else {
      if (changeDate && !/^\d{4}-\d{2}-\d{2}$/.test(changeDate)) {
        throw new DateError();
      }

      if (changeDate && dayjs(changeDate).isAfter(dayjs())) {
        throw new DateError();
      }

      if (changeDate && dayjs(changeDate).isBefore(dayjs(product.arrivalDate))) {
        throw new DateError();
      }
      return this.dao.changeProductQuantity(model, newQuantity);
    }
  }


  /**
   * Decreases the available quantity of a product through the sale of units.
   * @param model The model of the product to sell
   * @param quantity The number of product units that were sold.
   * @param sellingDate The optional date in which the sale occurred.
   * @returns A Promise that resolves to the new available quantity of the product.
   */

  async sellProduct(model: string, quantity: number, sellingDate: string | null) {
    const product = await this.dao.getProduct(model);
    if (!product) {
      throw new ProductNotFoundError();
    } else {

      if (sellingDate && !/^\d{4}-\d{2}-\d{2}$/.test(sellingDate)) {
        throw new DateError();
      }

      if (sellingDate && dayjs(sellingDate).isAfter(dayjs())) {
        throw new DateError();
      }

      if (sellingDate && dayjs(sellingDate).isBefore(dayjs(product.arrivalDate))) {
        throw new DateError();
      }

      if (product.quantity == 0) {
        throw new EmptyProductStockError();
      }

      if (product.quantity < quantity) {
        throw new LowProductStockError();
      }

      return this.dao.sellProduct(model, quantity);
    }
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
  ) /**Promise<Product[]> */ {
    if (grouping === 'model') {
      const product = await this.dao.getProduct(model);
      if (!product) {
        throw new Error('ERROR 404: Product not found');
      }
    }
    return this.dao.getProducts(grouping, category, model);
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
  ) /**:Promise<Product[]> */ {
    if (grouping === 'model') {
      const product = await this.dao.getProduct(model);
      if (!product) {
        throw new Error('ERROR 404: Product not found');
      }
    }
    return this.dao.getAvailableProducts(grouping, category, model);
  }

  /**
   * Deletes all products.
   * @returns A Promise that resolves to `true` if all products have been successfully deleted.
   */
  async deleteAllProducts() /**:Promise <Boolean> */ {
    return this.dao.deleteAllProducts();
  }

  /**
   * Deletes one product, identified by its model
   * @param model The model of the product to delete
   * @returns A Promise that resolves to `true` if the product has been successfully deleted.
   */
  async deleteProduct(model: string) /**:Promise <Boolean> */ {
    console.log(model);
    const product = await this.dao.getProduct(model);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return this.dao.deleteProduct(model);
  }
}

export default ProductController;
