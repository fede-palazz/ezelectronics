import { User } from "../components/user";
import db from "../db/db";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    /**
     * Retrieves a review for a specific model and user.
     * @param model - The model of the product.
     * @param user - The user object containing the username.
     * @returns A promise that resolves with the review object if found, or rejects with an error.
     */
    getReview(model: string, user: User) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM reviews WHERE model = ? AND user = ?", [model, user.username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

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
    addReview(model: string, user: User, score: number, comment: string) {
        return new Promise<void>((resolve, reject) => {
            db.run("INSERT INTO reviews (model, user, score, comment) VALUES (?, ?, ?, ?)", [model, user.username, score, comment], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Retrieves the reviews for a specific product model.
     * 
     * @param model - The model of the product.
     * @returns A promise that resolves to an array of review objects.
     */
    getProductReviews(model: string) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM reviews WHERE model = ?", [model], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Deletes a review from the database.
     * 
     * @param model - The model of the product associated with the review.
     * @param user - The user who posted the review.
     * @returns A promise that resolves when the review is successfully deleted, or rejects with an error if an error occurs.
     */
    deleteReview(model: string, user: User) {
        return new Promise<void>((resolve, reject) => {
            db.run("DELETE FROM reviews WHERE model = ? AND user = ?", [model, user.username], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Deletes all reviews of a given product model from the database.
     * @param model - The model of the product.
     * @returns A promise that resolves when the reviews are successfully deleted, or rejects with an error if an error occurs.
     */
    deleteReviewsOfProduct(model: string) {
        return new Promise<void>((resolve, reject) => {
            db.run("DELETE FROM reviews WHERE model = ?", [model], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Deletes all reviews from the database.
     * @returns A promise that resolves when the deletion is successful, or rejects with an error if it fails.
     */
    deleteAllReviews() {
        return new Promise<void>((resolve, reject) => {
            db.run("DELETE FROM reviews", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export default ReviewDAO;
