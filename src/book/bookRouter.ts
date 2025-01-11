import express from "express";
import {
  createBook,
  listBook,
  updateBookApi,
  getSingleBook,
  deleteBook,
} from "./bookController";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: {fileSize: 10_485_760},
});

//routes
bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    {name: "coverImage", maxCount: 1},
    {name: "file", maxCount: 1},
  ]),
  createBook,
);

bookRouter.patch(
  "/:bookId",
  authenticate,
  upload.fields([
    {name: "coverImage", maxCount: 1},
    {name: "file", maxCount: 1},
  ]),
  updateBookApi,
);

bookRouter.get("/", listBook);
bookRouter.get("/:bookId", getSingleBook);
bookRouter.delete("/:bookId", authenticate, deleteBook);

export {bookRouter};
