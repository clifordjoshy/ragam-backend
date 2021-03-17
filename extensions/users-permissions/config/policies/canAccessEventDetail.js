require('strapi-utils');

module.exports = async (ctx, next) => {
	// If the user is an administrator we allow them to perform this action unrestricted
	if (ctx.state.user.role.name === "Administrator") {
		return next();
	}

	const paramId = Number.parseInt(ctx.params.id, 10);

	const eventDetail = ctx.state.user.eventDetails.find(o => o.id === paramId);

	if (typeof eventDetail === 'undefined')
		return ctx.unauthorized("Not a part of this team");

	return next();
};