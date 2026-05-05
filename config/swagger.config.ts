import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Silver Glow API',
      version: '1.0.0',
      description: 'API documentation for Silver Glow E-commerce platform',
      contact: {
        name: 'Silver Glow Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.ts', './models/*.ts', './schemas/*.ts', './routes/*.js', './models/*.js', './schemas/*.js'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
