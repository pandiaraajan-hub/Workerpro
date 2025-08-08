# WorkerPro Vercel Deployment Instructions

## Quick Deployment Steps

1. **Upload to GitHub**
   - Create new repository on GitHub
   - Upload ALL files from this deployment package
   - Maintain the folder structure exactly as provided

2. **Connect to Vercel**
   - Go to vercel.com and connect your GitHub repository
   - Import the project
   - Vercel will auto-detect the configuration

3. **Add Environment Variable**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `DATABASE_URL` with your PostgreSQL connection string
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`

4. **Deploy**
   - Click "Deploy" in Vercel
   - Wait for build to complete

## Key Files Updated for JSON Fix

- `api/index.ts` - Complete rewrite using direct database queries
- `vercel.json` - Fixed Node.js version and routing
- `package.json` - Added @vercel/node dependency

## Expected Result

After deployment, all API endpoints should return valid JSON:
- ✅ `/api/stats` - Dashboard statistics
- ✅ `/api/workers` - Worker list
- ✅ `/api/courses` - Course list
- ✅ `/api/certifications` - Certification data

## Troubleshooting

If you still get JSON errors:
1. Check Vercel function logs in the dashboard
2. Verify DATABASE_URL environment variable is set
3. Ensure all files uploaded correctly with folder structure intact

The "not a valid JSON" error should be completely resolved with this package.