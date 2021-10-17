import dotenv from "dotenv"
dotenv.config()
const http = require('http');
import express from "express";
const path = require("path");
// import mongoose from "mongoose";
import server from "./server";
const mysql = require('mysql');
const { existsSync, mkdirSync } = require("fs");
import { graphqlUploadExpress } from "graphql-upload";
const cors = require('cors');

const connection = mysql.createConnection({
  host: `${process.env.MYSQL_HOST}`,
  user: `${process.env.MYSQL_USER}`,
  password: `${process.env.MYSQL_PASSWORD}`,
  database: `${process.env.MYSQL_DB}`
});

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'db_myapp',
// });

// const corsOptions = {
//   origin: "http://localhost:3000",
//   credentials: true
// };

connection.connect(function(err){
  if(!err) {
      console.log("Database is connected ... \n\n");
  } else {
      console.log("Failed connecting to database ... \n\n");
  }
});
existsSync(path.join(__dirname, "../uploads")) || mkdirSync(path.join(__dirname, "../uploads"));
const createServer = async () => {
    try {
      // await mongoose.connect(
      //   `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`,
      //   { useNewUrlParser: true, useUnifiedTopology: true }
      // );
      // mongoose.set('useFindAndModify', false);

      const app = express()
      app.use(cors());
      app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
      app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 })); // 10 MB
      server.applyMiddleware({ app });
      const httpServer = http.createServer(app);
      server.installSubscriptionHandlers(httpServer);
      httpServer.listen({ port: process.env.SERVER_PORT }, () =>
        console.log(`🚀 Subscriptions ready at ws://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}${server.graphqlPath}`)
      );
    } catch (error) {
      console.log(error);
    }
};

createServer();