import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Container,
  Stack,
  Button,
  Skeleton
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
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
  isblock?: boolean;
  isDeleted?: boolean;
}

const ClinicCarousel: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch all clinics
  const fetchClinics = async () => {
    try {
      const res = await Axios({ ...SummaryApi.clinic.list });
      const clinicData = res.data.data || [];
      // Filter out blocked and deleted clinics
      const activeClinics = clinicData.filter((clinic: Clinic) => 
        !clinic.isblock && !clinic.isDeleted
      );
      setClinics(activeClinics);
    } catch {
      toast.error("Failed to fetch clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 3 >= clinics.length ? 0 : prev + 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - 3 < 0 ? Math.max(0, clinics.length - 3) : prev - 3
    );
  };

  const visibleClinics = clinics.slice(currentIndex, currentIndex + 3);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Add a clear heading for the clinic section */}
      <Typography
        variant="h4"
        align="center"
        color="primary"
        fontWeight={700}
        gutterBottom
        sx={{ mb: 4 }}
      >
        OUR CLINICS
      </Typography>

      {/* Carousel Container */}
      <Box sx={{ position: "relative", maxWidth: 1200, mx: "auto", px: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", gap: 3, justifyContent: "center" }}>
            {[...Array(3)].map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                height={350}
                sx={{ borderRadius: 3, width: { xs: '100%', sm: '48%', md: '350px' }, maxWidth: "100%" }}
              />
            ))}
          </Box>
        ) : clinics.length === 0 ? (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No clinics available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please check back later for updates
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Navigation Buttons */}
            {clinics.length > 3 && (
              <>
                <IconButton
                  onClick={prevSlide}
                  sx={{
                    position: "absolute",
                    left: -20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: "white",
                    boxShadow: 2,
                    zIndex: 1,
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={nextSlide}
                  sx={{
                    position: "absolute",
                    right: -20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: "white",
                    boxShadow: 2,
                    zIndex: 1,
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}

            {/* Clinic Cards Display */}
            <Box
              sx={{
                display: "flex",
                gap: 3,
                overflowX: 'hidden',
                scrollBehavior: 'smooth',
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              {visibleClinics.map((clinic) => (
                <Card
                  key={clinic._id}
                  sx={{
                    minWidth: 350,
                    width: 350,
                    mb: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                  onClick={() => navigate(`/clinic/${clinic._id}`)}
                >
                  {/* Clinic Image */}
                  {clinic.image ? (
                    <Box sx={{ height: 180, width: '100%', overflow: 'hidden' }}>
                      <img src={clinic.image} alt={clinic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ) : (
                    <Box sx={{ height: 180, width: '100%', bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Clinic Name */}
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {clinic.name}
                    </Typography>

                    {/* Clinic Info */}
                    <Stack spacing={1.5}>
                      {/* Address */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {clinic.address}
                          {clinic.city && `, ${clinic.city}`}
                        </Typography>
                      </Box>

                      {/* Phone */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {clinic.phone}
                        </Typography>
                      </Box>

                      {/* Description */}
                      {clinic.description && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <DescriptionIcon color="action" sx={{ mr: 1, fontSize: 20, mt: 0.5 }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
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

            {/* View All Clinics Button */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/clinic')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  background: 'linear-gradient(45deg, #ff6b35, #ff8c42)',
                  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff5722, #ff7043)',
                    boxShadow: '0 6px 25px rgba(255, 107, 53, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                VIEW ALL CLINICS
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default ClinicCarousel;
