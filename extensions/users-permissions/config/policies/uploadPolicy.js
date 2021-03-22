require('strapi-utils');

module.exports = async (ctx, next) => {
    
    if(typeof ctx.request.body.refId === 'undefined')
        return ctx.badRequest("Invalid refId");

	if(ctx.is('multipart')){
        const refId = Number.parseInt(ctx.request.body.refId, 10);
        
        let found = ctx.state.user.eventDetails.find(o => o.id === refId);
        if (typeof found === 'undefined')
            return ctx.unauthorized('Cannot access');

        let eventObj = await strapi.services.event.findOne({ id: found.event });

        let currentDate = new Date();
        if(!(eventObj.isSubmissionEvent && new Date(eventObj.submissionStartDate) < currentDate && 
            currentDate < new Date(new Date(eventObj.submissionEndDate).getTime() + 900000)))		//15 minutes late submission window
        return ctx.badRequest("Submissions cannot be edited");

        ctx.request.body.ref = 'user-event-detail';
        ctx.request.body.field = 'submissions';

        return next();
        
    } else {
        return ctx.badRequest("Not multipart");
    }
};