import {config as conf} from "dotenv";
conf();

const _config = {
  port: process.env.PORT,
  dataBaseURL: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  cloudinaryCloud: process.env.CLOUDINARY_CLOUD,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
};

export const config = Object.freeze(_config);
