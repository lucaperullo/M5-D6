import express from "express";
import { v4 as uniqid } from "uuid";
import { check, validationResult } from "express-validator";
import { getBooks, writeBooks } from "../../fsUtilities.js";

const booksRouter = express.Router();

booksRouter.post("/search", async (req, res, next) => {
  try {
    const books = await getBooks();

    if (req.body.title) {
      const searchResult = books.filter((book) =>
        book.title.includes(req.body.title)
      );
      res.send(searchResult).status(200);
    } else {
      res.send(books);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.get("/", async (req, res, next) => {
  try {
    const books = await getBooks();

    if (req.query && req.query.category) {
      const filteredBooks = books.filter(
        (book) =>
          book.hasOwnProperty("category") &&
          book.category === req.query.category
      );

      res.send(filteredBooks);
    } else {
      res.send(books);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.get("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks();

    const bookFound = books.find((book) => book.asin === req.params.asin);

    if (bookFound) {
      res.send(bookFound);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.post("/", async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error();
      error.message = errors;
      error.httpStatusCode = 400;
      next(error);
    } else {
      const books = await getBooks();
      console.log(req.body);
      const asinFound = books.find((book) => book.asin === req.body.asin);

      if (asinFound) {
        const error = new Error();
        error.httpStatusCode = 400;
        error.message = "Book already in db";
        next(error);
      } else {
        const newBook = {
          asin: uniqid(),
          ...req.body,
        };
        books.push(newBook);
        await writeBooks(books);
        res.status(201);
      }
    }
  } catch (error) {
    console.log(error);
    const err = new Error("An error occurred while reading from the file");
    next(err);
  }
});

booksRouter.put("/:asin", async (req, res, next) => {
  try {
    const validatedData = matchedData(req);
    const books = await getBooks();

    const bookIndex = books.findIndex((book) => book.asin === req.params.asin);

    if (bookIndex !== -1) {
      // book found
      const updatedBooks = [
        ...books.slice(0, bookIndex),
        { ...books[bookIndex], ...validatedData },
        ...books.slice(bookIndex + 1),
      ];
      await writeBooks(updatedBooks);
      res.send(updatedBooks);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    const err = new Error("An error occurred while reading from the file");
    next(err);
  }
});

booksRouter.delete("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks();

    const bookFound = books.find((book) => book.asin === req.params.asin);

    if (bookFound) {
      const filteredBooks = books.filter(
        (book) => book.asin !== req.params.asin
      );

      await writeBooks(filteredBooks);
      res.status(204).send();
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.post(
  "/:asin/comments",
  [
    check("comment").isLength({ min: 3 }).withMessage("Name is too short!"),
    check("username")
      .isLength({ min: 3 })
      .withMessage("Username is too short!"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const books = await getBooks();
        const indexOfBook = books.findIndex(
          (book) => book.asin === req.params.asin
        );

        const newComment = {
          _id: uniqid(),
          username: req.body.username,
          comment: req.body.comment,
          _createdDate: new Date(),
        };
        if (!books[indexOfBook].comments) {
          books[indexOfBook].comments = [newComment];
        } else {
          books[indexOfBook].comments = [
            ...books[indexOfBook].comments,
            newComment,
          ];
        }
        await writeBooks(books);
        res.send("Comment successfully added");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

booksRouter.get("/:asin/comments", async (req, res, next) => {
  try {
    const books = await getBooks();
    const indexOfBook = books.findIndex(
      (book) => book.asin === req.params.asin
    );

    if (indexOfBook !== -1) {
      if (books[indexOfBook].comments) {
        res.send(books[indexOfBook].comments);
      } else {
        res.send("No comments found for that book");
      }
    } else {
      res.send("No book with that asin found");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.delete("/:asin/comments/:commentId", async (req, res, next) => {
  try {
    const books = await getBooks();
    const indexOfBook = books.findIndex(
      (book) => book.asin === req.params.asin
    );

    if (indexOfBook !== -1) {
      if (books[indexOfBook].comments) {
        const indexOfComment = books[indexOfBook].comments.findIndex(
          (comment) => comment._id === req.params.commentId
        );
        if (indexOfComment !== -1) {
          const filteredComments = books[indexOfBook].comments.filter(
            (comment) => comment._id !== req.params.commentId
          );
          books[indexOfBook].comments = filteredComments;
          await writeBooks(books);
          res.send("Comment successfully removed");
        } else {
          res.send(
            "Comment with that ID does not exist within the provided asin"
          );
        }
      } else {
        res.send("No comments found for the provided asin");
      }
    } else {
      res.send("No book with that asin found");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export default booksRouter;
