const mongoose = require("mongoose");
const { Schema } = mongoose;
const VarSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: 0 }
);

module.exports = mongoose.model("User", VarSchema);
