import express, { json } from "express";
import cors from "cors";
require("dotenv").config();
import { verify, sign } from "jsonwebtoken";
const stripe = require("stripe")(process.env.STRIPE_KEY);
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(json());





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
  verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: "Forbidden" });
    }
    req.decoded = decoded;
     res.setHeader(
       "Access-Control-Allow-Origin",
       "https://tools-manufacturer-4bdef.web.app/"
     );
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
      const profileCollection = client
        .db("squirrel-manufacturer")
        .collection("userprofile");
      const paymentCollection = client
        .db("squirrel-manufacturer")
        .collection("payment");

     const verifyAdmin = async (req, res, next) => {
       const requester = req.decoded.email;
       const requesterAccount = await usersCollection.findOne({
         email: requester,
       });
       if (requesterAccount.role === "admin") {
         next();
       } else {
         res.status(403).send({ message: "forbidden" });
       }
     };
    app.get("/userprofile/:email", async (req, res) => {
      const email = req.params.email;
      const user = await profileCollection.findOne({ email: email });
      res.send(user);
    }
     )
    
    app.put("/userprofile/:email", async (req, res) => { 
      const email = req.params.email;
      const body = req.body;
      const user = {
        name: body.name,
        email: body.email,
        number: body.number,
        education: body.education,
        city: body.city,
        pofile:body.profile

      };

      const filter = { email: email };
      const options = { upsert: true }
      const updatedDoc = {
        $set: 
         user,
        
      };
      const result = await profileCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
     
    });
         app.put("/order/:id",async (req, res) => {
             const id = req.params.id;
         const filter = { _id: ObjectId(id) };
           const updateDoc = {
             $set: {
               status:true
          },
        };
        const result = await orderCollection.updateOne(
          filter,
          updateDoc      
        );

        res.send({ result});
         })
      
    app.post("/order", async (req, res) => { 
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    })
      app.get("/order",verifyJWT,  async (req, res) => {
        const email = req.query.email;
        
        const result = await orderCollection.find({ email: email }).toArray();
        
        res.send(result);

      });
    app.get("/orders", async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    })
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    })

    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.findOne({ _id: ObjectId(id) });
      res.send(result);
    })

    app.patch("/order/:id",verifyJWT, async (req, res) => { 
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
       app.post("/create-payment-intent",verifyJWT,  async (req, res) => {
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
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
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
    app.delete("/services/:id",verifyJWT,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await serviceCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    })
   

      app.get("/user",verifyJWT,  async (req, res) => {
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
        const token = sign({ email: emial }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        res.send({ result, token: token });
      });

     app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })
    
     app.put("/user/admin/:email",verifyJWT,verifyAdmin,  async (req, res) => {
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

     app.post("/review", verifyJWT ,  async (req, res) => {
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
