import express from "express"; 
import { MongoClient } from "mongodb";
import { usersRouter  } from "./routes/users.js";
import { urlRouter } from "./routes/url.js";
import cors from "cors";

//to get data from .env file
import dotenv from "dotenv";
dotenv.config();
const PORT=process.env.PORT;  //any port can be used

export const app = express();
const MONGO_URL=process.env.MONGO_URL;

//takes some time to connect so using async and await
async function createConnection(){
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("Mongo DB connected");
    return client;
}
export const client = await createConnection();

//middleware
const corsOptions = {
    origin: '*'
  }
  app.use(cors(corsOptions))
  
  app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", '*');
      res.header("Access-Control-Allow-Credentials", true);
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
      next();
  });
// app.use(cors())
app.use(express.json())

//routes
app.use("/users",usersRouter);
app.use("/url",urlRouter);



app.get("/",(request,response)=>{
    response.send("Hello World");
});

//Need a port so that server can listen but is should not be used by some other //application
app.listen(PORT,()=>console.log("Server has started in "+PORT));
