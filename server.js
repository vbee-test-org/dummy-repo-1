import express from "express"
import { articlesRoutes } from "./routes/articlesRoutes.js"
import mongoose from "mongoose"
import cors from "cors";
import dotenv from "dotenv";

const app = express()

app.use(express.json())
app.use(cors())
app.use("/api/articles", articlesRoutes)
dotenv.config()

const port = process.env.PORT;
const connectionSTring = process.env.CONNECTION_STRING;

mongoose.connect(connectionSTring, { dbName: "WebData" })
    .then(() => {
        console.log("Connected successfully to MongoDB");
        app.listen(port, "localhost", () => {console.log(`Listening on port ${port}`)});
    })
    .catch(err => console.log(err));

