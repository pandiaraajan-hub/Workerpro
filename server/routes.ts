import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkerSchema, insertCourseSchema, insertCertificationSchema } from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to parse DD/MM/YYYY or DD.MM.YYYY dates
const parseEuropeanDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase().includes('life time') || dateStr.toLowerCase() === 'lifetime') {
    return null;
  }
  
  // Handle DD/MM/YYYY or DD.MM.YYYY format
  const cleanStr = dateStr.trim();
  const match = cleanStr.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(match[3], 10);
    
    const date = new Date(year, month, day);
    // Validate the date
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }
  
  // Fallback to standard Date parsing
  const fallbackDate = new Date(cleanStr);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Workers routes
  app.get("/api/workers", async (req, res) => {
    try {
      const workers = await storage.getWorkersWithCertifications();
      res.json(workers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  app.get("/api/workers/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const workers = await storage.searchWorkers(query);
      res.json(workers);
    } catch (error) {
      res.status(500).json({ message: "Failed to search workers" });
    }
  });

  app.get("/api/workers/:id", async (req, res) => {
    try {
      const worker = await storage.getWorkerWithCertifications(req.params.id);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch worker" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const { worker: workerData, certifications = [] } = req.body;
      
      // Validate with string dates first
      const validatedWorkerData = insertWorkerSchema.parse(workerData);
      
      // Convert date strings to Date objects for storage
      const processedWorkerData = {
        ...validatedWorkerData,
        dateOfExpiry: validatedWorkerData.dateOfExpiry ? new Date(validatedWorkerData.dateOfExpiry) : null,
        dateOfBirth: validatedWorkerData.dateOfBirth ? new Date(validatedWorkerData.dateOfBirth) : null,
      };
      
      const worker = await storage.createWorker(processedWorkerData);
      
      // Create certifications for the worker
      const createdCertifications = [];
      for (const cert of certifications) {
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
        
        // Convert string dates to Date objects for storage
        const processedCertData = {
          ...validatedCertData,
          issuedDate: validatedCertData.issuedDate ? new Date(validatedCertData.issuedDate) : new Date(),
          expiryDate: validatedCertData.expiryDate ? new Date(validatedCertData.expiryDate) : null,
        };
        const certification = await storage.createCertification(processedCertData);
        createdCertifications.push(certification);
      }
      
      res.status(201).json({ 
        worker, 
        certifications: createdCertifications 
      });
    } catch (error: any) {
      console.error('Error creating worker:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Handle unique constraint violations
      if (error.code === '23505' && error.constraint === 'workers_workers_id_unique') {
        return res.status(409).json({ 
          message: `Workers ID "${error.detail.match(/\(([^)]+)\)/)?.[1] || 'this value'}" already exists. Please use a different Workers ID.` 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create worker",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.patch("/api/workers/:id", async (req, res) => {
    try {
      const validatedData = insertWorkerSchema.partial().parse(req.body);
      const worker = await storage.updateWorker(req.params.id, validatedData);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(worker);
    } catch (error: any) {
      console.error('Error updating worker:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505' && error.constraint === 'workers_workers_id_unique') {
        return res.status(400).json({ 
          message: `Workers ID "${error.detail.match(/\(([^)]+)\)/)?.[1] || 'this value'}" already exists. Please use a different Workers ID.` 
        });
      }
      
      res.status(400).json({ message: "Invalid worker data" });
    }
  });

  app.delete("/api/workers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorker(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete worker" });
    }
  });

  // Courses routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      console.log('Creating course with data:', req.body);
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      console.log('Course created successfully:', course);
      res.status(201).json(course);
    } catch (error: any) {
      console.error('Error creating course:', error);
      
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
          message: "Course with this name already exists" 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create course",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Certifications routes
  app.get("/api/certifications", async (req, res) => {
    try {
      const certifications = await storage.getAllCertifications();
      res.json(certifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  app.get("/api/certifications/expiring/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      const certifications = await storage.getExpiringCertifications(days);
      res.json(certifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expiring certifications" });
    }
  });

  app.post("/api/certifications", async (req, res) => {
    try {
      const validatedData = insertCertificationSchema.parse(req.body);
      const certification = await storage.createCertification(validatedData);
      res.status(201).json(certification);
    } catch (error) {
      res.status(400).json({ message: "Invalid certification data" });
    }
  });

  // Excel import route
  app.post("/api/import/excel", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Found ${data.length} rows in Excel file`);
      if (data.length > 0) {
        console.log('Available columns:', Object.keys(data[0] as any));
      }

      // Get all courses from database to match column names
      const allCourses = await storage.getAllCourses();
      const courseMap = new Map();
      for (const course of allCourses) {
        courseMap.set(course.name.toLowerCase(), course);
      }

      const workers = [];
      const issues = [];
      const workersWithCertifications = [];
      
      for (let index = 0; index < data.length; index++) {
        const row = data[index] as any;
        const worker = {
          entity: row['Entity'] || row['entity'] || '',
          serialNumber: row['S/N'] || row['Serial Number'] || row['serialNumber'] || '',
          workersId: row['Workers ID'] || row['workersId'] || row['Worker ID'] || row['workerID'] || '',
          nameOfWorkers: row['Name of Workers'] || row['Name'] || row['nameOfWorkers'] || row['Worker Name'] || '',
          designation: row['Designation'] || row['designation'] || '',
          contactNo: row['Contact No.'] || row['Contact No'] || row['contactNo'] || row['Contact'] || '',
          nationality: row['Nationality'] || row['nationality'] || '',
          wpNo: row['WP No.'] || row['WP No'] || row['wpNo'] || '',
          nricFinNo: row['NRIC / Fin No'] || row['NRIC/Fin No'] || row['nricFinNo'] || row['NRIC'] || '',
          dateOfExpiry: row['Date of Expiry'] || row['dateOfExpiry'] || row['Expiry Date'] || null,
          dateOfBirth: row['Date of Birth'] || row['dateOfBirth'] || row['DOB'] || null,
          isActive: true,
        };

        // Check if required fields are present
        if (!worker.workersId || !worker.nameOfWorkers) {
          issues.push(`Row ${index + 2}: Missing required fields - Workers ID: '${worker.workersId}', Name: '${worker.nameOfWorkers}'`);
        } else {
          // Check for course certifications in additional columns
          const certifications = [];
          
          // Check all columns for course data  
          for (const [columnName, cellValue] of Object.entries(row as any)) {
            if (cellValue && cellValue !== '' && typeof cellValue === 'string') {
              const cellStr = cellValue.toString().toUpperCase();
              
              // Special handling for BCSSC/CSC - check in any column
              if (cellStr.includes('BCSSC') || cellStr.includes('CSC')) {
                const bcsscCourse = courseMap.get('bcssc/csc');
                if (bcsscCourse) {
                  certifications.push({
                    courseId: bcsscCourse.id,
                    courseName: bcsscCourse.name,
                    expiryDate: null, // BCSSC/CSC has no expiry
                    status: 'active'
                  });
                }
              }
              
              // Check for SPIC data
              else if (columnName === 'SPIC' && cellValue !== '' && typeof cellValue === 'string') {
                const spicCourse = courseMap.get('spic');
                if (spicCourse) {
                  const parsedDate = parseEuropeanDate(cellValue as string);
                  
                  certifications.push({
                    courseId: spicCourse.id,
                    courseName: spicCourse.name,
                    expiryDate: parsedDate ? parsedDate.toISOString() : null,
                    status: 'active'
                  });
                }
              }
              
              // Check for other known course columns
              else {
                const courseColumns = ['First Aid', 'bizsafe Level 1', 'bizsafe Level 2', 'WSH Level B - Safety Coordinator', 'WSH Level C - Safety Officer', 'Coretrade', 'Multiskill', 'Direct R1', 'MBF', 'CSOC'];
                
                if (courseColumns.includes(columnName)) {
                  const course = courseMap.get(columnName.toLowerCase());
                  if (course) {
                    const parsedDate = parseEuropeanDate(cellValue as string);
                    
                    certifications.push({
                      courseId: course.id,
                      courseName: course.name,
                      expiryDate: parsedDate ? parsedDate.toISOString() : null,
                      status: 'active'
                    });
                  }
                }
              }
            }
          }
          
          workers.push(worker);
          workersWithCertifications.push({
            worker,
            certifications
          });
        }
      }
      
      // Log issues for debugging
      if (issues.length > 0) {
        console.log('Import issues found:', issues);
      }
      
      if (workers.length === 0) {
        return res.status(400).json({ 
          message: "No valid workers found in Excel file",
          details: {
            totalRows: data.length,
            availableColumns: data.length > 0 ? Object.keys(data[0] as any) : [],
            issues: issues.slice(0, 5), // Show first 5 issues
            requiredColumns: ['Workers ID', 'Name of Workers'],
            acceptedVariations: {
              'Workers ID': ['Workers ID', 'workersId', 'Worker ID', 'workerID'],
              'Name of Workers': ['Name of Workers', 'Name', 'nameOfWorkers', 'Worker Name']
            }
          }
        });
      }
      
      // Convert date strings to Date objects for each worker
      const processedWorkers = workers.map(worker => {
        let dateOfExpiry = null;
        let dateOfBirth = null;
        
        // Safe date parsing using European format
        if (worker.dateOfExpiry) {
          dateOfExpiry = parseEuropeanDate(worker.dateOfExpiry.toString());
        }
        
        if (worker.dateOfBirth) {
          dateOfBirth = parseEuropeanDate(worker.dateOfBirth.toString());
        }
        
        return {
          ...worker,
          dateOfExpiry,
          dateOfBirth,
        };
      });

      // Process workers and their certifications
      const processedResults = [];
      let certificationsCreated = 0;
      
      for (let i = 0; i < workersWithCertifications.length; i++) {
        const item = workersWithCertifications[i];
        const processedWorker = processedWorkers[i];
        
        try {
          // Create or update worker
          let worker;
          try {
            worker = await storage.createWorker(processedWorker);
          } catch (error: any) {
            if (error.code === '23505') {
              // Duplicate - update existing
              const existing = await storage.getWorkerByEmployeeId(processedWorker.workersId);
              if (existing) {
                worker = await storage.updateWorker(existing.id, processedWorker);
              }
            } else {
              console.error(`Failed to process worker ${processedWorker.workersId}:`, error.message);
              continue;
            }
          }
          
          if (worker) {
            processedResults.push(worker);
            
            // Create certifications for this worker
            for (const cert of item.certifications) {
              try {
                // Check if certification already exists
                const existingCerts = await storage.getCertificationsByWorker(worker.id);
                const existingCert = existingCerts.find(c => c.courseId === cert.courseId);
                
                // Parse expiry date using European format
                let expiryDate = null;
                if (cert.expiryDate && cert.expiryDate !== 'null') {
                  expiryDate = parseEuropeanDate(cert.expiryDate);
                }
                
                const certData = {
                  workerId: worker.id,
                  courseId: cert.courseId,
                  name: cert.courseName,
                  certificateNumber: null,
                  issuedDate: new Date(),
                  expiryDate: expiryDate,
                  status: cert.status
                };
                
                if (existingCert) {
                  // Update existing certification with European date parsing
                  let updateExpiryDate = null;
                  if (cert.expiryDate && cert.expiryDate !== 'null') {
                    updateExpiryDate = parseEuropeanDate(cert.expiryDate);
                  }
                  
                  await storage.updateCertification(existingCert.id, {
                    expiryDate: updateExpiryDate,
                    status: cert.status
                  });
                } else {
                  // Create new certification
                  await storage.createCertification(certData);
                }
                certificationsCreated++;
              } catch (certError) {
                console.error(`Failed to create certification for worker ${worker.workersId}:`, certError);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to process worker:`, error);
        }
      }
      
      const importedCount = processedResults.length;
      const skippedCount = issues.length;
      
      res.json({ 
        message: `Successfully processed ${importedCount} workers and ${certificationsCreated} certifications (${skippedCount} invalid rows skipped)`,
        workers: processedResults,
        stats: {
          workersProcessed: importedCount,
          certificationsCreated,
          skipped: skippedCount,
          totalRows: data.length
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: "Failed to import Excel file", error: (error as Error).message });
    }
  });

  // CSV export route (virus-safe alternative)
  app.get("/api/export/workers-csv", async (req, res) => {
    try {
      const workers = await storage.getWorkersWithCertifications();
      
      // Create CSV headers
      const headers = [
        'Row',
        'Entity',
        'S/N',
        'Workers ID',
        'Name of Workers',
        'Designation',
        'Contact No.',
        'Nationality',
        'WP No.',
        'NRIC / Fin No',
        'Date of Expiry',
        'Date of Birth',
        'Total Certifications',
        'Active Certifications',
        'Expiring Certifications',
        'Expired Certifications'
      ];
      
      // Create CSV data
      const csvData = workers.map((worker, index) => [
        index + 1,
        worker.entity || '',
        worker.serialNumber || '',
        worker.workersId,
        worker.nameOfWorkers,
        worker.designation || '',
        worker.contactNo || '',
        worker.nationality || '',
        worker.wpNo || '',
        worker.nricFinNo || '',
        worker.dateOfExpiry ? new Date(worker.dateOfExpiry).toLocaleDateString('en-GB') : '',
        worker.dateOfBirth ? new Date(worker.dateOfBirth).toLocaleDateString('en-GB') : '',
        worker.certifications.length,
        worker.certifications.filter(c => c.status === 'active').length,
        worker.certifications.filter(c => c.status === 'expiring_soon').length,
        worker.certifications.filter(c => c.status === 'expired').length
      ]);
      
      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Use simple, standard filename
      const filename = 'worker_list.csv';
      
      // Add BOM for text file recognition and use plain text type
      const csvWithBOM = '\uFEFF' + csvContent;
      
      // Set minimal, standard headers
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(csvWithBOM);
    } catch (error) {
      console.error('CSV Export error:', error);
      res.status(500).json({ message: "Failed to export CSV data" });
    }
  });

  // Excel export route  
  app.get("/api/export/workers", async (req, res) => {
    try {
      const workers = await storage.getWorkersWithCertifications();
      
      // Create a clean, standard Excel structure
      const exportData = workers.map((worker, index) => ({
        'Row': index + 1,
        'Entity': worker.entity || '',
        'S/N': worker.serialNumber || '',
        'Workers ID': worker.workersId,
        'Name of Workers': worker.nameOfWorkers,
        'Designation': worker.designation || '',
        'Contact No.': worker.contactNo || '',
        'Nationality': worker.nationality || '',
        'WP No.': worker.wpNo || '',
        'NRIC / Fin No': worker.nricFinNo || '',
        'Date of Expiry': worker.dateOfExpiry ? new Date(worker.dateOfExpiry).toLocaleDateString('en-GB') : '',
        'Date of Birth': worker.dateOfBirth ? new Date(worker.dateOfBirth).toLocaleDateString('en-GB') : '',
        'Total Certifications': worker.certifications.length,
        'Active Certifications': worker.certifications.filter(c => c.status === 'active').length,
        'Expiring Certifications': worker.certifications.filter(c => c.status === 'expiring_soon').length,
        'Expired Certifications': worker.certifications.filter(c => c.status === 'expired').length,
      }));

      // Create worksheet with proper formatting
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 5 },   // Row
        { wch: 15 },  // Entity
        { wch: 8 },   // S/N
        { wch: 12 },  // Workers ID
        { wch: 25 },  // Name
        { wch: 15 },  // Designation
        { wch: 15 },  // Contact
        { wch: 12 },  // Nationality
        { wch: 12 },  // WP No
        { wch: 15 },  // NRIC
        { wch: 12 },  // Expiry
        { wch: 12 },  // Birth
        { wch: 10 },  // Total
        { wch: 10 },  // Active
        { wch: 10 },  // Expiring
        { wch: 10 }   // Expired
      ];
      worksheet['!cols'] = colWidths;

      // Create workbook with proper metadata
      const workbook = XLSX.utils.book_new();
      
      // Add standard Excel properties to avoid virus detection
      workbook.Props = {
        Title: "Worker Management System Export",
        Subject: "Employee Data Export",
        Author: "Worker Management System",
        Manager: "System Administrator",
        Company: "WorkerPro",
        Category: "Data Export",
        Keywords: "workers, employees, certifications, data",
        Comments: "Generated worker data export from WorkerPro system",
        LastAuthor: "WorkerPro System",
        CreatedDate: new Date()
      };
      
      // Add the worksheet
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Worker Data');
      
      // Add a summary sheet
      const summaryData = [
        { Field: 'Export Date', Value: new Date().toLocaleDateString('en-GB') },
        { Field: 'Export Time', Value: new Date().toLocaleTimeString() },
        { Field: 'Total Workers', Value: workers.length },
        { Field: 'Total Certifications', Value: workers.reduce((sum, w) => sum + w.certifications.length, 0) },
        { Field: 'Active Certifications', Value: workers.reduce((sum, w) => sum + w.certifications.filter(c => c.status === 'active').length, 0) },
        { Field: 'System', Value: 'WorkerPro Management System' },
        { Field: 'Export Format', Value: 'Microsoft Excel (.xlsx)' }
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Info');

      // Write with proper options to create a standard Excel file
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true,
        Props: workbook.Props
      });

      // Generate clean filename without special characters
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      const filename = `WorkerData_${dateStr}_${timeStr}.xlsx`;

      // Set proper MIME type and headers for Excel files
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '-1');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Send the buffer
      res.end(buffer);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export workers data" });
    }
  });

  // Statistics route
  app.get("/api/stats", async (req, res) => {
    try {
      const workers = await storage.getAllWorkers();
      const courses = await storage.getAllCourses();
      const certifications = await storage.getAllCertifications();

      // Calculate certification expiry statistics
      const now = new Date();
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setDate(now.getDate() + 60);
      
      // Properly categorize certifications by expiry status
      let expiringSoonCount = 0;
      let expiredCount = 0;
      
      certifications.forEach(cert => {
        if (cert.expiryDate) {
          const expiryDate = new Date(cert.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            expiredCount++;
          } else if (daysUntilExpiry <= 60) {
            expiringSoonCount++;
          }
        }
      });
      
      // Calculate work permit expiry statistics (60 days for expiring soon)
      const permitExpiringSoon = workers.filter(worker => 
        worker.dateOfExpiry && 
        new Date(worker.dateOfExpiry) > now && 
        new Date(worker.dateOfExpiry) <= twoMonthsFromNow
      ).length;
      
      const permitExpired = workers.filter(worker => 
        worker.dateOfExpiry && 
        new Date(worker.dateOfExpiry) <= now
      ).length;

      const stats = {
        totalWorkers: workers.length,
        activeCourses: courses.length,
        totalCertifications: certifications.length,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
        permitExpiringSoon,
        permitExpired,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
