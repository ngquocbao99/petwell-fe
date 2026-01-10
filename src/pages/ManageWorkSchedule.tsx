import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Stack, Tooltip, MenuItem, Chip, Paper, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CalendarMonth as CalendarMonthIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import Axios from '../utils/Axios';
import toast from 'react-hot-toast';
import Container from '@mui/material/Container';
import { useSelector } from 'react-redux';

interface WorkSchedule {
  _id?: string;
  doctorId: string | { _id: string; fullName: string };
  clinicId: string | { _id: string; name: string };
  work_Date: string;
  start_time: string;
  end_time: string;
  swappedWith?: string;
  status: string;
  appointmentCount?: number;
  isDeleted?: boolean;
}

interface Doctor {
  _id: string;
  fullName: string;
  clinicId?: string;
}

interface Clinic {
  _id: string;
  name: string;
}

interface FormErrors {
  doctorId?: string;
  clinicId?: string;
  work_Date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
}

interface TouchedFields {
  doctorId?: boolean;
  clinicId?: boolean;
  work_Date?: boolean;
  start_time?: boolean;
  end_time?: boolean;
  status?: boolean;
}

const ManageWorkSchedule: React.FC = () => {
  // CRITICAL: ALL HOOKS MUST BE AT THE TOP LEVEL - NO CONDITIONAL CALLS
  const user = useSelector((state: any) => state.user);
  
  // ALL useState hooks declared at the very top
  const [isLoading, setIsLoading] = useState(true);
  const [showClinicError, setShowClinicError] = useState(false);
  const [checkingClinic, setCheckingClinic] = useState(false);
  const [userClinicId, setUserClinicId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [form, setForm] = useState<WorkSchedule>({
    doctorId: '',
    clinicId: '',
    work_Date: '',
    start_time: '',
    end_time: '',
    swappedWith: '',
    status: 'active',
  });
  const [openForm, setOpenForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ALL useEffect hooks declared after useState hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Set userClinicId when component mounts or user changes
  useEffect(() => {
    const initializeClinicId = async () => {
      if (user.role === 'staff') {
        const currentUserId = user._id || user.id;
        
        // Clear any existing clinic data when user changes
        if (currentUserId) {
          // Remove old generic clinic data
          localStorage.removeItem('userClinicId');
          
          // Use user-specific localStorage key
          const userSpecificKey = `userClinicId_${currentUserId}`;
          
          // First try to get clinic ID from Redux user state
          let clinicId = user.clinicId || user.clinic_id || user.clinic;
          
          if (!clinicId) {
            // Try user-specific localStorage
            const storedClinicId = localStorage.getItem(userSpecificKey);
            if (storedClinicId) {
              clinicId = storedClinicId;
            } else {
              // Try API to fetch fresh data
              try {
                const response = await Axios.get(`/api/v1/profiles/${currentUserId}`);
                
                if (response.data && response.data.data) {
                  const userData = response.data.data;
                  const fetchedClinicId = userData.clinicId || userData.clinic_id || userData.clinic;
                  
                  if (fetchedClinicId) {
                    clinicId = fetchedClinicId;
                    localStorage.setItem(userSpecificKey, fetchedClinicId);
                  }
                }
              } catch (error) {
                // Error fetching clinic ID from API
              }
            }
          } else {
            localStorage.setItem(userSpecificKey, clinicId);
          }
          
          setUserClinicId(clinicId);
        } else {
          // If no user ID, clear clinic data
          setUserClinicId(null);
        }
      } else {
        // If not staff, clear clinic data
        setUserClinicId(null);
      }
    };
    
    initializeClinicId();
  }, [user._id, user.id, user.role, user.clinicId, user.clinic_id, user.clinic]); // Add user properties to dependency array

  useEffect(() => {
    if (!isLoading && userClinicId !== null) {
      fetchSchedules();
      fetchDoctors();
      fetchClinics();
      fetchAppointments();
    }
  }, [userClinicId, isLoading]);

  useEffect(() => {
    const checkStaffClinic = async () => {
      if (!isLoading && user.role === 'staff') {
        if (!userClinicId) {
          setCheckingClinic(true);
          
          try {
            const userId = user._id || user.id || localStorage.getItem('userId') || localStorage.getItem('user_id');
            
            if (userId) {
              const response = await Axios.get(`/api/v1/profiles/${userId}`);
              
              if (response.data && response.data.data) {
                const userData = response.data.data;
                const fallbackClinicId = userData.clinicId || userData.clinic_id || userData.clinic;
                
                if (fallbackClinicId) {
                  setCheckingClinic(false);
                  setUserClinicId(fallbackClinicId);
                  
                  // Store in localStorage for future use
                  localStorage.setItem('userClinicId', fallbackClinicId);
                  
                  toast.success('Clinic assignment found and data refreshed!');
                  return;
                }
              }
            }
          } catch (error) {
            // Error fetching user profile data
          }
          
          setCheckingClinic(false);
          setShowClinicError(true);
        } else {
          setCheckingClinic(false);
          setShowClinicError(false);
          // Store in localStorage for consistency
          localStorage.setItem('userClinicId', userClinicId);
        }
      }
    };
    
    checkStaffClinic();
  }, [user.role, isLoading, userClinicId]);

  // ALL useMemo hooks after useEffect
  const filteredSchedules = React.useMemo(() => {
    if (user.role === 'staff' && userClinicId) {
      const filteredResults = schedules.filter((schedule: WorkSchedule) => {
        const scheduleClinicId = typeof schedule.clinicId === 'object' 
          ? schedule.clinicId._id 
          : schedule.clinicId;
        
        return scheduleClinicId === userClinicId;
      });
      
      return filteredResults.map((schedule: WorkSchedule) => {
        const scheduleAppointmentCount = appointments.filter((appointment: any) => {
          const appointmentScheduleId = typeof appointment.workScheduleId === 'object' 
            ? appointment.workScheduleId._id 
            : appointment.workScheduleId;
          
          const appointmentClinicId = typeof appointment.clinicId === 'object'
            ? appointment.clinicId._id
            : appointment.clinicId;
          
          return appointmentScheduleId === schedule._id && appointmentClinicId === userClinicId;
        }).length;

        return {
          ...schedule,
          appointmentCount: scheduleAppointmentCount
        };
      });
    }
    
    return schedules.map((schedule: WorkSchedule) => {
      const scheduleAppointmentCount = appointments.filter((appointment: any) => {
        const appointmentScheduleId = typeof appointment.workScheduleId === 'object' 
          ? appointment.workScheduleId._id 
          : appointment.workScheduleId;
        
        return appointmentScheduleId === schedule._id;
      }).length;

      return {
        ...schedule,
        appointmentCount: scheduleAppointmentCount
      };
    });
  }, [schedules, appointments, user.role, userClinicId]);

  const sortedSchedules = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return [...filteredSchedules].sort((a, b) => {
      const dateA = new Date(a.work_Date);
      const dateB = new Date(b.work_Date);
      
      const isPastA = dateA < today;
      const isPastB = dateB < today;
      
      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      
      if (!isPastA && !isPastB) {
        return dateA.getTime() - dateB.getTime();
      }
      
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredSchedules]);

  // Helper functions defined after all hooks
  const fetchSchedules = async () => {
    try {
      const res = await Axios.get('/api/v1/work-schedules');
      const allSchedules = (res.data.data || []).filter((s: WorkSchedule) => !s.isDeleted);
      setSchedules(allSchedules);
    } catch (error) {
      toast.error('Failed to fetch work schedules');
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await Axios.get('/api/v1/profiles');
      const allDoctorsData = (res.data.data || []).filter((u: any) => u.role === 'doctor');
      setAllDoctors(allDoctorsData);
      
      if (user.role === 'staff' && userClinicId) {
        const filteredDoctors = allDoctorsData.filter((doctor: any) => {
          return doctor.clinicId === userClinicId;
        });
        setDoctors(filteredDoctors);
      } else {
        setDoctors(allDoctorsData);
      }
    } catch {
      toast.error('Failed to fetch doctors');
    }
  };

  const filterDoctorsByClinic = (clinicId: string) => {
    if (!clinicId) {
      setDoctors(allDoctors);
    } else {
      const filteredDoctors = allDoctors.filter((doctor: any) => doctor.clinicId === clinicId);
      setDoctors(filteredDoctors);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await Axios.get('/api/v1/clinics/view-all-clinic');
      const allClinics = res.data.data || [];
      
      if (user.role === 'staff' && userClinicId) {
        const filteredClinics = allClinics.filter((clinic: Clinic) => clinic._id === userClinicId);
        setClinics(filteredClinics);
        
        // If no clinic found with the userClinicId, try to get clinic info directly
        if (filteredClinics.length === 0) {
          try {
            const directClinicRes = await Axios.get(`/api/v1/clinics/${userClinicId}`);
            if (directClinicRes.data && directClinicRes.data.data) {
              setClinics([directClinicRes.data.data]);
            }
          } catch (directError) {
            // Failed to fetch clinic directly
          }
        }
      } else {
        setClinics(allClinics);
      }
    } catch (error) {
      toast.error('Failed to fetch clinics');
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await Axios.get('/api/v1/appointments/view-all-appointment');
      const allAppointments = res.data.data || [];
      
      if (user.role === 'staff' && userClinicId) {
        const filteredAppointments = allAppointments.filter((appointment: any) => {
          const appointmentClinicId = typeof appointment.clinicId === 'object'
            ? appointment.clinicId._id
            : appointment.clinicId;
          
          return appointmentClinicId === userClinicId;
        });
        setAppointments(filteredAppointments);
      } else {
        setAppointments(allAppointments);
      }
    } catch (error: any) {
      try {
        const res = await Axios.get('/api/v1/appointment/view-all-appointment');
        const allAppointments = res.data.data || [];
        
        if (user.role === 'staff' && userClinicId) {
          const filteredAppointments = allAppointments.filter((appointment: any) => {
            const appointmentClinicId = typeof appointment.clinicId === 'object'
              ? appointment.clinicId._id
              : appointment.clinicId;
            
            return appointmentClinicId === userClinicId;
          });
          setAppointments(filteredAppointments);
        } else {
          setAppointments(allAppointments);
        }
      } catch (secondError: any) {
        setAppointments([]);
      }
    }
  };

  const getFilteredAppointmentsForSchedule = (scheduleId: string) => {
    return appointments.filter((appointment: any) => {
      const appointmentScheduleId = typeof appointment.workScheduleId === 'object' 
        ? appointment.workScheduleId._id 
        : appointment.workScheduleId;
      
      return appointmentScheduleId === scheduleId;
    });
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Validate clinic assignment for staff
    if (user.role === 'staff') {
      if (!userClinicId) {
        toast.error('Staff user does not have a clinic assigned. Please contact administrator.');
        return false;
      }
      // Auto-assign clinic for staff
      if (!form.clinicId) {
        setForm(prev => ({ ...prev, clinicId: userClinicId }));
      }
    } else if (user.role === 'admin' && !form.clinicId) {
      newErrors.clinicId = 'Please select a store';
    }
    
    if (!form.doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }
    
    // Validate that selected doctor belongs to staff's clinic
    if (user.role === 'staff' && form.doctorId) {
      const selectedDoctor = allDoctors.find(d => d._id === form.doctorId);
      if (selectedDoctor && selectedDoctor.clinicId !== userClinicId) {
        newErrors.doctorId = 'Selected doctor does not belong to your clinic';
      }
    }
    
    if (!form.work_Date) {
      newErrors.work_Date = 'Please select a work date';
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const workDate = new Date(form.work_Date);
      if (workDate < today) {
        newErrors.work_Date = 'Work date cannot be in the past';
      }
    }
    if (!form.start_time) {
      newErrors.start_time = 'Please select a start time';
    }
    if (!form.end_time) {
      newErrors.end_time = 'Please select an end time';
    }
    if (form.start_time && form.end_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(form.start_time) || !timeRegex.test(form.end_time)) {
        newErrors.start_time = 'Invalid time format (HH:mm)';
        newErrors.end_time = 'Invalid time format (HH:mm)';
      } else {
        const [startHour, startMinute] = form.start_time.split(':').map(Number);
        const [endHour, endMinute] = form.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        if (endMinutes <= startMinutes) {
          newErrors.end_time = 'End time must be after start time';
        }
        if (endMinutes - startMinutes < 30) {
          newErrors.end_time = 'Working time must be at least 30 minutes';
        }
      }
    }
    if (!form.status) {
      newErrors.status = 'Please select a status';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === 'clinicId' && user.role === 'admin') {
      filterDoctorsByClinic(value);
      setForm(prev => ({ ...prev, doctorId: '' }));
    }
  };

  const handleOpenCreate = () => {
    const initialClinicId = user.role === 'staff' && userClinicId ? userClinicId : '';
    
    // For staff, ensure they only see doctors from their clinic
    if (user.role === 'staff' && userClinicId) {
      const staffDoctors = allDoctors.filter((doctor: any) => doctor.clinicId === userClinicId);
      setDoctors(staffDoctors);
      
      if (staffDoctors.length === 0) {
        toast.error(`No doctors found in your clinic${clinics.length > 0 ? ` "${clinics[0].name}"` : ''}. Please contact administrator.`);
      }
    }
    
    setForm({
      doctorId: '',
      clinicId: initialClinicId,
      work_Date: '',
      start_time: '',
      end_time: '',
      swappedWith: '',
      status: 'active',
    });
    setIsEditing(false);
    setOpenForm(true);
    setSelectedId(null);
    setErrors({});
    setTouched({});
  };

  const isSchedulePastDate = (schedule: WorkSchedule): boolean => {
    if (schedule.work_Date) {
      const workDate = new Date(schedule.work_Date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return workDate < today;
    }
    return false;
  };
  
  const isScheduleEditable = (schedule: WorkSchedule): boolean => {
    if (schedule.appointmentCount && schedule.appointmentCount > 0) {
      return false;
    }
    
    return !isSchedulePastDate(schedule);
  };

  const handleEdit = (schedule: WorkSchedule) => {
    if (!isScheduleEditable(schedule)) {
      toast.error('Cannot edit past schedules or schedules with appointments');
      return;
    }
    
    if (user.role === 'staff' && userClinicId) {
      const staffDoctors = allDoctors.filter((doctor: any) => doctor.clinicId === userClinicId);
      setDoctors(staffDoctors);
    } else if (user.role === 'admin') {
      const scheduleClinicId = typeof schedule.clinicId === 'object' ? schedule.clinicId._id : schedule.clinicId;
      if (scheduleClinicId) {
        filterDoctorsByClinic(scheduleClinicId);
      }
    }
    
    setForm({
      ...schedule,
      doctorId: typeof schedule.doctorId === 'object' ? schedule.doctorId._id : schedule.doctorId,
      clinicId: typeof schedule.clinicId === 'object' ? schedule.clinicId._id : schedule.clinicId,
      work_Date: schedule.work_Date ? new Date(schedule.work_Date).toISOString().slice(0,10) : '',
      start_time: schedule.start_time ? new Date(schedule.start_time).toTimeString().slice(0,5) : '',
      end_time: schedule.end_time ? new Date(schedule.end_time).toTimeString().slice(0,5) : '',
    });
    setIsEditing(true);
    setOpenForm(true);
    setSelectedId(schedule._id || null);
  };

  const handleDeleteClick = (id: string, appointmentCount?: number, schedule?: WorkSchedule) => {
    if (appointmentCount && appointmentCount > 0) {
      toast.error('Cannot delete schedule with existing appointments');
      return;
    }
    
    if (schedule && schedule.work_Date) {
      const workDate = new Date(schedule.work_Date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (workDate < today) {
        toast.error('Cannot delete past schedules');
        return;
      }
    }
    
    setDeleteId(id);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await Axios.delete(`/api/v1/work-schedules/${deleteId}`);
      toast.success('Deleted successfully');
      fetchSchedules();
      setDeleteDialog(false);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      doctorId: '',
      clinicId: '',
      work_Date: '',
      start_time: '',
      end_time: '',
      swappedWith: '',
      status: 'active',
    });
    setErrors({});
    setTouched({});
    setIsEditing(false);
    setSelectedId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      doctorId: true,
      clinicId: true,
      work_Date: true,
      start_time: true,
      end_time: true,
      status: true
    });
    const valid = validateForm();
    if (!valid) {
      toast.error('Please check the information again!');
      return;
    }
    setLoading(true);
    try {
      const workDate = new Date(form.work_Date);
      workDate.setHours(0, 0, 0, 0);
      const [startHour, startMinute] = form.start_time.split(':').map(Number);
      const [endHour, endMinute] = form.end_time.split(':').map(Number);
      const startDateTime = new Date(workDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      const endDateTime = new Date(workDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      const doctorId = form.doctorId;
      if (!doctorId) {
        toast.error('Please select a doctor.');
        setLoading(false);
        return;
      }
      
      let finalClinicId;
      if (user.role === 'staff') {
        if (!userClinicId) {
          toast.error('Staff user does not have a clinic assigned. Please contact administrator.');
          setLoading(false);
          return;
        }
        finalClinicId = userClinicId;
        
        // Double-check that the selected doctor belongs to staff's clinic
        const selectedDoctor = allDoctors.find(d => d._id === doctorId);
        if (selectedDoctor && selectedDoctor.clinicId !== userClinicId) {
          toast.error('Selected doctor does not belong to your clinic. Please select a doctor from your clinic.');
          setLoading(false);
          return;
        }
      } else {
        finalClinicId = form.clinicId;
      }
      
      const formData = {
        doctorId,
        clinicId: finalClinicId,
        work_Date: workDate.toISOString(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: form.status
      };
      
      if (isEditing && selectedId) {
        const res = await Axios.put(`/api/v1/work-schedules/${selectedId}`, formData);
        if (res.data.success) {
          toast.success('Schedule updated successfully');
          setOpenForm(false);
          fetchSchedules();
          resetForm();
        }
      } else {
        const res = await Axios.post('/api/v1/work-schedules', formData);
        if (res.data.success) {
          toast.success('Schedule created successfully');
          setOpenForm(false);
          fetchSchedules();
          resetForm();
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh clinic information for staff users
  const refreshClinicInfo = async () => {
    if (user.role === 'staff') {
      try {
        const userId = user._id || user.id || localStorage.getItem('userId') || localStorage.getItem('user_id');
        
        if (userId) {
          const response = await Axios.get(`/api/v1/profiles/${userId}`);
          
          if (response.data && response.data.data) {
            const userData = response.data.data;
            const fetchedClinicId = userData.clinicId || userData.clinic_id || userData.clinic;
            
            if (fetchedClinicId && fetchedClinicId !== userClinicId) {
              localStorage.setItem('userClinicId', fetchedClinicId);
              setUserClinicId(fetchedClinicId);
              
              // Force refresh all data with new clinic
              fetchSchedules();
              fetchDoctors();
              fetchClinics();
              fetchAppointments();
            }
          }
        }
      } catch (error) {
        // Error refreshing clinic info
      }
    }
  };

  // Check for clinic assignment changes periodically for staff users
  useEffect(() => {
    if (user.role === 'staff' && userClinicId) {
      const interval = setInterval(() => {
        refreshClinicInfo();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [user.role, userClinicId]);

  // Early returns after all hooks and function definitions
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ color: '#ff8c2b', mb: 2 }} />
          <Typography variant="h6" color="#b97a56">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (user.role !== 'admin' && user.role !== 'staff') {
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

  if (checkingClinic) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
          <CircularProgress size={40} sx={{ color: '#ff8c2b', mb: 2 }} />
          <Typography variant="h6" color="#b97a56">Checking clinic assignment...</Typography>
        </Box>
      </Container>
    );
  }
  
  if (showClinicError) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
          <Typography variant="h4" color="error" gutterBottom>
            No Clinic Assigned
          </Typography>
          <Typography variant="body1">
            You are a staff member but no clinic has been assigned to your account. 
            Please contact the administrator to assign you to a clinic.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            User ID: {user._id || user.userId || 'N/A'}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
        </Box>
      </Container>
    );
  }

  // UI
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="#b97a56">Work Schedules</Typography>
            <Typography variant="subtitle1" color="#b97a56" sx={{ mt: 0.5 }}>
              {user.role === 'staff' 
                ? `Managing schedules for your clinic${clinics.length > 0 ? ` - ${clinics[0].name}` : userClinicId ? ` (ID: ${userClinicId})` : ''}`
                : 'Manage doctor schedules across all stores'
              }
            </Typography>
            {user.role === 'staff' && (clinics.length > 0 || userClinicId) && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: '#e6f9ed', borderRadius: 2, border: '1px solid #3bb77e' }}>
                <Typography variant="body2" color="#3bb77e" fontWeight={600}>
                  🏥 Your Clinic: {clinics.length > 0 ? clinics[0].name : `Clinic ID: ${userClinicId}`}
                </Typography>
                <Typography variant="body2" color="#3bb77e">
                  📊 Total Schedules: {filteredSchedules.length} | 
                  👨‍⚕️ Doctors Available: {doctors.length}
                </Typography>
              </Box>
            )}
          </Box>
          <Box>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => {
              fetchSchedules();
              fetchDoctors();
              fetchClinics();
              fetchAppointments();
            }} sx={{ mr: 2, bgcolor: '#fbeee6', color: '#b97a56', borderColor: '#fbeee6', fontWeight: 600, '&:hover': { bgcolor: '#f3e1d2' } }}>Refresh</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ bgcolor: '#ff8c2b', fontWeight: 600, boxShadow: 2, '&:hover': { bgcolor: '#ffb366' } }}>
               Add Schedule
            </Button>
          </Box>
        </Box>
        {sortedSchedules.length === 0 ? (
          <Paper elevation={3} sx={{ p: 6, textAlign: 'center', mt: 6, mb: 8, borderRadius: 3, bgcolor: '#fff7ed' }}>
            <CalendarMonthIcon sx={{ fontSize: 56, color: '#ffb366', mb: 2 }} />
            <Typography variant="h6" color="#b97a56" gutterBottom>No schedules found</Typography>
            <Typography variant="body2" color="#b97a56" sx={{ mb: 3 }}>
              {user.role === 'staff' 
                ? `No work schedules found for your clinic${clinics.length > 0 ? ` "${clinics[0].name}"` : ''}.`
                : 'Add your first schedule to get started'
              }
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ bgcolor: '#ff8c2b', fontWeight: 600, '&:hover': { bgcolor: '#ffb366' } }}>
              {user.role === 'staff' ? '+ Add Schedule for Your Clinic' : '+ Add Your First Schedule'}
            </Button>
          </Paper>
        ) : (
          <Stack spacing={4}>
            {/* Upcoming Schedules Section */}
            <Box>
              <Typography variant="h6" fontWeight={600} color="#b97a56" sx={{ mt: 2, mb: 2 }}>
                Upcoming Schedules
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={4} justifyContent="flex-start">
                {                sortedSchedules
                  .filter(schedule => !isSchedulePastDate(schedule))
                  .map((item) => {
                    const doctor = typeof item.doctorId === 'object' ? item.doctorId : doctors.find(d => d._id === item.doctorId);
                    const clinic = typeof item.clinicId === 'object' ? item.clinicId : clinics.find(c => c._id === item.clinicId);
                    const filteredAppointments = getFilteredAppointmentsForSchedule(item._id!);
                    const appointmentCount = filteredAppointments.length;
                    
                    return (
                      <Paper 
                        key={item._id} 
                        elevation={3} 
                        sx={{ 
                          minWidth: 350, 
                          maxWidth: 400, 
                          borderRadius: 3, 
                          border: '2px solid #ffb366', 
                          bgcolor: '#fff', 
                          p: 0, 
                          overflow: 'hidden', 
                          position: 'relative' 
                        }}
                      >
                        <Box sx={{ p: 2, pb: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body2" color="#b97a56" fontWeight={600}>
                              {doctor?.fullName ? doctor.fullName : (
                                <>
                                  <span role="img" aria-label="no-doctor">📌</span> No doctors registered yet!
                                </>
                              )}
                            </Typography>
                            <Chip 
                              label={item.status === 'active' ? 'Opening' : item.status} 
                              size="small" 
                              sx={{ bgcolor: '#e6f9ed', color: '#3bb77e', fontWeight: 600, ml: 1 }} 
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span role="img" aria-label="store">🏪</span>
                            <Typography variant="body2" color="#b97a56" fontWeight={500}>Store: {clinic?.name || 'Unknown'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span role="img" aria-label="calendar">📅</span>
                            <Typography variant="body2" color="#b97a56">{item.work_Date?.slice(0,10)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span role="img" aria-label="clock">⏰</span>
                            <Typography variant="body2" color="#b97a56">
                              {item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              {' - '}
                              {item.end_time ? new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, p: 1.5, pt: 0, bgcolor: '#fff7ed', borderTop: '1px solid #ffe0b2' }}>
                          <Tooltip title={
                            appointmentCount > 0
                              ? 'Cannot edit schedule with appointments' 
                              : 'Edit'
                          }>
                            <span>
                              <IconButton 
                                color="warning" 
                                onClick={() => handleEdit(item)} 
                                disabled={!isScheduleEditable({...item, appointmentCount})}
                                sx={{
                                  opacity: isScheduleEditable({...item, appointmentCount}) ? 1 : 0.5,
                                  '&.Mui-disabled': {
                                    opacity: 0.5,
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={
                            appointmentCount > 0
                              ? 'Cannot delete schedule with appointments' 
                              : 'Delete'
                          }>
                            <span>
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteClick(item._id!, appointmentCount, {...item, appointmentCount})} 
                                disabled={appointmentCount > 0 || !isScheduleEditable({...item, appointmentCount})}
                                sx={{
                                  opacity: (appointmentCount > 0 || !isScheduleEditable({...item, appointmentCount})) ? 0.5 : 1,
                                  '&.Mui-disabled': {
                                    opacity: 0.5,
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Paper>
                    );
                  })}
                {sortedSchedules.filter(schedule => !isSchedulePastDate(schedule)).length === 0 && (
                  <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No upcoming schedules found</Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Past Schedules Section */}
            <Box>
              <Typography variant="h6" fontWeight={600} color="#b97a56" sx={{ mt: 4, mb: 2 }}>
                Past Schedules
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={4} justifyContent="flex-start">
                {sortedSchedules
                  .filter(schedule => isSchedulePastDate(schedule))
                  .map((item) => {
                    const doctor = typeof item.doctorId === 'object' ? item.doctorId : doctors.find(d => d._id === item.doctorId);
                    const clinic = typeof item.clinicId === 'object' ? item.clinicId : clinics.find(c => c._id === item.clinicId);
                    const filteredAppointments = getFilteredAppointmentsForSchedule(item._id!);
                    const appointmentCount = filteredAppointments.length;
                    
                    return (
                      <Paper 
                        key={item._id} 
                        elevation={3} 
                        sx={{ 
                          minWidth: 350, 
                          maxWidth: 400, 
                          borderRadius: 3, 
                          border: '2px solid #ffb366', 
                          bgcolor: '#fff', 
                          p: 0, 
                          overflow: 'hidden', 
                          position: 'relative', 
                          opacity: 0.7,
                        }}
                      >
                        <Box sx={{ p: 2, pb: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body2" color="#b97a56" fontWeight={600}>
                              {doctor?.fullName ? doctor.fullName : (
                                <>
                                  <span role="img" aria-label="no-doctor">📌</span> No doctors registered yet!
                                </>
                              )}
                            </Typography>
                            <Chip 
                              label="Past" 
                              size="small" 
                              sx={{ bgcolor: '#fff0f0', color: '#d32f2f', fontWeight: 600, ml: 1 }} 
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span role="img" aria-label="store">🏪</span>
                            <Typography variant="body2" color="#b97a56" fontWeight={500}>Store: {clinic?.name || 'Unknown'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span role="img" aria-label="calendar">📅</span>
                            <Typography variant="body2" color="#b97a56">{item.work_Date?.slice(0,10)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span role="img" aria-label="clock">⏰</span>
                            <Typography variant="body2" color="#b97a56">
                              {item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              {' - '}
                              {item.end_time ? new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, p: 1.5, pt: 0, bgcolor: '#fff7ed', borderTop: '1px solid #ffe0b2' }}>
                          <Tooltip title="Cannot edit past schedules">
                            <span>
                              <IconButton 
                                color="warning" 
                                disabled={true}
                                sx={{ opacity: 0.5 }}
                              >
                                <EditIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cannot delete past schedules">
                            <span>
                              <IconButton 
                                color="error" 
                                disabled={true}
                                sx={{ opacity: 0.5 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Paper>
                    );
                  })}
                {sortedSchedules.filter(schedule => isSchedulePastDate(schedule)).length === 0 && (
                  <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No past schedules found</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => !deleteLoading && setDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            p: 1
          } 
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: '#d32f2f', pb: 1 }}>
          <Typography variant="h6" component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span role="img" aria-label="warning">⚠️</span> Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography align="center" sx={{ mb: 2 }}>
            Are you sure you want to delete this work schedule? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center', gap: 1 }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            color="inherit"
            disabled={deleteLoading}
            sx={{ minWidth: 100, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            sx={{ minWidth: 100, fontWeight: 600 }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 22, textAlign: 'center', color: '#b97a56', pb: 1 }}>          {isEditing ? 'Edit Work Schedule' : 'Create New Schedule'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {user.role === 'staff' ? (
              // Staff: Display clinic info (read-only)
              <Box sx={{ mb: 2 }}>
                <input 
                  type="hidden" 
                  name="clinicId" 
                  value={typeof form.clinicId === 'object' ? form.clinicId._id : form.clinicId} 
                />
                <Box sx={{ p: 2, bgcolor: '#e6f9ed', borderRadius: 2, border: '1px solid #3bb77e' }}>
                  <Typography variant="body2" color="#3bb77e" fontWeight={600} sx={{ mb: 1 }}>
                    🏥 Schedule for Your Clinic:
                  </Typography>
                  <Typography variant="h6" color="#3bb77e" fontWeight={700}>
                    {clinics.length > 0 ? clinics[0].name : userClinicId ? `Clinic ID: ${userClinicId}` : 'No clinic assigned'}
                  </Typography>
                  <Typography variant="body2" color="#3bb77e">
                    You can only create schedules for doctors in your clinic
                  </Typography>
                  {!userClinicId && (
                    <Typography variant="body2" color="#d32f2f" sx={{ mt: 1 }}>
                      ⚠️ No clinic assignment found. Please contact administrator.
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              // Admin: Selectable clinic field
              <TextField
                select
                name="clinicId" 
                label="Store"
                value={form.clinicId}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { 'aria-label': 'Store' }
                }}
                error={touched.clinicId && !!errors.clinicId}
                helperText={touched.clinicId && errors.clinicId}
                sx={{ mb: 2 }}
              >
                {clinics.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                ))}
              </TextField>
            )}

            {/* Doctor Selection - Always visible for both staff and admin */}
            <TextField
              select
              name="doctorId"
              label={user.role === 'staff' ? 'Select Doctor (from your clinic)' : 'Select Doctor'}
              value={form.doctorId}
              onChange={handleChange}
              fullWidth
              InputProps={{
                inputProps: { 'aria-label': 'Doctor' }
              }}
              error={touched.doctorId && !!errors.doctorId}
              helperText={
                touched.doctorId && errors.doctorId 
                  ? errors.doctorId 
                  : user.role === 'staff' 
                    ? `Showing doctors from your clinic only (${doctors.length} available)`
                    : `${doctors.length} doctors available`
              }
              sx={{ mb: 2 }}
            >
              {doctors.length === 0 ? (
                <MenuItem disabled value="">
                  {user.role === 'staff' ? 'No doctors available in your clinic' : 'No doctors available'}
                </MenuItem>
              ) : (
                doctors.map((doctor) => (
                  <MenuItem key={doctor._id} value={doctor._id}>
                    {doctor.fullName}
                  </MenuItem>
                ))
              )}
            </TextField>

            <TextField
              name="work_Date"
              label="Work Date"
              type="date"
              value={form.work_Date?.slice(0,10)}
              onChange={handleChange}
              fullWidth
              InputProps={{
                inputProps: {
                  'aria-label': 'Work Date',
                  min: new Date().toISOString().slice(0,10) // Only allow today and future dates
                }
              }}
              InputLabelProps={{ shrink: true }}
              error={touched.work_Date && !!errors.work_Date}
              helperText={touched.work_Date && errors.work_Date}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                name="start_time"
                label="Start Time"
                type="time"
                value={form.start_time}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { 'aria-label': 'Start Time' }
                }}
                InputLabelProps={{ shrink: true }}                error={touched.start_time && !!errors.start_time}
                helperText={touched.start_time && errors.start_time}
              />
              <TextField
                name="end_time"
                label="End Time"
                type="time"
                value={form.end_time}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { 'aria-label': 'End Time' }
                }}
                InputLabelProps={{ shrink: true }}
                error={touched.end_time && !!errors.end_time}
                helperText={touched.end_time && errors.end_time}
              />
            </Box>

            <TextField              select
              name="status"
              label="Status"
              value={form.status}
              onChange={handleChange}
              fullWidth
              InputProps={{
                inputProps: { 'aria-label': 'Status' }
              }}
              error={touched.status && !!errors.status}
              helperText={touched.status && errors.status}
              sx={{ mb: 2 }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => {
                setOpenForm(false);
                setErrors({});
                setTouched({});
              }} 
              color="inherit" 
              sx={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 120, fontWeight: 600, bgcolor: '#ff8c2b', '&:hover': { bgcolor: '#ffb366' } }}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ManageWorkSchedule;
