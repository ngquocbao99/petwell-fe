import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Container,
  Avatar,
  Stack,
  Paper,
  Button,
  Divider,
  Tooltip,
  Skeleton,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import SummaryApi from '@common/SummarryAPI';
import Axios from '@utils/Axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Rating } from '@mui/material';

interface Clinic {
  _id?: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  description?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isblock?: boolean;
  isDeleted?: boolean;
}

const ClinicPage: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Fetch all clinics
  const fetchClinics = async () => {
    try {
      const res = await Axios({ ...SummaryApi.clinic.list });
      const clinicData = res.data.data || [];
      // Filter out blocked and deleted clinics
      const activeClinic = clinicData.filter((clinic: Clinic) => 
        !clinic.isblock && !clinic.isDeleted
      );
      setClinics(activeClinic);
      setFilteredClinics(activeClinic);
    } catch {
      toast.error("Failed to fetch clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClinics(clinics);
    } else {
      const filtered = clinics.filter(clinic =>
        clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClinics(filtered);
    }
  }, [searchQuery, clinics]);

  // Loading skeleton component
  const ClinicSkeleton = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={24} />
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        
        <Typography
          variant="h3"
          align="center"
          color="primary"
          fontWeight={700}
          gutterBottom
          sx={{ mb: 2 }}
        >
          All Our Clinics
        </Typography>
        
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Find the perfect clinic for your pet's healthcare needs
        </Typography>

        {/* Search Bar */}
        <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search clinics by name, address, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Results count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {loading ? 'Loading...' : `${filteredClinics.length} clinic${filteredClinics.length !== 1 ? 's' : ''} found`}
          </Typography>
          {searchQuery && (
            <Chip
              label={`Searching: "${searchQuery}"`}
              onDelete={() => setSearchQuery('')}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Clinics Grid */}
      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {[...Array(6)].map((_, index) => (
            <ClinicSkeleton key={index} />
          ))}
        </Box>
      ) : filteredClinics.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {searchQuery ? 'No clinics found' : 'No clinics available'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Try adjusting your search terms or browse all clinics'
              : 'Please check back later for updates'
            }
          </Typography>
          {searchQuery && (
            <Button
              variant="outlined"
              onClick={() => setSearchQuery('')}
              sx={{ mt: 2 }}
            >
              Show All Clinics
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredClinics.map((clinic) => (
            <Card
              key={clinic._id}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 8,
                  transform: 'translateY(-8px)',
                },
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
              }}
              onClick={() => navigate(`/clinic/${clinic._id}`)}
            >
              {/* Clinic Image */}
              {clinic.image ? (
                <Box sx={{ height: 200, width: '100%', overflow: 'hidden' }}>
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLImageElement).style.transform = 'scale(1)';
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 200,
                    width: '100%',
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* Clinic Name and Verification */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                    {clinic.name}
                  </Typography>
                  {clinic.isVerified && (
                    <Chip
                      label="Verified"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Clinic Info */}
                <Stack spacing={1.5}>
                  {/* Address */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon color="action" sx={{ fontSize: 20, mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {clinic.address}
                      {clinic.city && `, ${clinic.city}`}
                    </Typography>
                  </Box>

                  {/* Phone */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" sx={{ fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {clinic.phone}
                    </Typography>
                  </Box>

                  {/* Description */}
                  {clinic.description && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <DescriptionIcon color="action" sx={{ fontSize: 20, mt: 0.2 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {clinic.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Rating and Reviews */}
                  {clinic.rating !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Rating
                        value={clinic.rating}
                        readOnly
                        precision={0.5}
                        icon={<StarIcon fontSize="inherit" />}
                        emptyIcon={<StarIcon fontSize="inherit" />}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({clinic.reviewCount || 0} reviews)
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Action Buttons */}
                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      navigate(`/clinic/${clinic._id}`);
                    }}
                    sx={{ 
                      flex: 1,
                      borderColor: '#ff6b35',
                      color: '#ff6b35',
                      '&:hover': {
                        borderColor: '#ff5722',
                        backgroundColor: 'rgba(255, 107, 53, 0.04)',
                      }
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      navigate(`/book-appointment?clinicId=${clinic._id}`);
                    }}
                    sx={{ 
                      flex: 1,
                      backgroundColor: '#ff6b35',
                      '&:hover': {
                        backgroundColor: '#ff5722',
                      }
                    }}
                  >
                    Book Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Call to Action */}
      {!loading && filteredClinics.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Ready to book an appointment?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Click on any clinic to view details and book your appointment
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/book-appointment')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
            }}
          >
            Book Appointment Now
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default ClinicPage;
