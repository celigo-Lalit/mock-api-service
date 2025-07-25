const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { auth, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Helper function to check if parent folder is shared and get sharing info
async function getParentFolderSharing(newRoutePath, userId) {
    try {
        // Get all parent folder paths
        const pathSegments = newRoutePath.split('/').filter(Boolean);
        const parentPaths = [];
        
        // Generate all possible parent paths
        for (let i = 1; i <= pathSegments.length; i++) {
            const parentPath = '/' + pathSegments.slice(0, i).join('/');
            parentPaths.push(parentPath);
        }
        
        // Find any existing routes in parent folders that are shared
        const sharedParentRoutes = await Route.find({
            userId: userId,
            path: { $in: parentPaths },
            'sharedWith.0': { $exists: true } // Has at least one share
        }).populate('sharedWith.userId', 'name email');
        
        if (sharedParentRoutes.length === 0) {
            return [];
        }
        
        // Collect all unique users that have access to parent folders
        const inheritedShares = new Map();
        
        sharedParentRoutes.forEach(route => {
            route.sharedWith.forEach(share => {
                const userId = share.userId._id.toString();
                if (!inheritedShares.has(userId)) {
                    inheritedShares.set(userId, {
                        userId: share.userId._id,
                        sharedAt: new Date(),
                        sharedBy: route.userId // Who originally shared the parent
                    });
                }
            });
        });
        
        // Successfully inherited shares from parent folders
        
        return Array.from(inheritedShares.values());
        
    } catch (error) {
        console.error('Error checking parent folder sharing:', error);
        return [];
    }
}

// Add ping route
router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Get all routes - protected (includes owned and shared routes)
router.get('/routes', auth, async (req, res) => {
    try {
        const routes = await Route.find({
            $or: [
                { userId: req.user._id }, // Owned routes
                { 'sharedWith.userId': req.user._id } // Shared routes
            ]
        }).populate('userId', 'name email');
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — returns only _id and path of each route - protected (includes shared routes)
router.get('/routes/summary', auth, async (req, res) => {
    try {
        const summary = await Route.find({
            $or: [
                { userId: req.user._id }, // Owned routes
                { 'sharedWith.userId': req.user._id } // Shared routes
            ]
        }, { path: 1, userId: 1 }).sort({ path: 1 });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new route - protected with validation
router.post('/routes', [
    auth,
    body('path').trim().notEmpty().withMessage('Path is required'),
    body('response').notEmpty().withMessage('Response is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { path, response, name, description } = req.body;
        
        // Check if route already exists for this user
        const existingRoute = await Route.findOne({ path, userId: req.user._id });
        if (existingRoute) {
            return res.status(409).json({ message: 'Route already exists for this path' });
        }

        // Auto-sharing: Check if parent folder is shared and inherit sharing
        const sharedWith = await getParentFolderSharing(path, req.user._id);

        const route = new Route({ 
            path, 
            response, 
            userId: req.user._id,
            name,
            description,
            sharedWith: sharedWith
        });
        
        await route.save();
        
        // Log auto-sharing if it occurred
        if (sharedWith.length > 0) {
            console.log(`Auto-shared new route ${path} with ${sharedWith.length} user(s)`);
        }
        
        res.status(201).json(route);
    } catch (err) {
        console.error('Create route error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update an existing route - protected
router.put('/routes/:id', [
    auth,
    body('path').optional().trim().notEmpty().withMessage('Path cannot be empty'),
    body('response').optional().notEmpty().withMessage('Response cannot be empty')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { path, response, name, description } = req.body;
        
        // Check if path conflict exists (if path is being updated)
        if (path) {
            const existingRoute = await Route.findOne({ 
                path, 
                userId: req.user._id, 
                _id: { $ne: req.params.id } 
            });
            if (existingRoute) {
                return res.status(409).json({ message: 'Route already exists for this path' });
            }
        }

        const route = await Route.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { path, response, name, description },
            { new: true, runValidators: true }
        );
        
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (err) {
        console.error('Update route error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Find an existing route - protected (includes shared routes)
router.get('/routes/:id', auth, async (req, res) => {
    try {
        const route = await Route.findOne({
            _id: req.params.id,
            $or: [
                { userId: req.user._id }, // Owned routes
                { 'sharedWith.userId': req.user._id } // Shared routes
            ]
        }).populate('userId', 'name email');
        
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (err) {
        console.error('Get route error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete a route - protected
router.delete('/routes/:id', auth, async (req, res) => {
    try {
        const route = await Route.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json({ message: 'Route deleted' });
    } catch (err) {
        console.error('Delete route error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Share folder with user
router.post('/folders/share', [
    auth,
    body('folderPath').trim().notEmpty().withMessage('Folder path is required'),
    body('userEmail').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { folderPath, userEmail } = req.body;
        
        // Find the user to share with
        const User = require('../models/User');
        const targetUser = await User.findOne({ email: userEmail }).select('_id name email');
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find all routes in the folder owned by current user
        const regexPattern = `^${folderPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
        console.log('Sharing folder:', folderPath, 'with pattern:', regexPattern);
        
        const routes = await Route.find({ 
            userId: req.user._id,
            path: { $regex: regexPattern }
        });
        
        console.log('Found', routes.length, 'routes to share');
        
        if (routes.length === 0) {
            return res.status(404).json({ 
                message: `No routes found in folder: ${folderPath}`,
                folderPath: folderPath,
                regexPattern: regexPattern
            });
        }
        
        let updatedCount = 0;
        
        // Add sharing to all routes in the folder
        for (const route of routes) {
            const alreadyShared = route.sharedWith.some(share => 
                share.userId.toString() === targetUser._id.toString()
            );
            
            if (!alreadyShared) {
                route.sharedWith.push({
                    userId: targetUser._id
                });
                await route.save();
                updatedCount++;
            }
        }
        
        console.log('Successfully shared', updatedCount, 'routes');
        
        res.json({
            message: `Folder shared successfully with ${targetUser.name}`,
            routesShared: updatedCount,
            sharedWith: {
                name: targetUser.name,
                email: targetUser.email
            }
        });
        
    } catch (err) {
        console.error('Share folder error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get folder sharing info
router.get('/folders/shares', auth, async (req, res) => {
    try {
        const { folderPath } = req.query;
        if (!folderPath) {
            return res.status(400).json({ message: 'Folder path is required' });
        }
        
        // Find all routes in the folder
        const routes = await Route.find({ 
            userId: req.user._id,
            path: { $regex: `^${folderPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` }
        }).populate('sharedWith.userId', 'name email');
        
        // Collect unique shared users
        const sharedUsers = new Map();
        
        routes.forEach(route => {
            route.sharedWith.forEach(share => {
                if (!sharedUsers.has(share.userId._id.toString())) {
                    sharedUsers.set(share.userId._id.toString(), {
                        id: share.userId._id,
                        name: share.userId.name,
                        email: share.userId.email,
                        sharedAt: share.sharedAt,
                        routeCount: 0
                    });
                }
                sharedUsers.get(share.userId._id.toString()).routeCount++;
            });
        });
        
        res.json({
            folderPath,
            totalRoutes: routes.length,
            sharedWith: Array.from(sharedUsers.values())
        });
        
    } catch (err) {
        console.error('Get folder shares error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Remove folder sharing
router.delete('/folders/share', [
    auth,
    body('folderPath').trim().notEmpty().withMessage('Folder path is required'),
    body('userId').trim().notEmpty().withMessage('User ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { folderPath, userId } = req.body;
        
        // Find all routes in the folder
        const routes = await Route.find({ 
            userId: req.user._id,
            path: { $regex: `^${folderPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` }
        });
        
        let updatedCount = 0;
        
        // Remove sharing from all routes in the folder
        for (const route of routes) {
            const originalLength = route.sharedWith.length;
            route.sharedWith = route.sharedWith.filter(share => 
                share.userId.toString() !== userId
            );
            
            if (route.sharedWith.length < originalLength) {
                await route.save();
                updatedCount++;
            }
        }
        
        res.json({
            message: 'Folder sharing removed successfully',
            routesUpdated: updatedCount
        });
        
    } catch (err) {
        console.error('Remove folder share error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Search users for sharing
router.get('/users/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }
        
        const User = require('../models/User');
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } }, // Exclude current user
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { email: { $regex: q, $options: 'i' } }
                    ]
                }
            ]
        }).select('name email').limit(10);
        
        res.json(users);
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Handle dynamic routes - find from any user (public access)
router.all('*', async (req, res) => {
    try {
        // Find the first matching route from any user
        // In the future, we might want to add a "isPublic" flag to routes
        const route = await Route.findOne({ path: req.path }).sort({ createdAt: 1 });
        if (route) {
            res.json(route.response);
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (err) {
        console.error('Dynamic route error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;