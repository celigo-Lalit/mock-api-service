# Mock API Service

A powerful and flexible mock API service with route management, authentication, pagination, and advanced testing features. Perfect for frontend development, testing, and prototyping.

## 🚀 Features

- **Dynamic Route Management** - Create, update, and delete custom API endpoints
- **User Authentication** - JWT-based authentication with multiple auth methods
- **Advanced Pagination** - Built-in pagination with metadata and navigation URLs
- **Error Simulation** - Special endpoints for testing error scenarios
- **Route Sharing** - Share API routes and folders with team members
- **Web Interface** - Complete web UI for managing routes and testing APIs
- **Auto-sharing** - Automatic inheritance of sharing permissions in folder structures
- **Flexible Response Types** - Support for any JSON response structure

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Pagination](#pagination)
- [Error Simulation](#error-simulation)
- [Route Sharing](#route-sharing)
- [Web Interface](#web-interface)
- [Examples](#examples)

## 🏃 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mock-api-service

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mock-api-service
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## 🔐 Authentication

The service supports multiple authentication methods:

### Authentication Methods

1. **JWT Bearer Token** - `Authorization: Bearer <token>`
2. **Basic Authentication** - `Authorization: Basic <base64(email:password)>`
3. **Cookie Authentication** - Automatic cookie-based auth for web interface

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout User
```http
POST /auth/logout
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## 🌐 API Endpoints

### Route Management

#### Get All Routes
```http
GET /api/routes
Authorization: Bearer <token>
```

#### Get Route Summary
```http
GET /api/routes/summary
Authorization: Bearer <token>
```
Returns only `_id` and `path` of each route.

#### Create Route
```http
POST /api/routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "/api/users",
  "response": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
  ],
  "name": "Users List",
  "description": "List of all users"
}
```

#### Update Route
```http
PUT /api/routes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "/api/users",
  "response": [
    {"id": 1, "name": "Alice Updated"},
    {"id": 2, "name": "Bob"}
  ],
  "name": "Updated Users List"
}
```

#### Delete Route
```http
DELETE /api/routes/:id
Authorization: Bearer <token>
```

### Utility Endpoints

#### Ping
```http
GET /api/ping
```
**Response:** `{"message": "pong"}`

### Dynamic Routes

All custom routes you create are automatically available:

```http
GET /api/users
# Returns the response you defined for this path
```

## 📄 Pagination

### Standard Pagination

Use the `/page/{records}/{index}` pattern to paginate any array response:

```http
GET /api/users/page/5/0
```

**Parameters:**
- `records` - Number of items per page
- `index` - Starting index (0-based)

**Response:**
```json
{
  "id": 1609459200000,
  "data": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
  ],
  "pagination": {
    "records": 5,
    "index": 0,
    "returned": 2,
    "total": 10,
    "hasMore": true
  },
  "nextUrl": "https://yourdomain.com/api/users/page/5/5"
}
```

### Pagination Features

- ✅ **Unique Request ID** - Each response includes a unique epoch timestamp
- ✅ **Metadata** - Complete pagination information
- ✅ **Navigation URLs** - Always includes `nextUrl` for easy navigation
- ✅ **Array Support** - Works with any endpoint that returns an array
- ✅ **Boundary Handling** - Proper handling of last page and out-of-bounds requests

## 🚨 Error Simulation

### Perror Endpoint

The `/perror/{records}/{index}/{errorIndex}` pattern provides advanced error testing:

```http
GET /api/users/perror/5/0/10
```

**Parameters:**
- `records` - Number of items per page
- `index` - Starting index
- `errorIndex` - Index at which to trigger errors

### Error Conditions

1. **Primary Error** - When `index + records >= errorIndex`:
   ```json
   {
     "message": "Simulated error: pagination range [8, 9] reaches or exceeds error index 10",
     "errorType": "PERROR_SIMULATION",
     "requestedIndex": 8,
     "records": 2,
     "errorIndex": 10,
     "paginationRange": {
       "start": 8,
       "end": 9
     }
   }
   ```

2. **Random Errors** (10% chance total):
   - **429 Rate Limit** (2% chance)
   - **503 Service Unavailable** (2% chance)
   - **408 Request Timeout** (2% chance)
   - **502 Bad Gateway** (2% chance)
   - **403 Forbidden** (2% chance)

### Error Response Examples

```json
// Rate Limit Error
{
  "message": "Rate limit exceeded. Too many requests.",
  "errorType": "RATE_LIMIT_ERROR",
  "retryAfter": 60,
  "requestedIndex": 0,
  "errorIndex": 10
}

// Service Unavailable
{
  "message": "Service temporarily unavailable. Please try again later.",
  "errorType": "SERVICE_UNAVAILABLE",
  "requestedIndex": 0,
  "errorIndex": 10
}
```

## 👥 Route Sharing

### Share Folder
```http
POST /api/folders/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "folderPath": "/api/users",
  "userEmail": "teammate@example.com"
}
```

### Get Folder Shares
```http
GET /api/folders/shares
Authorization: Bearer <token>
```

### Remove Folder Share
```http
DELETE /api/folders/shares/:userId
Authorization: Bearer <token>
```

### Sharing Features

- ✅ **Folder-level Sharing** - Share entire folders with team members
- ✅ **Auto-inheritance** - New routes automatically inherit parent folder permissions
- ✅ **Access Control** - Shared users can view and use routes but cannot modify them
- ✅ **Team Collaboration** - Multiple users can work with the same API definitions

## 🖥️ Web Interface

Access the web interface at `http://localhost:3000` for:

