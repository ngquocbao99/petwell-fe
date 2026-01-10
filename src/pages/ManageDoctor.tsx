import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Container,
  Fab,
  Avatar,
  Divider,
  Stack,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  Verified as VerifiedIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import SummaryApi from '@common/SummarryAPI';
import Axios from '@utils/Axios';
import { useSelector } from 'react-redux';

interface Doctor {
  _id?: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  clinicId: string;
  licenseNumber: string;
  address: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ManageDoctorPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState<Doctor>({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    clinicId: '',
    licenseNumber: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch all doctors
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.doctor.list
      });
      if (response.data.success) {
        // Filter only users with role 'doctor'
        setDoctors((response.data.data || []).filter((d: any) => d.role === 'doctor'));
      } else {
        toast.error(response.data.message || 'Failed to fetch doctors');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch all clinics for the select field (exclude banned clinics)
  const [clinics, setClinics] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await Axios({ ...SummaryApi.clinic.list });
        // Filter out banned/blocked clinics
        const activeClinics = (res.data.data || []).filter((clinic: any) => 
          !clinic.isblock && !clinic.isDeleted
        );
        setClinics(activeClinics);
      } catch {
        toast.error('Failed to fetch clinics');
      }
    };
    fetchClinics();
  }, []);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) {
      newErrors.email = 'Invalid email format.';
    }

    if (!isEditing && !form.password?.trim()) {
      newErrors.password = 'Password is required.';
    } else if (!isEditing && form.password && form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^(0[0-9]{9,10})$/.test(form.phone.trim())) {
      newErrors.phone = 'Phone number must start with 0 and be 10 or 11 digits.';
    }

    // clinicId is auto-assigned, no need to validate

    if (!form.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required.';
    } else if (!/^VN-CLN-\d{5}$/.test(form.licenseNumber.trim())) {
      newErrors.licenseNumber = 'License number must be in format VN-CLN-XXXXX.';
    }

    if (!form.address.trim()) {
      newErrors.address = 'Address is required.';
    } else if (form.address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create doctor
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password?.trim(),
      phone: form.phone.trim(),
      clinicId: form.clinicId,
      licenseNumber: form.licenseNumber.trim(),
      address: form.address.trim(),
    };

    setLoading(true);

    try {
      const response = await Axios({
        ...SummaryApi.doctor.create,
        data: payload,
      });

      if (response.data.success) {
        toast.success('Doctor created successfully');
        setSuccess('Doctor created successfully');
        fetchDoctors();
        handleCloseForm();
      } else {
        const backendMessage = response.data.message || 'Failed to create doctor';
        setError(backendMessage);
        toast.error(backendMessage);
      }
    } catch (err) {
      console.error('Error creating doctor:', err);
      const backendMessage = err.response?.data?.message || 'Failed to create doctor';
      setError(backendMessage);
      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show detail
  const handleDetail = async (doctor: Doctor) => {
    if (!doctor._id) return;
    
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.doctor.detail(doctor._id),
      });

      if (response.data.success) {
        setSelectedDoctor(response.data.data);
        setShowDetail(true);
      } else {
        toast.error(response.data.message || 'Failed to fetch doctor details');
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      toast.error('Failed to fetch doctor details');
    } finally {
      setLoading(false);
    }
  };

  // Update doctor
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor?._id) return;
    
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;

    // Check for duplicate email and license number (excluding current doctor)
    const isDuplicateEmail = doctors.some(doctor => 
      doctor._id !== selectedDoctor._id && 
      doctor.email.toLowerCase() === form.email.toLowerCase()
    );
    const isDuplicateLicense = doctors.some(doctor => 
      doctor._id !== selectedDoctor._id && 
      doctor.licenseNumber === form.licenseNumber
    );

    if (isDuplicateEmail) {
      setError('A doctor with this email already exists');
      toast.error('A doctor with this email already exists');
      return;
    }

    if (isDuplicateLicense) {
      setError('A doctor with this license number already exists');
      toast.error('A doctor with this license number already exists');
      return;
    }

    setLoading(true);

    try {
      const updateData = { ...form };
      // Remove password from update if not provided
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }

      const response = await Axios({
        ...SummaryApi.doctor.update(selectedDoctor._id),
        data: updateData,
      });

      if (response.data.success) {
        toast.success('Doctor updated successfully');
        setSuccess('Doctor updated successfully');
        fetchDoctors();
        handleCloseForm();
      } else {
        const errorMsg = response.data.message || 'Failed to update doctor';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error updating doctor:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update doctor';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete doctor
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.doctor.delete(id),
      });

      if (response.data.success) {
        toast.success('Doctor deleted successfully');
        fetchDoctors();
      } else {
        toast.error(response.data.message || 'Failed to delete doctor');
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      toast.error('Failed to delete doctor');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  // Edit doctor
  const handleEdit = (doctor: Doctor) => {
    let clinicId = '';
    const docClinic: any = doctor.clinicId;
    if (docClinic && typeof docClinic === 'object' && 'name' in docClinic && '_id' in docClinic) {
      clinicId = docClinic._id;
    } else if (typeof docClinic === 'string') {
      clinicId = docClinic;
    }
    setForm({
      fullName: doctor.fullName,
      email: doctor.email,
      password: '', // Don't pre-fill password
      phone: doctor.phone,
      clinicId,
      licenseNumber: doctor.licenseNumber,
      address: doctor.address,
    });
    setSelectedDoctor(doctor);
    setIsEditing(true);
    setOpenForm(true);
    setErrors({});
    setError('');
    setSuccess('');
  };

  // Open create form
  const handleOpenCreate = () => {
    // Auto-assign manager's clinic - for now use first available clinic as fallback
    const defaultClinicId = user.clinicId || (clinics.length > 0 ? clinics[0]._id : '');
    
    setForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      clinicId: defaultClinicId, // Auto-assign manager's clinic
      licenseNumber: '',
      address: '',
    });
    setSelectedDoctor(null);
    setIsEditing(false);
    setOpenForm(true);
    setErrors({});
    setError('');
    setSuccess('');
  };

  // Cancel/Close form
  const handleCloseForm = () => {
    setOpenForm(false);
    setShowDetail(false);
    setForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      clinicId: '',
      licenseNumber: '',
      address: '',
    });
    setSelectedDoctor(null);
    setIsEditing(false);
    setErrors({});
    setError('');
    setSuccess('');
  };

  const openDeleteConfirm = (id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const user = useSelector((state: any) => state.user);

  // Filter doctors by manager's clinic
  const filteredDoctors = React.useMemo(() => {
    // If user is not manager, return empty array
    if (!user || user.role !== 'manager') {
      return [];
    }
    
    // Get manager's clinic ID from various sources
    const managerClinicId = user.clinicId || user.clinic?._id || user.clinic;
    
    if (!managerClinicId) {
      // If manager doesn't have clinic info, show doctors from first available clinic as fallback
      // TODO: Fix backend to properly assign clinicId to manager
      if (clinics.length > 0) {
        const fallbackClinicId = clinics[0]._id;
        return doctors.filter(doctor => {
          const docClinic = doctor?.clinicId;
          if (typeof docClinic === 'object' && docClinic !== null) {
            return (docClinic as any)?._id === fallbackClinicId;
          }
          return docClinic === fallbackClinicId;
        });
      }
      return [];
    }
    
    return doctors.filter((doctor) => {
      const docClinic = doctor?.clinicId;
      if (!docClinic) return false;
      
      // Handle populated clinic object
      if (typeof docClinic === 'object' && docClinic !== null) {
        const clinicId = (docClinic as any)?._id;
        if (clinicId) {
          return String(clinicId) === String(managerClinicId);
        }
      }
      
      // Handle clinic ID as string
      if (typeof docClinic === 'string') {
        return String(docClinic) === String(managerClinicId);
      }
      
      return false;
    });
  }, [doctors, user, clinics]);

  if (user.role !== 'manager') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">You do not have permission to access this page.</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Add Toaster component */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={700} color="primary" gutterBottom>
          Doctor Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage veterinary doctor information
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Doctors List */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3,
          justifyContent: 'flex-start'
        }}
      >
        {filteredDoctors.map((doctor) => (
          <Box 
            key={doctor._id} 
            sx={{ 
              width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
              minWidth: '300px'
            }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => `0 12px 24px ${theme.palette.primary.light}25`
                }
              }}
            >
              {/* Avatar Section */}
              <Box 
                sx={{ 
                  position: 'relative',
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {doctor.fullName.charAt(0).toUpperCase()}
                </Avatar>
                
                {/* Status Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: doctor.isActive ? 'success.main' : 'grey.500',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {doctor.isActive && <VerifiedIcon sx={{ fontSize: 16 }} />}
                  {doctor.isActive ? 'Active' : 'Inactive'}
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                {/* Doctor Name */}
                <Typography 
                  variant="h6" 
                  component="h2" 
                  fontWeight={600}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.3,
                    mb: 2
                  }}
                >
                  {doctor.fullName}
                </Typography>

                {/* Doctor Info */}
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {doctor.email}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {String(doctor.phone).startsWith('0') ? doctor.phone : `0${doctor.phone}`}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalIcon color="primary" sx={{ fontSize: 20 }} />
                    {/* Clinic Name Display - safer null/object check */}
                    {(() => {
                      let clinicName = 'Unknown Clinic';
                      const docClinic: any = doctor.clinicId;
                      if (docClinic && typeof docClinic === 'object' && 'name' in docClinic) {
                        clinicName = String(docClinic.name);
                      } else if (docClinic && typeof docClinic === 'string') {
                        const found = clinics.find(c => c._id === docClinic);
                        if (found) clinicName = found.name;
                      }
                      return (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {clinicName}
                        </Typography>
                      );
                    })()}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {doctor.licenseNumber}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon color="primary" sx={{ fontSize: 20, mt: 0.3 }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4
                      }}
                    >
                      {doctor.address}
                    </Typography>
                  </Box>
                </Stack>

                {/* Action Buttons */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Tooltip title="View details">
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleDetail(doctor)}
                      sx={{ flex: 1 }}
                    >
                      Details
                    </Button>
                  </Tooltip>
                  <Tooltip title="Edit doctor">
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(doctor)}
                      sx={{ flex: 1 }}
                    >
                      Edit
                    </Button>
                  </Tooltip>
                  <Tooltip title="Delete doctor">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => openDeleteConfirm(doctor._id!)}
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'error.lighter'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}

        {/* Empty State */}
        {filteredDoctors.length === 0 && !loading && (
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No doctors found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please add your first doctor
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Add doctor
              </Button>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Loading */}
      {loading && !openForm && !showDetail && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={handleOpenCreate}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Create/Edit Form Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {isEditing ? 'Edit doctor' : 'Add new doctor'}
          </Typography>
        </DialogTitle>
        <form onSubmit={isEditing ? handleUpdate : handleCreate}>
          <DialogContent sx={{ pt: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 3,
                '& > *': {
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' }
                }
              }}
            >
              <TextField
                name="fullName"
                label="Full Name"
                value={form.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                fullWidth
                variant="outlined"
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                variant="outlined"
              />
              <TextField
                name="password"
                label={isEditing ? "New Password (leave empty to keep current)" : "Password"}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <TextField
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                fullWidth
                variant="outlined"
              />
              
              {/* Hidden clinic field - automatically assigned to manager's clinic */}
              <input
                type="hidden"
                name="clinicId"
                value={form.clinicId}
              />
              
              <TextField
                name="licenseNumber"
                label="License Number"
                value={form.licenseNumber}
                onChange={handleChange}
                error={!!errors.licenseNumber}
                helperText={errors.licenseNumber}
                fullWidth
                variant="outlined"
              />
              <Box sx={{ flex: '1 1 100%' }}>
                <TextField
                  name="address"
                  label="Address"
                  value={form.address}
                  onChange={handleChange}
                  error={!!errors.address}
                  helperText={errors.address}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Doctor's address..."
                />
              </Box>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleCloseForm} color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              {loading ? 'Processing...' : (isEditing ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Doctor Detail Dialog */}
      <Dialog 
        open={showDetail} 
        onClose={handleCloseForm} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>
          Doctor Details
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedDoctor && (
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 3,
                '& > *': {
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' }
                }
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedDoctor.fullName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedDoctor.email}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedDoctor.phone}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Clinic</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {(() => {
                    let clinicName = 'Unknown Clinic';
                    const docClinic: any = selectedDoctor?.clinicId;
                    if (docClinic && typeof docClinic === 'object' && docClinic !== null && 'name' in docClinic) {
                      clinicName = String(docClinic.name);
                    } else if (docClinic && typeof docClinic === 'string') {
                      const found = clinics.find(c => c._id === docClinic);
                      if (found) clinicName = found.name;
                    }
                    return clinicName;
                  })()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">License Number</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedDoctor.licenseNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedDoctor.isActive ? 'Active' : 'Inactive'}
                  color={selectedDoctor.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedDoctor.address}</Typography>
              </Box>
              {selectedDoctor.createdAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(selectedDoctor.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Button onClick={handleCloseForm}>Close</Button>
          {selectedDoctor && (
            <Button 
              variant="contained" 
              onClick={() => handleEdit(selectedDoctor)}
              sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this doctor? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteId && handleDelete(deleteId)} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageDoctorPage;
