//#modules
const express = require('express');
const mongoose = require('mongoose');
// const nodemailer = require('nodemailer'); //# nodemailer can be used for sending emails

//#imports
const mongodb = require('./database/db');
/* 
const User = require('./models/User');

User.create({
	username: 'johdoe123',
	password: 'Password123',
	firstname: 'John',
	lastname: 'Doe',
	email: 'johdoe123@email.com',
	phone: '123-456-7890',
	notifications: [],
	role: 'engineer',
}); */

const app = express();
require('dotenv').config();

mongoose.connect(mongodb.db, (err) => {
	if (err) {
		console.log('Failed to connect to database. ' + err.message);
	} else {
		console.log('Successfully connected to database');
	}
});

//middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(__dirname + '/build'));

//test apis
app.post('/users/registration', (req, res, next) => {
	console.log(req.body, req.headers);

	res.send('Good');
});

app.get('*', (req, res) => {
	res.status(404).send('Oops. Page not found. Did you mean something else?');
});

app.listen(process.env.PORT || 3000, () =>
	console.log('Listening on port ' + process.env.PORT || 3000)
);
