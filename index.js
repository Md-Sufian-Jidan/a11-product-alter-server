const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 9000;

//middleware
const corsOptions = {
    origin: ["http://localhost:5173"],
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

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
        const recommendationCollection = client.db('ProductQueries').collection('recommendation');

        // jwt generator
        app.post('/jwt', async (req, res) => {
            const email = req?.body;
            // console.log('dynamic token for this user --->', email);
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
            // console.log(token);
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })
        });

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
            const query = { 'addUser.email': email }
            const result = await productCollection.find(query).toArray()
            res.send(result)
        });
        // product delete api created 
        app.delete('/deleted/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result)
        });
        //product update api created
        app.put('/update/:id', async (req, res) => {
            const product = req.body;
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: product
            };
            const options = { upsert: true };
            const result = await productCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        });
        //product recommendation api
        app.post('/recommendation', async (req, res) => {
            const recommendation = req.body;
            const query = { _id: new ObjectId(recommendation.query_id) }
            // console.log(recommendation);
            const result = await recommendationCollection.insertOne(recommendation);
            const updateQuery = await productCollection.updateOne(query, { $inc: { recommendationCount: 1 } })
            res.send(result);
        });
        //get all the matching recommendation by query id
        app.get('/some-recommendation/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { query_id: id };
            const result = await recommendationCollection.find(query).toArray();
            res.send(result);
        });
        // all recommendation made ny me
        app.get('/all-recommendation/:email', async (req, res) => {
            const email = req.params.email;
            const query = { recommendation_email: email }
            const result = await recommendationCollection.find(query).toArray();
            res.send(result);
        });
        //delete a single recommendation by _id
        app.delete('/recommendation-delete/:id', async (req, res) => {
            const id = req.params.id.split('&');
            console.log(id[0]);
            console.log(id[1]);
            const query = { _id: new ObjectId(id[0]) };
            const update = { _id: new ObjectId(id[1]) }
            console.log(update);
            const result = await recommendationCollection.deleteOne(query);
            const updateQuery = await productCollection.updateOne(update, { $inc: { recommendationCount: -1 } })
            res.send(result);
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