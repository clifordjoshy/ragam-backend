'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async findOne(ctx) {
        const ragamID = ctx.params.id;
    
        const entity = await strapi.query('user', 'users-permissions').findOne({ragamID});
        
        if(entity === null)
            return ctx.badRequest("Invalid ID");
        const entity2 = {name : entity.name, collegeName: entity.collegeName};

        return sanitizeEntity(entity2, { model: strapi.plugins['users-permissions'].models.user });
      },
};
