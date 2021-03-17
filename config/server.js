module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: 'https://f4a9f4564320.ngrok.io',
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'bb48de1c797c07948ea23f1ed31fa7b3'),
    },
  },
});
