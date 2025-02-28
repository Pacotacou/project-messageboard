const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Board = require('../models').Board;
const Thread = require('../models').Thread;
const Reply = require('../models').Reply;

chai.use(chaiHttp);

const createThread = async (board, thread, password) => {
  try {
    let boardData = await Board.findOne({ name: board });
    if (!boardData) {
      boardData = new Board({
        name: board
      });
    }
    const newThread = new Thread({
      text: thread,
      delete_password: password
    });
    boardData.threads.push(newThread);
    await boardData.save()
    return newThread;
  } catch (error) {
    throw error
  }
}

const createReply = async (boardName, threadText, replyText, password) => {
  let board = await Board.findOne({ name: boardName });
  if (!board) {
    board = new Board({ name: boardName });
  }
  
  const thread = new Thread({
    text: threadText,
    delete_password: password
  });
  
  const reply = new Reply({
    text: replyText,
    delete_password: password
  });
  
  thread.replies.push(reply);
  board.threads.push(thread);
  await board.save();
  
  return { 
    board,
    thread: board.threads[board.threads.length - 1],
    reply: board.threads[board.threads.length - 1].replies[0]
  };
};

const log = (message) =>{
  console.log(message);
}



suite('Functional Tests', function() {
  test('Create a thread with POST to /api/threads/{board}', async function() {
    try {
      const boardName = 'board_example';
      
      const res = await chai.request(server)
        .post(`/api/threads/${boardName}`) 
        .send({
          text: 'text',          
          delete_password: '1234'
        });

      // Assert the response status code
      assert.equal(res.status, 200);
      
      // Assert response contains expected properties
      assert.property(res.body, '_id');
      assert.property(res.body, 'text');
      assert.property(res.body, 'created_on');
      assert.property(res.body, 'bumped_on');
      
      console.log('Test passed successfully');
    } catch (error) {
      // If any assertion fails, throw the error
      throw error;
    }
  });

  test('Viewing the 10 most recent threads with 3 replies each', async () => {
    try {
      const board = 'fcc';
  
      // Create test data (11 threads, each with 4 replies)
      const boardData = new Board({
        name: board,
        threads: Array.from({ length: 11 }, (_, i) => ({
          text: `Thread ${i}`,
          delete_password: '123',
          replies: Array.from({ length: 4 }, (_, j) => ({
            text: `Reply ${j} to Thread ${i}`,
            delete_password: '456'
          }))
        }))
      });
      await boardData.save();
  
      // Fetch threads
      const res = await chai.request(server)
        .get(`/api/threads/${board}`);
  
      // Assertions
      assert.strictEqual(res.status, 200, 'Response status should be 200');
      assert.isArray(res.body, 'Response should be an array');
      assert.strictEqual(res.body.length, 10, 'Should return 10 threads');
  
      // Check thread structure
      const thread = res.body[0];
      assert.exists(thread, 'First thread should exist');
      assert.exists(thread.text, 'Thread should have text');
      assert.exists(thread.created_on, 'Thread should have created_on');
      assert.exists(thread.bumped_on, 'Thread should have bumped_on');
  
      // Check replies
      assert.isArray(thread.replies, 'Thread should have replies');
      assert.strictEqual(thread.replies.length, 3, 'Thread should have 3 replies');
  
      // Check reply structure
      const reply = thread.replies[0];
      assert.exists(reply, 'First reply should exist');
      assert.exists(reply.text, 'Reply should have text');
      assert.exists(reply.created_on, 'Reply should have created_on');
  
      // Cleanup
      await Board.deleteOne({ name: board });
  
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  test('Deleting a thread with the incorrect password', async () => {
    const board = 'fcc_test'
    try {
      const thread = await createThread('fcc_test','delete_test','123');
      const response = await chai.request(server)
        .delete(`/api/threads/${board}`)
        .send({
          thread_id: thread._id,
          delete_password: '456'
        });
      
      assert.equal(response.text, 'incorrect password')

    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Deleting a thread with the correct password', async ()=> {
    const board = 'fcc_test'
    try {
      const thread = await createThread('fcc_test','delete_test','123');
      const response = await chai.request(server)
        .delete(`/api/threads/${board}`)
        .send({
          thread_id: thread._id,
          delete_password: '123'
        });
      
      assert.equal(response.text, 'success')

    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Reporting a thread', async ()=> {
    const board = 'fcc_test'
    try {
      const thread = await createThread('fcc_test','report_test','123');
      const response = await chai.request(server)
        .put(`/api/threads/${board}`)
        .send({
          thread_id: thread._id
        });
      
      assert.equal(response.text, 'reported')
    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Creating a new reply', async () => {
    const board = 'fcc_test'
    try {
      const thread = await createThread('fcc_test','create_test','123');
      const response = await chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          text: 'create_test',
          delete_password: '123'
        });
      
      assert.isObject(response.body)
    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Viewing a single thread with all replies', async () => {
    const board = 'fcc_test'
    try {
      const thread = await createThread('fcc_test','get_test','123');
      const response = await chai.request(server)
        .get(`/api/threads/${board}`)
        .query({thread_id: String(thread._id)});
      assert.isObject(response.body);
      assert.isArray(response.body.replies);
    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Deleting a reply with the incorrect password', async () => {
    const board = 'fcc_test'
    try {
      const {reply, thread} = await createReply(board,'testreply','testreply','123');
      const response = await chai.request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id: String(thread._id),
          reply_id: reply._id,
          delete_password: '453'
        });
      assert.equal(response.text,'incorrect password');
    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Deleting a reply with the correct password', async () => {
    const board = 'fcc_test'
    try {
      
      const {reply, thread} = await createReply(board,'testreply','testreply','123');
      const response = await chai.request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id: String(thread._id),
          reply_id: reply._id,
          delete_password: '123'
        });
      assert.equal(response.text,'success');
    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });

  test('Reporting a reply', async () => {
    const board = 'fcc_test2'
    try {

      const {reply, thread} = await createReply(board,'testreply','testreply','123');
      const response = await chai.request(server)
        .put(`/api/replies/${board}`)
        .send({
          thread_id: String(thread._id),
          reply_id: String(reply._id)
        });
      assert.equal(response.text,'reported');
    } catch (error) {
      throw error
    } finally {
      await Board.deleteOne({ name: board });
    }
  });
});

