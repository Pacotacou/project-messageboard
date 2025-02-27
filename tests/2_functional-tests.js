const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Board = require('../models').Board;

chai.use(chaiHttp);

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

});

