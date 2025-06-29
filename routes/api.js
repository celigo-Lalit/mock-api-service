const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { auth, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Add ping route
router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Get all routes - protected
router.get('/routes', auth, async (req, res) => {
    try {
        const routes = await Route.find({ userId: req.user._id });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — returns only _id and path of each route - protected
router.get('/routes/summary', auth, async (req, res) => {
    try {
        const summary = await Route.find({ userId: req.user._id }, { path: 1 }).sort({ path: 1 });
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

        const route = new Route({ 
            path, 
            response, 
            userId: req.user._id,
            name,
            description
        });
        
        await route.save();
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

// Find an existing route - protected
router.get('/routes/:id', auth, async (req, res) => {
    try {
        const route = await Route.findOne({ _id: req.params.id, userId: req.user._id });
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