import React, { useEffect, useState, useCallback } from 'react';
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
  DialogContentText,
  DialogActions,
  IconButton,
  Container,
  Fab,
  Avatar,
  Divider,
  Stack,
  Paper,
  Tooltip,
  Chip,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  Block as BlockIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import SummaryApi from '@common/SummarryAPI';
import Axios from '@utils/Axios';
import toast, { Toaster } from 'react-hot-toast';
import UploadImage from '@utils/UploadImage';

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
  doctors?: Array<{ _id: string, fullName: string, email: string, role: string, avatar?: string }>;
  staff?: Array<{ _id: string, fullName: string, email: string, role: string, avatar?: string }>;
  rating?: number;
  reviewCount?: number;
  isDeleted?: boolean;
  isblock?: boolean;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
}

// Interface for confirmation dialog
interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmBtnColor: 'error' | 'primary' | 'success' | 'warning' | 'info';
  onConfirm: () => void;
}

const ManageClinicPage: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    description: '',
    doctors: [],
    staff: []
  });
  const [form, setForm] = useState<Clinic>({ name: '', address: '', city: '', phone: '', email: '', description: '', image: '', licenseNumber: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmBtnColor: 'primary',
    onConfirm: () => { }
  });

  // States for doctor/staff management
  const [availableDoctors, setAvailableDoctors] = useState<User[]>([]);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [openDoctorDialog, setOpenDoctorDialog] = useState<boolean>(false);
  const [openStaffDialog, setOpenStaffDialog] = useState<boolean>(false);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Redux state
  const user = useSelector((state: any) => state.user);

  if (user.role !== 'admin') {
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

  // Helper function to consistently get the manager ID
  const getManagerId = () => {
    // First try from user object in Redux state
    let managerId = user && (user._id || user.id || user.userId);

    // If not found, try localStorage
    if (!managerId && window.localStorage) {
      try {
        const userData = window.localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          managerId = parsedUser._id || parsedUser.id || parsedUser.userId;
        }
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e);
      }
    }

    // Last resort - try to get from session storage
    if (!managerId && window.sessionStorage) {
      try {
        const sessionData = window.sessionStorage.getItem('user');
        if (sessionData) {
          const parsedUser = JSON.parse(sessionData);
          managerId = parsedUser._id || parsedUser.id || parsedUser.userId;
        }
      } catch (e) {
        console.error('Failed to parse user data from sessionStorage:', e);
      }
    }

    return managerId;
  };

  // Open confirmation dialog
  const openConfirmationDialog = (
    title: string,
    message: string,
    confirmText: string,
    confirmBtnColor: 'error' | 'primary' | 'success' | 'warning' | 'info',
    onConfirm: () => void,
    cancelText: string = 'Cancel'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmBtnColor,
      onConfirm,
      cancelText
    });
  };

  // Fetch all clinics including banned ones
  const fetchClinics = async () => {
    try {
      const res = await Axios({ ...SummaryApi.clinic.listAdmin });
      setClinics(res.data.data || []);
    } catch {
      toast.error("Failed to fetch clinics");
    }
  };
  useEffect(() => {
    fetchClinics();
  }, []);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.name.trim()) {
      newErrors.name = 'Clinic name is required';
    }
    if (!form.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(0[0-9]{9,10})$/.test(form.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    // Validate license number (required by backend)
    if (!form.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }
    // Optional: validate description length
    if (form.description && form.description.length > 300) {
      newErrors.description = 'Description cannot exceed 300 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create clinic
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    // Check for duplicate clinic before creating
    const isDuplicate = clinics.some(clinic =>
      !clinic.isDeleted &&
      (clinic.name.trim().toLowerCase() === form.name.trim().toLowerCase() ||
        clinic.address.trim().toLowerCase() === form.address.trim().toLowerCase() ||
        clinic.phone.trim() === form.phone.trim())
    );
    if (isDuplicate) {
      setError('A clinic with the same name, address, or phone number already exists.');
      toast.error('A clinic with the same name, address, or phone number already exists.');
      return;
    }
    setLoading(true);
    let imageUrl = form.image;
    if (selectedImage) {
      const formDataUpload = new FormData();
      formDataUpload.append("image", selectedImage);
      try {
        const res = await Axios.post("/api/v1/upload", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success && res.data.data) {
          imageUrl = res.data.data.secure_url;
        } else {
          setSelectedImage(null);
          toast.error("Upload Image Failed!");
          setLoading(false);
          return;
        }
      } catch (err) {
        toast.error("Error uploading image!");
        setLoading(false);
        return;
      }
    }
    try {
      const managerId = getManagerId();
      const response = await Axios({
        ...SummaryApi.clinic.create,
        data: {
          ...form,
          image: imageUrl,
          ...(managerId && { managerId }),
          doctorIds: selectedDoctorIds,
          staffIds: selectedStaffIds
        },
      });
      setForm({ name: '', address: '', city: '', phone: '', email: '', description: '', image: '', licenseNumber: '' });
      setSelectedImage(null);
      setImagePreview('');
      setOpenForm(false);
      setSelectedDoctorIds([]);
      setSelectedStaffIds([]);
      toast.success('Clinic created successfully!');
      fetchClinics();
    } catch (err) {
      toast.error('Unable to create clinic');
    } finally {
      setLoading(false);
    }
  };

  // Show detail
  const handleDetail = async (clinic: Clinic) => {
    setLoading(true);
    try {
      // Make sure we have a valid clinic ID
      if (!clinic || !clinic._id) {
        toast.error('Invalid clinic selected');
        setShowDetail(false);
        setSelectedClinic(null);
        setLoading(false);
        return;
      }


      const res = await Axios({
        ...SummaryApi.clinic.detail,
        url: `${SummaryApi.clinic.detail.url}/${clinic._id}`
      });


      if (!res.data.data) {
        toast.error('Clinic not found or has been deleted.');
        setShowDetail(false);
        setSelectedClinic(null);
      } else {
        // Make sure doctors and staff are initialized
        const clinicData = res.data.data;
        if (!clinicData.doctors) clinicData.doctors = [];
        if (!clinicData.staff) clinicData.staff = [];

        setSelectedClinic(clinicData);
        setShowDetail(true);
      }
    } catch (err) {
      console.error('Error loading clinic details:', err);
      toast.error('Unable to load clinic details');
      setShowDetail(false);
      setSelectedClinic(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available doctors
  const fetchAvailableDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await Axios({
        ...SummaryApi.clinic.availableDoctors
      });

      if (response.data.success) {
        setAvailableDoctors(response.data.data || []);
      } else {
        toast.error('Failed to fetch available doctors');
      }
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      toast.error('Error fetching available doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch available staff
  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await Axios({
        ...SummaryApi.clinic.availableStaff
      });

      if (response.data.success) {
        setAvailableStaff(response.data.data || []);
      } else {
        toast.error('Failed to fetch available staff');
      }
    } catch (error) {
      console.error('Error fetching available staff:', error);
      toast.error('Error fetching available staff');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Add doctor to clinic
  const handleAddDoctor = async () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor');
      return;
    }

    if (!selectedClinic?._id) {
      toast.error('No clinic selected');
      setOpenDoctorDialog(false);
      return;
    }

    setLoadingDoctors(true);
    try {
      const response = await Axios({
        ...SummaryApi.clinic.addDoctor(selectedClinic._id),
        data: {
          doctorId: selectedDoctorId
        }
      });


      if (response.data.success) {
        toast.success('Doctor added to clinic successfully');

        // Update the selectedClinic directly with the response data
        if (response.data.data) {
          // Ensure populated data has doctors and staff arrays
          const updatedClinicData = response.data.data;
          if (!updatedClinicData.doctors) updatedClinicData.doctors = [];
          if (!updatedClinicData.staff) updatedClinicData.staff = [];

          setSelectedClinic(updatedClinicData);
        } else {
          // Fallback to refreshing clinic details if no data in response
          handleDetail(selectedClinic);
        }

        // Close the doctor dialog
        setOpenDoctorDialog(false);
        setSelectedDoctorId('');
        // Refresh available doctors
        fetchAvailableDoctors();
      } else {
        toast.error(response.data.message || 'Failed to add doctor to clinic');
      }
    } catch (error) {
      console.error('Error adding doctor to clinic:', error);
      toast.error('Error adding doctor to clinic');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Add staff to clinic
  const handleAddStaff = async () => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    if (!selectedClinic?._id) {
      toast.error('No clinic selected');
      setOpenStaffDialog(false);
      return;
    }

    setLoadingStaff(true);
    try {
      const response = await Axios({
        ...SummaryApi.clinic.addStaff(selectedClinic._id),
        data: {
          staffId: selectedStaffId
        }
      });


      if (response.data.success) {
        toast.success('Staff member added to clinic successfully');

        // Update the selectedClinic directly with the response data
        if (response.data.data) {
          // Ensure populated data has doctors and staff arrays
          const updatedClinicData = response.data.data;
          if (!updatedClinicData.doctors) updatedClinicData.doctors = [];
          if (!updatedClinicData.staff) updatedClinicData.staff = [];

          setSelectedClinic(updatedClinicData);
        } else {
          // Fallback to refreshing clinic details if no data in response
          handleDetail(selectedClinic);
        }

        // Close the staff dialog
        setOpenStaffDialog(false);
        setSelectedStaffId('');
        // Refresh available staff
        fetchAvailableStaff();
      } else {
        toast.error(response.data.message || 'Failed to add staff to clinic');
      }
    } catch (error) {
      console.error('Error adding staff to clinic:', error);
      toast.error('Error adding staff to clinic');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Remove doctor from clinic
  const handleRemoveDoctor = async (doctorId: string) => {
    if (!selectedClinic?._id) return;

    openConfirmationDialog(
      'Remove Doctor',
      'Are you sure you want to remove this doctor from the clinic?',
      'Remove',
      'error',
      async () => {
        setLoading(true);
        try {
          const response = await Axios({
            ...SummaryApi.clinic.removeDoctor(selectedClinic._id, doctorId)
          });

          if (response.data.success) {
            toast.success('Doctor removed from clinic successfully');
            // Refresh clinic details
            handleDetail(selectedClinic);
            // Refresh available doctors
            fetchAvailableDoctors();
          } else {
            toast.error(response.data.message || 'Failed to remove doctor from clinic');
          }
        } catch (error) {
          console.error('Error removing doctor from clinic:', error);
          toast.error('Error removing doctor from clinic');
        } finally {
          setLoading(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    );
  };

  // Remove staff from clinic
  const handleRemoveStaff = async (staffId: string) => {
    if (!selectedClinic?._id) return;

    openConfirmationDialog(
      'Remove Staff',
      'Are you sure you want to remove this staff member from the clinic?',
      'Remove',
      'error',
      async () => {
        setLoading(true);
        try {
          const response = await Axios({
            ...SummaryApi.clinic.removeStaff(selectedClinic._id, staffId)
          });

          if (response.data.success) {
            toast.success('Staff member removed from clinic successfully');
            // Refresh clinic details
            handleDetail(selectedClinic);
            // Refresh available staff
            fetchAvailableStaff();
          } else {
            toast.error(response.data.message || 'Failed to remove staff from clinic');
          }
        } catch (error) {
          console.error('Error removing staff from clinic:', error);
          toast.error('Error removing staff from clinic');
        } finally {
          setLoading(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    );
  };

  // Edit clinic
  const handleEdit = async (clinic: Clinic) => {
    if (clinic.isDeleted) {
      toast.error('Cannot edit a banned clinic. Please unban it first.');
      return;
    }

    // Find a valid managerId from either the clinic or the user
    const managerId = clinic.managerId || getManagerId();
    // Fetch detailed clinic info including doctors and staff
    setLoading(true);
    try {
      const res = await Axios({
        ...SummaryApi.clinic.detail,
        url: `${SummaryApi.clinic.detail.url}/${clinic._id}`
      });


      if (!res.data.data) {
        toast.error('Clinic not found or has been deleted.');
        return;
      }

      const detailedClinic = res.data.data;
      setSelectedClinic(detailedClinic);
      setForm({
        ...detailedClinic,
        managerId
      });
      setIsEditing(true);
      setOpenForm(true);

      // Fetch available doctors and staff for assignment
      await fetchAvailableDoctors();
      await fetchAvailableStaff();

      // Initialize doctor and staff selections as empty (for new assignments)
      // Note: We don't pre-select existing doctors/staff as they are already assigned
      setSelectedDoctorIds([]);
      setSelectedStaffIds([]);

    } catch (err) {
      toast.error('Unable to load clinic details for editing');
      console.error('Error fetching clinic details:', err);
    } finally {
      setLoading(false);
    }
    setImagePreview(clinic.image || '');
    setSelectedImage(null); // Clear selected image when editing
  };
  // Open create form
  const handleOpenCreate = useCallback(async () => {
    setForm({ name: '', address: '', city: '', phone: '', email: '', description: '', image: '', licenseNumber: '' });
    setIsEditing(false);
    setSelectedClinic({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      description: '',
      doctors: [],
      staff: []
    });
    setOpenForm(true);
    setSelectedImage(null);
    setImagePreview('');
    setSelectedDoctorIds([]);
    setSelectedStaffIds([]);

    // Fetch available doctors and staff for new clinic creation
    await fetchAvailableDoctors();
    await fetchAvailableStaff();
  }, []);
  // Cancel/Close form
  const handleCloseForm = () => {
    setOpenForm(false);
    setIsEditing(false);
    setForm({ name: '', address: '', city: '', phone: '', email: '', description: '', image: '', licenseNumber: '' });
    setSelectedClinic({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      description: '',
      doctors: [],
      staff: []
    });
    setSelectedImage(null);
    setImagePreview('');
    setErrors({});
  };
  // This function was also defined below, so removing the duplicate

  // Use openConfirmationDialog instead of openConfirmDialog
  // closeConfirmDialog is defined below

  // Handle banning a clinic
  const handleBan = async (clinicId: string) => {
    openConfirmationDialog(
      'Ban Clinic',
      'Are you sure you want to ban this clinic? It will no longer be visible to users.',
      'Ban',
      'error',
      async () => {
        setLoading(true);
        try {
          const response = await Axios(SummaryApi.clinic.ban(clinicId));


          if (response.data.success) {
            toast.success('Clinic banned successfully');
            fetchClinics(); // Refresh the clinic list
          } else {
            toast.error(response.data.message || 'Failed to ban clinic');
          }
        } catch (error) {
          console.error('Error banning clinic:', error);
          toast.error('Error banning clinic');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle unbanning a clinic
  const handleUnban = async (clinicId: string) => {
    openConfirmationDialog(
      'Unban Clinic',
      'Are you sure you want to unban this clinic? It will be visible to users again.',
      'Unban',
      'warning',
      async () => {
        setLoading(true);
        try {
          const response = await Axios(SummaryApi.clinic.unban(clinicId));

          if (response.data.success) {
            toast.success('Clinic unbanned successfully');
            fetchClinics(); // Refresh the clinic list
          } else {
            toast.error(response.data.message || 'Failed to unban clinic');
          }
        } catch (error) {
          console.error('Error unbanning clinic:', error);
          toast.error('Error unbanning clinic');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle deleting a clinic
  const handleDelete = async (clinicId: string) => {
    openConfirmationDialog(
      'Delete Clinic',
      'Are you sure you want to permanently delete this clinic? This action cannot be undone.',
      'Delete',
      'error',
      async () => {
        setLoading(true);
        try {
          const response = await Axios(SummaryApi.clinic.delete(clinicId));

          if (response.data.success) {
            toast.success('Clinic deleted successfully');
            fetchClinics(); // Refresh the clinic list
          } else {
            toast.error(response.data.message || 'Failed to delete clinic');
          }
        } catch (error) {
          console.error('Error deleting clinic:', error);
          toast.error('Error deleting clinic');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Function to reset form state
  const resetForm = () => {
    setForm({ name: '', address: '', city: '', phone: '', email: '', description: '', image: '', licenseNumber: '' });
    setSelectedImage(null);
    setImagePreview('');
    setErrors({});
    setSelectedClinic({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      description: '',
      doctors: [],
      staff: []
    });
    setIsEditing(false);
  };

  // Handle updating a clinic
  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate clinic selection
    if (!selectedClinic?._id) {
      toast.error('No clinic selected for update');
      return;
    }

    // Validate managerId
    const managerId = getManagerId();
    if (!managerId) {
      toast.error('Unable to identify manager. Please try logging in again.');
      return;
    }

    // Validate required fields
    const newErrors: { [key: string]: string } = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.address) newErrors.address = 'Address is required';
    if (!form.city) newErrors.city = 'City is required';
    if (!form.phone) newErrors.phone = 'Phone is required';
    if (!form.email) newErrors.email = 'Email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);

    try {
      let imageUrl = form.image;

      // If a new image is selected, upload it
      if (selectedImage) {
        try {
          imageUrl = await UploadImage(selectedImage);
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error('Error uploading image');
          setLoading(false);
          return;
        }
      }

      // Update the form with the image URL
      const updatedForm = {
        ...form,
        image: imageUrl,
        managerId: managerId // Use the validated managerId
      };
      const response = await Axios({
        ...SummaryApi.clinic.update(selectedClinic._id),
        data: updatedForm
      });


      if (response.data.success) {
        // Store counts before clearing arrays
        const doctorCount = selectedDoctorIds.length;
        const staffCount = selectedStaffIds.length;

        // Update doctors and staff if any are selected
        if (doctorCount > 0 || staffCount > 0) {
          try {
            const doctorPromises = [];
            const staffPromises = [];

            // Add selected doctors to clinic
            for (const doctorId of selectedDoctorIds) {
              doctorPromises.push(
                Axios({
                  ...SummaryApi.clinic.addDoctor(selectedClinic._id),
                  data: { doctorId }
                })
              );
            }

            // Add selected staff to clinic
            for (const staffId of selectedStaffIds) {
              staffPromises.push(
                Axios({
                  ...SummaryApi.clinic.addStaff(selectedClinic._id),
                  data: { staffId }
                })
              );
            }

            // Wait for all assignments to complete
            const results = await Promise.allSettled([...doctorPromises, ...staffPromises]);

            // Check for any failures
            const failed = results.filter(result => result.status === 'rejected');
            if (failed.length > 0) {
              console.error('Some assignments failed:', failed);
              toast.error(`Failed to assign ${failed.length} member(s). Please try again.`);
            }

            // Clear selections after successful update
            setSelectedDoctorIds([]);
            setSelectedStaffIds([]);

          } catch (error) {
            console.error('Error updating doctors/staff:', error);
            toast.error('Error assigning doctors/staff to clinic');
          }
        }

        toast.success('Clinic updated successfully');

        // Show additional success message if doctors/staff were added
        if (doctorCount > 0 || staffCount > 0) {
          const addedItems = [];
          if (doctorCount > 0) addedItems.push(`${doctorCount} doctor(s)`);
          if (staffCount > 0) addedItems.push(`${staffCount} staff member(s)`);
          toast.success(`Successfully added ${addedItems.join(' and ')} to clinic`);
        }

        fetchClinics(); // Refresh the clinic list
        setOpenForm(false);
        handleCloseForm();

        // Refresh available doctors and staff
        fetchAvailableDoctors();
        fetchAvailableStaff();
      } else {
        console.error('Clinic update failed:', response.data);
        toast.error(response.data.message || 'Failed to update clinic');
      }
    } catch (error: any) {
      console.error('Error updating clinic:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error updating clinic';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Functions are now implemented

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  // Handler for image change is already defined above

  // Handler for viewing clinic details
  // handleDetail is already defined above

  // Effect to load clinics on component mount
  useEffect(() => {
    fetchClinics();
  }, []);

  // Filtered clinics - exclude deleted and blocked clinics
  // Show all clinics in management interface, including blocked ones
  const filteredClinics = clinics.filter(clinic => !clinic.isDeleted);

  const renderClinicStatus = (clinic) => {
    if (clinic.isblock) {
      return (
        <Typography variant="body2" color="text.secondary">
          unban
        </Typography>
      );
    }
    return null;
  };

  const handleUnbanClinic = async (clinicId) => {
    try {
      await Axios.put(`/api/clinics/${clinicId}/unban`);
      toast.success("Clinic unbanned successfully.");
      fetchClinics();
    } catch (error) {
      toast.error("Failed to unban clinic.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Add Toaster component */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          top: 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto',
          },
          success: {
            style: {
              border: '1px solid #10B981',
              background: '#F0FDF4',
              color: '#065F46',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#F0FDF4',
            },
          },
          error: {
            style: {
              border: '1px solid #EF4444',
              background: '#FEF2F2',
              color: '#991B1B',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FEF2F2',
            },
          },
        }}
      />

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={700} color="primary" gutterBottom>
          Clinic Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage veterinary clinic information
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>


        </Box>
      </Box>

      {/* Clinics List */}
      <Stack direction="row" flexWrap="wrap" gap={3} justifyContent="flex-start">
        {filteredClinics.map((clinic) => (
          <Box key={clinic._id} sx={{ width: { xs: '100%', sm: '48%', md: '31%' }, mb: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease-in-out',
                boxShadow: clinic.isblock ? '0 0 0 2px #ff9800' : (clinic.isDeleted ? '0 0 0 2px #ff5252' : 'md'),
                opacity: clinic.isblock || clinic.isDeleted ? 0.8 : 1,
                filter: clinic.isblock ? 'grayscale(50%)' : 'none',
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 0 }}>
                {/* Clinic Image */}
                <Box
                  sx={{
                    height: 150,
                    backgroundImage: `url(${clinic.image || 'https://via.placeholder.com/400x150?text=No+Image'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Status Badge */}
                  {clinic.isDeleted && (
                    <Chip
                      label="Deleted"
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        fontWeight: 'bold'
                      }}
                    />
                  )}

                  {clinic.isblock && (
                    <Chip
                      label="Blocked"
                      color="warning"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: clinic.isDeleted ? 90 : 10,
                        fontWeight: 'bold'
                      }}
                    />
                  )}

                  {clinic.isVerified && (
                    <Chip
                      icon={<VerifiedIcon fontSize="small" />}
                      label="Verified"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: (clinic.isDeleted || clinic.isblock) ? 90 : 10,
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ p: 2 }}>
                  {/* Clinic Name */}
                  <Typography variant="h6" component="h2" gutterBottom noWrap title={clinic.name}>
                    {clinic.name}
                  </Typography>

                  {/* Location */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {clinic.address}, {clinic.city}
                    </Typography>
                  </Box>

                  {/* Phone */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {clinic.phone}
                    </Typography>
                  </Box>

                  {/* Email */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {clinic.email}
                    </Typography>
                  </Box>

                  {/* Rating */}
                  {clinic.rating !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {clinic.rating.toFixed(1)} ({clinic.reviewCount || 0} reviews)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleDetail(clinic)}
                >
                  View
                </Button>

                <Box>
                  {clinic.isblock ? (
                    <Tooltip title="Unban Clinic">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleUnban(clinic._id!)}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip title="Edit Clinic">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(clinic)}
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Ban Clinic">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleBan(clinic._id!)}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  <Tooltip title="Delete Permanently">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(clinic._id!)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Card>
          </Box>
        ))}

        {/* Add New Clinic Card */}
        <Box sx={{ width: { xs: '100%', sm: '48%', md: '31%' }, mb: 3 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: 150,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 3,
              border: '2px dashed',
              borderColor: 'primary.light',
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(63, 81, 181, 0.04)'
              }
            }}
            onClick={handleOpenCreate}
          >
            <AddIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h6" color="primary" align="center">
              Add New Clinic
            </Typography>
          </Card>
        </Box>
      </Stack>

      {/* Create/Edit Form Dialog */}
      <Dialog
        open={openForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Clinic' : 'Create New Clinic'}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <form onSubmit={isEditing ? handleUpdate : handleCreate}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Basic Information */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Basic Information
                </Typography>
              </Box>

              {/* Name */}
              <Box sx={{ width: '100%' }}>
                <TextField
                  label="Clinic Name"
                  fullWidth
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Box>

              {/* Address and City */}
              <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 2 }}>
                  <TextField
                    label="Address"
                    fullWidth
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Box>

                {/* City */}
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="City"
                    fullWidth
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    error={!!errors.city}
                    helperText={errors.city}
                    required
                  />
                </Box>
              </Box>

              {/* Contact Information */}
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Contact Information
                </Typography>
              </Box>

              {/* Phone and Email */}
              <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    required
                  />
                </Box>

                {/* Email */}
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Box>
              </Box>

              {/* Description */}
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Additional Information
                </Typography>
              </Box>

              <Box sx={{ width: '100%' }}>
                <Box sx={{ width: '100%' }}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    error={!!errors.description}
                    helperText={errors.description}
                  />
                </Box>
              </Box>

              {/* License Number and Verification */}
              <Box sx={{ width: '100%', display: 'flex', gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="License Number"
                    fullWidth
                    value={form.licenseNumber || ''}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber}
                  />
                </Box>

                {/* Verified Status */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.isVerified || false}
                        onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Verified Clinic"
                  />
                </Box>
              </Box>

              {/* Image Upload */}
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Clinic Image
                </Typography>
              </Box>

              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  {/* Preview */}
                  <Box
                    sx={{
                      width: { xs: '100%', md: '50%' },
                      height: 200,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Clinic preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No image selected
                      </Typography>
                    )}
                  </Box>

                  {/* Upload Button */}
                  <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      Upload Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Button>

                    {selectedImage && (
                      <Typography variant="body2">
                        Selected: {selectedImage.name}
                      </Typography>
                    )}

                    {imagePreview && !selectedImage && (
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => {
                          setImagePreview('');
                          setForm({ ...form, image: '' });
                        }}
                        startIcon={<CloseIcon />}
                        size="small"
                      >
                        Remove Image
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Doctor and Staff Selection - Available in both Edit and Create modes */}
              {/* For create mode, we need to add doctors/staff after creating the clinic */}
              {openForm && isEditing && selectedClinic && (
                <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  {/* Doctor Section */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Current Doctors
                      </Typography>
                    </Box>
                    {selectedClinic.doctors && selectedClinic.doctors.length > 0 ? (
                      <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <Stack spacing={1}>
                          {selectedClinic.doctors.map((doctor) => (
                            <Paper
                              key={doctor._id}
                              elevation={1}
                              sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={doctor.avatar}
                                  sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}
                                >
                                  {doctor.fullName.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">{doctor.fullName} - {doctor.email}</Typography>
                              </Box>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleRemoveDoctor(doctor._id)}
                                title="Remove Doctor"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 1 }}>
                        No doctors currently assigned to this clinic.
                      </Typography>
                    )}
                  </Box>

                  {/* Staff Section */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Current Staff
                      </Typography>
                    </Box>

                    {selectedClinic.staff && selectedClinic.staff.length > 0 ? (
                      <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <Stack spacing={1}>
                          {selectedClinic.staff.map((staff) => (
                            <Paper
                              key={staff._id}
                              elevation={1}
                              sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={staff.avatar}
                                  sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}
                                >
                                  {staff.fullName.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">{staff.fullName} - {staff.email}</Typography>
                              </Box>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleRemoveStaff(staff._id)}
                                title="Remove Staff"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 1 }}>
                        No staff currently assigned to this clinic.
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Doctor and Staff multi-select - Always visible in create/edit form */}
              {(isEditing || !isEditing) && (
                <>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      {isEditing ? 'Add New Doctors' : 'Assign Doctors'}
                    </Typography>
                    <TextField
                      select
                      SelectProps={{ multiple: true }}
                      label={isEditing ? "Select Doctors to Add" : "Select Doctors"}
                      value={selectedDoctorIds}
                      onChange={e => setSelectedDoctorIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                      fullWidth
                      margin="normal"
                      disabled={loadingDoctors}
                      helperText={availableDoctors.length === 0 ? 'No doctors available' : ''}
                    >
                      {availableDoctors.length === 0 ? (
                        <MenuItem disabled value="">
                          No doctors available
                        </MenuItem>
                      ) : (
                        availableDoctors.map((doctor) => (
                          <MenuItem key={doctor._id} value={doctor._id}>
                            {doctor.fullName} - {doctor.email}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  </Box>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      {isEditing ? 'Add New Staff' : 'Assign Staff'}
                    </Typography>
                    <TextField
                      select
                      SelectProps={{ multiple: true }}
                      label={isEditing ? "Select Staff to Add" : "Select Staff"}
                      value={selectedStaffIds}
                      onChange={e => setSelectedStaffIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                      fullWidth
                      margin="normal"
                      disabled={loadingStaff}
                      helperText={availableStaff.length === 0 ? 'No staff available' : ''}
                    >
                      {availableStaff.length === 0 ? (
                        <MenuItem disabled value="">
                          No staff available
                        </MenuItem>
                      ) : (
                        availableStaff.map((staff) => (
                          <MenuItem key={staff._id} value={staff._id}>
                            {staff.fullName} - {staff.email}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  </Box>
                </>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseForm} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const formElement = document.querySelector('form');
              if (formElement) {
                formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : isEditing ? 'Update Clinic' : 'Create Clinic'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Clinic Details Dialog */}
      <Dialog
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedClinic({
            name: '',
            address: '',
            city: '',
            phone: '',
            email: '',
            description: '',
            doctors: [],
            staff: []
          });
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedClinic._id && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {selectedClinic.name}
                  {selectedClinic.isVerified && (
                    <VerifiedIcon sx={{ ml: 1, color: 'primary.main', fontSize: 20 }} />
                  )}
                </Typography>
                <IconButton onClick={() => setShowDetail(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Image */}
              {selectedClinic.image && (
                <Box sx={{ mb: 3 }}>
                  <img
                    src={selectedClinic.image}
                    alt={selectedClinic.name}
                    style={{ width: '100%', borderRadius: 8, maxHeight: '300px', objectFit: 'cover' }}
                  />
                </Box>
              )}
              {/* Info Section */}
              <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {/* Address */}
                <div style={{ width: '100%', maxWidth: '50%', marginBottom: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Address</Typography>
                      <Typography variant="body2">{selectedClinic.address}, {selectedClinic.city}</Typography>
                    </Box>
                  </Box>
                </div>

                {/* Phone */}
                <div style={{ width: '100%', maxWidth: '50%', marginBottom: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Phone</Typography>
                      <Typography variant="body2">{selectedClinic.phone}</Typography>
                    </Box>
                  </Box>
                </div>

                {/* Email */}
                <div style={{ width: '100%', maxWidth: '50%', marginBottom: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Email</Typography>
                      <Typography variant="body2">{selectedClinic.email}</Typography>
                    </Box>
                  </Box>
                </div>

                {/* License Number */}
                {selectedClinic.licenseNumber && (
                  <div style={{ width: '100%', maxWidth: '50%', marginBottom: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2">License Number</Typography>
                        <Typography variant="body2">{selectedClinic.licenseNumber}</Typography>
                      </Box>
                    </Box>
                  </div>
                )}

                {/* Rating */}
                {typeof selectedClinic.rating === 'number' && (
                  <div style={{ width: '100%', maxWidth: '50%', marginBottom: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <StarIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="subtitle2">Rating</Typography>
                        <Typography variant="body2">
                          {selectedClinic.rating.toFixed(1)} out of 5 ({selectedClinic.reviewCount || 0} reviews)
                        </Typography>
                      </Box>
                    </Box>
                  </div>
                )}
              </div>

              <Divider sx={{ my: 2 }} />

              {/* Doctor Section */}
              <Box sx={{ mt: 4, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" fontWeight="bold">
                    Doctors
                  </Typography>
                  {/* <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      fetchAvailableDoctors();
                      setOpenDoctorDialog(true);
                    }}
                  >
                    Add Doctor
                  </Button> */}
                </Box>

                {selectedClinic.doctors && selectedClinic.doctors.length > 0 ? (
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Stack spacing={1}>
                      {selectedClinic.doctors.map((doctor) => (
                        <Paper
                          key={doctor._id}
                          elevation={1}
                          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={doctor.avatar}
                              sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}
                            >
                              {doctor.fullName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1">{doctor.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">{doctor.email}</Typography>
                            </Box>
                          </Box>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveDoctor(doctor._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    No doctors assigned to this clinic yet.
                  </Typography>
                )}
              </Box>

              {/* Staff Section */}
              <Box sx={{ mt: 4, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" fontWeight="bold">
                    Staff
                  </Typography>
                  {/* <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      fetchAvailableStaff();
                      setOpenStaffDialog(true);
                    }}
                  >
                    Add Staff
                  </Button> */}
                </Box>

                {selectedClinic.staff && selectedClinic.staff.length > 0 ? (
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Stack spacing={1}>
                      {selectedClinic.staff.map((staff) => (
                        <Paper
                          key={staff._id}
                          elevation={1}
                          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={staff.avatar}
                              sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}
                            >
                              {staff.fullName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1">{staff.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">{staff.email}</Typography>
                            </Box>
                          </Box>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveStaff(staff._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    No staff assigned to this clinic yet.
                  </Typography>
                )}
              </Box>

              {/* Description */}
              {selectedClinic.description && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{selectedClinic.description}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedClinic({
                    name: '',
                    address: '',
                    city: '',
                    phone: '',
                    email: '',
                    description: '',
                    doctors: [],
                    staff: []
                  });
                }}
                color="primary"
              >
                Close
              </Button>
              {!selectedClinic.isDeleted && (
                <Button
                  onClick={() => handleEdit(selectedClinic)}
                  color="primary"
                  variant="contained"
                  disabled={loading}
                >
                  Edit
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 1,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {confirmDialog.confirmBtnColor === 'error' ? (
              <BlockIcon sx={{ mr: 1.5, fontSize: 28, color: '#ff9800' }} />
            ) : (
              <RestoreIcon sx={{ mr: 1.5, fontSize: 28, color: '#ff9800' }} />
            )}
            <Typography variant="h6" fontWeight={600}>
              {confirmDialog.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', mt: 1 }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={closeConfirmDialog}
            color="inherit"
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {confirmDialog.cancelText}
          </Button>
          <Button
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirmDialog();
            }}
            variant="contained"
            sx={{
              minWidth: 100,
              fontWeight: 600,
              bgcolor: '#ff9800',
              '&:hover': {
                bgcolor: '#f57c00'
              }
            }}
          >
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageClinicPage;
