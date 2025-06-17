// server.js - WebsitePrototype Express Server with OpenTelemetry
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'website-prototype',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    otel: {
      service: process.env.OTEL_SERVICE_NAME || 'website-prototype',
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'not-configured',
      protocol: process.env.OTEL_EXPORTER_OTLP_PROTOCOL || 'http/protobuf'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    }
  });
});

// Interview stats API endpoint
app.get('/api/interviews/stats', (req, res) => {
  res.json({
    activeInterviews: 0,
    totalInterviews: 0,
    completedInterviews: 0,
    averageDuration: 0,
    status: 'ok'
  });
});

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/dashboard.html'));
});

app.get('/twin-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/twin-management.html'));
});

app.get('/interview', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/interview.html'));
});

app.get('/curator', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/curator.html'));
});

app.get('/transcripts', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/interview-transcripts.html'));
});

app.get('/talk-to-twin', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/talk-to-twin.html'));
});

app.get('/my-files', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/my-files.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/settings.html'));
});

// Auth pages
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/auth.html'));
});

app.get('/email-verification', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/email-verification.html'));
});

app.get('/alpha-welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/alpha-welcome.html'));
});

// Error handling
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'pages/error.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ WebsitePrototype server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 OpenTelemetry endpoint: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'not-configured'}`);
  
  // Log environment
  console.log(`🏷️  Service: ${process.env.OTEL_SERVICE_NAME || 'website-prototype'}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});