const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const app = express();
const Menu = require("./models/menuModel");

app.use(express.json());

// Secret key for JWT signing
const secretKey = "your_secret_key"; // Replace with your secret key

// Predefined admin credentials (you can store this in a secure manner, e.g., environment variables)
const adminUsername = "admin";
const adminPassword = "adminpassword"; // Plain text password (not recommended)

// Function to hash password using SHA-256
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Route for admin login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the provided username and password match the predefined admin credentials
    if (
      username !== adminUsername ||
      hashPassword(password) !== hashPassword(adminPassword)
    ) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // If both username and password are correct, generate a JWT token
    const token = jwt.sign({ username: username, isAdmin: true }, secretKey, {
      expiresIn: "1h",
    });

    // Send the token in the response
    res.status(200).json({ message: "Login successful", token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware function to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, secretKey, (error, decoded) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired!!" });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      } else {
        return res.status(500).json({ message: "Token verification failed" });
      }
    }
    req.user = decoded;
    next();
  });
};

// Middleware function to check if the user is an admin
const isAdmin = (req, res, next) => {
  const isAdminUser = req.user && req.user.isAdmin;
  if (!isAdminUser) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};
// Route to get menu lists for admin (restricted to admins)
app.get("/menu-admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const menus = await Menu.find({});
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get menu lists (accessible to all users)
app.get("/menu", async (req, res) => {
  try {
    const menus = await Menu.find({});
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get menu lists for admin (restricted to admins)
// app.get("/menu-admin", isAdmin, async (req, res) => {
//   try {
//     const menus = await Menu.find({});
//     res.status(200).json(menus);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// Route to edit a menu item (restricted to admins)
app.put("/edit/:id", isAdmin, async (req, res) => {
  try {
    const itemId = req.params.id;
    const updatedItem = req.body;

    const menu = await Menu.findOneAndUpdate(
      { "items._id": itemId },
      { $set: { "items.$": updatedItem } },
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to create a new menu item (restricted to admins)
app.post("/create", isAdmin, async (req, res) => {
  try {
    // Logic to create a new menu item
    res.send("Creating a menu item");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route for logging in (not implemented in this example)
app.post("/login", async (req, res) => {
  // Authentication logic goes here
  res.send("Logging in");
});

mongoose
  .connect("mongodb://localhost:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database");
    app.listen(6000, () => {
      console.log("Server is running on port 6000");
    });
  })
  .catch((error) => {
    console.log(error);
  });
