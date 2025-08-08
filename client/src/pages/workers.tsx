import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WorkerWithCertifications } from "@shared/schema";
import WorkerModal from "@/components/worker-modal";
import WorkerForm from "@/components/worker-form";
import { useLocation } from "wouter";

const Workers = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithCertifications | null>(null);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [sortField, setSortField] = useState<'nameOfWorkers' | 'designation' | 'nationality' | 'contactNo' | 'nricFinNo' | 'workersId' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [location, setLocation] = useLocation();

  // Check if import parameter is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('import') === 'true') {
      setShowWorkerForm(true);
      // Clean up URL
      setLocation('/workers');
    }
  }, [setLocation]);

  const { data: workers = [], isLoading } = useQuery<WorkerWithCertifications[]>({
    queryKey: ['/api/workers'],
  });

  const handleSort = (field: 'nameOfWorkers' | 'designation' | 'nationality' | 'contactNo' | 'nricFinNo' | 'workersId') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'nameOfWorkers' | 'designation' | 'nationality' | 'contactNo' | 'nricFinNo' | 'workersId') => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-4 w-4 text-primary" />
      : <ArrowDown className="ml-1 h-4 w-4 text-primary" />;
  };

  const filteredWorkers = useMemo(() => {
    let filtered = workers.filter((worker: WorkerWithCertifications) =>
      worker.nameOfWorkers.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.workersId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.contactNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.nationality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.nricFinNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle different data types and null values
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [workers, searchQuery, sortField, sortDirection]);

  const getStatusBadge = (certifications: any[]) => {
    const hasExpired = certifications.some(c => c.status === 'expired');
    const hasExpiring = certifications.some(c => c.status === 'expiring_soon');
    
    if (hasExpired) return <Badge variant="destructive">Has Expired</Badge>;
    if (hasExpiring) return <Badge variant="secondary" className="bg-accent text-black">Expiring Soon</Badge>;
    return <Badge variant="default" className="bg-secondary">All Current</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Workers</h2>
              <p className="text-sm text-gray-600">Manage employee profiles and information</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search workers..."
                  className="w-64 pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button onClick={() => setShowWorkerForm(true)} className="bg-primary hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>All Workers ({filteredWorkers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('nameOfWorkers')}
                    >
                      <div className="flex items-center">
                        Worker
                        {getSortIcon('nameOfWorkers')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('designation')}
                    >
                      <div className="flex items-center">
                        Designation
                        {getSortIcon('designation')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('nationality')}
                    >
                      <div className="flex items-center">
                        Nationality
                        {getSortIcon('nationality')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('contactNo')}
                    >
                      <div className="flex items-center">
                        Contact / WP No.
                        {getSortIcon('contactNo')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('nricFinNo')}
                    >
                      <div className="flex items-center">
                        NRIC/Fin
                        {getSortIcon('nricFinNo')}
                      </div>
                    </TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker: WorkerWithCertifications) => (
                    <TableRow 
                      key={worker.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {worker.nameOfWorkers.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{worker.nameOfWorkers}</p>
                            <p className="text-sm text-gray-500">ID: {worker.workersId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">{worker.designation || 'Not specified'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">{worker.nationality || 'Not specified'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900">{worker.contactNo || 'No contact'}</div>
                          <div className="text-gray-500">{worker.wpNo || 'No WP No.'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 font-mono text-xs">{worker.nricFinNo || 'Not provided'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{worker.certifications.length}</span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorker(worker);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredWorkers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No workers found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {selectedWorker && (
        <WorkerModal
          worker={selectedWorker}
          isOpen={!!selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onEditWorker={(worker) => {
            setSelectedWorker(null);
            toast({
              title: "Edit Worker",
              description: "Worker editing functionality will be available in a future update.",
            });
          }}
          onAddCertification={(workerId) => {
            setSelectedWorker(null);
            toast({
              title: "Add Certification",
              description: "Add certification functionality will be available in a future update.",
            });
          }}
        />
      )}

      <WorkerForm 
        isOpen={showWorkerForm}
        onClose={() => setShowWorkerForm(false)}
      />
    </>
  );
};

export default Workers;
