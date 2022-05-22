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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ error: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: "Forbidden" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() { 
  try {
    await client.connect();
    console.log("Connected correctly to server");
      const usersCollection = client
        .db("squirrel-manufacturer")
        .collection("users");
    

      app.get("/user", verifyJWT, async (req, res) => {
        const users = await usersCollection.find().toArray();
        res.send(users);
      });
      app.put("/user/:email", async (req, res) => {
        const emial = req.params.email;
        const user = req.body;
        const filter = { email: emial };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign({ email: emial }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        res.send({ result, token: token });
      });
    
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
