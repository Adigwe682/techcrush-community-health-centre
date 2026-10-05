const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const dns = require("dns");

const paymentRouter = require("./routers/paymentRouter.js");
const billRouter = require("./routers/billRouter.js");
dotenv.config();

dns.setServers (['8.8.8.8']);

const app = express();

app.use("/api/payment", paymentRouter);


app.use(express.json());

app.use("/api/bill", billRouter);



app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);

});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});