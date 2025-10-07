# Pomofocus Backend API

A comprehensive Pomodoro productivity app backend API built with TypeScript, Node.js, Express.js, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with refresh tokens
- 👤 **User Management**: Registration, login, profile management
- 📝 **Task Management**: Create, update, delete, and track tasks
- 🎯 **Learning Tracks**: Organize tasks into learning categories
- ⏱️ **Session Management**: Pomodoro timer sessions with real-time updates
- ⚙️ **Settings**: Customizable user preferences and configurations
- 📊 **Analytics**: Productivity insights and statistics
- 🔌 **WebSocket Support**: Real-time notifications and timer sync
- 📚 **API Documentation**: Interactive Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## Prerequisites

- Node.js (>= 18.0.0)
- npm (>= 8.0.0)
- PostgreSQL (>= 13.0)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pomo-task-be
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/pomofocus_db"
   TEST_DATABASE_URL="postgresql://username:password@localhost:5432/pomofocus_test_db"

   # JWT Secrets
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"

   # Server
   PORT=3000
   NODE_ENV="development"

   # CORS
   CORS_ORIGIN="http://localhost:3000"

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Bcrypt
   BCRYPT_ROUNDS=12
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run database migrations
   npm run db:migrate

   # Seed the database (optional)
   npm run db:seed
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

### Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Starting the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI Spec**: http://localhost:3000/api/docs.json

### API Endpoints

#### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user
- `GET /me` - Get current user
- `GET /check-email/:email` - Check email availability
- `GET /check-username/:username` - Check username availability

#### Users (`/api/users`)

- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `DELETE /profile` - Deactivate account

#### Tasks (`/api/tasks`)

- `POST /` - Create task
- `GET /` - Get user tasks (paginated)
- `GET /stats` - Get task statistics
- `GET /:id` - Get task by ID
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task
- `GET /track/:trackId` - Get tasks by track

#### Learning Tracks (`/api/tracks`)

- `POST /` - Create learning track
- `GET /` - Get user tracks
- `GET /stats` - Get track statistics
- `GET /popular` - Get popular tracks
- `GET /search` - Search tracks
- `GET /:id` - Get track by ID
- `PUT /:id` - Update track
- `DELETE /:id` - Delete track

#### Sessions (`/api/sessions`)

- `POST /start` - Start session
- `POST /:id/complete` - Complete session
- `POST /:id/cancel` - Cancel session
- `GET /active` - Get active session
- `GET /history` - Get session history
- `GET /stats` - Get session statistics

#### Settings (`/api/settings`)

- `GET /` - Get user settings
- `PUT /` - Update settings
- `POST /reset` - Reset to defaults
- `GET /themes` - Get available themes
- `GET /languages` - Get available languages

#### Analytics (`/api/analytics`)

- `GET /` - Get analytics data
- `GET /insights` - Get productivity insights
- `GET /streak` - Get streak information
- `GET /daily` - Get daily analytics
- `GET /weekly` - Get weekly analytics
- `GET /monthly` - Get monthly analytics

## Authentication

The API uses JWT tokens for authentication. Include the access token in the Authorization header:

```bash
curl -H "Authorization: Bearer <your-access-token>" \
     http://localhost:3000/api/users/profile
```

## WebSocket Support

Real-time features are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=<access-token>');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = event => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Production Deployment

### Docker

```bash
# Build Docker image
docker build -t pomofocus-api .

# Run container
docker run -p 3000:3000 --env-file .env pomofocus-api
```

### Environment Variables

Ensure all required environment variables are set in production:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `NODE_ENV=production`

### Health Check

The API provides a health check endpoint:

```bash
curl http://localhost:3000/health
```

## API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP

Rate limit information is included in response headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: `/api/docs`
- **Health Check**: `/health`
- **Issues**: GitHub Issues
- **Email**: support@pomofocus.com
