import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface ExcelImportProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExcelImport = ({ isOpen, onClose }: ExcelImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "Failed to import Excel file. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadProgress(0);
    onClose();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Import Excel File</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* File Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={triggerFileSelect}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-primary text-xl" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {file ? file.name : "Select Excel File"}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Upload .xlsx or .xls file with worker information
                </p>
                <Button 
                  variant="outline" 
                  onClick={triggerFileSelect}
                  disabled={importMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Expected Format */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Expected Excel Format</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Your Excel file should contain the following columns:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Employee ID (required)</li>
                  <li>Name (required)</li>
                  <li>Email</li>
                  <li>Phone</li>
                  <li>Position</li>
                  <li>Department</li>
                  <li>Start Date</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {importMutation.isPending && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-600">Importing workers...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success/Error Messages */}
          {importMutation.isSuccess && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">Import completed successfully!</span>
                </div>
              </CardContent>
            </Card>
          )}

          {importMutation.isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-800">Import failed. Please check your file format.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || importMutation.isPending}
              className="bg-primary hover:bg-blue-700"
            >
              {importMutation.isPending ? "Importing..." : "Import Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;
