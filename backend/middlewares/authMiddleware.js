const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const caller = require("../helpers/caller");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  let publicUrls = [
    "http://localhost:5000/api/user/login",
    "http://localhost:5000/api/user/",
  ];
  let currentUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  var Protected;
  if (publicUrls.includes(currentUrl)) {
    Protected = false;
  } else {
    Protected = true;
  }
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer") &&
    Protected
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      caller(req, res, "Not authorized, token failed", 401);
    }
  }

  if (Protected === false) {
    next();
  }

  if (!token && Protected) {
    caller(req, res, "Not authorized, no token", 401);
  }
});

module.exports = { protect };
