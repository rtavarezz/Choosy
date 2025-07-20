# Choosy Development Guide

## 🏗️ Architecture Overview

Choosy follows a **monorepo structure** with clear separation of concerns:

```
Choosy/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # FastAPI backend application
├── packages/
│   ├── database/            # Database schemas, migrations, utilities
│   ├── shared/              # Shared types, utilities, constants
│   └── ui/                  # Reusable UI components
├── docs/                    # Documentation
└── scripts/                 # Build, deploy, and utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Redis (optional, for caching)

### 1. Clone and Setup
```bash
git clone https://github.com/yourusername/choosy.git
cd choosy

# Install dependencies
npm install
cd apps/api && pip install -r requirements.txt
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
DATABASE_URL=postgresql://user:password@localhost:5432/choosy
JWT_SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379
```

### 3. Database Setup
```bash
# Run database migrations
cd packages/database
psql $DATABASE_URL -f schema.sql
```

### 4. Start Development Servers
```bash
# Terminal 1: Frontend
npm run dev:web

# Terminal 2: Backend
npm run dev:api
```

## 📁 Project Structure

### Apps

#### `apps/web/` - Next.js Frontend
- **Pages**: Next.js pages and API routes
- **Components**: Page-specific components
- **Hooks**: Custom React hooks
- **Utils**: Frontend utilities
- **Styles**: CSS and styling

#### `apps/api/` - FastAPI Backend
- **main.py**: FastAPI application entry point
- **auth_service.py**: Authentication logic
- **auth_routes.py**: Authentication endpoints
- **location_services.py**: Location and event services
- **global_event_apis.py**: External API integrations

### Packages

#### `packages/database/`
- **schema.sql**: Complete database schema
- **migrations/**: Database migration files
- **seeds/**: Database seed data
- **utils/**: Database utilities

#### `packages/shared/`
- **types/**: Shared TypeScript types
- **constants/**: Application constants
- **utils/**: Shared utilities
- **validation/**: Input validation schemas

#### `packages/ui/`
- **components/**: Reusable UI components
- **hooks/**: UI-specific hooks
- **styles/**: Component styles
- **index.ts**: Component exports

## 🔐 Authentication System

### Overview
Choosy uses **JWT-based authentication** with refresh tokens for security.

### Features
- ✅ Email/password registration and login
- ✅ Social login (Google, Apple)
- ✅ JWT access tokens (30 min expiry)
- ✅ Refresh tokens (7 day expiry)
- ✅ Password strength validation
- ✅ Email verification (planned)
- ✅ Password reset (planned)

### API Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/refresh      # Refresh access token
POST /api/auth/logout       # Logout user
POST /api/auth/social       # Social login
GET  /api/auth/me           # Get user profile
PUT  /api/auth/me           # Update user profile
```

### Frontend Integration
```typescript
// Example usage in components
import { AuthModal } from '@choosy/ui';

const MyComponent = () => {
  const [showAuth, setShowAuth] = useState(false);
  
  const handleAuthSuccess = (userData) => {
    // User is now authenticated
    console.log('User logged in:', userData.display_name);
  };
  
  return (
    <AuthModal
      isOpen={showAuth}
      onClose={() => setShowAuth(false)}
      onSuccess={handleAuthSuccess}
      mode="login"
    />
  );
};
```

## 🗄️ Database Design

### Core Tables
- **users**: User accounts and profiles
- **user_sessions**: JWT refresh tokens
- **plans**: Event planning sessions
- **events**: Available events/places
- **votes**: User votes on events
- **friendships**: User relationships
- **user_groups**: Group management
- **notifications**: User notifications

### Key Features
- **Row Level Security (RLS)**: Data protection
- **UUID Primary Keys**: Scalable IDs
- **JSONB Metadata**: Flexible event data
- **Automatic Timestamps**: Created/updated tracking
- **Soft Deletes**: Data preservation

## 🎨 UI Component System

### Design Principles
1. **Mobile First**: Optimized for phones
2. **Accessibility**: WCAG 2.1 compliant
3. **Performance**: Lazy loading, code splitting
4. **Consistency**: Design system adherence

### Component Structure
```typescript
// Example component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  onClick
}) => {
  // Component implementation
};
```

## 🔒 Security Best Practices

### Backend Security
- **Input Validation**: Pydantic models for all inputs
- **Rate Limiting**: Prevent API abuse
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper origin handling
- **Environment Variables**: Secure credential management

### Frontend Security
- **XSS Prevention**: Sanitized inputs
- **CSRF Protection**: Token validation
- **Secure Storage**: HttpOnly cookies for tokens
- **Content Security Policy**: XSS mitigation

### Database Security
- **Row Level Security**: User data isolation
- **Connection Pooling**: Resource management
- **Encrypted Connections**: TLS for data in transit
- **Regular Backups**: Data protection

## 🧪 Testing Strategy

### Backend Testing
```bash
# Run backend tests
cd apps/api
pytest tests/

# Run with coverage
pytest --cov=. tests/
```

### Frontend Testing
```bash
# Run frontend tests
cd apps/web
npm test

# Run with coverage
npm test -- --coverage
```

### E2E Testing
```bash
# Run end-to-end tests
npm run test:e2e
```

## 📊 Performance Optimization

### Backend
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Resource efficiency
- **Caching**: Redis for frequently accessed data
- **Async Operations**: Non-blocking I/O

### Frontend
- **Code Splitting**: Lazy loading
- **Image Optimization**: WebP format, lazy loading
- **Bundle Optimization**: Tree shaking, minification
- **CDN**: Global content delivery

## 🚀 Deployment

### Development
```bash
# Local development
npm run dev:web    # Frontend on :3000
npm run dev:api    # Backend on :8000
```

### Production
```bash
# Build applications
npm run build:web
npm run build:api

# Deploy
npm run deploy
```

### Environment Variables
```bash
# Required for production
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...
REDIS_URL=redis://...
NEXT_PUBLIC_API_URL=https://api.choosy.com
```

## 🤝 Contributing

### Code Style
- **Backend**: Black for Python, isort for imports
- **Frontend**: Prettier for formatting, ESLint for linting
- **TypeScript**: Strict mode enabled
- **Git**: Conventional commits

### Pull Request Process
1. Create feature branch
2. Write tests for new functionality
3. Update documentation
4. Submit PR with description
5. Code review and approval
6. Merge to main

### Commit Convention
```
feat: add user authentication system
fix: resolve phone number display issue
docs: update API documentation
style: format code with prettier
refactor: restructure database schema
test: add authentication tests
chore: update dependencies
```

## 📈 Monitoring & Analytics

### Backend Monitoring
- **Health Checks**: `/health` endpoints
- **Error Tracking**: Sentry integration
- **Performance**: APM tools
- **Logging**: Structured logging

### Frontend Analytics
- **User Behavior**: Google Analytics
- **Performance**: Core Web Vitals
- **Error Tracking**: Sentry
- **A/B Testing**: Optimizely

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build applications
        run: npm run build
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Need help?** Check our [FAQ](FAQ.md) or open an issue on GitHub. 