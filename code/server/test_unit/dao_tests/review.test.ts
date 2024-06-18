import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import ReviewDAO from "../../src/dao/reviewDAO";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { ProductReview } from "../../src/components/review";
import { ExistingReviewError } from "../../src/errors/reviewError";
import { ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";

jest.mock("../../src/db/db.ts");

let reviewDAO: ReviewDAO;

describe("Review registration", () => {
  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Review correctly registered", async () => {
    // Mocking the database methods
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      // Simulate successful review insertion
      callback(null);
      return {} as Database;
    });

    const result = await reviewDAO.addReview("testModel", "testUser", 3, "comment");
    expect(mockDBRun).toBeCalled();
    expect(result).toBe(null);
  });

  test("Model not found", async () => {
    // Mocking the database methods
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      // Simulate model does not exist
      callback(new Error("UNIQUE constraint failed: reviews.user, reviews.product"));
      return {} as Database;
    });

    const result = reviewDAO.addReview("testModel", "testUser", 3, "comment");

    await expect(result).rejects.toEqual(new ProductNotFoundError());
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("Review already exists", async () => {
    // Mocking the database methods
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("FOREIGN KEY constraint failed"));
      return {} as Database;
    });

    const result = reviewDAO.addReview("testModel", "testUser", 3, "comment");

    await expect(result).rejects.toEqual(new ProductAlreadyExistsError());
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("DB error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });

    const result = reviewDAO.addReview("testModel", "testUser", 3, "comment");

    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBRun).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });

    const result = reviewDAO.addReview("testModel", "testUser", 3, "comment");

    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBRun).toBeCalled();
  });
});

describe("Get reviews of a product", () => {
  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Success", async () => {
    const mockReviews = [
      {
        product: "testModel",
        user: "user1",
        score: 5,
        date: "2024-01-01",
        comment: "Great product!",
      },
      { product: "testModel", user: "user2", score: 4, date: "2024-01-02", comment: "Good value." },
      { product: "testModel", user: "user3", score: 3, date: "2024-01-03", comment: "Average." },
    ];

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, mockReviews);
      return {} as Database;
    });
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, 1);
      return {} as Database;
    });

    const result = await reviewDAO.getProductReviews("testModel");

    const expectedReviews = mockReviews.map(
      (row: any) => new ProductReview(row.product, row.user, row.score, row.date, row.comment)
    );

    expect(mockDBAll).toBeCalled();
    expect(mockDBGet).toBeCalled();
    expect(result).toEqual(expectedReviews);
  });

  test("DB error", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      throw new Error("DB error");
    });

    const result = reviewDAO.getProductReviews("testModel");

    await expect(result).rejects.toThrowError("DB error");
    expect(mockDBGet).toBeCalled();
  });

  test("SQL error", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("SQL error"));
      return {} as Database;
    });

    const result = reviewDAO.getProductReviews("testModel");

    await expect(result).rejects.toEqual(new Error("SQL error"));
    expect(mockDBGet).toBeCalled();
  });
});

