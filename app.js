import express from "express"
import { config } from "dotenv";
import errorHandlerMiddleware from "./middlewares/errorHandler.js"
import cookieParser from "cookie-parser";
import cors from "cors"



config({
    path: "./config/config.env"
})
const app = express();


//using middlewares on 

app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
)

app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}))

//importing and using routes
import user from "./routes/userRouter.js"
import chat from "./routes/chatRouter.js"
import message from "./routes/messageRouter.js"


app.use("/api/v1", user);
app.use("/api/v1", chat);
app.use("/api/v1", message);




export default app;

app.get("/", (req, res) =>
    res.send(
        `<h1>Site is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
    )
);


app.use(errorHandlerMiddleware);


