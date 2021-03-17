'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
	async create(ctx) {

		const { user, event } = ctx.request.body;

		if (user.id !== ctx.state.user.id)	
			return ctx.unauthorized("Unauthorized user access");

		const hasUserRegistered = ctx.state.user.eventDetails.find(o => o.event === event.id)
		if (typeof hasUserRegistered !== 'undefined')
			return ctx.badRequest("Already registered for event");
		

		let eventObj = await strapi.services.event.findOne({id: event.id});

		if(typeof eventObj == 'undefined')
			return ctx.badRequest('Event does not exist');

		let currentDate = new Date();
		if(!(new Date(eventObj.regStartDate) < currentDate && currentDate < new Date(eventObj.regEndDate)))
			return ctx.badRequest('Not in registration period');
		
		
		const updateData = {
			teamMembers: [{ id: user.id }],
			event,
			status:'participating'
		};

		let entity = await strapi.services['user-event-detail'].create(updateData);
		return sanitizeEntity(entity, { model: strapi.models['user-event-detail'] });
	},


	async update(ctx) {
		let paramId = Number.parseInt(ctx.params.id, 10);
		const eventDetail = ctx.state.user.eventDetails.find(o => o.id === paramId);

		if (typeof eventDetail === 'undefined')
			return ctx.unauthorized("Not a part of this team");

		if (eventDetail.status !== 'participating')
			return ctx.unauthorized('Cannote edit this field');

		let { teamMembers, submissions } = ctx.request.body;
		
		let eventObj = await strapi.services.event.findOne({id: eventDetail.event});

		if(Array.isArray(teamMembers) && (teamMembers.length > eventObj.maxTeamSize || teamMembers.length < 1))
			return ctx.badRequest("Invalid team size");

		
		let currentDate = new Date();
		if(typeof teamMembers !== 'undefined' && !(new Date(eventObj.regStartDate) < currentDate && currentDate < new Date(eventObj.regEndDate)))
			return ctx.badRequest("Team members can't be edited after reg period");

		if(typeof submissions !== 'undefined' && 
				!(eventObj.isSubmissionEvent && new Date(eventObj.regStartDate) < currentDate && currentDate < new Date(eventObj.submissionDate)))
			return ctx.badRequest("Submissions cannot be edited");
		
		const updateData = { teamMembers, submissions };

		if(!Array.isArray(submissions))
			submissions = [];

		const savedSubmissions = (await strapi.services['user-event-detail'].findOne({id: eventDetail.id})).submissions;
		savedSubmissions.forEach(
			async function(sub){
				let found = submissions.find(o => o.id === sub.id);
				if(typeof found === 'undefined'){
					await strapi.plugins['upload'].services.upload.remove(sub);
				}
			}
		);

		updateData.submissions = savedSubmissions;		//don't include random submissions from the request

		let entity = await strapi.services['user-event-detail'].update({ id: eventDetail.id }, updateData);

		return sanitizeEntity(entity, { model: strapi.models['user-event-detail'] });
	},


	async delete(ctx) {
		let paramId = Number.parseInt(ctx.params.id, 10);
		const eventDetail = ctx.state.user.eventDetails.find(o => o.id === paramId);

		if (typeof eventDetail === 'undefined')
			return ctx.unauthorized("Not a part of this team");

		const savedSubmissions = (await strapi.services['user-event-detail'].findOne({id: eventDetail.id})).submissions;
		savedSubmissions.forEach(async sub => await strapi.plugins['upload'].services.upload.remove(sub));
	
		const detail = await strapi.services['user-event-detail'].delete(eventDetail);

		return sanitizeEntity(detail, { model: strapi.models['user-event-detail'] });
	},

};
