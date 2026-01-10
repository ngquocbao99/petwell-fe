import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import SummaryApi from '@common/SummarryAPI';
import Axios from '@utils/Axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

// màu sắc và nhãn cho 4 trạng thái cuộc hẹn
const STATUS_COLORS: Record<string, string> = {
    pending: '#FFA726',
    confirmed: '#42A5F5',
    completed: '#66BB6A',
    canceled: '#EF5350',
};
// nhãn cho các trạng thái cuộc hẹn
const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    canceled: 'Canceled',
};

// lấy năm và tháng hiện tại
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // tháng trong JavaScript bắt đầu từ 0, nên cần cộng thêm 1
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// Component AppointmentStatus để hiển thị thống kê trạng thái cuộc hẹn
const AppointmentStatus: React.FC = () => {
    const { userId, role } = useSelector((state: any) => state.user);
    const [clinicId, setClinicId] = useState<string | null>(null);
    const [clinicName, setClinicName] = useState('');
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [doctors, setDoctors] = useState<any[]>([]);

    // lấy danh sách phòng khám của người dùng
    // nếu người dùng là quản lý thì sẽ lấy phòng khám mà họ quản lý
    useEffect(() => {
        (async () => {
            try {
                const res = await Axios(SummaryApi.clinic.list);
                const clinics = res.data.data || [];
                const myClinic = clinics.find((c: any) => c.managerId === userId);// Tìm phòng khám mà người dùng quản lý
                if (myClinic) {
                    setClinicId(myClinic._id);// Lưu ID phòng khám
                    setClinicName(myClinic.name);// Lưu tên phòng khám
                }
            } catch {
                setClinicId(null);
            }
        })();
    }, [userId]);

    // lấy danh sách bác sĩ của phòng khám 
    useEffect(() => {
        // nếu không có clinicId thì không cần gọi API
        if (!clinicId) return;
        (async () => {
            try {
                const res = await Axios(SummaryApi.doctor.listByClinicId(clinicId));// Gọi API lấy danh sách bác sĩ theo clinicId
                setDoctors(res.data.data || []);
            } catch {
                setDoctors([]);
            }
        })();
    }, [clinicId]);

    // lấy thống kê trạng thái cuộc hẹn theo tháng
    useEffect(() => {
        if (!clinicId) return;// nếu không có clinicId thì không cần gọi API
        (async () => {
            setLoading(true);
            try {
                const apiCall = doctorId
                    ? SummaryApi.statistics.getDoctorAppointmentStatusByMonth(clinicId, doctorId, year, month)
                    : SummaryApi.statistics.getAppointmentStatusByMonth(clinicId, year, month);
                // Gọi API lấy thống kê trạng thái cuộc hẹn theo tháng
                // nếu có doctorId thì lấy thống kê theo bác sĩ, nếu không thì lấy thống kê chung
                const res = await Axios(apiCall);
                const data = res.data.data || {};
                const counts = data.appointmentStatusCounts || {};
                const percents = data.appointmentStatusPercentages || {};
                const statuses = ['pending', 'confirmed', 'completed', 'canceled'];
                const fullData = statuses.map((status) => ({
                    status,
                    count: counts[status] || 0,
                    percent: percents[status] || 0,
                }));
                setTotal(data.totalAppointments || 0);// Lưu tổng số cuộc hẹn
                setStatusData(fullData);// Lưu dữ liệu trạng thái cuộc hẹn
            } catch {
                setStatusData([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [clinicId, year, month, doctorId]);

    // kiểm tra quyền truy cập của người dùng
    // nếu không phải là quản lý thì hiển thị thông báo không có quyền truy cập
    if (role !== 'manager') {
        toast.error('You are not allowed to view appointment statistics.');
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <Box textAlign="center">
                    <Typography variant="h4" color="error" gutterBottom>
                        Access Denied
                    </Typography>
                    <Typography>You do not have permission to view this page.</Typography>
                </Box>
            </Box>
        );
    }

    // nếu không có dữ liệu phòng khám thì hiển thị thông báo không có dữ liệu
    const pieData = statusData.filter((entry) => entry.count > 0);

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
                Appointment Status - {clinicName}
            </Typography>

            {/* Filters */}
            <Box display="flex" gap={2} justifyContent="flex-end" alignItems="center" mb={4} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
                        {Array.from({ length: 2 }, (_, i) => currentYear - 1 + i).map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Month</InputLabel>
                    <Select value={month} label="Month" onChange={(e) => setMonth(Number(e.target.value))}>
                        {monthNames.map((name, idx) => {
                            const m = idx + 1;
                            const disabled = year === currentYear && m > currentMonth;
                            return (
                                <MenuItem key={m} value={m} disabled={disabled}>
                                    {name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Doctor</InputLabel>
                    <Select value={doctorId || ''} label="Doctor" onChange={(e) => setDoctorId(e.target.value || null)}>
                        <MenuItem value="">All Doctors</MenuItem>
                        {doctors.map((doc) => (
                            <MenuItem key={doc._id} value={doc._id}>{doc.fullName}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                    <CircularProgress />
                </Box>
            ) : pieData.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={300}>
                    <Typography variant="h6" color="text.disabled">No appointment data</Typography>
                    <Typography variant="body2" color="text.secondary">
                        There are no appointments for {monthNames[month - 1]} {year}.
                    </Typography>
                </Box>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={140}
                                label={({ status, count }) =>
                                    `${STATUS_LABELS[status] || status}: ${count} (${Math.round((count / total) * 100)}%)`
                                }
                            >
                                {pieData.map((entry) => (
                                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <Box sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #ccc', borderRadius: 1, boxShadow: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {STATUS_LABELS[data.status]}: {data.count} appointments
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Ratio: {data.percent.toFixed(2)}%
                                                </Typography>
                                            </Box>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                layout="vertical"
                                verticalAlign="top"
                                align="right"
                                payload={pieData.map((entry) => ({
                                    value: STATUS_LABELS[entry.status],
                                    type: 'square',
                                    color: STATUS_COLORS[entry.status],
                                    id: entry.status,
                                }))}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <Typography variant="h6" textAlign="center" mt={2}>
                        Appointment Status in {month}/{year}
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default AppointmentStatus;
