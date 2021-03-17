require('strapi-utils');

module.exports = async (ctx, next) => {
	if (ctx.state.user.role.name === "Administrator") {
		return next();
	}

    if(typeof ctx.request.body.refId === 'undefined')
        return ctx.badRequest("Invalid refId");

	if(ctx.is('multipart')){
        const refId = Number.parseInt(ctx.request.body.refId, 10);
        
        ctx.request.body.ref = 'user-event-detail'
        ctx.request.body.field = 'submissions'

        let found = ctx.state.user.eventDetails.find(o => o.id === refId);
        if (typeof found === 'undefined')
            return ctx.unauthorized('Cannot access');

        return next();
        
    } else {
        return ctx.badRequest("Not multipart");
    }
};