const express = require('express');
const router = express.Router();
const Route = require('../models/Route');

// Get all routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await Route.find();
        Route.find({}, { id: 1, name: 1 })
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET — returns only _id and path of each route
router.get('/routes/summary', async (req, res) => {
    try {
        const summary = await Route.find({}, { path: 1 }).sort({ path: 1 });;
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new route
router.post('/routes', async (req, res) => {
    const { path, response } = req.body;
    const route = new Route({ path, response });
    try {
        await route.save();
        res.status(201).json(route);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an existing route
router.put('/routes/:id', async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// find an existing route
router.get('/routes/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a route
router.delete('/routes/:id', async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json({ message: 'Route deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Handle dynamic routes
router.all('*', async (req, res) => {
    try {
        const route = await Route.findOne({ path: req.path });
        if (route) {
            res.json(route.response);
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;