import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pomofocus Backend API',
      version: '1.0.0',
      description:
        'A comprehensive Pomodoro productivity app backend API with user management, task tracking, learning tracks, session management, and analytics.',
      contact: {
        name: 'API Support',
        email: 'support@pomofocus.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.pomofocus.com/api',
        description: 'Production server',
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
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Unique username',
            },
            firstName: {
              type: 'string',
              nullable: true,
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              nullable: true,
              description: 'User last name',
            },
            avatar: {
              type: 'string',
              nullable: true,
              description: 'User avatar URL',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique task identifier',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Task priority level',
            },
            estimatedPomodoros: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Estimated number of pomodoros needed',
            },
            completedPomodoros: {
              type: 'integer',
              minimum: 0,
              maximum: 50,
              description: 'Number of completed pomodoros',
            },
            trackId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Associated learning track ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Task owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        LearningTrack: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique track identifier',
            },
            name: {
              type: 'string',
              description: 'Track name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Track description',
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
              description: 'Track color in hex format',
            },
            icon: {
              type: 'string',
              nullable: true,
              description: 'Track icon',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Track owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Track creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique session identifier',
            },
            type: {
              type: 'string',
              enum: ['POMODORO', 'SHORT_BREAK', 'LONG_BREAK'],
              description: 'Session type',
            },
            duration: {
              type: 'integer',
              description: 'Session duration in minutes',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Session start timestamp',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Session end timestamp',
            },
            isCompleted: {
              type: 'boolean',
              description: 'Whether the session is completed',
            },
            taskId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Associated task ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Session owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Session creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        UserSettings: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique settings identifier',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            pomodoroDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 60,
              description: 'Pomodoro duration in minutes',
            },
            shortBreakDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 30,
              description: 'Short break duration in minutes',
            },
            longBreakDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 60,
              description: 'Long break duration in minutes',
            },
            longBreakInterval: {
              type: 'integer',
              minimum: 2,
              maximum: 10,
              description: 'Number of pomodoros before long break',
            },
            autoStartBreaks: {
              type: 'boolean',
              description: 'Auto-start breaks',
            },
            autoStartPomodoros: {
              type: 'boolean',
              description: 'Auto-start pomodoros',
            },
            soundEnabled: {
              type: 'boolean',
              description: 'Sound notifications enabled',
            },
            desktopNotifications: {
              type: 'boolean',
              description: 'Desktop notifications enabled',
            },
            emailNotifications: {
              type: 'boolean',
              description: 'Email notifications enabled',
            },
            theme: {
              type: 'string',
              enum: ['light', 'dark', 'auto'],
              description: 'UI theme preference',
            },
            language: {
              type: 'string',
              enum: [
                'en',
                'es',
                'fr',
                'de',
                'it',
                'pt',
                'ru',
                'ja',
                'ko',
                'zh',
              ],
              description: 'Language preference',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Settings creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message (if any)',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
            },
          },
        },
        PaginatedResponse: {
          allOf: [
            {
              $ref: '#/components/schemas/ApiResponse',
            },
            {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number',
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page',
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of items',
                    },
                    totalPages: {
                      type: 'integer',
                      description: 'Total number of pages',
                    },
                  },
                },
              },
            },
          ],
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 20,
              pattern: '^[a-zA-Z0-9]+$',
              description: 'Unique username (alphanumeric only)',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (minimum 8 characters)',
            },
            firstName: {
              type: 'string',
              maxLength: 50,
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              description: 'User last name',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              description: 'User password',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token',
            },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              maxLength: 50,
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              description: 'User last name',
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL',
            },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Task priority level',
            },
            estimatedPomodoros: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Estimated number of pomodoros needed',
            },
            trackId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated learning track ID',
            },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Task priority level',
            },
            estimatedPomodoros: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Estimated number of pomodoros needed',
            },
            completedPomodoros: {
              type: 'integer',
              minimum: 0,
              maximum: 50,
              description: 'Number of completed pomodoros',
            },
            trackId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated learning track ID',
            },
          },
        },
        CreateTrackRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Track name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Track description',
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
              description: 'Track color in hex format',
            },
            icon: {
              type: 'string',
              maxLength: 10,
              description: 'Track icon',
            },
          },
        },
        UpdateTrackRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Track name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Track description',
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
              description: 'Track color in hex format',
            },
            icon: {
              type: 'string',
              maxLength: 10,
              description: 'Track icon',
            },
          },
        },
        StartSessionRequest: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['POMODORO', 'SHORT_BREAK', 'LONG_BREAK'],
              description: 'Session type',
            },
            taskId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated task ID',
            },
          },
        },
        CompleteSessionRequest: {
          type: 'object',
          properties: {
            duration: {
              type: 'integer',
              minimum: 1,
              maximum: 120,
              description: 'Session duration in minutes',
            },
          },
        },
        UpdateSettingsRequest: {
          type: 'object',
          properties: {
            pomodoroDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 60,
              description: 'Pomodoro duration in minutes',
            },
            shortBreakDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 30,
              description: 'Short break duration in minutes',
            },
            longBreakDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 60,
              description: 'Long break duration in minutes',
            },
            longBreakInterval: {
              type: 'integer',
              minimum: 2,
              maximum: 10,
              description: 'Number of pomodoros before long break',
            },
            autoStartBreaks: {
              type: 'boolean',
              description: 'Auto-start breaks',
            },
            autoStartPomodoros: {
              type: 'boolean',
              description: 'Auto-start pomodoros',
            },
            soundEnabled: {
              type: 'boolean',
              description: 'Sound notifications enabled',
            },
            desktopNotifications: {
              type: 'boolean',
              description: 'Desktop notifications enabled',
            },
            emailNotifications: {
              type: 'boolean',
              description: 'Email notifications enabled',
            },
            theme: {
              type: 'string',
              enum: ['light', 'dark', 'auto'],
              description: 'UI theme preference',
            },
            language: {
              type: 'string',
              enum: [
                'en',
                'es',
                'fr',
                'de',
                'it',
                'pt',
                'ru',
                'ja',
                'ko',
                'zh',
              ],
              description: 'Language preference',
            },
          },
        },
        AnalyticsQuery: {
          type: 'object',
          required: ['period'],
          properties: {
            period: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly'],
              description: 'Analytics period',
            },
            startDate: {
              type: 'string',
              format: 'date',
              description: 'Start date for analytics',
            },
            endDate: {
              type: 'string',
              format: 'date',
              description: 'End date for analytics',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Pomofocus API Documentation',
    })
  );

  // Serve the OpenAPI spec as JSON
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};
