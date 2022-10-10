const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL);
const Schema = mongoose.Schema;
const Exercise = mongoose.model("Exercise", new Schema({username: String, description: String, duration: Number, date: Date}));
const User = mongoose.model("User", new Schema({ username: String, exercises: Array}));
const Log = mongoose.model("Log", new Schema({ username: String, count: Number, log: [{description: String, duration: Number, date: Date}] }));

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app
  .get('/api/users', async function(req, res){
    const foundUser = await User.find();
    res.json(foundUser); // all users
  })
  .post('/api/users', async function(req, res){
    const foundUser = await User.findOne({username: req.body.username});
    if(foundUser){ // existing user
      res.json({username: foundUser.username, _id: foundUser._id});
    }else{ // new user
      const newUser = new User({username: req.body.username, exercises: []});
      newUser.save();
      res.json({username: newUser.username, _id: newUser._id});
    }
  });

app.post('/api/users/:_id/exercises', async function(req, res){
  const exercise = { 
    description: req.body.description,
    duration: +req.body.duration,
    date: req.body.date || new Date().toISOString().slice(0, 10)
  };
  const date = req.body.date || Date.now();
  const user = await User.findOne({_id: req.params._id});
  user.exercises.push(exercise);
  user.save();
  let returnObj = {
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    _id: user._id,
    date: new Date(exercise.date).toDateString()
  };
  res.json(returnObj);
});

app.get('/api/users/:_id/logs', function(req, res){
  const from = req.query.from || '0000-00-00',
        to = req.query.to || '9999-99-99',
        limit = req.query.limit || 10000;
  User.findOne({_id:req.params._id}).then(u => {
    try{
      const exercises = u.exercises
        .filter(e => e.date >= from && e.date <= to)
        .slice(0, limit)
        .map(e => ({
            description: e.description, 
            duration: e.duration, 
            date: new Date(e.date).toDateString()
        }));
      console.log(exercises);
      var cnt = 0;
      const json = {
        _id: u._id,
        username: u.username,
        log: !exercises ? [] : exercises,
        count: !exercises ? 0 : exercises.length
      };
      console.log(json);
      res.json(json);
    }catch (error){
      console.log(error);
      res.json({error: 'error'});
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
