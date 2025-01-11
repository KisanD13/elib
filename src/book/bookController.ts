import {NextFunction, Request, Response} from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import {AuthRequest} from "../middlewares/authenticate";

//create new book method: POST
const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const {title, genre} = req.body;

  const files = req.files as {[fieldname: string]: Express.Multer.File[]};

  //for image
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName,
  );

  //for pdf
  const bookFileName = files.file[0].filename;
  const bookFilePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    bookFileName,
  );

  try {
    const uploadresult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      },
    );

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadresult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    //delete temporarily file

    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);
    } catch (error) {
      return next(createHttpError(500, "Error while deleting temp file"));
    }

    res.status(201).json({id: newBook._id});
  } catch (error) {
    return next(createHttpError(500, "Error while uploading the files"));
  }
};

//update exisitng book method:POST
const updateBookApi = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {title, genre} = req.body;
  const bookId = req.params.bookId;
  const files = req.files as {[fieldname: string]: Express.Multer.File[]};

  const book = await bookModel.findOne({_id: bookId});
  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }
  //check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "User not authorised"));
  }

  try {
    let completeCoverImage = "";
    let filePath;

    if (files?.coverImage) {
      const fileName = files?.coverImage[0].filename;
      const coverMimeType = files?.coverImage[0].mimetype.split("/").at(-1);

      //send file to cloudinary
      filePath = path.resolve(
        __dirname,
        "../../public/data/uploads/" + fileName,
      );

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: fileName,
        folder: "book-covers",
        format: coverMimeType,
      });

      completeCoverImage = uploadResult.secure_url;
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        return next(createHttpError(500, "Error while updating temp file"));
      }
    }

    //check if file fiels is exists
    let completeFileName = "";
    let bookFilePath;

    if (files?.file) {
      const bookFileName = files?.file[0].filename;
      bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads/" + bookFileName,
      );

      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      });

      completeFileName = uploadResultPdf.secure_url;
    }

    const updateBook = await bookModel.findOneAndUpdate(
      {_id: bookId},
      {
        title,
        genre,
        coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
        file: completeFileName ? completeFileName : book.file,
      },
      {new: true},
    );

    try {
      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      if (bookFilePath && fs.existsSync(bookFilePath)) {
        await fs.promises.unlink(bookFilePath);
      }
    } catch (error) {
      return next(createHttpError(500, "Error while deleting temp file"));
    }

    res.json(updateBook);
  } catch (error) {
    return next(createHttpError(500, "Error while updating the book"));
  }
};

//get list book method:GET
const listBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //TODO: add pagination
    const allBook = await bookModel.find();
    res.json(allBook);
  } catch (error) {
    return next(createHttpError(500, "Error while getting a list book"));
  }
};

//get single book
const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({_id: bookId});
    if (!book) return next(createHttpError(404, "Book not found"));

    res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

//get single book
const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({_id: bookId});
  if (!book) return next(createHttpError(404, "Book not found"));

  //check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId)
    return next(createHttpError(403, "User not authorised"));

  const coverFileSplit = book.coverImage.split("/");
  const coverImagePublicId =
    coverFileSplit.at(-2) + "/" + coverFileSplit.at(-1)?.split(".").at(-2);

  const bookFileSplit = book.file.split("/");
  const filePublicId = bookFileSplit.at(-2) + "/" + bookFileSplit.at(-1);

  try {
    await cloudinary.uploader.destroy(coverImagePublicId);
    await cloudinary.uploader.destroy(filePublicId, {
      resource_type: "raw",
    });
  } catch (error) {
    return next(createHttpError(500, "Error whilw deleting files"));
  }

  await bookModel.deleteOne({_id: bookId});
  res.send({message: `${bookId} has been deleted`});
};

export {createBook, updateBookApi, listBook, getSingleBook, deleteBook};
