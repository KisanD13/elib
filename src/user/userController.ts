import {NextFunction, Request, Response} from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import {sign} from "jsonwebtoken";
import {config} from "../config/config";
import {User} from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const {name, email, password} = req.body;

  //validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All field are required");
    return next(error);
  }

  //database call
  try {
    const user = await userModel.findOne({email});

    if (user) {
      return next(createHttpError(400, "User already exist with this email"));
    }
  } catch (error) {
    return next(createHttpError(500, "Error while getting user"));
  }

  //password->hash
  const hashedPassword = await bcrypt.hash(password, 10);

  //store in database
  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while creatin user"));
  }

  //token generation, JWT
  try {
    const token = sign({sub: newUser._id}, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    //response
    res.status(201).json({accessToken: token});
  } catch (error) {
    return next(createHttpError(500, "Error while signing the jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const {email, password} = req.body;
  if (!email || !password) {
    return next(createHttpError(400, "All field are required"));
  }

  let user;
  try {
    user = await userModel.findOne({email});

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
  } catch (error) {
    return next(createHttpError(500, "Error while finding user"));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(createHttpError(401, "Username or password incorrect!"));
  }

  //create accessToken

  try {
    const token = sign({sub: user._id}, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.json({accessToken: token});
  } catch (error) {
    return next(createHttpError(500, "Error while signing the jwt token"));
  }
};

export {createUser, loginUser};
