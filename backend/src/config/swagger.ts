export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CloudCampus API',
    version: '1.0.0',
    description: 'REST API documentation for the College Campus Management System local version (Phase 1)',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
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
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'User Login',
        description: 'Authenticates a user and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'student@campus.local' },
                  password: { type: 'string', example: 'password123' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
          },
          401: {
            description: 'Invalid credentials',
          },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        summary: 'Get Profile',
        description: 'Retrieves current user details and metadata.',
        responses: {
          200: {
            description: 'Profile data retrieved',
          },
          401: {
            description: 'Unauthorized access',
          },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'Service Health Check',
        responses: {
          200: {
            description: 'Server is healthy',
          },
        },
      },
    },
    '/api/health/database': {
      get: {
        summary: 'Database Health Check',
        responses: {
          200: {
            description: 'Database is healthy',
          },
          500: {
            description: 'Database connection failed',
          },
        },
      },
    },
    '/api/general/notifications': {
      get: {
        summary: 'Get Notifications',
        responses: {
          200: {
            description: 'Notifications fetched',
          },
        },
      },
    },
    '/api/admin/dashboard-stats': {
      get: {
        summary: 'Admin Dashboard Statistics',
        responses: {
          200: {
            description: 'Summary statistics for dashboard widgets',
          },
        },
      },
    },
    '/api/admin/students': {
      get: {
        summary: 'List Students',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'departmentId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Success' } },
      },
      post: {
        summary: 'Create Student',
        responses: { 201: { description: 'Created' } },
      },
    },
  },
};
export default swaggerDocument;
