# C/No Voidline - Configuration Guide

> **2025-08-16** – Synced with build audit and quick-start script availability. See `docs/AUDIT.md` for details.

This guide explains all configuration options available in the AI Audio Mastering Console.

## Environment Variables

### Core Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | `development` | Application environment: `development`, `production`, `test` |
| `PORT` | number | `3000` | Server port |
| `VITE_APP_TITLE` | string | `"C/No Voidline"` | Application title shown in browser |

### Authentication Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_REQUIRE_AUTH` | boolean | `false` | Enable/disable authentication requirement |
| `REPL_ID` | string | - | Replit application ID (auto-provided on Replit) |
| `ISSUER_URL` | string | `https://replit.com/oidc` | OpenID Connect issuer URL |
| `REPLIT_DOMAINS` | string | - | Allowed domains for Replit auth |
| `SESSION_SECRET` | string | random | Secret key for session encryption |

### Database Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_TYPE` | enum | `memory` | Database type: `memory`, `sqlite`, `postgresql` |
| `DATABASE_URL` | string | - | PostgreSQL connection string |
| `SQLITE_PATH` | string | `./data/cnvoidline.db` | SQLite database file path |

### AI Processing Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_AI_PROVIDER` | enum | `local` | AI provider: `local`, `openai`, `huggingface`, `mock` |
| `OPENAI_API_KEY` | string | - | OpenAI API key |
| `VITE_OPENAI_MODEL` | string | `gpt-4` | OpenAI model to use |
| `HUGGINGFACE_API_KEY` | string | - | Hugging Face API key |
| `VITE_HF_MODEL` | string | `facebook/musicgen-small` | Hugging Face model |

### Feature Flags

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_ENABLE_FILE_UPLOAD` | boolean | `true` | Enable audio file upload |
| `VITE_ENABLE_REAL_TIME_ANALYSIS` | boolean | `true` | Enable real-time audio analysis |
| `VITE_ENABLE_EXPORT` | boolean | `true` | Enable audio export functionality |
| `VITE_ENABLE_PRESETS` | boolean | `true` | Enable mastering presets |
| `VITE_ENABLE_PROJECT_SAVING` | boolean | `true` | Enable project persistence |

### Processing Limits

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_MAX_FILE_SIZE` | number | `100` | Maximum file size in MB |
| `VITE_SUPPORTED_FORMATS` | string | `wav,mp3,aac,flac,ogg,m4a` | Supported audio formats |
| `VITE_MAX_PROCESSING_TIME` | number | `300` | Max processing time in seconds |
| `VITE_MAX_CONCURRENT_SESSIONS` | number | `10` | Max concurrent processing sessions |

## Configuration Profiles

### Development Profile
```env
NODE_ENV=development
VITE_REQUIRE_AUTH=false
DATABASE_TYPE=memory
VITE_AI_PROVIDER=local
VITE_ENABLE_PROJECT_SAVING=false
```

**Use Case:** Local development and testing
**Features:** All features enabled, no authentication, memory storage

### Production Profile (Open Source)
```env
NODE_ENV=production
VITE_REQUIRE_AUTH=false
DATABASE_TYPE=sqlite
VITE_AI_PROVIDER=local
VITE_ENABLE_PROJECT_SAVING=true
SQLITE_PATH=/data/cnvoidline.db
```

**Use Case:** Self-hosted deployment without user accounts
**Features:** All features, local processing, file-based storage

### Production Profile (Multi-User)
```env
NODE_ENV=production
VITE_REQUIRE_AUTH=true
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://...
VITE_AI_PROVIDER=local
```

**Use Case:** Multi-user hosted service
**Features:** Full authentication, PostgreSQL storage, user isolation

### Frontend-Only Profile
```env
NODE_ENV=production
VITE_REQUIRE_AUTH=false
VITE_AI_PROVIDER=local
VITE_ENABLE_PROJECT_SAVING=false
DATABASE_TYPE=memory
```

**Use Case:** Static hosting (GitHub Pages, Netlify)
**Features:** Client-side only, no backend dependencies

## AI Provider Configuration

### Local Processing (Default)
```env
VITE_AI_PROVIDER=local
```

**Benefits:**
- No external dependencies
- No API costs
- Works offline
- Privacy-focused

**Limitations:**
- Client-side processing only
- Limited by browser capabilities
- No advanced AI models

### OpenAI Integration
```env
VITE_AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
VITE_OPENAI_MODEL=gpt-4
```

**Benefits:**
- Advanced AI capabilities
- Cloud processing
- Regular model updates

