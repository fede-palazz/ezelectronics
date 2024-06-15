import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { User } from "../components/user";
import db from "../db/db";
import { ProductNotFoundError } from "../errors/productError";
import { ProductReview } from "../components/review";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
  /**
   * Adds a review to the database.
   *
   * @param model - The model of the product being reviewed.
   * @param user - The user who wrote the review.
   * @param score - The score given to the product.
   * @param comment - The comment provided by the user.
   * @returns A promise that resolves when the review is successfully added to the database.
   * @throws If there is an error while adding the review to the database.
   */
  addReview(model: string, username: string, score: number, comment: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const sql = "INSERT INTO reviews (user, product, score, date, comment) VALUES (?,?,?,?,?)";
        const date = new Date().toISOString().split("T")[0];
        db.run(sql, [username, model, score, date, comment], function (err: Error | null) {
          if (err) {
            if (err.message.includes("UNIQUE constraint failed: reviews.user, reviews.product")) {
              // Review already existing in db
              reject(new ExistingReviewError());
              return;
            }
            if (err.message.includes("FOREIGN KEY constraint failed")) {
              // Product not found
              reject(new ProductNotFoundError());
              return;
            }
            reject(err);
            return;
          }
          resolve(null);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves the reviews for a specific product model.
   *
   * @param model - The model of the product.
   * @returns A promise that resolves to an array of review objects.
   */
  getProductReviews(model: string): Promise<ProductReview[]> {
    return new Promise<ProductReview[]>((resolve, reject) => {
      try {
        const sql = "SELECT * FROM reviews WHERE product=?";
        db.all(sql, [model], (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (rows.length == 0) {
            reject(new ProductNotFoundError());
          }
          const reviews = rows.map(
            (row: any) => new ProductReview(row.product, row.user, row.score, row.date, row.comment)
          );
          resolve(reviews);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes a review from the database.
   *
   * @param model - The model of the product associated with the review.
   * @param user - The user who posted the review.
   * @returns A promise that resolves when the review is successfully deleted, or rejects with an error if an error occurs.
   */
  deleteReview(model: string, username: string): Promise<null> {
    return new Promise<null>((resolve, reject) => {
      try {
        let sql = "SELECT * FROM products WHERE model=?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          sql = "DELETE FROM reviews WHERE product=? AND user=?";
          db.run(sql, [model, username], function (err: Error | null) {
            if (err) {
              reject(err);
              return;
            }
            if (this.changes === 0) {
              reject(new ProductNotFoundError());
              return;
            }
            resolve(null);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes all reviews of a given product model from the database.
   *
   * @param model - The model of the product.
   * @returns A promise that resolves when the reviews are successfully deleted, or rejects with an error if an error occurs.
   */
  deleteReviewsOfProduct(model: string): Promise<null> {
    return new Promise<null>((resolve, reject) => {
      try {
        // Check whether product exists
        let sql = "SELECT * FROM products WHERE model=?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new ProductNotFoundError());
            return;
          }
          sql = "DELETE FROM reviews WHERE product=?";
          db.run(sql, [model], (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(null);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes all reviews from the database.
   *
   * @returns A promise that resolves when the deletion is successful, or rejects with an error if it fails.
   */
  deleteAllReviews(): Promise<null> {
    return new Promise<null>((resolve, reject) => {
      try {
        const sql = "DELETE FROM reviews";
        db.run(sql, [], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve(null);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default ReviewDAO;
