const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const MONGODB_URI = process.env.MONGODB_URI;
const Router = require('./controller/userRouter');

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173', 
  credentials: true               
};

app.use(cors(corsOptions));

app.use(express.json());
app.use('/router', Router);

app.listen(5000, async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
  console.log(`Running on server 5000`);
});