**Requirements:**
- OpenAI API key
- Internet connection
- API usage costs

### Hugging Face Integration
```env
VITE_AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_your-key-here
VITE_HF_MODEL=facebook/musicgen-small
```

**Benefits:**
- Open source models
- Specialized audio models
- Community models

**Requirements:**
- Hugging Face API key
- Internet connection
- Model-specific costs

### Mock/Demo Mode
```env
VITE_AI_PROVIDER=mock
```

**Benefits:**
- No processing overhead
- Perfect for UI demos
- No dependencies

**Limitations:**
- No actual audio processing
- Simulated results only

## Database Configuration

### Memory Storage (Development)
```env
DATABASE_TYPE=memory
```

**Use Case:** Development, testing, demos
**Persistence:** None (data lost on restart)
**Performance:** Very fast
**Scalability:** Single instance only

### SQLite Storage
```env
DATABASE_TYPE=sqlite
SQLITE_PATH=./data/cnvoidline.db
```

**Use Case:** Single-server deployments
**Persistence:** File-based
**Performance:** Good for small/medium load
**Scalability:** Single server only

### PostgreSQL Storage
```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/db
```

**Use Case:** Production, multi-user systems
**Persistence:** Full ACID compliance
**Performance:** Excellent for high load
**Scalability:** Horizontal scaling support

## Security Configuration

### Session Security
```env
SESSION_SECRET=your-256-bit-secret-key
```

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Different per environment

**Generation:**
```bash
# Generate secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS Configuration
```env
FRONTEND_URL=https://yourdomain.com
```

**Development:** Typically `http://localhost:3000`
**Production:** Your actual domain

### File Upload Security
```env
VITE_MAX_FILE_SIZE=100
VITE_SUPPORTED_FORMATS=wav,mp3,aac,flac,ogg,m4a
```

**Security Considerations:**
- Limit file sizes to prevent DoS
- Restrict file types to audio only
- Implement virus scanning in production

## Performance Tuning

### Processing Limits
```env
VITE_MAX_PROCESSING_TIME=300
VITE_MAX_CONCURRENT_SESSIONS=10
```

**Adjust based on:**
- Server resources
- Expected user load
- Processing complexity

### Database Performance
```env
# PostgreSQL specific
DATABASE_URL=postgresql://user:pass@host:5432/db?pool_timeout=30&connection_limit=25
```

**Tuning parameters:**
- Connection pooling
- Query timeouts
- Connection limits

## Monitoring Configuration

### Health Checks
```env
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=30
```

### Logging
```env
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true
```

### Metrics
```env
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Platform-Specific Configuration

### Replit
```env
# Auto-provided by Replit
REPL_ID=auto-provided
REPLIT_DOMAINS=auto-provided
DATABASE_URL=auto-provided
```

### Vercel
```env
# Required for Vercel
VERCEL_URL=auto-provided
NEXT_PUBLIC_VERCEL_URL=auto-provided
```

### Railway
```env
# Auto-provided by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

### Netlify
```env
# For Netlify Functions
NETLIFY_FUNCTIONS_PORT=8888
```

## Validation and Testing

### Configuration Validation Script
```bash
# Check required environment variables
npm run config:validate

# Test database connection
npm run db:test

# Verify AI provider setup
npm run ai:test
```

### Environment Testing
```bash
# Test development setup
npm run test:env:dev

# Test production setup
npm run test:env:prod

# Test all configurations
npm run test:env:all
```

## Troubleshooting

### Common Issues

#### Environment Variables Not Loading
```bash
# Check if .env file exists
ls -la .env*

# Verify environment variables
npm run env:check
```

#### Database Connection Issues
```bash
# Test database connection
npm run db:ping

# Check database schema
npm run db:introspect
```

#### Authentication Problems
```bash
# Verify auth configuration
npm run auth:test

# Check session store
npm run session:verify
```

### Debug Mode
```env
DEBUG=cnvoidline:*
LOG_LEVEL=debug
VITE_DEBUG=true
```

## Best Practices

### Security
1. Use different secrets per environment
2. Never commit secrets to version control
3. Use environment-specific .env files
4. Implement proper CORS policies
5. Enable HTTPS in production

### Performance
1. Use connection pooling for databases
2. Implement caching where appropriate
3. Optimize audio processing algorithms
4. Monitor resource usage
5. Set appropriate limits

### Deployment
1. Use configuration validation
2. Implement health checks
3. Set up monitoring and logging
4. Test configuration in staging
5. Document environment-specific settings