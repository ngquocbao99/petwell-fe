import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicalIcon,
  Pets as PetIcon,
  CalendarToday as CalendarIcon,
  Person as DoctorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Axios from '../utils/Axios';

interface Prescription {
  _id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  age: number;
  medications: string | Array<{
    name: string;
    dosage: string;
    duration: string;
    note?: string;
  }>;
  instructions: string;
  medicalHistory?: string;
  imageUrl?: string;
  healthCondition?: string;
  diagnosis?: string;
  treatment?: string;
  testResults?: string[] | string;
  treatmentRecommendations?: string;
  reExaminationDate?: string;
  diagnosedAt?: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentType?: string;
  isDepositPaid?: boolean;
  isFullyPaid?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pet {
  _id: string;
  petName: string;
  species: string;
  breed: string;
}

const MedicalRecord: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  const user = useSelector((state: RootState) => state.user);

  // Fetch user's pets
  const fetchPets = async () => {
    try {
      const response = await Axios({
        url: `/api/v1/pets/view-all-pet-customer?userId=${user.userId}`,
        method: "get",
      });
      
      if (response.data.success) {
        setPets(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
    }
  };

  const fetchPrescriptions = async (petId: string) => {
    if (!petId || !user.userId) {
      setPrescriptions([]);
      return;
    }

    setLoading(true);
    try {
      // Try production API first
      let response = await Axios({
        url: `/api/v1/prescriptions/customer/${user.userId}`,
        method: 'get',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (response.data.success && response.data.data?.length > 0) {
        // Filter prescriptions for the selected pet
        const allPrescriptions = response.data.data || [];
        const petPrescriptions = allPrescriptions.filter((prescription: Prescription) => 
          prescription.petName === pets.find(p => p._id === petId)?.petName
        );
        setPrescriptions(petPrescriptions);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load medical records');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.userId) {
      fetchPets();
    }
  }, [user.userId]);

  useEffect(() => {
    if (selectedPetId) {
      fetchPrescriptions(selectedPetId);
    }
  }, [selectedPetId]);

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailDialogOpen(true);
  };

  const handleDownloadPDF = async (prescription: Prescription) => {
    setDownloadingId(prescription._id);
    try {
      toast.loading('Generating and downloading prescription...', { id: 'download-pdf' });
      
      console.log('Downloading PDF for appointment:', prescription.appointmentId);
      
      const response = await Axios({
        url: `/api/v1/prescriptions/${prescription.appointmentId}/download`,
        method: 'get',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        responseType: 'blob', // Important for file downloads
      });

      console.log('PDF response received, creating download link...');

      // Check if the response is actually a PDF
      if (response.data.type === 'application/json') {
        // If we get JSON back, it means there was an error
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        console.error('PDF generation failed:', errorData);
        toast.error(`PDF generation failed: ${errorData.message}`, { id: 'download-pdf' });
        return;
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename with safe characters
      const safePetName = prescription.petName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `prescription-${safePetName}-${format(new Date(prescription.createdAt), 'yyyy-MM-dd')}.pdf`;
      link.setAttribute('download', filename);
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
      toast.success('Prescription downloaded successfully', { id: 'download-pdf' });
    } catch (error: any) {
      console.error('Error downloading prescription:', error);
      
      let errorMessage = 'Unable to download prescription. Please try again.';
      
      if (error.response?.data) {
        try {
          // Try to parse error response
          const errorData = error.response.data;
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'download-pdf' });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <MedicalIcon color="primary" />
        Medical History
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select a pet to view medical records
          </Typography>
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          >
            <option value="">Select a pet</option>
            {pets.map((pet) => (
              <option key={pet._id} value={pet._id}>
                {pet.petName} - {pet.species} ({pet.breed})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedPetId && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Medical Records
            </Typography>
            
            {loading ? (
              <Typography>Loading medical records...</Typography>
            ) : prescriptions.length === 0 ? (
              <Typography color="text.secondary">
                No medical records found for this pet.
              </Typography>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Pet</TableCell>
                      <TableCell>Diagnosis</TableCell>
                      <TableCell>Medications</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptions.map((prescription) => (
                      <TableRow key={prescription._id} hover>
                        <TableCell>
                          {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {prescription.doctorName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {prescription.petName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {prescription.petSpecies} - {prescription.petBreed}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {prescription.diagnosis || 'No diagnosis'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {prescription.healthCondition || 'No condition noted'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {prescription.medications ? 
                              (typeof prescription.medications === 'string' 
                                ? prescription.medications.substring(0, 50) + '...'
                                : prescription.medications.map(m => m.name).join(', ').substring(0, 50) + '...'
                              ) : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {prescription.totalAmount ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {prescription.totalAmount.toLocaleString('vi-VN')} VND
                              </Typography>
                              <Chip 
                                label={prescription.paymentMethod?.toUpperCase()} 
                                size="small" 
                                color={prescription.paymentMethod === 'cash' ? 'success' : 'primary'}
                              />
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not specified
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => handleViewDetails(prescription)}
                              color="primary"
                              size="small"
                              title="View Details"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDownloadPDF(prescription)}
                              color="secondary"
                              size="small"
                              title="Download Prescription PDF"
                              disabled={downloadingId === prescription._id}
                            >
                              {downloadingId === prescription._id ? (
                                <Box sx={{ width: 20, height: 20 }}>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </Box>
                              ) : (
                                <DownloadIcon />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescription Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Medical Record Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <Box sx={{ pt: 1 }}>
              {/* Prescription Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalIcon /> Prescription Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Typography variant="subtitle2" color="primary">Date:</Typography>
                        <Typography>
                          {format(new Date(selectedPrescription.createdAt), 'PPP')}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="primary">Doctor:</Typography>
                        <Typography>{selectedPrescription.doctorName}</Typography>
                      </Box>
                    </Box>
                    {selectedPrescription.healthCondition && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Health Condition:</Typography>
                        <Typography>{selectedPrescription.healthCondition}</Typography>
                      </Box>
                    )}
                    {selectedPrescription.diagnosis && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Diagnosis:</Typography>
                        <Typography>{selectedPrescription.diagnosis}</Typography>
                      </Box>
                    )}
                    {selectedPrescription.treatment && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Treatment:</Typography>
                        <Typography>{selectedPrescription.treatment}</Typography>
                      </Box>
                    )}
                    {selectedPrescription.testResults && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Test Results:</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                          {Array.isArray(selectedPrescription.testResults) 
                            ? selectedPrescription.testResults.join('\n') 
                            : selectedPrescription.testResults}
                        </Typography>
                      </Box>
                    )}
                    {selectedPrescription.treatmentRecommendations && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Treatment Recommendations:</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedPrescription.treatmentRecommendations}
                        </Typography>
                      </Box>
                    )}
                    {selectedPrescription.reExaminationDate && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Re-examination Date:</Typography>
                        <Typography>
                          {format(new Date(selectedPrescription.reExaminationDate), 'PPP')}
                        </Typography>
                      </Box>
                    )}
                    {selectedPrescription.diagnosedAt && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Diagnosed At:</Typography>
                        <Typography>
                          {format(new Date(selectedPrescription.diagnosedAt), 'PPP p')}
                        </Typography>
                      </Box>
                    )}
                    {selectedPrescription.totalAmount && (
                      <Box>
                        <Typography variant="subtitle2" color="primary">Total Amount:</Typography>
                        <Typography fontWeight="bold" color="success.main">
                          {selectedPrescription.totalAmount.toLocaleString('vi-VN')} VND
                        </Typography>
                      </Box>
                    )}
                    {selectedPrescription.paymentMethod && (
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box>
                          <Typography variant="subtitle2" color="primary">Payment Method:</Typography>
                          <Chip 
                            label={selectedPrescription.paymentMethod?.toUpperCase()} 
                            color={selectedPrescription.paymentMethod === 'cash' ? 'success' : 'primary'} 
                            size="small" 
                          />
                        </Box>
                        {selectedPrescription.paymentType && (
                          <Box>
                            <Typography variant="subtitle2" color="primary">Payment Type:</Typography>
                            <Chip 
                              label={selectedPrescription.paymentType === 'deposit' ? 'Deposit' : 'Full Payment'} 
                              color={selectedPrescription.paymentType === 'full' ? 'success' : 'warning'} 
                              size="small" 
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Pet Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PetIcon /> Pet Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                      <Typography variant="subtitle2" color="primary">Name:</Typography>
                      <Typography>{selectedPrescription.petName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="primary">Species:</Typography>
                      <Typography>{selectedPrescription.petSpecies}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="primary">Breed:</Typography>
                      <Typography>{selectedPrescription.petBreed}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="primary">Age:</Typography>
                      <Typography>{selectedPrescription.age} years</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Medications */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Medications Prescribed</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {typeof selectedPrescription.medications === 'string' ? (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          Medication Details
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedPrescription.medications || 'No medications prescribed'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : (
                    <Stack spacing={2}>
                      {selectedPrescription.medications?.map((medication, index) => (
                        <Card key={index} variant="outlined">
                          <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                              {medication.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              <Box sx={{ minWidth: '200px' }}>
                                <Typography variant="subtitle2">Dosage:</Typography>
                                <Typography variant="body2">{medication.dosage}</Typography>
                              </Box>
                              <Box sx={{ minWidth: '200px' }}>
                                <Typography variant="subtitle2">Duration:</Typography>
                                <Typography variant="body2">{medication.duration}</Typography>
                              </Box>
                              {medication.note && (
                                <Box sx={{ width: '100%' }}>
                                  <Typography variant="subtitle2">Note:</Typography>
                                  <Typography variant="body2">{medication.note}</Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      )) || (
                        <Typography>No medications prescribed</Typography>
                      )}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Instructions */}
              {selectedPrescription.instructions && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Instructions</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedPrescription.instructions}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Medical History */}
              {selectedPrescription.medicalHistory && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Medical History</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedPrescription.medicalHistory}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => selectedPrescription && handleDownloadPDF(selectedPrescription)}
            color="primary"
            variant="contained"
            startIcon={downloadingId === selectedPrescription?._id ? null : <DownloadIcon />}
            disabled={downloadingId === selectedPrescription?._id}
          >
            {downloadingId === selectedPrescription?._id ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecord;