const express = require('express');
require('dotenv').config();
const expressEjsLayouts = require('express-ejs-layouts');
const axios = require('axios');

const app = express();

// Static files
app.use(express.static('/public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/images', express.static(__dirname + '/public/images'));

// set templating engine
app.use(expressEjsLayouts);
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const KinstaAPIUrl = 'https://api.kinsta.com/v2';

// Naviagtion
app.get('/', (req, res) => {
	res.render('pages/index', { errors: '' });
});

app.post('/', (req, res) => {
	const createSite = async () => {
		const resp = await fetch(`${KinstaAPIUrl}/sites`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.REACT_APP_KINSTA_API_KEY}`,
			},
			body: JSON.stringify({
				company: process.env.REACT_APP_KINSTA_COMPANY_ID,
				display_name: req.body.displayName,
				region: req.body.location,
				install_mode: 'new',
				is_subdomain_multisite: false,
				admin_email: req.body.email,
				admin_password: req.body.password,
				admin_user: req.body.username,
				is_multisite: false,
				site_title: req.body.siteTitle,
				woocommerce: false,
				wordpressseo: false,
				wp_language: 'en_US',
			}),
		});

		const data = await resp.json();
		// res.send(data);
		// console.log(data);

		if (data.status === 202) {
			axios.post(`${process.env.SLACK_WEBHOOK_URL}`, {
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `Hello, your new site (${req.body.displayName}) has started building. It takes minutes to build. You can check the operation status intermitently via https://site-builder-nodejs-xvsph.kinsta.app/operation/${req.body.displayName}/${data.operation_id}.`,
						},
					},
					{
						type: 'divider',
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: "_Here are your site's details:_",
						},
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `1. *Site URL:* http://${req.body.displayName}.kinsta.cloud/\n2. *WP Admin URL:* http://${req.body.displayName}.kinsta.cloud/wp-admin/`,
						},
					},
				],
			});
			res.redirect(`/operation/${req.body.displayName}/${data.operation_id}`);
		}
	};
	createSite();
});

app.get('/operation/:displayName/:operationId', (req, res) => {
	const checkOperation = async () => {
		const operationId = req.params.operationId;
		const resp = await fetch(`${KinstaAPIUrl}/operations/${operationId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${process.env.REACT_APP_KINSTA_API_KEY}`,
			},
		});

		const data = await resp.json();
		res.render('pages/operation', {
			operationID: req.params.operationId,
			displayName: req.params.displayName,
			operationMessage: data.message,
		});
	};

	checkOperation();
});

// Listen on port 3000
app.listen(process.env.PORT, () => {
	console.log(`Your app is running on http://localhost:${process.env.PORT}/`);
});
