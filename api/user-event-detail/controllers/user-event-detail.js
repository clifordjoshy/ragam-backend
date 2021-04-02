'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');
const fs = require('fs');

module.exports = {
	async create(ctx) {

		const { user, event } = ctx.request.body;

		if (user.id !== ctx.state.user.id)
			return ctx.unauthorized("Unauthorized user access");

		const hasUserRegistered = ctx.state.user.eventDetails.find(o => o.event === event.id)
		if (typeof hasUserRegistered !== 'undefined')
			return ctx.badRequest("Already registered for event");


		let eventObj = await strapi.services.event.findOne({ id: event.id });

		if (typeof eventObj === 'undefined')
			return ctx.badRequest('Event does not exist');

		let currentDate = new Date();
		if (!(new Date(eventObj.regStartDate) < currentDate && currentDate < new Date(eventObj.regEndDate)))
			return ctx.badRequest('Not in registration period');

		let metaValues = null;

		switch (eventObj.name) {
			case "Wordsmith (Prose)": {
				let title_list = JSON.parse(fs.readFileSync('./event_metavalues/wordsmith-prose.json'));
				metaValues = [title_list[Math.floor(Math.random() * (title_list.length - 1))]];
				break;
			}
			case "Wordsmith (Poem)": {
				let title_list = JSON.parse(fs.readFileSync('./event_metavalues/wordsmith-poem.json'));
				metaValues = [title_list[Math.floor(Math.random() * (title_list.length - 1))]];
				break;
			}
			case "Reporter (E)": {
				let title_list = JSON.parse(fs.readFileSync('./event_metavalues/reporter-eng.json'));
				metaValues = [title_list[Math.floor(Math.random() * (title_list.length - 1))]];
				break;
			}			
			case "Reporter (M)": {
				let title_list = JSON.parse(fs.readFileSync('./event_metavalues/reporter-mal.json'));
				metaValues = [title_list[Math.floor(Math.random() * (title_list.length - 1))]];
				break;
			}
		}

		const updateData = {
			teamMembers: [{ id: user.id }],
			event,
			status: 'participating',
			metaValues
		};

		let entity = await strapi.services['user-event-detail'].create(updateData);
		entity.metaValues = null;
		return sanitizeEntity(entity, { model: strapi.models['user-event-detail'] });
	},

	async findOne(ctx) {
		const paramId = Number.parseInt(ctx.params.id, 10);

		if (typeof (ctx.state.user.eventDetails.find(o => o.id === paramId)) === 'undefined')
			return ctx.unauthorized("Not a part of this team");

		const detail = await strapi.services['user-event-detail'].findOne({ id: paramId });
		const event = await strapi.services.event.findOne({ id: detail.event });

		if (new Date() < new Date(event.regEndDate))
			detail.metaValues = null;
		if(Array.isArray(event.commonMetaValues))
			detail.metaValues = event.commonMetaValues.concat((Array.isArray(detail.metaValues))?detail.metaValues:[]);
		
		return sanitizeEntity(detail, { model: strapi.models['user-event-detail'] });
	},

	async update(ctx) {
		let paramId = Number.parseInt(ctx.params.id, 10);
		let eventDetail = ctx.state.user.eventDetails.find(o => o.id === paramId);

		if (typeof eventDetail === 'undefined')
			return ctx.unauthorized("Not a part of this team");

		if (eventDetail.status !== 'participating')
			return ctx.unauthorized('Cannot edit this field');

		let { teamMembers, submissions } = ctx.request.body;

		let eventObj = await strapi.services.event.findOne({ id: eventDetail.event });

		let currentDate = new Date();
		if (!(new Date(eventObj.regStartDate) < currentDate && currentDate < new Date(eventObj.regEndDate)))
			teamMembers = null;

		if (!(eventObj.isSubmissionEvent && new Date(eventObj.submissionStartDate) < currentDate && 
		currentDate < new Date(new Date(eventObj.submissionEndDate).getTime() + 900000)))		//15 minutes late submission window
			submissions = null;

		eventDetail = await strapi.services['user-event-detail'].findOne({ id: eventDetail.id })

		if (Array.isArray(teamMembers)) {
			if (teamMembers.length > eventObj.maxTeamSize || teamMembers.length < 1)
				return ctx.badRequest("Invalid team size");

			for (const mem of teamMembers) {
				//if already a part of team
				if (typeof (eventDetail.teamMembers.find(o => o.id === mem.id)) !== 'undefined')
					continue;

				//new user
				let found = await strapi.query('user', 'users-permissions').findOne({ id: mem.id });

				if (found === null)
					return ctx.badRequest("Invalid team member id");

				if (typeof (found.eventDetails.find(o => o.event === eventDetail.event)) !== 'undefined')
					return ctx.badRequest("RagamID " + found.ragamID + " has already registered for this event.");

			}
		} else {
			teamMembers = null;
		}

		if (!Array.isArray(submissions))
			submissions = null;

		const savedSubmissions = eventDetail.submissions;
		if(submissions != null){
			const savedSubmissions = eventDetail.submissions;
			for (const sub of savedSubmissions) {
				let found = submissions.find(o => o.id === sub.id);
				if (typeof found === 'undefined') {
					await strapi.plugins['upload'].services.upload.remove(sub);
				}
			}
		}

		const updateData = { teamMembers, savedSubmissions };
		Object.keys(updateData).forEach(key => updateData[key] === null && delete updateData[key]);

		let entity = await strapi.services['user-event-detail'].update({ id: eventDetail.id }, updateData);
		entity.metaValues = null;
		return sanitizeEntity(entity, { model: strapi.models['user-event-detail'] });
	},

	async delete(ctx) {
		let paramId = Number.parseInt(ctx.params.id, 10);
		const eventDetail = ctx.state.user.eventDetails.find(o => o.id === paramId);

		if (typeof eventDetail === 'undefined')
			return ctx.unauthorized("Not a part of this team");

		const savedSubmissions = (await strapi.services['user-event-detail'].findOne({ id: eventDetail.id })).submissions;
		for (const sub of savedSubmissions)
			await strapi.plugins['upload'].services.upload.remove(sub);

		const detail = await strapi.services['user-event-detail'].delete({ id: eventDetail.id });
		detail.metaValues = null;
		return sanitizeEntity(detail, { model: strapi.models['user-event-detail'] });
	},

};
