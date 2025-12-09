# Ayphen Jira Backend API

Express.js + TypeORM + PostgreSQL backend for Ayphen Jira.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure database**

Create a PostgreSQL database:
```sql
CREATE DATABASE ayphen_jira;
```

Update `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ayphen_jira
```

3. **Start the server**
```bash
npm run dev
```

Server will run on **http://localhost:7500**

4. **Seed the database** (optional)
```bash
npm run seed
```

## 📡 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Issues
- `GET /api/issues` - Get all issues (supports query params: projectId, status, assigneeId)
- `GET /api/issues/:id` - Get issue by ID
- `GET /api/issues/key/:key` - Get issue by key (e.g., AYP-1)
- `POST /api/issues` - Create issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user

### Sprints
- `GET /api/sprints` - Get all sprints (supports query param: projectId)
- `POST /api/sprints` - Create sprint
- `PUT /api/sprints/:id` - Update sprint

### Health Check
- `GET /health` - API health status

## 🗄️ Database Schema

### Tables
- **users** - User accounts
- **projects** - Projects
- **issues** - Issues/tickets
- **sprints** - Scrum sprints

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL 14+
- **Port**: 7500

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run seed     # Seed database with sample data
```

## 🔗 Frontend Connection

The backend is configured to accept requests from:
- Frontend: http://localhost:1500

CORS is enabled for the frontend origin.

## 📦 Project Structure

```
ayphen-jira-backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Issue.ts
│   │   └── Sprint.ts
│   ├── routes/
│   │   ├── projects.ts
│   │   ├── issues.ts
│   │   ├── users.ts
│   │   └── sprints.ts
│   ├── index.ts
│   └── seed.ts
├── .env
├── package.json
└── tsconfig.json
```

## ✅ Features

- ✅ RESTful API
- ✅ TypeORM entities with relations
- ✅ CORS enabled
- ✅ Auto-sync database schema
- ✅ Seed script for sample data
- ✅ TypeScript support
- ✅ Hot reload in development

## 🚧 Next Steps

- [ ] Add authentication (JWT)
- [ ] Add validation middleware
- [ ] Add error handling middleware
- [ ] Add pagination
- [ ] Add filtering and sorting
- [ ] Add Swagger documentation
- [ ] Add unit tests
- [ ] Add logging
- [ ] Add rate limiting
