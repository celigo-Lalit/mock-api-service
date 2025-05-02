const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Define paths
const configPath = path.join(__dirname, 'mock-config.json');
const responsesDir = path.join(__dirname, 'responses');

// Initialize mockConfig
let mockConfig = {};
if (fs.existsSync(configPath)) {
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    mockConfig = JSON.parse(data);
  } catch (err) {
    console.error('Error reading mock-config.json:', err);
  }
}

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Function to register routes based on mockConfig
function registerRoutes() {
  Object.entries(mockConfig).forEach(([route, filename]) => {
    app.get(route, (req, res) => {
      const filePath = path.join(responsesDir, filename);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        res.type('json').send(data);
      } else {
        res.status(404).json({ error: 'Response file not found' });
      }
    });
  });
}
registerRoutes();

// Endpoint to add a new route
app.post('/admin/add-route', (req, res) => {
  const { path: newPath, file, data } = req.body;
  if (!newPath || !file || !data) {
    return res.status(400).json({ error: 'Fields "path", "file", and "data" are required.' });
  }

  try {
    JSON.parse(data); // Validate JSON
    fs.writeFileSync(path.join(responsesDir, file), data, 'utf-8');

    mockConfig[newPath] = file;
    fs.writeFileSync(configPath, JSON.stringify(mockConfig, null, 2), 'utf-8');

    // Register the new route
    app.get(newPath, (req, res) => {
      const filePath = path.join(responsesDir, file);
      res.type('json').sendFile(filePath);
    });

    res.json({ success: true, message: `Route ${newPath} added.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add route or save file.', details: err.message });
  }
});

// Endpoint to list all routes
app.get('/admin/routes', (req, res) => {
  res.json(mockConfig);
});

// Endpoint to delete a route
app.delete('/admin/delete-route', (req, res) => {
  const { path: routePath } = req.body;
  if (!mockConfig[routePath]) {
    return res.status(404).json({ error: 'Route not found' });
  }

  const fileToDelete = path.join(responsesDir, mockConfig[routePath]);
  delete mockConfig[routePath];
  fs.writeFileSync(configPath, JSON.stringify(mockConfig, null, 2), 'utf-8');

  // Optional: delete the response file
  if (fs.existsSync(fileToDelete)) {
    fs.unlinkSync(fileToDelete);
  }

  res.json({ success: true, message: `Route ${routePath} deleted.` });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
