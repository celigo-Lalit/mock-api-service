const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Check for JWT Bearer token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      
      req.user = user;
      return next();
    }
    
    // Check for Basic Auth
    if (authHeader?.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf-8');
      const [email, password] = credentials.split(':');
      
      if (!email || !password) {
        return res.status(401).json({ message: 'Invalid basic auth format' });
      }
      
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.user = user;
      return next();
    }
    
    // Check for cookie token
    const cookieToken = req.cookies?.token;
    if (cookieToken) {
      const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      
      req.user = user;
      return next();
    }
    
    return res.status(401).json({ message: 'No valid authentication provided' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional auth - doesn't block if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Check for JWT Bearer token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    // Check for Basic Auth
    else if (authHeader?.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf-8');
      const [email, password] = credentials.split(':');
      
      if (email && password) {
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
          req.user = user;
        }
      }
    }
    // Check for cookie token
    else {
      const cookieToken = req.cookies?.token;
      if (cookieToken) {
        const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't block, just continue without user
    next();
  }
};

module.exports = { auth, optionalAuth }; 