require('strapi-utils');

module.exports = async (ctx, next) => {

  const { id: currentUserId } = ctx.state.user;
  const userToUpdate = Number.parseInt(ctx.params.id, 10);

  if (currentUserId !== userToUpdate) {
    return ctx.unauthorized("Unable to edit this user ID");
  }

  // Extract the fields regular users should be able to edit
  const { name, phoneNumber, collegeName, gender, referralCode } = ctx.request.body;

  // Provide custom validation policy here
  if (name && name.trim() === "") {
    return ctx.badRequest("Display name is required");
  }
  if (phoneNumber && phoneNumber.trim() === "") {
    return ctx.badRequest("Phone number is required");
  }

  // Setup the update object
  const updateData = {
    name,
    phoneNumber,
    collegeName,
    gender,
    referralCode
  };

  // remove properties from the update object that are undefined (not submitted by the user in the PUT request)
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
  ctx.request.body = updateData;
  return next();
};