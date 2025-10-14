const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config();

const secretKey = 's4a5j6a7n'

// middlewares
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// mongo connection
mongoose
  .connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
  })
  .then(() => {
    console.log("mongoDB Atlas connected");
  })
  .catch((err) => {
    console.log("connection failed", err);
  });

let userSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: String,
  mobileNumber: Number,
  password: String,
})

let userModel = mongoose.model('users', userSchema);

// routes
app.get('/get', async (req, res) => {
  let users = await userModel.find({});
  res.send(users)
})

app.post('/add-user', async (req, res) => {
  let newUser = await userModel.create(req.body);
  res.json(newUser)
})
app.post('/add-friend', async(req,res)=>{
 let number= req.body
 let findFriend= await userModel.findOne({mobileNumber:number.number})
  if(findFriend){
    res.send(findFriend)
  }
 
})

app.post('/login', async (req, res) => {
  let { mobileNumber, password } = req.body;

  let findUser = await userModel.findOne({ mobileNumber: mobileNumber })
  if (findUser) {
    if (findUser.mobileNumber === parseInt(mobileNumber) && findUser.password === password) {
      const token = jwt.sign({ id: findUser._id }, secretKey, { expiresIn: '1h' })
      // let userId= findUser._id;
      return res.json({ jwtToken: token, user: findUser})
    } else {
      return res.status(401).json({ message: 'Invalid password' })
    }
  } else {
    return res.status(404).json({ message: 'User not found Create account' })
  }
})

// socket.io
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  socket.on("join_private_chat", ({ roomId, userId }) => {
    socket.join(roomId);
    // console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on("send_private_message", ({ roomId, text, from }) => {
    io.to(roomId).emit("receive_private_message", { text, from });
  });
});


// start server
const PORT= process.env.PORT ||6677;
server.listen(PORT, () => {
  console.log('server start http://localhost:6677/get')
})
