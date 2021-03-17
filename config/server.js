module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: 'http://api.staging.ragam.live',
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'bb48de1c797c07948ea23f1ed31fa7b3'),
    },
  },
});
