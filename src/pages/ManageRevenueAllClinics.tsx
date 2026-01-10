import React, { useEffect, useState, useCallback } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@mui/material";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";
import SummaryApi from "@common/SummarryAPI";
import Axios from "@utils/Axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

// khai báo kiểu dữ liệu cho doanh thu phòng khám
interface ClinicRevenue {
    clinicId: string;
    clinicName: string;
    revenue: number;
    appointmentCount: number;
}

// lấy ngày hiện tại, năm và tháng hiện tại
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Component để quản lý doanh thu của tất cả các phòng khám
const ManageRevenueAllClinics: React.FC = () => {
    const role = useSelector((state: any) => state.user.role);
    const [filterType, setFilterType] = useState<"month" | "last7days">("month");
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [loading, setLoading] = useState(false);
    const [clinics, setClinics] = useState<{ clinicId: string; clinicName: string }[]>([]);
    const [data, setData] = useState<ClinicRevenue[]>([]);

    // Hàm để lấy danh sách tất cả các phòng khám
    // sử dụng useCallback để tránh tạo lại hàm mỗi lần render
    const fetchAllClinics = useCallback(async () => {
        try {
            const res = await Axios(SummaryApi.clinic.list);
            setClinics(
                (res.data.data || []).map((c: any) => ({
                    clinicId: c._id,
                    clinicName: c.name?.trim() || "Unnamed Clinic",
                }))
            );
        } catch {
            toast.error("Failed to load clinic list");
        }
    }, []);

    // Hàm để lấy doanh thu của tất cả các phòng khám
    // Dựa trên filterType, sẽ gọi API tương ứng để lấy doanh thu theo tháng hoặc 7 ngày gần nhất
    const fetchRevenue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await Axios(
                filterType === "month"
                    ? SummaryApi.statistics.getAllClinicsRevenueByMonth(year, month)// Gọi API lấy doanh thu theo tháng
                    : SummaryApi.statistics.getAllClinicsRevenueLast7Days()// Gọi API lấy doanh thu trong 7 ngày gần nhất
            );
            // Tạo một Map để ánh xạ clinicId với doanh thu và số cuộc hẹn
            // sau đó kết hợp với danh sách phòng khám đã lấy trước đó
            const map = new Map(
                (res.data.data || []).map((i: any) => [
                    i.clinicId,
                    {
                        clinicId: i.clinicId,
                        clinicName: i.clinicName?.trim() || "Unnamed Clinic",// Tên phòng khám, nếu không có thì đặt là "Unnamed Clinic"
                        revenue: i.totalRevenue || 0,// Doanh thu, nếu không có thì đặt là 0
                        appointmentCount: i.appointmentCount || 0,// Số cuộc hẹn, nếu không có thì đặt là 0
                    } as ClinicRevenue,
                ])
            );
            // Kết hợp dữ liệu doanh thu với danh sách phòng khám
            // nếu phòng khám không có doanh thu thì sẽ tạo một đối tượng mới với doanh thu và số cuộc hẹn là 0
            const merged: ClinicRevenue[] = clinics.map(c => map.get(c.clinicId) || {
                clinicId: c.clinicId,
                clinicName: c.clinicName,
                revenue: 0,
                appointmentCount: 0
            });
            setData(merged);// Cập nhật dữ liệu doanh thu
        } catch (err: any) {
            console.error("Revenue fetch error:", err);
            toast.error(err?.response?.data?.message || "Failed to fetch revenue data");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [filterType, year, month, clinics]);

    // useEffect để lấy danh sách phòng khám khi component được mount
    // và khi fetchAllClinics thay đổi
    useEffect(() => {
        fetchAllClinics();
    }, [fetchAllClinics]);

    // useEffect để lấy doanh thu của tất cả các phòng khám khi clinics thay đổi
    useEffect(() => {
        if (clinics.length) fetchRevenue();
    }, [clinics, fetchRevenue]);

    // Kiểm tra quyền truy cập của người dùng
    // nếu không phải là admin thì hiển thị thông báo không có quyền truy cập
    if (role !== "admin") {
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
    // Kiểm tra xem có dữ liệu doanh thu hay không
    // nếu không có dữ liệu doanh thu thì hiển thị thông báo không có dữ liệu
    const hasData = data.some(d => d.revenue > 0);

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={668} mb={3} textAlign="center">
                Revenue Statistics for All Clinics
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={2} justifyContent="flex-end" mb={4}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Filter Type</InputLabel>
                    <Select
                        value={filterType}
                        label="Filter Type"
                        onChange={e => setFilterType(e.target.value as any)}
                    >
                        <MenuItem value="month">By Month</MenuItem>
                        <MenuItem value="last7days">Last 7 Days</MenuItem>
                    </Select>
                </FormControl>

                {filterType === "month" && (
                    <>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={year}
                                label="Year"
                                onChange={e => setYear(Number(e.target.value))}
                            >
                                {[currentYear - 1, currentYear].map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={month}
                                label="Month"
                                onChange={e => setMonth(Number(e.target.value))}
                            >
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
                    </>
                )}
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                    <CircularProgress />
                </Box>
            ) : !hasData ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={300}>
                    <Typography variant="h6" color="text.disabled" gutterBottom>No revenue data</Typography>
                    <Typography color="text.secondary">
                        There is no recorded revenue for {filterType === "month" ? `${monthNames[month - 1]} ${year}` : "the last 7 days"}.
                    </Typography>
                </Box>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data} margin={{ top: 30, right: 40, left: 40, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="clinicName" />
                            <YAxis
                                width={70}
                                domain={[0, 'auto']}
                                tickFormatter={(v: number) => `${v.toLocaleString('vi-VN')}\u00A0₫`}
                                tickCount={6}
                            />
                            <Tooltip
                                content={({ active, payload }) =>
                                    active && payload?.length ? (
                                        <Box sx={{ p: 1.5, bgcolor: "white", border: "1px solid #ccc", borderRadius: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>
                                                Revenue: {payload[0].payload.revenue.toLocaleString('vi-VN')} ₫
                                            </Typography>
                                            <Typography variant="body2">
                                                Appointments: {payload[0].payload.appointmentCount}
                                            </Typography>
                                        </Box>
                                    ) : null
                                }
                            />
                            <Bar
                                dataKey="revenue"
                                radius={[6, 6, 0, 0]}
                                barSize={data.length > 5 ? 40 : 70}
                                shape={({ x, y, width, height, payload }) => (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={payload.revenue === 0 ? "#ccc" : "#ff9800"}
                                        rx={6}
                                        ry={6}
                                    />
                                )}
                            />
                        </BarChart>
                    </ResponsiveContainer>

                    <Typography variant="h6" textAlign="center" mt={0.5}>
                        {filterType === "last7days"
                            ? "Aggregated revenue over the last 7 days"
                            : `Revenue in ${month}/${year}`}
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default ManageRevenueAllClinics;
