import express from "express"
import { articlesRoutes } from "./routes/articlesRoutes.js"
import { usersRoutes } from "./routes/usersRoutes.js"
import { categoriesRoutes } from "./routes/categoriesRoutes.js"
import { postsRoutes } from "./routes/postsRoutes.js"
import { coinsRoutes } from "./routes/coinsRoutes.js"
import swaggerJSDoc from "swagger-jsdoc"
import swaggerUI from "swagger-ui-express"
import mongoose from "mongoose"
import cors from "cors";
import dotenv from "dotenv";
import { aiRoutes } from "./routes/aiRoutes.js"

const e = express()

// Middlewares
e.use(express.json())
e.use(cors())
dotenv.config()

// Configs
const port = process.env.PORT || 4000;
const connectionSTring = process.env.CONNECTION_STRING;
const swaggerSpec = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "News Aggregator APIs",
      version: "1.0.0",
    },
    servers: [
      {
        url: `https://newsaggregator-mern.onrender.com`,
      },
      {
        url: `http://localhost:4000`
      }
    ]
  },
  apis: ["./docs/swagger-docs.yaml"]
}


// Routes
e.get("/", (req, res) => {
  res.status(200).json({
    "msg": "Server is healthy!!!"
  })
})
e.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDoc(swaggerSpec)))
e.use("/api/v1/articles", articlesRoutes)
e.use("/api/v1/categories", categoriesRoutes)
e.use("/api/v1/reddit", postsRoutes)
e.use("/api/v1/users", usersRoutes)
e.use("/api/v1/coins", coinsRoutes)
e.use("/api/v1/askai", aiRoutes)

mongoose.connect(connectionSTring, { dbName: process.env.MONGODB_DATABASE_NAME })
  .then(() => {
    console.log("Connected successfully to MongoDB");
    e.listen(port, () => { console.log(`Listening on port ${port}`) });
  })
  .catch(err => console.log(err));

