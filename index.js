const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 9000;

//middleware
app.use(cors());
app.use(express.json());

//============

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvjjrvn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const productCollection = client.db('ProductQueries').collection('Queries');
        // get all queries api 
        app.get('/queries', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        });
        // get single queries api
        app.get('/single-queries/:id', async (req, res) => {
            const user = req.params.id;
            const id = { _id: new ObjectId(user) };
            const result = await productCollection.findOne(id);
            res.send(result);
        });
        // save a product in db
        app.post('/add-product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result)
        });
        // my added product see api 
        app.get('/my-queries/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: new ObjectId(email) }
            const result = await productCollection.find(query).toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('product alter is running');
});

app.listen(port, () => {
    console.log('port is running on', port);
});