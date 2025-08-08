import { 
  type Worker, 
  type InsertWorker,
  type Course,
  type InsertCourse,
  type Certification,
  type InsertCertification,
  type WorkerWithCertifications,
  workers,
  courses,
  certifications
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lte, like, or } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // Workers
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkerByEmployeeId(employeeId: string): Promise<Worker | undefined>;
  getAllWorkers(): Promise<Worker[]>;
  getWorkersWithCertifications(): Promise<WorkerWithCertifications[]>;
  getWorkerWithCertifications(id: string): Promise<WorkerWithCertifications | undefined>;
  createWorker(worker: any): Promise<Worker>;
  updateWorker(id: string, worker: any): Promise<Worker | undefined>;
  deleteWorker(id: string): Promise<boolean>;
  searchWorkers(query: string): Promise<Worker[]>;

  // Courses
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;

  // Certifications
  getCertification(id: string): Promise<Certification | undefined>;
  getAllCertifications(): Promise<Certification[]>;
  getCertificationsByWorker(workerId: string): Promise<(Certification & { course: Course })[]>;
  createCertification(certification: any): Promise<Certification>;
  updateCertification(id: string, certification: any): Promise<Certification | undefined>;
  deleteCertification(id: string): Promise<boolean>;
  getExpiringCertifications(days: number): Promise<(Certification & { worker: Worker; course: Course })[]>;

  // Bulk operations
  createWorkersInBulk(workers: any[]): Promise<Worker[]>;
}

export class MemStorage implements IStorage {
  private workers: Map<string, Worker>;
  private courses: Map<string, Course>;
  private certifications: Map<string, Certification>;

  constructor() {
    this.workers = new Map();
    this.courses = new Map();
    this.certifications = new Map();

    // Initialize with some sample courses
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const courseNames = [
      "Coretrade", "Multiskill", "Direct R1", "MBF", "CSOC", "BCSSC/CSC", "First Aid", 
      "bizsafe Level 1", "bizsafe Level 2", "Boomlift Operator", "Scissorlift Operator", 
      "Gondola Operator", "Lifting Supervisor", "Scaffolding Supervisor", "Metal Scaffold Supervisor", 
      "Scaffold Erector", "Welder's Cert", "EPIC (DTL)", "EPIC (NEL)", "SPIC", "WAH Worker", 
      "Managing WAH", "WSH Level B - Safety Coordinator", "WSH Level C - Safety Officer", 
      "Signalman / Rigger", "Register Earthwork Supervisor", "Airport Pass", "Boustead Pass", "JTC Course"
    ];

    for (const courseName of courseNames) {
      await this.createCourse({ name: courseName, isActive: true });
    }
  }

  // Workers
  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async getWorkerByEmployeeId(employeeId: string): Promise<Worker | undefined> {
    return Array.from(this.workers.values()).find(
      (worker) => worker.workersId === employeeId,
    );
  }

