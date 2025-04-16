const express = require('express')
const mongoose = require('mongoose')
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config();
const User = require('./models/userModel');
const PORT = process.env.PORT||3000;
app.listen(PORT,async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("connected to database")
    } catch (error) {
        console.log(error);
    }
    console.log(`Running on port ${PORT}`)
})