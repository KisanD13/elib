import mongoose from "mongoose";
import {config} from "./config";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      //mongoose.connection is event given by mongoose
      console.log("connected to database  succesfully"),
    );
    mongoose.connection.on("error", (err) =>
      //after first connect if connection gets faailed then we should use below
      console.log(`error in connecting to database due to ${err}`),
    );

    await mongoose.connect(config.dataBaseURL as string); //making sure specify the databaseUrl to be string
  } catch (error) {
    //this will log, if at the first time connection fails
    console.error(`failed to connect to database because of ${error}`);
    process.exit(1); //exiting the process as connection failed
  }
};

export default connectDB;
