'use strict';

const { Board } = require('../models');

const BoardModel = require('../models').Board;
const ThreadModel = require('../models').Thread;
const ReplyModel = require('../models').Reply;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  // post thread
  .post(async (req, res) => {
    try {
      const { text, delete_password } = req.body;
      let board = req.params.board;
      if (!board) {
        return res.status(400).json({ error: 'Missing board' });
      }

      if (!text || !delete_password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const newDate = Date.now()

      const newThread = new ThreadModel({
        text,
        delete_password,
        created_on: newDate,
        bumped_on: newDate,
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

      res.send('reported')
    } catch (error) {
      console.error('Error reporting the thread:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  // delete thread
  .delete(async (req, res) =>{
    try {
      let { board, thread_id, delete_password } = req.body;
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
        return res.send('incorrect password');
      }

      thread.deleteOne();
      await boardData.save();
      return res.send('success');
    } catch (error) {
      console.error('Delete thread error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .get(async (req, res) => {
    try {
      const { board } = req.params;
      const { thread_id } = req.query;
      const boardData = await BoardModel.findOne({ name: board })
        .lean()
        .select('-__v');

      if (!boardData) {
        return res.json({ error: 'Board not found' });
      }

      if ( thread_id ){
        const thread = boardData.threads.filter(e => e._id == thread_id)[0];
        if (!thread) {
          return res.json({ error: 'Thread id not found' });
        }
        
        const result = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(r => ({
            _id: r._id,
            text: r.text,
            created_on: r.created_on
          }))
        };
        return res.json(result)
      }else{
        const processedThreads = boardData.threads
          .sort((a,b) => new Date(b.bumped_on) - new Date(a.bumped_on))
          .slice(0, 10)
          .map(thread => ({
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies
              .sort((a,b) => new Date(b.created_on) - new Date(a.created_on))
              .slice(0,3)
              .map(reply => ({
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on
              }))
          }));
        return res.json(processedThreads);
      }
    } catch (error) {
      console.error('Error fetching threads: ', error);
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
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData){
        return res.status(400).json({ error: 'Board not found' });
      }
      // find thread
      const thread = boardData.threads.id(thread_id);
      if (!thread){
        return res.status(400).json({ error: 'Thread not found' });
      }
      // create reply
      const newReply = new ReplyModel({
        text,
        delete_password
      });
      // save
      thread.bumped_on = newReply.created_on;
      thread.replies.push(newReply);
      await boardData.save()
      res.json(newReply);
    } catch (error) {
      console.error('Error creating reply',error);
      res.status(500).json({ error: 'Server internal error '});
    }
  })
  .get(async (req, res) => {
    try {
      const { board } = req.params;
      const { thread_id } = req.query;
      if (!board || !thread_id) {
        return res.json({ error: 'Missing arguments' });
      }
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData){
        return res.json({ error: 'Board not found' });
      }
      const thread = boardData.threads.id(thread_id);
      if (!thread){
        return res.json({ error: 'Thread not found' });
      }
      const result = {
        _id: thread._id,
        text: thread.text,
        bumped_on: thread.bumped_on,
        created_on: thread.created_on,
        replies: thread.replies.map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        }))
      };
      res.json(result);
    } catch(error) {
      console.error('error', error);
      res.json({ error: 'Internal server error' });
    }
  })
  //report reply
  .put(async (req,res) => {
    try {
      const { board } = req.params;
      const { thread_id, reply_id } = req.body;
      if (!board || !thread_id || !reply_id){
        return res.status(400).json({ error: 'Missing arguments' });
      }
      
      const boardData = await BoardModel.findOne({ name: String(board) });
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
      res.send('reported');
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
        return res.json({ error: 'Missing arguments' });
      }
      const boardData = await BoardModel.findOne({ name: board });
      if (!boardData) {
        return res.json({ error: 'Board not found' });
      }
      const thread = boardData.threads.id(thread_id)
      if (!thread) {
        return res.json({ error: 'Thread not found' });
      }
      const reply = thread.replies.id(reply_id);

      if (!reply) {
        return res.json({ error: 'Reply not found' });
      }
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      reply.text = '[deleted]'
      await boardData.save()
      res.send('success');
    } catch (error) {
      console.error('Error on Reply delete', error);
      res.status(500).json({ error: 'Server internal error' });
    }
  });

  



};
