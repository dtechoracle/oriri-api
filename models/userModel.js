const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter Your username"],
  },

  password: {
    type: String,
    required: [true, "Enter Your password"],
  },
});
