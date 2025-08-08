# WorkerPro - Employee Management System

A comprehensive employee management platform that provides advanced tracking, reporting, and data management capabilities for organizational workforce development.

## 🚀 Features

- **Employee Management**: Full CRUD operations for worker profiles
- **Certification Tracking**: Course enrollment and certification status monitoring  
- **Excel Integration**: Import/export functionality for bulk data operations
- **Search & Filtering**: Real-time search across worker data
- **Expiration Alerts**: Automatic tracking of certification expiration dates
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Dashboard Analytics**: Real-time statistics and reporting

## 🛠 Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- TanStack Query for state management
- React Hook Form for form handling

### Backend
- Node.js with Express
- TypeScript
- Drizzle ORM for database operations
- PostgreSQL database
- Multer for file uploads
- Excel processing capabilities

## 📦 Quick Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Visit [vercel.com](https://vercel.com) and sign up
   - Click "New Project" and import your GitHub repository
   - Vercel will automatically detect the configuration
   - Set your environment variables (see below)
   - Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel

# Follow the prompts
```

## 🔐 Environment Variables

Set these in your Vercel dashboard under Project Settings → Environment Variables:

```env
DATABASE_URL=your_postgresql_database_url_here
NODE_ENV=production
PGHOST=your_db_host
PGDATABASE=your_db_name
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGPORT=5432
```

## 🗄 Database Setup

### Option 1: Neon Database (Recommended)
1. Visit [neon.tech](https://neon.tech) and create a free account
2. Create a new project and database
3. Copy the connection string to use as `DATABASE_URL`

### Option 2: Vercel Postgres
1. In your Vercel project dashboard, go to the Storage tab
2. Create a new Postgres database
3. Use the provided connection details

### Run Migrations
After setting up the database:
```bash
npm run db:push
```

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

## 📁 Project Structure

```
workerpro/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages/routes
│   │   ├── lib/         # Utility functions
│   │   └── hooks/       # Custom React hooks
│   └── index.html
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # Database abstraction layer
│   └── vite.ts          # Vite integration
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
├── migrations/          # Database migration files
├── build.sh            # Custom build script for Vercel
├── vercel.json         # Vercel deployment configuration
└── package.json        # Project dependencies and scripts
```

## ✨ Key Features Explained

### Dashboard
- Real-time worker statistics
- Certification expiration tracking
- Visual charts and analytics

### Worker Management
- Add, edit, and delete worker profiles
- Track personal information and contact details
- Assign courses and certifications
- Excel import/export for bulk operations

### Course Management
- Create and manage training courses
- Track course duration and descriptions
- Monitor active/inactive status

### Certification Tracking
- Link workers to courses
- Track completion dates
- Monitor expiration dates with alerts
- Generate compliance reports

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

## 📄 License

Private/Proprietary - All rights reserved.