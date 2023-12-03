const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000

// middleware
app.use(
  cors({origin: [
      "http://localhost:5173",
      "https://mihu-it.web.app",
      "https://mihu-it.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
  

  // MongoDB:
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sah5bbd.mongodb.net/?retryWrites=true&w=majority`;

// insertOne a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();

      const Collection = client.db("Mihu-It");
    const userCollection = Collection.collection("Users");
    const paymentCollection = Collection.collection("Payments");
    const worksCollection = Collection.collection("Works");
    const serviceCollection = Collection.collection("Services");
// data to show on chart
app.get("/dashboard/details/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const result = await userCollection.findOne(filter);
    const email = result.email;
    const query = { email: email };
  
    const result2 = await paymentCollection
      .find(query, { time: 1, salary: 1 })
      .toArray();
    res.send(result2);
  });
// show payments data to web
app.get("/payments/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
  
    const result = await paymentCollection.find(query).sort({ time: -1 }).toArray();
    res.send(result);
  });
app.post("/payments", async (req, res) => {
    const payment = req.body;
    const paymentResult = await paymentCollection.insertOne(payment);
    res.send(paymentResult);
  });
app.get("/services", async (req, res) => {
    const result = await serviceCollection.find().toArray();
    res.send(result);
  });

  app.get("/employee", async (req, res) => {
    const filter = { role: "Employee" };
    const result = await userCollection.find(filter).toArray();
    res.send(result);
  });
// check for HR, admin and employee
app.get("/users/hr/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await userCollection.findOne(query);
    if (user?.role === "Admin") {
      res.send({ user: "Admin" });
    }
    if (user?.role === "HR") {
      res.send({ user: "HR" });
    }
    if (user?.role === "Employee") {
      res.send({ user: "Employee" });
    }
  });
// check the user fire or not when login
app.get("/users/login/:email", async (req, res) => {
    const email = req.params.email;
    const filter = { email: email };
    const result = await userCollection.findOne(filter);
    res.send(result);
  });
// to get the name of every employee
app.get("/progress/name", async (req, res) => {
    const filter = { role: "Employee" };
    const result = await userCollection.find(filter, { name: 1 }).toArray();
    res.send(result);
  });
// load all user info to ui for admin
app.get("/users", async (req, res) => {
    const roleToMatch = ["Employee", "HR"];
    const filter = { role: { $in: roleToMatch }, Verified: true };
    const result = await userCollection.find(filter).toArray();
    res.send(result);
  });
// load specific user
app.get("/users/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const result = await userCollection.findOne(filter);
    res.send(result);
  });
app.post("/users", async (req, res) => {
    const user = req.body;
    const result = await userCollection.insertOne(user);
    res.send(result);
  });
// Fire an user as admin
app.put("/users/fire/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const updateDoc = {
      $set: {
        fire: true,
      },
    };
    const result = await userCollection.updateOne(query, updateDoc);
    res.send(result);
  });
// make employee to HR
app.put("/user/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const updateDoc = {
      $set: {
        role: "HR",
      },
    };
    const result = await userCollection.updateOne(query, updateDoc);
    res.send(result);
  });
// verify the employee
app.put("/users/:email", async (req, res) => {
    const email = req.params.email;
    const filter = { email: email };
    const user = await userCollection.findOne(filter);
    const newValue = !user?.Verified;
    const updateDoc = {
      $set: {
        Verified: newValue,
      },
    };
    const result = await userCollection.findOneAndUpdate(filter, updateDoc, {
      new: true,
    });
    res.send(result);
  });
app.post("/worksheet", async (req, res) => {
    const sheet = req.body;
    const result = await worksCollection.insertOne(sheet);
    res.send(result);
  });
app.get("/progress/p", async (req, res) => {
    const name = req.query.name;
    let query = {};
    if (name === "search") {
      const result = await worksCollection.find().toArray();
      res.send(result);
      return;
    }
    query = { name: name };
    const result = await worksCollection.find(query).toArray();
    res.send(result);
  });
app.get("/worksheet/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
  
    const result = await worksCollection
      .find(query)
      .sort({ timeStamp: -1 })
      .toArray();
    res.send(result);
  });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }  finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
  }
  run().catch(console.dir);
  
  app.get("/", (req, res) => {
    res.send("Mihu-it is running");
  });
  
  app.listen(port, () => {
    console.log(`Mihu is running on ${port}`);
  });