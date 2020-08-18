const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
//const todos = require('../data/todos.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this protected route, we get the user's id like so: ${req.userId}`
  });
});

// get all the user's todos
app.get('/api/todos', async(req, res) => {
  const userId = req.userId;
  const data = await client.query(`
  SELECT * from todos
  WHERE todos.owner_id=${userId}
  `);

  res.json(data.rows);
});

// create new todo
app.post('/api/todos', async(req, res) => {
  try {
    const newTodo = {
      todo: req.body.todo,
      completed: req.body.completed,
    };
  
    const data = await client.query(`
    INSERT INTO todos(todo, completed, owner_id)
    VALUES($1, $2, $3)
    RETURNING *
  `, [newTodo.todo, newTodo.completed, req.userId]); 
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

//error message
app.get('*', (req, res) => {
  res.status(404).json({ message: 'No such endpoint!' });
});

app.use(require('./middleware/error'));

module.exports = app;