describe("Delete Review", () => {
  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Review successfully deleted", async () => {
    const mockProduct = {
      model: "mockModel",
      category: "mockCategory",
      quantity: 10,
      details: "mockDetails",
      sellingPrice: 100,
      arrivalDate: "2024-06-03",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback.call({ changes: 1 }, null);
      return {} as Database;
    });

    const result = await reviewDAO.deleteReview("testModel", "testUser");

    expect(mockDBGet).toBeCalled();
    expect(mockDBRun).toBeCalled();
    expect(result).toBe(null);
  });

  test("Product not found", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null); // Simulate product not found
      return {} as Database;
    });

    const result = reviewDAO.deleteReview("testModel", "testUser");

    await expect(result).rejects.toEqual(new ProductNotFoundError());
    expect(mockDBGet).toHaveBeenCalled();
  });

  test("Review not found", async () => {
    const mockProduct = {
      model: "mockModel",
      category: "mockCategory",
      quantity: 10,
      details: "mockDetails",
      sellingPrice: 100,
      arrivalDate: "2024-06-03",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      // Simula il fatto che non ci siano recensioni da eliminare
      callback.call({ changes: 0 }, null);
      return {} as Database;
    });

    const result = reviewDAO.deleteReview("testModel", "testUser");

    await expect(result).rejects.toEqual(new ProductNotFoundError());
    expect(mockDBGet).toBeCalled();
    expect(mockDBRun).toBeCalled();
  });

  test("DB error on get", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("DB error on get"), null);
      return {} as Database;
    });

    const result = reviewDAO.deleteReview("testModel", "testUser");

    await expect(result).rejects.toThrowError("DB error on get");
    expect(mockDBGet).toBeCalled();
  });

  test("DB error", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      throw new Error("DB error on get");
    });

    const result = reviewDAO.deleteReview("testModel", "testUser");

    await expect(result).rejects.toThrowError("DB error on get");
    expect(mockDBGet).toBeCalled();
  });

  test("DB error on delete", async () => {
    const mockProduct = {
      model: "mockModel",
      category: "mockCategory",
      quantity: 10,
      details: "mockDetails",
      sellingPrice: 100,
      arrivalDate: "2024-06-03",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("DB error on delete"));
      return {} as Database;
    });

    const result = reviewDAO.deleteReview("testModel", "testUser");

    await expect(result).rejects.toThrowError("DB error on delete");
    expect(mockDBGet).toBeCalled();
    expect(mockDBRun).toBeCalled();
  });
});

describe("Delete Reviews of Product", () => {
  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Successfully delete reviews of product", async () => {
    const mockProduct = {
      model: "mockModel",
      category: "mockCategory",
      quantity: 10,
      details: "mockDetails",
      sellingPrice: 100,
      arrivalDate: "2024-06-03",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null); // Simulate successful deletion
      return {} as Database;
    });

    const result = await reviewDAO.deleteReviewsOfProduct("testModel");

    expect(mockDBGet).toBeCalled();
    expect(mockDBRun).toBeCalled();
    expect(result).toBe(null);
  });

  test("Product not found", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null); // Simulate product not found
      return {} as Database;
    });

    const result = reviewDAO.deleteReviewsOfProduct("testModel");

    await expect(result).rejects.toEqual(new ProductNotFoundError());
    expect(mockDBGet).toHaveBeenCalled();
  });

  test("DB error on get", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(new Error("DB error on get"), null);
      return {} as Database;
    });

    const result = reviewDAO.deleteReviewsOfProduct("testModel");

    await expect(result).rejects.toThrowError("DB error on get");
    expect(mockDBGet).toHaveBeenCalled();
  });

  test("DB error", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      throw new Error("DB error on get");
    });

    const result = reviewDAO.deleteReviewsOfProduct("testModel");

    await expect(result).rejects.toThrowError("DB error on get");
    expect(mockDBGet).toBeCalled();
  });

  test("DB error on delete", async () => {
    const mockProduct = {
      model: "mockModel",
      category: "mockCategory",
      quantity: 10,
      details: "mockDetails",
      sellingPrice: 100,
      arrivalDate: "2024-06-03",
    };
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("DB error on delete"));
      return {} as Database;
    });

    const result = reviewDAO.deleteReviewsOfProduct("testModel");

    await expect(result).rejects.toThrowError("DB error on delete");
    expect(mockDBGet).toHaveBeenCalled();
    expect(mockDBRun).toHaveBeenCalled();
  });
});

describe("Delete All Reviews", () => {
  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears the call counts and arguments of all mocks
    jest.restoreAllMocks(); // Restores the original implementations of all mocked/spied methods
  });

  test("Successfully delete all reviews", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null); // Simulate successful deletion
      return {} as Database;
    });

    const result = await reviewDAO.deleteAllReviews();

    expect(mockDBRun).toBeCalled();
    expect(result).toBe(null);
  });

  test("DB error on delete all reviews", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error("DB error on delete all reviews"));
      return {} as Database;
    });

    const result = reviewDAO.deleteAllReviews();

    await expect(result).rejects.toThrowError("DB error on delete all reviews");
    expect(mockDBRun).toBeCalled();
  });

  test("General catch block", async () => {
    // Simulate an unexpected error
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      throw new Error("Unexpected error");
    });

    const result = reviewDAO.deleteAllReviews();

    await expect(result).rejects.toThrowError("Unexpected error");
    expect(mockDBRun).toBeCalled();
  });
});
