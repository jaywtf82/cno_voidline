
# Platform-Specific Deployment Instructions

## 🚀 Recommended Full-Stack Combinations

### 🥇 Primary: Railway + Supabase (Recommended)

**Why This Combination:**
- Always-on hosting (no cold starts)
- Excellent performance for real-time audio processing
- Built-in database with real-time subscriptions
- Cost-effective for production workloads

#### Railway Setup
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and initialize:
   ```bash
   railway login
   railway init
   ```

3. Copy configuration:
   ```bash
   cp configs/railway-config.env .env.production
   cp configs/railway.json railway.json
   ```

4. Deploy:
   ```bash
   railway up
   ```

#### Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Set up database tables:
   ```sql
   -- Audio sessions table
   CREATE TABLE audio_sessions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     filename VARCHAR(255) NOT NULL,
     original_audio BYTEA,
     processed_audio BYTEA,
     analysis_data JSONB,
     preset_id VARCHAR(50),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- User presets table
   CREATE TABLE user_presets (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     name VARCHAR(100) NOT NULL,
     parameters JSONB NOT NULL,
     is_public BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

4. Configure environment variables in Railway:
   ```bash
   railway variables set VITE_SUPABASE_URL=your-project-url
   railway variables set VITE_SUPABASE_ANON_KEY=your-anon-key
   railway variables set DATABASE_URL=your-postgres-connection-string
   ```

---

### 🥈 Alternative: Render + PlanetScale

**Why This Combination:**
- High availability with auto-scaling
- Serverless MySQL with database branching
- DDoS protection included

#### Render Setup
1. Copy configuration:
   ```bash
   cp configs/render-config.env .env.production
   cp configs/render.yaml render.yaml
   ```

2. Connect repository in [Render dashboard](https://render.com)
3. Configure build settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

#### PlanetScale Setup
1. Install PlanetScale CLI:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/planetscale/cli/main/install.sh | sh
   ```

2. Create database:
   ```bash
   pscale database create cno-voidline
   pscale branch create cno-voidline main
   ```

3. Get connection string and add to Render environment variables

---

### 🥉 Budget: Netlify + Supabase

**Why This Combination:**
- Serverless-first approach with global edge
- Excellent for frontend-heavy applications
- Built-in form handling and A/B testing

#### Netlify Setup
1. Copy configuration:
   ```bash
   cp configs/netlify-config.env .env.production
   cp configs/netlify.toml netlify.toml
   ```

2. Connect repository in [Netlify dashboard](https://netlify.com)
3. Build settings auto-detected from `netlify.toml`

#### Supabase Integration
Same as Railway + Supabase setup above, but configure environment variables in Netlify dashboard.

---

## Frontend-Only Deployments

### Vercel (Recommended for Static)

#### Setup via Git
1. Copy configuration:
   ```bash
   cp configs/vercel-config.env .env.production
   cp configs/vercel.json vercel.json
   ```

2. Connect repository in [Vercel dashboard](https://vercel.com)
3. Deploy automatically on push

#### CLI Deployment
```bash
npm install -g vercel
vercel login
npm run deploy:vercel
```

### GitHub Pages

#### Setup
1. Copy configuration:
   ```bash
   cp configs/github-pages-config.env .env.production
   cp configs/github-pages-workflow.yml .github/workflows/deploy.yml
   ```

2. Enable GitHub Pages in repository settings
3. Push to main branch for automatic deployment

### Manual Deployment
```bash
npm run deploy:github
```

---

## Docker (Self-Hosted)

### Local Development
1. Copy configuration:
   ```bash
   cp configs/docker-config.env .env.production
   cp configs/docker-compose.yml docker-compose.yml
   ```

2. Build and run:
   ```bash
   docker-compose up -d
   ```

3. Access at http://localhost:5000

### Production Docker
```bash
docker build -t cno-voidline:latest .
docker run -p 5000:5000 --env-file configs/docker-config.env cno-voidline:latest
```

---

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for better query performance
CREATE INDEX idx_audio_sessions_user_created ON audio_sessions(user_id, created_at DESC);
CREATE INDEX idx_audio_sessions_preset ON audio_sessions(preset_id);
CREATE INDEX idx_user_presets_public ON user_presets(is_public, created_at DESC);
```

### Connection Pooling
```javascript
// Add to your database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Strategy
```javascript
// Add Redis for session caching (optional)
const redis = new Redis(process.env.REDIS_URL);
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

---

## Monitoring & Logging

### Health Check Endpoint
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

### Error Tracking
```javascript
// Add error monitoring
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});
```

---

## Cost Analysis

| Platform Combination | Free Tier | Paid Plan | Best For |
|----------------------|-----------|-----------|----------|
| **Railway + Supabase** | Limited | $5/month | Production apps |
| **Render + PlanetScale** | 750hrs/month | $36/month | High availability |
| **Netlify + Supabase** | 300 build min | $19/month | Serverless-first |
| **Vercel** | 100GB bandwidth | $20/month | Frontend only |
| **GitHub Pages** | Unlimited | Free | Open source |
| **Docker Self-hosted** | Free | VPS cost | Full control |

---

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version (18+ required)
2. **Database connection**: Verify connection string format
3. **CORS errors**: Configure allowed origins in production
4. **Audio processing**: Ensure Web Audio API support in target browsers

### Getting Help

- Check platform-specific documentation
- Review deployment logs in platform dashboards  
- Test configurations locally first
- Use health check endpoints for debugging

Each platform configuration is optimized for the specific hosting environment and includes performance tuning for audio processing workloads.

