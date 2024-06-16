import { test, expect, jest, describe, afterEach, beforeEach } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { Role, User } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"
import { ExistingReviewError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError"


jest.mock("../../src/dao/reviewDAO")

let controller: ReviewController;

describe("create new review", () => {
    beforeEach(() => {
        controller = new ReviewController();
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("create Review", async () => {
        const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
        const testReview = {
            model: "test",
            user: testUser,
            score: 3,
            comment: "test",
        }
        jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce(); //Mock the createReview method of the DAO
        //Call the createReview method of the controller with the test Review object
        const response = await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment);

        //Check if the createReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testReview.model, testReview.user.username, testReview.score, testReview.comment);
        expect(response).toBeUndefined();
    });

    test("not found product", async () => {
        const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
        const testReview = {
            model: "test",
            user: testUser,
            score: 3,
            comment: "test",
        }
        jest.spyOn(ReviewDAO.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError()); //Mock the createReview method of the DAO
        //Call the createReview method of the controller with the test Review object
        await expect(controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ProductNotFoundError);

        //Check if the createReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testReview.model, testReview.user.username, testReview.score, testReview.comment);
    });

    test("already existing Review", async () => {
        const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
        const testReview = {
            model: "test",
            user: testUser,
            score: 3,
            comment: "test",
        }
        jest.spyOn(ReviewDAO.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError()); //Mock the createReview method of the DAO
        //Call the createReview method of the controller with the test Review object
        await expect(controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ExistingReviewError);

        //Check if the createReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testReview.model, testReview.user.username, testReview.score, testReview.comment);
    });
});
describe("Get product reviews", () => {
    beforeEach(() => {
        controller = new ReviewController();
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    test("get Product Reviews", async () => {
        const mockReviews = [
            { product: "testModel", user: "user1", score: 5, date: "2024-01-01", comment: "Great product!" },
            { product: "testModel", user: "user2", score: 4, date: "2024-01-02", comment: "Good value." },
            { product: "testModel", user: "user3", score: 3, date: "2024-01-03", comment: "Average." }
        ];

        const expectedReviews = mockReviews.map(
            (row: any) => new ProductReview(row.product, row.user, row.score, row.date, row.comment)
        );

        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(expectedReviews); //Mock the createReview method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createReview method of the controller with the test Review object
        const response = await controller.getProductReviews("model");

        //Check if the createReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith("model");
        expect(response).toBe(expectedReviews)
    });

    test("not found product", async () => {

        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockRejectedValueOnce(new ProductNotFoundError()); //Mock the createReview method of the DAO
        //Call the createReview method of the controller with the test Review object
        await expect(controller.getProductReviews("model")).rejects.toThrow(ProductNotFoundError);

        //Check if the createReview method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith("model");
    });
});

describe("Delete Review", () => {
    beforeEach(() => {
        controller = new ReviewController();
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("successfully delete review", async () => {
        const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(null);

        const response = await controller.deleteReview("model", testUser);

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith("model", testUser.username);
        expect(response).toBe(null);
    });

    test("product not found", async () => {
        const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError());

        await expect(controller.deleteReview("model", testUser)).rejects.toThrow(ProductNotFoundError);

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith("model", testUser.username);
    });
});

describe("Delete Reviews of Product", () => {
    beforeEach(() => {
        controller = new ReviewController();
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("successfully delete reviews of product", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(null);

        const response = await controller.deleteReviewsOfProduct("model");

        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("model");
        expect(response).toBe(null);
    });

    test("product not found", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError());

        await expect(controller.deleteReviewsOfProduct("model")).rejects.toThrow(ProductNotFoundError);

        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("model");
    });
});

describe("Delete All Reviews", () => {
    beforeEach(() => {
        controller = new ReviewController();
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("successfully delete all reviews", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(null);

        const response = await controller.deleteAllReviews();

        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
        expect(response).toBe(null);
    });

});