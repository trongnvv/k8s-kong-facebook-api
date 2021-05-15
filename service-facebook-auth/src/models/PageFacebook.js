const mongoose = require('mongoose');
const { Schema } = mongoose;
const VarSchema = new Schema(
  {
    userID: {
      type: String,
      required: true
    },
    pageFacebookID: {
      type: String,
      required: true
    },
    userFacebookID: {
      type: String,
      required: true
    },
    accessToken: {
      type: String,
      required: true
    },
    category: {
      type: String,
    },
    link:{
      type: String,
    },
    name: {
      type: String,
      required: true
    },
    picture: {
      type: String,
    },
    unreadMessageCount: {
      type: Number,
    },
    status: {
      type: String,
      default: "SUBSCRIBE",
      enum: ['SUBSCRIBE', 'EXPIRED', 'UNSUBSCRIBE', 'LIVE_STREAM'],
    },
    isRemoved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('PageFacebook', VarSchema);
