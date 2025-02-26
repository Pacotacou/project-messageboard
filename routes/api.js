'use strict';
const BoardModel = require('../models').Board;
const ThreadModel = require('../models').Thread;
const ReplyModel = require('../models').Reply;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  // post thread
  .post(async (req, res) => {
    try {
      const { text, delete_password } = req.body;
      let board = req.body.board;
      if (!board) {
        board = req.params.board;
      }

      if (!text || !delete_password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newThread = new ThreadModel({
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        replies: []
      });

      let boardData = await BoardModel.findOne({ name: board });
      if (!boardData) {
        boardData = new BoardModel({
          name: board,
          threads: []
        });
      }

      boardData.threads.push(newThread);
      await boardData.save();

      /*const responseThread = newThread.toObject()
      delete responseThread.delete_password;*/

      return res.json(newThread);

    } catch (err) {
      console.error('Error saving thread:', err);
      res.status(500).json({ error: 'Error saving post' });
    }
  })
  // report thread
  .put(async (req, res) => {
    try {
      const { board } = req.params;
      const { thread_id } = req.body;
      
      // Validate input
      if (!thread_id) {
        return res.status(400).json({ error: 'Missing thread_id' });
      }

      // Find the board
      const boardData = await BoardModel.findOne({ name: board});
      if (!boardData){
        return res.status(404).json({ error: 'Board not found' });
      }

      // Find the thread
      const thread = boardData.threads.id(thread_id);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      // Mark as reported
      thread.reported = true;
      await boardData.save()

      // Return sanitized response

      const response = thread.toObject();
      delete response.delete_password;
      delete response.reported;

      res.json({ 
        message: 'Thread reported succesfully',
        thread: response
      });
    } catch (error) {
      console.error('Error reporting the thread:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  // delete thread
  .delete(async (req, res) =>{
    try {
      const { board, id: thread_id, password: delete_password } = req.body;
      if (!board) {
        board = req.params.board;
      }

      if (!thread_id || !delete_password) {
        return res.status(400).json({ error: 'Missing id or password' });
      }

      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData) {
        return res.status(400).json({ error: 'Board not found' });
      }

      const thread = boardData.threads.id(thread_id);
      if (!thread) {
        return res.status(400).json({ error: 'Thread not found' });
      }

      if (thread.delete_password !== delete_password) {
        return res.status(403).json({ error: 'Incorrect password '});
      }

      thread.deleteOne();
      await boardData.save();

      res.json({ message: 'Thread deleted successfully' });
      
    } catch (error) {
      console.error('Delete thread error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // new reply
  app.route('/api/replies/:board')
  .post(async (req, res) => {
    try {
      const { board } = req.params;
      const { thread_id, text, delete_password } = req.body;
      if (!board || !text || !thread_id || ! delete_password) {
        return res.status(400).json({ error: 'Missing arguments' });
      }
      // find board
      boardData = await BoardModel.findOne({ name: board });
      if (!boardData){
        return res.status(400).json({ error: 'Board not found' });
      }
      // find thread
      thread = boardData.threads.id(thread_id);
      if (!thread){
        return res.status(400).json({ error: 'Thread not found' });
      }
      // create reply
      const newReply = new ReplyModel({
        text,
        delete_password
      });
      // save
      thread.replies.push(newReply);
      await boardData.save()
      res.status(201).json(newReply);
    } catch (error) {
      console.error('Error creating reply',error);
      res.status(500).json({ error: 'Server internal error '});
    }
  })
  //report reply
  .put(async (req,res) => {
    try {
      const board = req.params;
      const { thread_id, reply_id } = req.body;
      if (!board || !thread_id || !reply_id){
        return res.status(400).json({ error: 'Missing arguments' });
      }
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData) {
        return res.status(400).json({ error: 'Board not found' });
      }
      const thread = boardData.threads.id(thread_id);
      if (!thread) {
        return res.status(400).json({ error: 'Thread not found' });
      }
      const reply = thread.replies.id(reply_id);
      if (!reply) {
        return res.status(400).json({ error: 'Reply not found' });
      }
      reply.reported = true;
      boardData.save();
      res.status(201).json({ message:'Reply reported successfully' });
    } catch (error) {
      console.error('Error reporting reply ',error);
      res.status(500).json({ error: 'Server internal error' });
    }
  })
  //delete reply
  .delete(async (req,res) => {
    try {
      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;
      if (!board || !thread_id || !delete_password) {
        return res.status(400).json({ error: 'Missing arguments' });
      }
      const boardData = await BoardModel.find({ name: board });
      if (!boardData) {
        return res.status(400).json({ error: 'Board not found' });
      }
      const thread = boardData.threads.id(thread_id);
      if (!thread) {
        return res.status(400).json({ error: 'Thread not found' });
      }
      const reply = thread.replies.id(reply_id);
      if (!reply) {
        return res.status(400).json({ error: 'Reply not found' });
      }
      reply.deleteOne()
      boardData.save()
      res.status(200).json({ message: 'Reply delete successful'});
    } catch (error) {
      console.error('Error on Reply delete', error);
      res.status(500).json({ error: 'Server internal error' });
    }
  });


};
