const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_KEY);
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
      const serviceCollection = client
        .db("squirrel-manufacturer")
      .collection("services");
      const orderCollection = client
        .db("squirrel-manufacturer")
      .collection("orders");
      const reviewCollection = client
        .db("squirrel-manufacturer")
      .collection("reviews");
      const paymentCollection = client
        .db("squirrel-manufacturer")
        .collection("payment");

    app.post("/order", async (req, res) => { 
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    })
      app.get("/order",  async (req, res) => {
        const email = req.query.email;
        
        const result = await orderCollection.find({ email: email }).toArray();
        
        res.send(result);

      });

    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.findOne({ _id: ObjectId(id) });
      res.send(result);
    })

    app.patch("/order/:id", async (req, res) => { 
 const id = req.params.id;
 const payment = req.body;
 const filter = { _id: ObjectId(id) };
 const updatedDoc = {
   $set: {
     paid: true,
     transactionId: payment.transactionId,
   },
 };
    

 const result = await paymentCollection.insertOne(payment);
 const updateOrder = await orderCollection.updateOne(filter, updatedDoc);
 res.send(updateOrder);

     
    })

    app.delete("/order/:id",verifyJWT, async (req, res) => { 
      const id = req.params.id;
      const result = await orderCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    })
       app.post("/create-payment-intent",  async (req, res) => {
         const service = req.body;
         const price = service.price;
         const amount = price * 100;
         const paymentIntent = await stripe.paymentIntents.create({
           amount: amount,
           currency: "usd",
           payment_method_types: ["card"],
         });
         res.send({ clientSecret: paymentIntent.client_secret });
       });
    
    app.get("/services", async (req, res) => {
      const query = {};
      const books = await serviceCollection.find(query).toArray();
      res.send(books);
    });
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    })
     app.get("/services/:id", async (req, res) => {
       const service = await serviceCollection.findOne({
         _id: new ObjectId(req.params.id),
       });
       res.send(service);
     });
   
    

      app.get("/user",  async (req, res) => {
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
    
     app.put("/user/admin/:email",  async (req, res) => {
       const email = req.params.email;
       const filter = { email: email };
       const updateDoc = {
         $set: { role: "admin" },
       };
       const result = await usersCollection.updateOne(filter, updateDoc);
       res.send(result);
     });

     app.get("/review", async (req, res) => {
       const review = await reviewCollection.find().toArray();
       res.send(review);
     });

     app.post("/review",  async (req, res) => {
       const review = req.body;
       const result = await reviewCollection.insertOne(review);
       res.send(result);
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
