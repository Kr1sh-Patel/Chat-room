const express = require("express");
const { chats } = require("./data/data");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { path } = require("express/lib/application");
const caller = require("./helpers/caller");
const logger = require("./config/logger");
const { protect } = require("./middlewares/authMiddleware");

const app = express();
dotenv.config();
connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  //solely for test purpose , dummy api
  res.send("API is running..");
});
app.use(protect);
 
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  logger.error(`there was an uncaught exception in  session, error:${err}`);
  process.exit(1); // mandatory (as per the Node.js docs)
});

//error handling-----------------------------------

app.use((req, res, next) => {
  const error = new Error("Not found ");
  error.status = 404;
  next(error);
});

// comment in order to make validator func work
app.use((error, req, res, next) => {
  caller(req, res, error.message, error.status || 500);
});

// --------------------------deployment------------------------------

// const __dirname1 = path.resolve();
const __dirname1 = path.resolve;

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// app.use(notFound);
// app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running on PORT ${PORT}`));

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
//joi,winston,common res,val schema func,repo logic  ,common middleware
