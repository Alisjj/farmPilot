import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Filter, 
  Plus, 
  Heart, 
  AlertTriangle, 
  Activity,
  Stethoscope,
  Pill,
  Calendar
} from "lucide-react";

export default function Health() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    recordType: "",
    flockSection: "",
    medicationType: "",
    dosage: "",
    administrationMethod: "",
    withdrawalPeriod: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    recordDate: new Date().toISOString().split('T')[0],
    followUpDate: "",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: healthRecords, isLoading: recordsLoading, error } = useQuery({
    queryKey: ["/api/health"],
    enabled: isAuthenticated,
  });

  const { data: healthAlerts } = useQuery({
    queryKey: ["/api/health/alerts"],
    enabled: isAuthenticated,
  });

  const { data: productionData } = useQuery({
    queryKey: ["/api/production"],
    enabled: isAuthenticated,
  });

  const addRecordMutation = useMutation({
    mutationFn: async (recordData: any) => {
      await apiRequest("POST", "/api/health", recordData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Health record added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
      setIsAddDialogOpen(false);
      setNewRecord({
        recordType: "",
        flockSection: "",
        medicationType: "",
        dosage: "",
        administrationMethod: "",
        withdrawalPeriod: "",
        symptoms: "",
        diagnosis: "",
        treatment: "",
        recordDate: new Date().toISOString().split('T')[0],
        followUpDate: "",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add health record",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || recordsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading health records...</p>
        </div>
      </div>
    );
  }

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'medication': return 'bg-primary/10 text-primary';
      case 'vaccination': return 'bg-success/10 text-success';
      case 'treatment': return 'bg-warning/10 text-warning';
      case 'observation': return 'bg-secondary/10 text-secondary';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredRecords = (Array.isArray(healthRecords) ? healthRecords : []).filter((record: any) => {
    const matchesSearch = searchTerm === "" || 
      record.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.medicationType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.flockSection?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || record.recordType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleAddRecord = () => {
    if (!newRecord.recordType || !newRecord.recordDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addRecordMutation.mutate({
      ...newRecord,
      withdrawalPeriod: newRecord.withdrawalPeriod ? parseInt(newRecord.withdrawalPeriod) : null,
      followUpDate: newRecord.followUpDate || null,
    });
  };

  // Calculate health metrics
  const productionArray = Array.isArray(productionData) ? productionData : [];
  const healthRecordsArray = Array.isArray(healthRecords) ? healthRecords : [];
  const healthAlertsArray = Array.isArray(healthAlerts) ? healthAlerts : [];
  
  const totalMortality = productionArray.reduce((sum: number, p: any) => sum + (p.mortality || 0), 0);
  const avgMortalityRate = productionArray.length ? (totalMortality / productionArray.length).toFixed(1) : 0;
  const medicationRecords = healthRecordsArray.filter((r: any) => r.recordType === 'medication').length;
  const activeAlerts = healthAlertsArray.length;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 ml-0">
        <TopHeader 
          title="Health & Veterinary Management" 
          subtitle="Monitor flock health, track treatments, and maintain veterinary records"
        />
        
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
          {/* Health Alerts */}
          {activeAlerts > 0 && (
            <Alert className="bg-accent/10 border-accent/20">
              <AlertTriangle className="h-4 w-4 text-accent" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="text-accent font-medium">Health Alerts</p>
                  <p className="text-sm text-slate-600">
                    {activeAlerts} health alert{activeAlerts > 1 ? 's' : ''} require attention.
                  </p>
                </div>
                <Button size="sm" className="bg-accent hover:bg-accent/90">
                  View Alerts
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Health Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Heart className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {avgMortalityRate}%
                    </h3>
                    <p className="text-slate-600">Avg Mortality Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Stethoscope className="h-8 w-8 text-success" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {healthRecordsArray.length}
                    </h3>
                    <p className="text-slate-600">Health Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Pill className="h-8 w-8 text-warning" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {medicationRecords}
                    </h3>
                    <p className="text-slate-600">Medication Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Activity className="h-8 w-8 text-accent" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {activeAlerts}
                    </h3>
                    <p className="text-slate-600">Active Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Health Records</span>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      New Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Health Record</DialogTitle>
                      <DialogDescription>
                        Record health observations, treatments, or medical interventions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recordType">Record Type *</Label>
                        <Select value={newRecord.recordType} onValueChange={(value) => setNewRecord({ ...newRecord, recordType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="vaccination">Vaccination</SelectItem>
                            <SelectItem value="treatment">Treatment</SelectItem>
                            <SelectItem value="observation">Observation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="flockSection">Flock Section</Label>
                        <Input
                          id="flockSection"
                          value={newRecord.flockSection}
                          onChange={(e) => setNewRecord({ ...newRecord, flockSection: e.target.value })}
                          placeholder="Section A, B, C, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="recordDate">Record Date *</Label>
                        <Input
                          id="recordDate"
                          type="date"
                          value={newRecord.recordDate}
                          onChange={(e) => setNewRecord({ ...newRecord, recordDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="followUpDate">Follow-up Date</Label>
                        <Input
                          id="followUpDate"
                          type="date"
                          value={newRecord.followUpDate}
                          onChange={(e) => setNewRecord({ ...newRecord, followUpDate: e.target.value })}
                        />
                      </div>
                      {newRecord.recordType === 'medication' && (
                        <>
                          <div>
                            <Label htmlFor="medicationType">Medication Type</Label>
                            <Input
                              id="medicationType"
                              value={newRecord.medicationType}
                              onChange={(e) => setNewRecord({ ...newRecord, medicationType: e.target.value })}
                              placeholder="Antibiotic, Vitamin, etc."
                            />
                          </div>
                          <div>
                            <Label htmlFor="dosage">Dosage</Label>
                            <Input
                              id="dosage"
                              value={newRecord.dosage}
                              onChange={(e) => setNewRecord({ ...newRecord, dosage: e.target.value })}
                              placeholder="10mg per bird"
                            />
                          </div>
                          <div>
                            <Label htmlFor="administrationMethod">Administration Method</Label>
                            <Select value={newRecord.administrationMethod} onValueChange={(value) => setNewRecord({ ...newRecord, administrationMethod: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oral">Oral</SelectItem>
                                <SelectItem value="injection">Injection</SelectItem>
                                <SelectItem value="water">Water</SelectItem>
                                <SelectItem value="feed">Feed</SelectItem>
                                <SelectItem value="spray">Spray</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="withdrawalPeriod">Withdrawal Period (days)</Label>
                            <Input
                              id="withdrawalPeriod"
                              type="number"
                              value={newRecord.withdrawalPeriod}
                              onChange={(e) => setNewRecord({ ...newRecord, withdrawalPeriod: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <Label htmlFor="symptoms">Symptoms/Observations</Label>
                        <Textarea
                          id="symptoms"
                          value={newRecord.symptoms}
                          onChange={(e) => setNewRecord({ ...newRecord, symptoms: e.target.value })}
                          placeholder="Describe observed symptoms or conditions..."
                          rows={3}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Textarea
                          id="diagnosis"
                          value={newRecord.diagnosis}
                          onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                          placeholder="Veterinary diagnosis or assessment..."
                          rows={2}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="treatment">Treatment Plan</Label>
                        <Textarea
                          id="treatment"
                          value={newRecord.treatment}
                          onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                          placeholder="Treatment protocol and instructions..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddRecord}
                        disabled={addRecordMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {addRecordMutation.isPending ? "Adding..." : "Add Record"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search health records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Flock Section</TableHead>
                      <TableHead>Medication/Treatment</TableHead>
                      <TableHead>Symptoms</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Follow-up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-slate-500">
                            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No health records found</p>
                            <p className="text-sm">Try adjusting your filters or add a new record</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.recordDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRecordTypeColor(record.recordType)}>
                              {record.recordType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.flockSection || '-'}</TableCell>
                          <TableCell>
                            {record.medicationType || record.treatment?.substring(0, 30) + '...' || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {record.symptoms?.substring(0, 50) + '...' || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {record.diagnosis?.substring(0, 50) + '...' || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {record.followUpDate ? (
                              <div className="flex items-center text-sm">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(record.followUpDate).toLocaleDateString()}
                              </div>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
