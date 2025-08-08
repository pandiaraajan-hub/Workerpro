import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, AlertTriangle, Printer, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo } from "react";

const Certifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'certificateNumber' | 'workerId' | 'issuedDate' | 'expiryDate' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: certifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/certifications'],
  });

  const { data: expiring = [] } = useQuery<any[]>({
    queryKey: ['/api/certifications/expiring/60'],
  });

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ['/api/workers'],
  });

  const getWorkerName = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.nameOfWorkers : `Worker #${workerId.slice(0, 8)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-secondary">Active</Badge>;
      case 'expiring_soon':
        return <Badge variant="secondary" className="bg-accent text-black">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSort = (field: 'name' | 'certificateNumber' | 'workerId' | 'issuedDate' | 'expiryDate' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'certificateNumber' | 'workerId' | 'issuedDate' | 'expiryDate' | 'status') => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-4 w-4 text-primary" />
      : <ArrowDown className="ml-1 h-4 w-4 text-primary" />;
  };

  const filteredCertifications = useMemo(() => {
    let filtered = certifications;
    
    // Apply status filter
    if (selectedFilter && selectedFilter !== 'total') {
      filtered = filtered.filter((cert: any) => cert.status === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((cert: any) => 
        cert.name.toLowerCase().includes(query) ||
        cert.certificateNumber?.toLowerCase().includes(query) ||
        cert.workerId.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle different data types
        if (sortField === 'name' || sortField === 'certificateNumber' || sortField === 'workerId' || sortField === 'status') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        } else if (sortField === 'issuedDate' || sortField === 'expiryDate') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [certifications, selectedFilter, searchQuery, sortField, sortDirection]);

  const handlePrint = () => {
    const filterTitle = selectedFilter 
      ? selectedFilter === 'total' 
        ? 'All Certifications'
        : selectedFilter === 'active' 
          ? 'Active Certifications'
          : selectedFilter === 'expiring_soon' 
            ? 'Expiring Soon Certifications'
            : 'Expired Certifications'
      : 'All Certifications';
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${filterTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-date { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${filterTitle}</h1>
          <div class="print-date">Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}</div>
          <div>Total Records: ${filteredCertifications.length}</div>
          <table>
            <thead>
              <tr>
                <th>Certification</th>
                <th>Certificate No.</th>
                <th>Worker ID</th>
                <th>Issued Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCertifications.map((cert: any) => `
                <tr>
                  <td>${cert.name}</td>
                  <td>${cert.certificateNumber || 'N/A'}</td>
                  <td>${cert.workerId.slice(0, 8)}</td>
                  <td>${cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('en-GB') : 'Not set'}</td>
                  <td>${cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-GB') : 'No expiry'}</td>
                  <td>${cert.status.charAt(0).toUpperCase() + cert.status.slice(1).replace('_', ' ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
            <p className="text-sm text-gray-600">Track and manage worker certifications</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search certifications..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <Button className="bg-primary hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Certification
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedFilter === 'total' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedFilter(selectedFilter === 'total' ? null : 'total')}
          >
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-900">{certifications.length}</div>
              <p className="text-sm text-gray-600">Total Certifications</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedFilter === 'active' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
            onClick={() => setSelectedFilter(selectedFilter === 'active' ? null : 'active')}
          >
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-secondary">
                {certifications.filter((c: any) => c.status === 'active').length}
              </div>
              <p className="text-sm text-gray-600">Active</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedFilter === 'expiring_soon' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
            }`}
            onClick={() => setSelectedFilter(selectedFilter === 'expiring_soon' ? null : 'expiring_soon')}
          >
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-accent">
                {certifications.filter((c: any) => c.status === 'expiring_soon').length}
              </div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedFilter === 'expired' ? 'ring-2 ring-red-500 bg-red-50' : ''
            }`}
            onClick={() => setSelectedFilter(selectedFilter === 'expired' ? null : 'expired')}
          >
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-destructive">
                {certifications.filter((c: any) => c.status === 'expired').length}
              </div>
              <p className="text-sm text-gray-600">Expired</p>
            </CardContent>
          </Card>
        </div>

        {/* Certifications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedFilter 
                  ? selectedFilter === 'total' 
                    ? 'All Certifications'
                    : selectedFilter === 'active' 
                      ? 'Active Certifications'
                      : selectedFilter === 'expiring_soon' 
                        ? 'Expiring Soon Certifications'
                        : 'Expired Certifications'
                  : 'All Certifications'} ({filteredCertifications.length})
              </CardTitle>
              {selectedFilter && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="flex items-center space-x-1"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFilter(null)}
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Certification
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('certificateNumber')}
                  >
                    <div className="flex items-center">
                      Certificate No.
                      {getSortIcon('certificateNumber')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('workerId')}
                  >
                    <div className="flex items-center">
                      Worker
                      {getSortIcon('workerId')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('issuedDate')}
                  >
                    <div className="flex items-center">
                      Issued Date
                      {getSortIcon('issuedDate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('expiryDate')}
                  >
                    <div className="flex items-center">
                      Expiry Date
                      {getSortIcon('expiryDate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertifications.map((cert: any) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="font-medium">{cert.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{cert.certificateNumber || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900">{getWorkerName(cert.workerId)}</div>
                    </TableCell>
                    <TableCell>
                      {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('en-GB') : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-GB') : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cert.status)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredCertifications.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {selectedFilter 
                    ? `No ${selectedFilter === 'total' ? '' : selectedFilter.replace('_', ' ')} certifications found.`
                    : 'No certifications found.'}
                </p>
                {selectedFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFilter(null)}
                    className="mt-2"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Certifications;
