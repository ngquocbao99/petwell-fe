import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummarryAPI';
import { Prescription, Medication } from '../types/prescription';
import { 
  Container, 
  Typography, 
  Paper, 
  Button,
  CircularProgress,
  Box,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  FaDownload, 
  FaMedkit, 
  FaCalendarAlt, 
  FaUserMd,
  FaPaw 
} from 'react-icons/fa';
import dayjs from 'dayjs';
import { styled } from '@mui/system';
import { toast } from 'react-hot-toast';

// Styled components
const PrescriptionCard = styled(Card)(({ theme }) => ({
  marginBottom: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.05)',
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: '25px',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
  },
}));

interface PrescriptionWithPetDetails extends Prescription {
  // All fields are already included in Prescription interface
}

// Define as a normal React component
const PrescriptionsPage = () => {
  console.log('🏥 PrescriptionsPage component mounting...');
  
  const user = useSelector((state: any) => state.user);
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPetDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  console.log('🔍 Component state - User:', user);
  console.log('🔍 Component state - Loading:', loading);
  console.log('🔍 Component state - Error:', error);
  console.log('🔍 Component state - Prescriptions count:', prescriptions.length);

  // Fetch prescriptions for the logged-in customer
  useEffect(() => {
    const fetchPrescriptions = async () => {
      console.log('=== PRESCRIPTIONS PAGE DEBUG ===');
      console.log('User object:', user);
      console.log('User ID:', user?._id || user?.id);
      
      if (!user?.id && !user?._id) {
        console.log('No user found - checking localStorage...');
        
        // Try to get user from localStorage as fallback
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log('Found user in localStorage:', parsedUser);
            // Use the stored user for API call
            if (parsedUser._id || parsedUser.id) {
              await makeApiCall(parsedUser);
              return;
            }
          }
        } catch (err) {
          console.error('Error parsing stored user:', err);
        }
        
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      await makeApiCall(user);
    };

    const makeApiCall = async (userObj: any) => {
      try {
        setLoading(true);
        setError(null);
        
        const userId = userObj._id || userObj.id;
        const apiUrl = `${SummaryApi.baseUrl}/api/v1/prescriptions/customer/${userId}`;
        console.log('Making API call to:', apiUrl);
        
        const token = localStorage.getItem('token');
        console.log('Using token:', token ? 'Token found' : 'No token');
        
        const response = await Axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
          }
        });
        
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        
        if (response.data?.success && response.data?.data) {
          console.log('Setting prescriptions:', response.data.data);
          setPrescriptions(response.data.data);
        } else if (response.data?.data) {
          // Some APIs don't have success field
          console.log('Setting prescriptions (no success field):', response.data.data);
          setPrescriptions(response.data.data);
        } else {
          console.log('No prescription data found');
          setPrescriptions([]);
        }
      } catch (err: any) {
        console.error('API Error:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.message || err.message || 'Failed to fetch prescriptions');
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user || localStorage.getItem('user')) {
      fetchPrescriptions();
    } else {
      console.log('No user available anywhere');
      setError('Please log in to view prescriptions');
      setLoading(false);
    }
  }, [user]);

  // Function to download prescription PDF
  const handleDownload = useCallback(async (prescriptionId: string) => {
    try {
      setDownloadingId(prescriptionId);
      
      const downloadUrl = `${SummaryApi.baseUrl}/api/v1/prescriptions/${prescriptionId}/download`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await Axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        }
      });
      
      // Create and download the file
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowSuccessMessage(true);
      toast.success('Prescription downloaded successfully');
      
    } catch (err: any) {
      console.error('Error downloading prescription:', err);
      toast.error('Failed to download prescription');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Close success message
  const handleCloseSuccessMessage = useCallback(() => {
    setShowSuccessMessage(false);
  }, []);

  // Format date helper function
  const formatDate = useCallback((dateString: string) => {
    return dayjs(dateString).format('MMM D, YYYY');
  }, []);

  // Format medications helper function
  const formatMedications = useCallback((medications: string | Medication[]) => {
    if (typeof medications === 'string') {
      return medications;
    }
    
    if (Array.isArray(medications) && medications.length > 0) {
      return medications.map((med, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {med.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Dosage: {med.dosage} | Duration: {med.duration}
          </Typography>
        </Box>
      ));
    }
    
    return 'No medications specified';
  }, []);

  // Render loading state
  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading prescriptions...
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.disabled' }}>
            User: {user?._id || user?.id || 'Checking...'} | API: {SummaryApi.baseUrl}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>Error Loading Prescriptions</Typography>
          <Typography variant="body2">{error}</Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Debug info: User ID = {user?._id || user?.id || 'Not found'} | 
            Token = {localStorage.getItem('token') ? 'Available' : 'Missing'}
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Render empty state
  if (prescriptions.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FaMedkit size={48} style={{ color: '#9e9e9e', marginBottom: '16px' }} />
          <Typography variant="h6" gutterBottom>No Prescriptions Found</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            You don't have any prescriptions available yet.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Prescriptions will appear here after your vet appointments.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Main render
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 4, 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          color: 'primary.main'
        }}
      >
        <FaMedkit style={{ marginRight: '12px' }} /> 
        Pet Prescriptions
        <Chip 
          label={prescriptions.length} 
          color="primary" 
          size="small" 
          sx={{ ml: 2 }}
        />
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {prescriptions.map((prescription, index) => (
          <PrescriptionCard key={prescription._id}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Left Content */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'primary.main'
                    }}>
                      <FaPaw style={{ marginRight: '8px' }} />
                      {prescription.petName || 'Pet Name Not Available'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Typography variant="body2" sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <FaUserMd style={{ marginRight: '6px' }} />
                        Dr. {prescription.doctorName || 'Not specified'}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <FaCalendarAlt style={{ marginRight: '6px' }} />
                        {formatDate(prescription.createdAt || new Date().toISOString())}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      color: 'primary.main'
                    }}>
                      💊 Medications:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ 
                        lineHeight: 1.6
                      }}>
                        {formatMedications(prescription.medications)}
                      </Box>
                    </Paper>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      color: 'primary.main'
                    }}>
                      📋 Instructions:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6
                      }}>
                        {prescription.instructions || 'No specific instructions'}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
                
                {/* Right Actions */}
                <Box sx={{ 
                  width: { xs: '100%', md: '220px' }, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 2
                }}>
                  <DownloadButton
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={
                      downloadingId === prescription._id ? 
                        <CircularProgress size={20} color="inherit" /> : 
                        <FaDownload />
                    }
                    onClick={() => handleDownload(prescription._id)}
                    disabled={downloadingId === prescription._id}
                    sx={{ 
                      width: '100%',
                      height: 48,
                      fontWeight: 'bold'
                    }}
                  >
                    {downloadingId === prescription._id ? 'Downloading...' : 'Download PDF'}
                  </DownloadButton>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    <Chip 
                      label={`Age: ${prescription.age || 'N/A'} years`}
                      color="secondary"
                      variant="outlined"
                      sx={{ width: '100%' }}
                    />
                    
                    {prescription.petSpecies && (
                      <Chip
                        label={`${prescription.petSpecies}${prescription.petBreed ? ` - ${prescription.petBreed}` : ''}`}
                        color="default"
                        variant="outlined"
                        sx={{ width: '100%' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </PrescriptionCard>
        ))}
      </Box>

      <Snackbar 
        open={showSuccessMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSuccessMessage} 
          severity="success" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          Prescription downloaded successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Standard export
export default PrescriptionsPage;
