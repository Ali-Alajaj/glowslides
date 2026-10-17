require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const { connectDB } = require('./services/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// 1. Security Headers (Helmet) with custom CSP for Google fonts & Tailwind CDN
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. Rate Limiting to prevent DoS / Brute-force attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per 15min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25, // limit login/signup attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again in 15 minutes.' }
});

const aiGenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI deck generations per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Generation rate limit reached. Please wait a minute before crafting more slides.' }
});

app.use(globalLimiter);

// 3. CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5000', 'http://127.0.0.1:5000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin) || !isProd) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS'));
  },
  credentials: true
}));

// 4. Request Body Parsers & Cookie Parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 5. NoSQL Injection Protection
app.use(mongoSanitize());

// 6. Safe Static Assets - ONLY serve public and specific safe directories
// CRITICAL FIX: Do NOT serve __dirname as it leaks server.js, package.json, etc.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 7. Robots.txt and Sitemap.xml
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${host}/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>
  <url><loc>${host}/dashboard</loc><priority>0.9</priority><changefreq>daily</changefreq></url>
  <url><loc>${host}/templates</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>${host}/pricing</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>${host}/engine</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>${host}/integrations</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>${host}/enterprise</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>${host}/security</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>
  <url><loc>${host}/status</loc><priority>0.6</priority><changefreq>daily</changefreq></url>
  <url><loc>${host}/privacy</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
  <url><loc>${host}/terms</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
</urlset>`);
});

// 8. Mount Rate-Limited API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/presentations/generate', aiGenLimiter);
app.use('/api', apiRoutes);

// 9. Clean SPA Route Helpers (HTML views)
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/editor', (req, res) => res.sendFile(path.join(__dirname, 'views', 'editor.html')));
app.get('/viewer', (req, res) => res.sendFile(path.join(__dirname, 'views', 'editor.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, 'views', 'pricing.html')));
app.get('/templates', (req, res) => res.sendFile(path.join(__dirname, 'views', 'templates.html')));
app.get('/engine', (req, res) => res.sendFile(path.join(__dirname, 'views', 'engine.html')));
app.get('/integrations', (req, res) => res.sendFile(path.join(__dirname, 'views', 'integrations.html')));
app.get('/enterprise', (req, res) => res.sendFile(path.join(__dirname, 'views', 'enterprise.html')));
app.get('/security', (req, res) => res.sendFile(path.join(__dirname, 'views', 'security.html')));
app.get('/status', (req, res) => res.sendFile(path.join(__dirname, 'views', 'status.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'views', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'views', 'terms.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'views', 'signup.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'views', 'settings.html')));

// Root Homepage
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// 10. Custom 404 Handler
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  }
  return res.status(404).json({ success: false, error: 'Resource not found' });
});

// 11. Global Safe Error Handler (Hides stack traces in production)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: isProd ? 'Internal Server Error' : err.message
  });
});

// Start Server & Connect MongoDB Atlas
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ⚡ GlowSlides AI Presentation Builder Server Running       ║
║   🌐 URL: http://localhost:${PORT}                             ║
║   🚀 Dashboard: http://localhost:${PORT}/dashboard              ║
║   💎 Pricing:   http://localhost:${PORT}/pricing                ║
║   🤖 AI Model:  ${process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'} ║
║   🔒 Security:  Helmet + RateLimit + NoSQLSanitize Active    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
};

startServer();
