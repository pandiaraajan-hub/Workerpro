import { VercelRequest, VercelResponse } from '@vercel/node';
import { insertWorkerSchema, insertCourseSchema, insertCertificationSchema } from '../shared/schema';
import { 
  type Worker, 
  type Course,
  type Certification,
  type WorkerWithCertifications,
  workers,
  courses,
  certifications
} from "../shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lte, like, or } from "drizzle-orm";

// Database connection for Vercel
let db: any = null;

function getDB() {
  if (!db) {
    const sql = neon(process.env.DATABASE_URL!);
    db = drizzle(sql);
  }
  return db;
}

// Helper function to handle CORS
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url?.replace('/api', '') || '';

  try {
    const database = getDB();
    
    // Routes handling
    if (method === 'GET' && path === '/stats') {
      const [allWorkers, allCourses, allCertifications] = await Promise.all([
        database.select().from(workers),
        database.select().from(courses),
        database.select().from(certifications)
      ]);
      
      const expiringSoon = allCertifications.filter(cert => {
        if (!cert.expiryDate) return false;
        const expiry = new Date(cert.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiry <= thirtyDaysFromNow;
      });

      return res.json({
        totalWorkers: allWorkers.length,
        activeCourses: allCourses.filter(c => c.isActive).length,
        totalCertifications: allCertifications.length,
        expiringSoon: expiringSoon.length
      });
    }

    if (method === 'GET' && path === '/workers') {
      const allWorkers = await database.select().from(workers);
      return res.json(allWorkers);
    }

    if (method === 'POST' && path === '/workers') {
      const { worker: workerData, certifications: certificationsData = [] } = req.body;
      const validatedWorkerData = insertWorkerSchema.parse(workerData);
      
      const processedWorkerData = {
        ...validatedWorkerData,
        dateOfExpiry: validatedWorkerData.dateOfExpiry ? new Date(validatedWorkerData.dateOfExpiry) : null,
        dateOfBirth: validatedWorkerData.dateOfBirth ? new Date(validatedWorkerData.dateOfBirth) : null,
      };
      
      const [worker] = await database.insert(workers).values(processedWorkerData).returning() as Worker[];
      
      const createdCertifications: Certification[] = [];
      for (const cert of certificationsData) {
        const certificationData = {
          workerId: worker.id,
          courseId: cert.courseId,
          name: cert.name,
          certificateNumber: cert.certificateNumber,
          issuedDate: cert.issuedDate || new Date().toISOString(),
          expiryDate: cert.expiryDate || null,
          status: cert.status || 'active'
        };
        const validatedCertData = insertCertificationSchema.parse(certificationData);
        
        const processedCertData = {
          ...validatedCertData,
          issuedDate: validatedCertData.issuedDate ? new Date(validatedCertData.issuedDate) : new Date(),
          expiryDate: validatedCertData.expiryDate ? new Date(validatedCertData.expiryDate) : null,
        };
        const [certification] = await database.insert(certifications).values(processedCertData).returning() as Certification[];
        createdCertifications.push(certification);
      }
      
      return res.status(201).json({ worker, certifications: createdCertifications });
    }

    if (method === 'GET' && path === '/courses') {
      const allCourses = await database.select().from(courses);
      return res.json(allCourses);
    }

    if (method === 'POST' && path === '/courses') {
      console.log('Creating course with data:', req.body);
      const validatedData = insertCourseSchema.parse(req.body);
      const [course] = await database.insert(courses).values(validatedData).returning() as Course[];
      console.log('Course created successfully:', course);
      return res.status(201).json(course);
    }

    if (method === 'GET' && path.startsWith('/certifications/expiring/')) {
      const days = parseInt(path.split('/')[3]);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      
      const expiringCerts = await database
        .select()
        .from(certifications)
        .where(lte(certifications.expiryDate, cutoffDate));
      
      return res.json(expiringCerts);
    }

    if (method === 'GET' && path === '/certifications') {
      const allCertifications = await database.select().from(certifications);
      return res.json(allCertifications);
    }

    if (method === 'POST' && path === '/certifications') {
      const validatedData = insertCertificationSchema.parse(req.body);
      const processedData = {
        ...validatedData,
        issuedDate: validatedData.issuedDate ? new Date(validatedData.issuedDate) : new Date(),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      };
      const [certification] = await database.insert(certifications).values(processedData).returning() as Certification[];
      return res.status(201).json(certification);
    }

    // Route not found
    return res.status(404).json({ message: `Route not found: ${method} ${path}` });

  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    // Handle database unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({ 
        message: "Duplicate entry detected" 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}