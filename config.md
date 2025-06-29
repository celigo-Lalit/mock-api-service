# Configuration Guide

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mock-api-service

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Important Notes:

1. **JWT_SECRET**: Change this to a strong, unique secret key in production
2. **MONGODB_URI**: Update this to point to your MongoDB instance
3. **NODE_ENV**: Set to 'production' when deploying

## Quick Setup:

```bash
# Copy the example above into .env file
echo 'MONGODB_URI=mongodb://localhost:27017/mock-api-service
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development' > .env
``` 