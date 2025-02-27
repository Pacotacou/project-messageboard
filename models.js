const mongoose = require('mongoose');
const { Schema } = mongoose;

// Reply Schema (Embedded Document)
const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  
});
const Reply = mongoose.model('Reply', ReplySchema);

// Thread Schema (Embedded Document)
const ThreadSchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  replies: { type: [ReplySchema], default: [] },
  
});
const Thread = mongoose.model('Thread', ThreadSchema);

// Board Schema (Top-Level Document)
const BoardSchema = new Schema({
  name: { type: String, required: true, unique: true },
  threads: { type: [ThreadSchema], default: [] }
});

// Board Model (Only export this)
const Board = mongoose.model('Board', BoardSchema);

// Export only the Board model
exports.Board = Board;
exports.Thread = Thread;
exports.Reply = Reply;