  async getAllWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter(w => w.isActive);
  }

  async getWorkersWithCertifications(): Promise<WorkerWithCertifications[]> {
    const workers = await this.getAllWorkers();
    const result: WorkerWithCertifications[] = [];

    for (const worker of workers) {
      const certifications = await this.getCertificationsByWorker(worker.id);
      result.push({ ...worker, certifications });
    }

    return result;
  }

  async getWorkerWithCertifications(id: string): Promise<WorkerWithCertifications | undefined> {
    const worker = await this.getWorker(id);
    if (!worker) return undefined;

    const certifications = await this.getCertificationsByWorker(id);
    return { ...worker, certifications };
  }

  async createWorker(insertWorker: any): Promise<Worker> {
    const id = randomUUID();
    const worker: Worker = { 
      ...insertWorker, 
      id,
      entity: insertWorker.entity || null,
      serialNumber: insertWorker.serialNumber || null,
      designation: insertWorker.designation || null,
      contactNo: insertWorker.contactNo || null,
      nationality: insertWorker.nationality || null,
      wpNo: insertWorker.wpNo || null,
      nricFinNo: insertWorker.nricFinNo || null,
      dateOfExpiry: insertWorker.dateOfExpiry || null,
      dateOfBirth: insertWorker.dateOfBirth || null,
      isActive: insertWorker.isActive ?? true
    };
    this.workers.set(id, worker);
    return worker;
  }

  async updateWorker(id: string, workerUpdate: any): Promise<Worker | undefined> {
    const existingWorker = this.workers.get(id);
    if (!existingWorker) return undefined;

    const updatedWorker = { ...existingWorker, ...workerUpdate };
    this.workers.set(id, updatedWorker);
    return updatedWorker;
  }

  async deleteWorker(id: string): Promise<boolean> {
    return this.workers.delete(id);
  }

  async searchWorkers(query: string): Promise<Worker[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.workers.values()).filter(worker =>
      worker.isActive && (
        worker.nameOfWorkers.toLowerCase().includes(lowerQuery) ||
        worker.workersId.toLowerCase().includes(lowerQuery) ||
        worker.designation?.toLowerCase().includes(lowerQuery) ||
        worker.contactNo?.toLowerCase().includes(lowerQuery) ||
        worker.nationality?.toLowerCase().includes(lowerQuery) ||
        worker.nricFinNo?.toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Courses
  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(c => c.isActive);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = { 
      ...insertCourse, 
      id,
      description: insertCourse.description || null,
      duration: insertCourse.duration || null,
      isActive: insertCourse.isActive ?? true
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: string, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const existingCourse = this.courses.get(id);
    if (!existingCourse) return undefined;

    const updatedCourse = { ...existingCourse, ...courseUpdate };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Certifications
  async getCertification(id: string): Promise<Certification | undefined> {
    return this.certifications.get(id);
  }

  async getAllCertifications(): Promise<Certification[]> {
    return Array.from(this.certifications.values());
  }

  async getCertificationsByWorker(workerId: string): Promise<(Certification & { course: Course })[]> {
    const workerCertifications = Array.from(this.certifications.values())
      .filter(cert => cert.workerId === workerId);
    
    const result = [];
    for (const cert of workerCertifications) {
      const course = await this.getCourse(cert.courseId);
      if (course) {
        result.push({ ...cert, course });
      }
    }
    
    return result;
  }

  async createCertification(insertCertification: any): Promise<Certification> {
    const id = randomUUID();
    const certification: Certification = { 
      ...insertCertification, 
      id,
      certificateNumber: insertCertification.certificateNumber || null,
      issuedDate: insertCertification.issuedDate || null,
      expiryDate: insertCertification.expiryDate || null,
      status: insertCertification.status || "active"
    };
    this.certifications.set(id, certification);
    return certification;
  }

  async updateCertification(id: string, certificationUpdate: any): Promise<Certification | undefined> {
    const existingCertification = this.certifications.get(id);
    if (!existingCertification) return undefined;

    const updatedCertification = { ...existingCertification, ...certificationUpdate };
    this.certifications.set(id, updatedCertification);
    return updatedCertification;
  }

  async deleteCertification(id: string): Promise<boolean> {
    return this.certifications.delete(id);
  }

  async getExpiringCertifications(days: number): Promise<(Certification & { worker: Worker; course: Course })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const result = [];
    for (const cert of Array.from(this.certifications.values())) {
      if (cert.expiryDate && new Date(cert.expiryDate) <= cutoffDate) {
        const worker = await this.getWorker(cert.workerId);
        const course = await this.getCourse(cert.courseId);
        if (worker && course) {
          result.push({ ...cert, worker, course });
        }
      }
    }
    
    return result;
  }

  async createWorkersInBulk(workers: InsertWorker[]): Promise<Worker[]> {
    const createdWorkers = [];
    for (const worker of workers) {
      const created = await this.createWorker(worker);
      createdWorkers.push(created);
    }
    return createdWorkers;
  }
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    if (this.initialized) return;
    
    // Check if courses already exist
    const existingCourses = await db.select().from(courses).limit(1);
    
    if (existingCourses.length === 0) {
      const courseNames = [
        "Coretrade", "Multiskill", "Direct R1", "MBF", "CSOC", "BCSSC/CSC", "First Aid", 
        "bizsafe Level 1", "bizsafe Level 2", "Boomlift Operator", "Scissorlift Operator", 
        "Gondola Operator", "Lifting Supervisor", "Scaffolding Supervisor", "Metal Scaffold Supervisor", 
        "Scaffold Erector", "Welder's Cert", "EPIC (DTL)", "EPIC (NEL)", "SPIC", "WAH Worker", 
        "Managing WAH", "WSH Level B - Safety Coordinator", "WSH Level C - Safety Officer", 
        "Signalman / Rigger", "Register Earthwork Supervisor", "Airport Pass", "Boustead Pass", "JTC Course"
      ];

      for (const courseName of courseNames) {
        await db.insert(courses).values({ name: courseName, isActive: true });
      }
    }
    
    this.initialized = true;
  }

  // Workers
  async getWorker(id: string): Promise<Worker | undefined> {
    const result = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
    return result[0];
  }

  async getWorkerByEmployeeId(employeeId: string): Promise<Worker | undefined> {
    const result = await db.select().from(workers).where(eq(workers.workersId, employeeId)).limit(1);
    return result[0];
  }

  async getAllWorkers(): Promise<Worker[]> {
    return await db.select().from(workers).where(eq(workers.isActive, true));
  }

  async getWorkersWithCertifications(): Promise<WorkerWithCertifications[]> {
    const allWorkers = await this.getAllWorkers();
    const result: WorkerWithCertifications[] = [];

    for (const worker of allWorkers) {
      const workerCertifications = await this.getCertificationsByWorker(worker.id);
      // Update certification statuses based on expiry dates
      const updatedCertifications = workerCertifications.map(cert => {
        if (!cert.expiryDate) {
          return { ...cert, status: 'active' };
        }
        
        const now = new Date();
        const expiryDate = new Date(cert.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let status = 'active';
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 60) {
          status = 'expiring_soon';
        }
        
        return { ...cert, status };
      });
      
      result.push({ ...worker, certifications: updatedCertifications });
    }

    return result;
  }

  async getWorkerWithCertifications(id: string): Promise<WorkerWithCertifications | undefined> {
    const worker = await this.getWorker(id);
    if (!worker) return undefined;

    const workerCertifications = await this.getCertificationsByWorker(id);
    return { ...worker, certifications: workerCertifications };
  }

  async createWorker(insertWorker: any): Promise<Worker> {
    const workerData = {
      ...insertWorker,
      dateOfExpiry: insertWorker.dateOfExpiry ? new Date(insertWorker.dateOfExpiry) : null,
      dateOfBirth: insertWorker.dateOfBirth ? new Date(insertWorker.dateOfBirth) : null,
      isActive: insertWorker.isActive ?? true
    };
    
    const result = await db.insert(workers).values(workerData).returning();
    return result[0];
  }

  async updateWorker(id: string, workerUpdate: any): Promise<Worker | undefined> {
    const updateData = {
      ...workerUpdate,
      dateOfExpiry: workerUpdate.dateOfExpiry ? new Date(workerUpdate.dateOfExpiry) : undefined,
      dateOfBirth: workerUpdate.dateOfBirth ? new Date(workerUpdate.dateOfBirth) : undefined,
    };
    
    const result = await db.update(workers).set(updateData).where(eq(workers.id, id)).returning();
    return result[0];
  }

  async deleteWorker(id: string): Promise<boolean> {
    const result = await db.update(workers).set({ isActive: false }).where(eq(workers.id, id));
    return result.rowCount > 0;
  }

  async searchWorkers(query: string): Promise<Worker[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(workers).where(
      and(
        eq(workers.isActive, true),
        or(
          like(workers.nameOfWorkers, lowerQuery),
          like(workers.workersId, lowerQuery),
          like(workers.designation, lowerQuery),
          like(workers.contactNo, lowerQuery),
          like(workers.nationality, lowerQuery),
          like(workers.nricFinNo, lowerQuery)
        )
      )
    );
  }

  // Courses
  async getCourse(id: string): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result[0];
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(insertCourse).returning();
    return result[0];
  }

  async updateCourse(id: string, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const result = await db.update(courses).set(courseUpdate).where(eq(courses.id, id)).returning();
    return result[0];
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.update(courses).set({ isActive: false }).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  // Certifications
  async getCertification(id: string): Promise<Certification | undefined> {
    const result = await db.select().from(certifications).where(eq(certifications.id, id)).limit(1);
    return result[0];
  }

  async getAllCertifications(): Promise<Certification[]> {
    const certs = await db.select().from(certifications);
    // Update status based on expiry dates
    return certs.map(cert => {
      if (!cert.expiryDate) {
        return { ...cert, status: 'active' };
      }
      
      const now = new Date();
      const expiryDate = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'active';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 60) {
        status = 'expiring_soon';
      }
      
      return { ...cert, status };
    });
  }

  async getCertificationsByWorker(workerId: string): Promise<(Certification & { course: Course })[]> {
    const result = await db
      .select()
      .from(certifications)
      .leftJoin(courses, eq(certifications.courseId, courses.id))
      .where(eq(certifications.workerId, workerId));

    return result.map(row => ({
      ...row.certifications,
      course: row.courses!
    }));
  }

  async createCertification(insertCertification: any): Promise<Certification> {
    const certData = {
      ...insertCertification,
      issuedDate: insertCertification.issuedDate ? new Date(insertCertification.issuedDate) : null,
      expiryDate: insertCertification.expiryDate ? new Date(insertCertification.expiryDate) : null,
      status: insertCertification.status || "active"
    };
    
    const result = await db.insert(certifications).values(certData).returning();
    return result[0];
  }

  async updateCertification(id: string, certificationUpdate: any): Promise<Certification | undefined> {
    const updateData = {
      ...certificationUpdate,
      issuedDate: certificationUpdate.issuedDate ? new Date(certificationUpdate.issuedDate) : undefined,
      expiryDate: certificationUpdate.expiryDate ? new Date(certificationUpdate.expiryDate) : undefined,
    };
    
    const result = await db.update(certifications).set(updateData).where(eq(certifications.id, id)).returning();
    return result[0];
  }

  async deleteCertification(id: string): Promise<boolean> {
    const result = await db.delete(certifications).where(eq(certifications.id, id));
    return result.rowCount > 0;
  }

  async getExpiringCertifications(days: number): Promise<(Certification & { worker: Worker; course: Course })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const result = await db
      .select()
      .from(certifications)
      .leftJoin(workers, eq(certifications.workerId, workers.id))
      .leftJoin(courses, eq(certifications.courseId, courses.id))
      .where(lte(certifications.expiryDate, cutoffDate));

    return result.map(row => ({
      ...row.certifications,
      worker: row.workers!,
      course: row.courses!
    }));
  }

  async createWorkersInBulk(workersList: any[]): Promise<Worker[]> {
    const processedWorkers = [];
    for (const worker of workersList) {
      try {
        // Try to create new worker
        const created = await this.createWorker(worker);
        processedWorkers.push(created);
      } catch (error: any) {
        if (error.code === '23505') {
          // Duplicate key error - update existing worker instead
          console.log(`Worker ${worker.workersId} already exists, updating...`);
          const existingWorker = await this.getWorkerByEmployeeId(worker.workersId);
          if (existingWorker) {
            const updated = await this.updateWorker(existingWorker.id, worker);
            if (updated) {
              processedWorkers.push(updated);
            }
          }
        } else {
          console.error(`Failed to process worker ${worker.workersId}:`, error.message);
        }
      }
    }
    return processedWorkers;
  }
}

export const storage = new DatabaseStorage();
