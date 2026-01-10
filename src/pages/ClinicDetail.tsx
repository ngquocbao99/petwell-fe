import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Avatar,
  Paper,
  Button,
  Stack,
  Rating,
  Alert,
  Skeleton,
  Link,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Verified as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import SummaryApi from '@common/SummarryAPI';
import Axios from '@utils/Axios';
import toast from 'react-hot-toast';

interface Clinic {
  _id?: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  description?: string;
  image?: string;
  licenseNumber?: string;
  isVerified?: boolean;
  managerId?: string;
  doctors?: Array<{_id: string, fullName: string, email: string, role: string, avatar?: string}>;
  staff?: Array<{_id: string, fullName: string, email: string, role: string, avatar?: string}>;
  rating?: number;
  reviewCount?: number;
  isDeleted?: boolean;
  isblock?: boolean;
}

const ClinicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    const fetchClinic = async () => {
      setLoading(true);
      try {
        console.log(`Fetching clinic with ID: ${id}`);
        const res = await Axios({
          ...SummaryApi.clinic.detail,
          url: `${SummaryApi.clinic.detail.url}/${id}`
        });
        
        console.log('API Response:', res.data);
        
        // Handle array or single object response
        if (res.data && res.data.data) {
          let clinicData;
          if (Array.isArray(res.data.data)) {
            console.log('Response is array, using first item');
            clinicData = res.data.data[0] || null;
          } else {
            console.log('Response is object');
            clinicData = res.data.data;
          }
          
          // Check if clinic is blocked or deleted
          if (clinicData && (clinicData.isblock || clinicData.isDeleted)) {
            setError('This clinic is currently unavailable.');
          } else {
            setClinic(clinicData);
          }
        } else {
          console.error('Invalid response format:', res.data);
          setError('Clinic not found or has been deleted.');
        }
      } catch (err) {
        console.error('Error fetching clinic details:', err);
        setError('Unable to load clinic details');
        toast.error('Failed to load clinic details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchClinic();
    } else {
      setError('No clinic ID provided');
    }
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingSkeleton />
      </Container>
    );
  }

  if (error || !clinic) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Clinic not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clinic')}
          sx={{ ml: -1 }}
        >
          Back to Clinics
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */} 
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/clinic')}
        sx={{ ml: -1, mb: 3 }}
      >
        Back to Clinics
      </Button>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Left Column: Image and Basic Info */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 33.333%' } }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              height: '100%',
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            {/* Clinic Image */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              {clinic.image ? (
                <img
                  src={clinic.image}
                  alt={clinic.name}
                  style={{
                    width: '100%',
                    height: 240,
                    objectFit: 'cover',
                    borderRadius: 16,
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 240,
                    height: 240,
                    bgcolor: 'primary.main',
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 120 }} />
                </Avatar>
              )}
            </Box>

            {/* Basic Information */}
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Address
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon color="action" sx={{ mt: 0.5 }} />
                  <Typography>
                    {clinic.address}
                    {clinic.city && <Box component="span" sx={{ display: 'block' }}>{clinic.city}</Box>}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact
                </Typography>
                <Stack spacing={1}>
                  <Link 
                    href={`tel:${clinic.phone}`} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <PhoneIcon color="action" />
                    <Typography>{clinic.phone}</Typography>
                  </Link>
                  <Link 
                    href={`mailto:${clinic.email}`}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <EmailIcon color="action" />
                    <Typography>{clinic.email}</Typography>
                  </Link>
                </Stack>
              </Box>

              {clinic.rating !== undefined && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating
                      value={clinic.rating}
                      readOnly
                      precision={0.5}
                      icon={<StarIcon fontSize="inherit" />}
                      emptyIcon={<StarIcon fontSize="inherit" />}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({clinic.reviewCount || 0} reviews)
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Paper>
        </Box>

        {/* Right Column: Clinic Details */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 66.666%' } }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              height: '100%',
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight={700}>
                {clinic.name}
              </Typography>
              {clinic.isVerified && (
                <VerifiedIcon color="primary" sx={{ fontSize: 28 }} />
              )}
            </Box>

            {clinic.licenseNumber && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  License Number
                </Typography>
                <Typography variant="body1">{clinic.licenseNumber}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {clinic.description ? (
              <>
                <Typography variant="h6" gutterBottom>
                  About the Clinic
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}
                >
                  {clinic.description}
                </Typography>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No description available for this clinic
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              {!clinic.isblock && !clinic.isDeleted && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/book-appointment?clinicId=${clinic._id}`)}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 2,
                    backgroundColor: '#ff6b35',
                    '&:hover': {
                      backgroundColor: '#ff5722',
                    }
                  }}
                >
                  Book Appointment
                </Button>
              )}
              {(clinic.isblock || clinic.isDeleted) && (
                <Alert severity="warning" sx={{ width: '100%' }}>
                  This clinic is currently unavailable for booking appointments.
                </Alert>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
    <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 33.333%' } }}>
      <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2, mb: 2 }} />
      <Stack spacing={2}>
        <Skeleton variant="text" height={24} />
        <Skeleton variant="text" height={24} />
        <Skeleton variant="text" height={24} />
      </Stack>
    </Box>
    <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 66.666%' } }}>
      <Skeleton variant="text" height={48} sx={{ mb: 2 }} />
      <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
    </Box>
  </Box>
);

export default ClinicDetail;
