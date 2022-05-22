const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xt1bf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() { 
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const usersCollection = client.db("squirrel-manufacturer").collection("users");
    
    
  }
  finally { }
  
}


run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("Welcome To The Manufacturer House!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
