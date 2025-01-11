import app from "./src/app";
import {config} from "./src/config/config";
import connectDB from "./src/config/db";

const startServer = async () => {
  //connect database

  await connectDB();

  const port = config.port || 3000;

  app.listen(port, () => {
    console.log(`server is running on the port: ${port}`);
  });
};

startServer();
