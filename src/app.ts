import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandlers";
import userRouter from "./user/userRouter";
import {bookRouter} from "./book/bookRouter";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res, next) => {
  res.json({message: "welcome elib api"});
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

app.use(globalErrorHandler); //global error handler

export default app;
