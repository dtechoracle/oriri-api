const mongoose = require("mongoose");

const menuItemSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a menu item name"],
  },
  description: {
    type: String, // You can adjust this field as needed (e.g., add validation, set it as required)
  },
  price: {
    type: Number,
    required: true,
  },
});

const menuSchema = mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["appetizers", "main courses", "desserts"],
      required: [true, "Please select a category"],
    },
    items: [menuItemSchema],
  },
  {
    timestamps: true,
  }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