- **Visual Route Management** - Create, edit, and organize routes in a tree structure
- **JSON Editor** - Syntax-highlighted JSON editing with validation
- **Authentication UI** - Login, register, and profile management
- **Sharing Management** - Easy folder sharing with team members
- **Live Testing** - Test your APIs directly from the interface

### Web Interface Features

- 📁 **Hierarchical View** - Routes organized in folder structure
- ✏️ **Inline Editing** - Edit routes directly in the interface
- 🔍 **Search and Filter** - Find routes quickly
- 👤 **User Management** - Profile and authentication management
- 🔗 **Sharing Controls** - Manage team access to API routes

## 📚 Examples

### Example 1: User Management API

```bash
# Create users endpoint
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/api/users",
    "response": [
      {"id": 1, "name": "Alice", "email": "alice@example.com"},
      {"id": 2, "name": "Bob", "email": "bob@example.com"},
      {"id": 3, "name": "Charlie", "email": "charlie@example.com"}
    ],
    "name": "Users List"
  }'

# Use the endpoint
curl http://localhost:3000/api/users

# Use with pagination
curl http://localhost:3000/api/users/page/2/0

# Test error scenarios
curl http://localhost:3000/api/users/perror/1/2/3
```

### Example 2: E-commerce API

```bash
# Products endpoint
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/api/products",
    "response": [
      {"id": 1, "name": "Laptop", "price": 999.99},
      {"id": 2, "name": "Phone", "price": 599.99}
    ]
  }'

# Categories endpoint
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/api/categories",
    "response": [
      {"id": 1, "name": "Electronics"},
      {"id": 2, "name": "Clothing"}
    ]
  }'
```

### Example 3: Error Testing

```bash
# Test pagination that will error at index 5
curl http://localhost:3000/api/users/perror/2/4/5
# This will return an error because 4 + 2 = 6 >= 5

# Test pagination that won't error
curl http://localhost:3000/api/users/perror/2/0/5
# This will return normal data because 0 + 2 = 2 < 5
```

## 🛠️ API Testing

Perfect for:

- **Frontend Development** - Mock backend APIs during development
- **Integration Testing** - Test how your app handles different responses and errors
- **Load Testing** - Test pagination and error handling under load
- **Team Development** - Share consistent API definitions across teams
- **Prototyping** - Quickly prototype new API endpoints

## 📝 Response Format

All paginated responses follow this structure:

```json
{
  "id": "unique_epoch_timestamp",
  "data": [...],
  "pagination": {
    "records": "number_requested",
    "index": "starting_index", 
    "returned": "actual_items_returned",
    "total": "total_available_items",
    "hasMore": "boolean_if_more_pages_exist"
  },
  "nextUrl": "url_for_next_page"
}
```

## 🔧 Configuration

### Default Settings

- **Port:** 3000
- **JWT Expiration:** 7 days
- **Pagination:** Always includes nextUrl
- **Error Simulation:** 10% random error rate in perror endpoints

### Customization

All endpoints and responses are fully customizable through the API or web interface. Create any JSON structure you need for your testing scenarios.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
