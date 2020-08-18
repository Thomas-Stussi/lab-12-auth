require('dotenv').config();
const { execSync } = require('child_process');
const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');
describe('routes', () => {
  let token;
  const newTodo = {
    id: 4,
    todo: 'Testing!',
    completed: false,
    owner_id: 2,
  };
  beforeAll(async done => {
    execSync('npm run setup-db');
    client.connect();
    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'jon@user.com',
        password: '1234'
      });
    token = signInData.body.token;
    return done();
  });
  afterAll(done => {
    return client.end(done);
  });
  test('returns a new todo when creating new todo', async(done) => {
    const data = await fakeRequest(app)
      .post('/api/todos')
      .send(newTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(newTodo);
    done();
  });

  test('returns all todos for the user when hitting GET /todos', async(done) => {
    const expected = [
      {
        id: 4,
        todo: 'Testing!',
        completed: false,
        owner_id: 2,
      },
    ];
    const data = await fakeRequest(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });

  test('returns a single todo for the user when hitting GET /todos/:id', async(done) => {
    const expected = {
      id: 4,
      todo: 'Testing!',
      completed: false,
      owner_id: 2,
    };
    const data = await fakeRequest(app)
      .get('/api/todos/4')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });

  test('updates the todo property completed from false to true when hitting PUT /todos/:id', async(done) => {
    const expected = {
      id: 4,
      todo: 'Testing!',
      completed: true,
      owner_id: 2,
    };
    const data = await fakeRequest(app)
      .put('/api/todos/4')
      .send({ todo: 'Testing!', completed: true })
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });
  
});
