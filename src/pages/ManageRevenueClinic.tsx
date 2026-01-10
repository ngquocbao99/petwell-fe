import React, { useEffect, useState } from "react";
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

const currentYear = new Date().getFullYear();// lấy năm hiện tại
const currentMonth = new Date().getMonth() + 1;// lấy tháng hiện tại (0-11, nên cộng thêm 1 để có tháng 1-12)
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// component dùng để quản lý doanh thu của phòng khám
// cho phép người quản lý xem thống kê doanh thu theo năm hoặc tháng
const ManageRevenueClinic: React.FC = () => {
    const userId = useSelector((state: any) => state.user.userId);
    const [clinicId, setClinicId] = useState<string | null>(null);
    const [clinicName, setClinicName] = useState<string>("");
    const [filterType, setFilterType] = useState<"year" | "month">("year");
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    // useEffect để lấy danh sách phòng khám mà manager quản lý
    // nếu tìm thấy phòng khám của manager thì set clinicId và clinicName
    // nếu không tìm thấy thì set clinicId là null và hiển thị thông báo lỗi
    useEffect(() => {
        (async () => {
            try {
                const res = await Axios({ ...SummaryApi.clinic.list });
                const clinics = res.data.data || [];
                const myClinic = clinics.find((c: any) => c.managerId === userId);
                if (myClinic) {
                    setClinicId(myClinic._id);
                    setClinicName(myClinic.name);
                } else {
                    setClinicId("");
                    toast.error("You are not allowed to view this clinic's revenue.");
                }
            } catch {
                setClinicId("");
            }
        })();
    }, [userId]);

    // useEffect để lấy dữ liệu doanh thu của phòng khám theo năm hoặc tháng
    // nếu filterType là "year" thì gọi API lấy doanh thu theo năm
    // nếu filterType là "month" thì gọi API lấy doanh thu theo tháng
    useEffect(() => {
        if (!clinicId) return;
        (async () => {
            setLoading(true);
            try {
                const res =
                    filterType === "year"
                        ? await Axios({ ...SummaryApi.statistics.getClinicRevenueByYear(clinicId, year) })
                        : await Axios({ ...SummaryApi.statistics.getClinicRevenueByMonth(clinicId, year, month) });
                setData(Array.isArray(res.data.data) ? res.data.data : []);
            } catch (error: any) {
                // nếu là lỗi 403 thì hiển thị thông báo không có quyền truy cập
                if (error.response?.status === 403) {
                    toast.error("You are not allowed to view this clinic's revenue.");
                }
                setData([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [filterType, year, month, clinicId]);

    // xử lý dữ liệu để hiển thị trên biểu đồ
    // nếu filterType là "month" thì sắp xếp theo ngày, ngựợc lại nếu là "year"
    // sau đó chuyển đổi dữ liệu thành định dạng phù hợp với biểu đồ
    // lấy tổng doanh thu và tổng số cuộc hẹn từ dữ liệu
    // kiểm tra xem có dữ liệu doanh thu hay không để hiển thị thông báo phù
    const chartData =
        filterType === "month"
            ? [...data].sort((a, b) => a.day - b.day).map(item => ({
                label: `${item.day}`,
                revenue: item.totalRevenue || 0,
                appointmentCount: item.appointmentCount || 0
            }))
            : data.map(item => ({
                label: `${item.month}/${item.year}`,
                revenue: item.totalRevenue || 0,
                appointmentCount: item.appointmentCount || 0
            }));

    // tính tổng doanh thu và tổng số cuộc hẹn từ dữ liệu
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalAppointments = chartData.reduce((sum, item) => sum + (item.appointmentCount || 0), 0);
    const hasRevenueData = chartData.some(item => item.revenue > 0);// kiểm tra xem có dữ liệu doanh thu hay không

    // nếu clinicId là null thì hiển thị loading
    if (clinicId === null) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress />
            </Box>
        );
    }

    // nếu clinicId là "" thì hiển thị thông báo không có quyền truy cập
    if (clinicId === "") {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <Typography variant="h4" color="error">
                    Access Denied
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={700} mb={3} textAlign="center">
                Revenue Statistics for {clinicName}
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap">
                <Box display="flex" gap={4} alignItems="flex-start" ml={2}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
                        <Typography variant="subtitle2">
                            Total Revenue: {totalRevenue.toLocaleString("vi-VN")} ₫
                        </Typography>
                        <Typography variant="subtitle2">
                            Total Appointments: {totalAppointments}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={2} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Filter Type</InputLabel>
                        <Select
                            value={filterType}
                            label="Filter Type"
                            onChange={e => setFilterType(e.target.value as any)}
                        >
                            <MenuItem value="year">By Year</MenuItem>
                            <MenuItem value="month">By Month</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Year</InputLabel>
                        <Select value={year} label="Year" onChange={e => setYear(+e.target.value)}>
                            {Array.from({ length: 3 }, (_, i) => currentYear - 2 + i).map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {filterType === "month" && (
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Month</InputLabel>
                            <Select value={month} label="Month" onChange={e => setMonth(+e.target.value)}>
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
                    )}
                </Box>

            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                    <CircularProgress />
                </Box>
            ) : !hasRevenueData ? (
                <Box textAlign="center" minHeight={300}>
                    <Typography variant="h6" color="text.disabled">
                        No revenue data
                    </Typography>
                </Box>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" />
                            <YAxis
                                width={70}
                                domain={[0, "auto"]}
                                tickFormatter={v => `${v.toLocaleString("vi-VN")} ₫`}
                                tickCount={6}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload?.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <Box sx={{ p: 1.5, bgcolor: "white", border: "1px solid #ccc", borderRadius: 1 }}>
                                                <Typography variant="body2" fontWeight={500}>
                                                    Revenue: {d.revenue.toLocaleString("vi-VN")} ₫
                                                </Typography>
                                                <Typography>
                                                    Appointments: {d.appointmentCount ?? 0}
                                                </Typography>
                                            </Box>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="revenue"
                                radius={[6, 6, 0, 0]}
                                barSize={chartData.length > 5 ? 40 : 70}
                                shape={({ x, y, width, height, payload }) => (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={payload.revenue ? "#ff9800" : "#ccc"}
                                        rx={6}
                                        ry={6}
                                    />
                                )}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                    <Typography variant="h6" textAlign="center" mt={0.25}>
                        {filterType === "year"
                            ? `Revenue for ${year}`
                            : `Revenue for ${month}/${year}`}
                    </Typography>
                </>
            )
            }
        </Box>
    );
};

export default ManageRevenueClinic;
