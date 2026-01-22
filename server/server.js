const fastify = require('fastify')({ 
    logger: true 
});
const cors = require('@fastify/cors');
const multipart = require('@fastify/multipart');
require('dotenv').config();

fastify.register(cors, { 
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024,
    }
});

fastify.register(require('./routes'));

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();