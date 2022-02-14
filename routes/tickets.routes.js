const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
//const { DateTime } = require('luxon');
// DateTime.fromJSDate(doc.date_initiated).toLocaleString(DateTime.DATE_MED)  ----returns Mon, DD, YYYY

const Router = express.Router();

//new ticket
Router.route('/create-ticket').post(
	body('initiated_by.username').trim().escape().toLowerCase(),
	body('assigned_to.id').optional().trim().escape().toLowerCase(),
	body('subject').trim().escape(),
	body('description').trim().escape(),
	body('assigned_to.name').optional().trim().escape().toLowerCase(),
	body('initiated_by.name').trim().escape().toLowerCase(),
	(req, res) => {
		const input = req.body;
		const errors = validationResult(req); //validate body

		//if errors is not empty, return array of all errors
		if (!errors.isEmpty()) res.json(errors.array());
		//else create new ticket
		else if (req.user) {
			input.status = input['assigned_to'] ? 'assigned' : 'initiated';
			input.initiated_by.id = req.user._id;
			Ticket.create(input, (err) => {
				if (err) {
					console.log(err.message);
					res.status(201).send(`error: ${err.message}`);
				} else res.send('Ticket successfully created');
			});
		} else {
			res.status(401).send('Unauthorized user');
		}
	}
);

//find tickets
Router.route('/query*').get(async (req, res) => {
	const urlStart = req.url.indexOf('?') + 1;
	const url = req.url.substring(urlStart);
	const params = url.split('&');

	//make object containing params to be passed into query
	const query = params.reduce((acc, cur) => {
		if (!cur.includes('=')) return acc;

		cur = cur.split('=');
		acc[cur[0]] = cur[1];
		return acc;
	}, {});

	let result = null;

	try {
		result = await Ticket.where(query);
	} catch (err) {
		result = err.message;
	}

	res.json(result);
});

//add, fetch comment
Router.route('/:id/comments')
	.all((req, res, next) => {
		console.log('comments executed');
		next();
	})
	.post(async (req, res) => {
		console.log('post comment executed');
		let result;

		try {
			//if user is authenticated
			if (req.isAuthenticated()) {
				const { id } = req.params;
				const { email, firstname, lastname } = req.user;
				const body = {
					content: req.body.content,
					author_email: email,
					author: `${firstname} ${lastname}`,
				};
				const tickets = await Ticket.where({ _id: id });
				const ticket = tickets[0];
				ticket.comments.push(body);
				await ticket.save();
				result = ticket.comments;
			}
		} catch (err) {
			result = { err };
		}

		res.json(result);
	});

//get, edit, delete existing ticket
Router.route('/:id')
	.all((req, res, next) => {
		console.log('ticket executed');
		next();
	})
	.get(async (req, res) => {
		console.log('getting individual ticket');

		try {
			const id = req.params.id;
			const ticket = await Ticket.where({ _id: id });
			res.json(ticket);
		} catch (err) {
			console.log(err);
			res.status(201).json('Ticket does not exist');
		}
	})
	.put(
		body('initiated_by.id', 'id must be an email')
			.isEmail()
			.optional()
			.trim()
			.escape()
			.toLowerCase(),
		body('assigned_to.id', 'id must be an email')
			.optional()
			.isEmail()
			.trim()
			.escape()
			.toLowerCase(),
		body('subject').trim().escape().optional(),
		body('description').trim().escape().optional(),
		body('assigned_to.name').optional().trim().escape().toLowerCase(),
		body('initiated_by.name').trim().escape().optional().toLowerCase(),
		async (req, res) => {
			console.log('ticket put');
			const { id } = req.params;
			const { subject, status, type, assigned_to, description, priority } =
				req.body;
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				console.log('error!!');
				res.json(errors.array());
			} else {
				const ticket = await Ticket.findById(id);

				ticket.subject = subject;
				ticket.type = type;
				ticket.description = description;

				if (assigned_to !== 'none') {
					const project = await Project.where({ _id: ticket.project });
					const assignee = project[0].members.filter(
						(member) => member.email === assigned_to
					)[0];

					ticket.assigned_to = assignee;
					ticket.status = status !== 'resolved' ? 'assigned' : status;
				} else {
					ticket.assigned_to = { email: 'none', name: 'none' };
					ticket.status = 'unassigned';
				}

				ticket.last_updated = { date: new Date(), by: req.user.email };
				ticket.save().then((updatedTicket) => res.json(updatedTicket));
			}
		}
	)
	.delete((req, res) => {
		const { id } = req.params;
		let confirmation = `Document ${id} successfully deleted.`;

		Ticket.findByIdAndDelete(id, null, (err) => {
			if (err) confirmation = 'Invalid ID';

			res.send(confirmation);
		});
	});

module.exports = Router;
