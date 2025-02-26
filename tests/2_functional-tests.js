const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

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
});