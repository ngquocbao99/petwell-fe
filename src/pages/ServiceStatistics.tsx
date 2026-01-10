import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Box,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    Paper,
    CardHeader,
    Avatar,
    useTheme,
    alpha,
    Stack,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    LineChart,
    Line,
    ResponsiveContainer,
} from "recharts";
import axios from "../utils/Axios";
import SummaryApi from "../common/SummarryAPI";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import DownloadIcon from "@mui/icons-material/Download";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import * as XLSX from "xlsx";
import { vi } from "date-fns/locale";
import { toast } from "react-hot-toast";
import Axios from "../utils/Axios";

interface ServiceStatistic {
    serviceId: string;
    serviceName: string;
    clinicId: string;
    totalUsage: number;
    totalRevenue: number;
    customerCount: number;
    avgRating: number;
    totalRating: number;
}

const ServiceStatistics = () => {
    const [statistics, setStatistics] = useState<ServiceStatistic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [compareDialogOpen, setCompareDialogOpen] = useState(false);
    const { userId } = useSelector((state: RootState) => state.user);
    const theme = useTheme();

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const res = await Axios({
                    ...SummaryApi.service.getStatistics,
                    data: {
                        managerId: userId
                    }
                });
                setStatistics(res.data.data || []);
            } catch (error) {
                console.error("Error fetching statistics:", error);
                toast.error("Không thể tải dữ liệu thống kê");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchStatistics();
        }
    }, [userId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatMillions = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            maximumFractionDigits: 1,
        }).format(amount / 1000000);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("vi-VN").format(num);
    };

    const handleExportExcel = () => {
        const data = statistics.map((stat) => ({
            "Service Name": stat.serviceName,
            "Total Usage": stat.totalUsage,
            "Revenue": stat.totalRevenue,
            "Customer Count": stat.customerCount,
            "Average Rating": stat.avgRating.toFixed(1),
            "Total Ratings": stat.totalRating,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Service Statistics");

        const timestamp = new Date().toISOString().split("T")[0];
        XLSX.writeFile(wb, `service_statistics_${timestamp}.xlsx`);
    };

    const handleCompareServices = () => {
        setCompareDialogOpen(true);
    };

    const handleServiceSelect = (serviceId: string) => {
        setSelectedServices((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const getOverviewData = () => {
        return statistics.map(stat => ({
            name: stat.serviceName.length > 20 ? `${stat.serviceName.substring(0, 20)}...` : stat.serviceName,
            "Usage": stat.totalUsage,
            "Revenue (M)": Number((stat.totalRevenue / 1000000).toFixed(1))
        }));
    };

    const getComparisonData = () => {
        return statistics
            .filter((stat) => selectedServices.includes(stat.serviceId))
            .map((stat) => ({
                name: stat.serviceName.length > 15 ? `${stat.serviceName.substring(0, 15)}...` : stat.serviceName,
                "Usage": stat.totalUsage,
                "Revenue (M)": Number((stat.totalRevenue / 1000000).toFixed(1)),
                "Rating": Number(stat.avgRating.toFixed(1))
            }));
    };

    const chartColors = {
        usage: '#3b82f6', // bright blue
        revenue: '#22c55e', // bright green
        rating: '#f59e0b'  // bright amber
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.default, 0.98) }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <AnalyticsIcon fontSize="large" />
                            Service Statistics
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Export to Excel">
                                <IconButton
                                    onClick={handleExportExcel}
                                    sx={{
                                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.success.main, 0.2),
                                        }
                                    }}
                                >
                                    <DownloadIcon color="success" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Compare Services">
                                <IconButton
                                    onClick={handleCompareServices}
                                    sx={{
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                        }
                                    }}
                                >
                                    <CompareArrowsIcon color="primary" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>

                    {/* Overview Chart */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            backgroundColor: '#fff',
                            mb: 4,
                            '&:hover': {
                                boxShadow: theme.shadows[8]
                            },
                            transition: 'box-shadow 0.3s ease-in-out'
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            mb: 3
                        }}>
                            Revenue and Usage Overview
                        </Typography>
                        <Box sx={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart
                                    data={getOverviewData()}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                    barGap={12}
                                    barSize={28}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={alpha(theme.palette.text.primary, 0.05)}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        height={90}
                                        interval={0}
                                        tick={{
                                            fontSize: '13px',
                                            fontStyle: 'normal',
                                            fill: theme.palette.text.secondary
                                        }}
                                        axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                        tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tickFormatter={formatNumber}
                                        label={{
                                            value: 'Usage Count',
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: {
                                                textAnchor: 'middle',
                                                fill: theme.palette.text.secondary,
                                                fontSize: '13px'
                                            }
                                        }}
                                        tick={{
                                            fontSize: '12px',
                                            fill: theme.palette.text.secondary
                                        }}
                                        axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                        tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={(value) => `${value}M`}
                                        label={{
                                            value: 'Revenue (Million VND)',
                                            angle: 90,
                                            position: 'insideRight',
                                            style: {
                                                textAnchor: 'middle',
                                                fill: theme.palette.text.secondary,
                                                fontSize: '13px'
                                            }
                                        }}
                                        tick={{
                                            fontSize: '12px',
                                            fill: theme.palette.text.secondary
                                        }}
                                        axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                        tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                    />
                                    <RechartsTooltip
                                        formatter={(value: number, name: string) => {
                                            if (name === "Revenue (M)") {
                                                return [`${formatNumber(value)} Million VND`, "Revenue"];
                                            }
                                            return [formatNumber(value), "Usage Count"];
                                        }}
                                        cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                            padding: '12px'
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            paddingTop: '20px'
                                        }}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="Usage"
                                        fill={chartColors.usage}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={50}
                                        style={{
                                            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))'
                                        }}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="Revenue (M)"
                                        fill={chartColors.revenue}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={50}
                                        style={{
                                            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))'
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Box>

                {/* Statistics Cards */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)'
                    },
                    gap: 3
                }}>
                    {statistics.map((stat) => (
                        <Card
                            key={stat.serviceId}
                            sx={{
                                borderRadius: 2,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: theme.shadows[8],
                                }
                            }}
                        >
                            <CardHeader
                                avatar={
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main
                                        }}
                                    >
                                        {stat.serviceName.charAt(0)}
                                    </Avatar>
                                }
                                title={
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'medium',
                                            fontStyle: 'normal'
                                        }}
                                    >
                                        {stat.serviceName}
                                    </Typography>
                                }
                            />
                            <CardContent>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AnalyticsIcon color="primary" />
                                        <Typography>
                                            Usage Count: <strong>{formatNumber(stat.totalUsage)}</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AttachMoneyIcon color="success" />
                                        <Typography>
                                            Revenue: <strong>{formatCurrency(stat.totalRevenue)}</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PeopleIcon color="info" />
                                        <Typography>
                                            Customer Count: <strong>{formatNumber(stat.customerCount)}</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StarIcon color="warning" />
                                        <Typography>
                                            Rating: <strong>{stat.avgRating.toFixed(1)} ⭐</strong> ({formatNumber(stat.totalRating)} reviews)
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Compare Services Dialog */}
                <Dialog
                    open={compareDialogOpen}
                    onClose={() => setCompareDialogOpen(false)}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden',
                            maxHeight: '90vh'
                        }
                    }}
                >
                    <DialogTitle sx={{
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        p: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.5)
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Compare Services
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        {/* Service Selection */}
                        <Box sx={{
                            mb: 4,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 2
                        }}>
                            {statistics.map((stat) => (
                                <Paper
                                    key={stat.serviceId}
                                    sx={{
                                        p: 2,
                                        backgroundColor: selectedServices.includes(stat.serviceId)
                                            ? alpha(theme.palette.primary.main, 0.1)
                                            : alpha(theme.palette.background.default, 0.5),
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        border: `1px solid ${selectedServices.includes(stat.serviceId)
                                            ? alpha(theme.palette.primary.main, 0.3)
                                            : 'transparent'}`,
                                        '&:hover': {
                                            backgroundColor: selectedServices.includes(stat.serviceId)
                                                ? alpha(theme.palette.primary.main, 0.15)
                                                : alpha(theme.palette.background.default, 0.8),
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                    onClick={() => handleServiceSelect(stat.serviceId)}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Checkbox
                                            checked={selectedServices.includes(stat.serviceId)}
                                            color="primary"
                                            sx={{
                                                '&.Mui-checked': {
                                                    color: chartColors.usage
                                                }
                                            }}
                                        />
                                        <Typography
                                            noWrap
                                            title={stat.serviceName}
                                            sx={{
                                                flex: 1,
                                                fontWeight: selectedServices.includes(stat.serviceId) ? 600 : 400
                                            }}
                                        >
                                            {stat.serviceName}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            ))}
                        </Box>

                        {selectedServices.length > 0 ? (
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{
                                    fontWeight: 600,
                                    color: theme.palette.text.primary,
                                    mb: 3
                                }}>
                                    Comparison Chart
                                </Typography>
                                <Box sx={{ height: 400, width: '100%' }}>
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={getComparisonData()}
                                            margin={{ top: 5, right: 50, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={alpha(theme.palette.text.primary, 0.05)}
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="name"
                                                height={60}
                                                interval={0}
                                                tick={{
                                                    fontSize: '13px',
                                                    fill: theme.palette.text.secondary
                                                }}
                                                axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                                tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                tickFormatter={formatNumber}
                                                label={{
                                                    value: 'Usage Count',
                                                    angle: -90,
                                                    position: 'insideLeft',
                                                    offset: -5,
                                                    style: {
                                                        textAnchor: 'middle',
                                                        fill: theme.palette.text.secondary,
                                                        fontSize: '13px'
                                                    }
                                                }}
                                                tick={{
                                                    fontSize: '12px',
                                                    fill: theme.palette.text.secondary
                                                }}
                                                axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                                tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                domain={[0, 5]}
                                                tickFormatter={(value) => `${value}⭐`}
                                                label={{
                                                    value: 'Rating',
                                                    angle: 90,
                                                    position: 'insideRight',
                                                    offset: 0,
                                                    style: {
                                                        textAnchor: 'middle',
                                                        fill: theme.palette.text.secondary,
                                                        fontSize: '13px'
                                                    }
                                                }}
                                                tick={{
                                                    fontSize: '12px',
                                                    fill: theme.palette.text.secondary
                                                }}
                                                axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                                tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                            />
                                            <YAxis
                                                yAxisId="revenue"
                                                orientation="right"
                                                tickFormatter={(value) => `${value}M`}
                                                label={{
                                                    value: 'Revenue (Million VND)',
                                                    angle: 90,
                                                    position: 'insideRight',
                                                    offset: 70,
                                                    style: {
                                                        textAnchor: 'middle',
                                                        fill: theme.palette.text.secondary,
                                                        fontSize: '13px'
                                                    }
                                                }}
                                                tick={{
                                                    fontSize: '12px',
                                                    fill: theme.palette.text.secondary
                                                }}
                                                axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                                tickLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                                            />
                                            <RechartsTooltip
                                                formatter={(value: number, name: string) => {
                                                    switch (name) {
                                                        case "Revenue (M)":
                                                            return [`${formatNumber(value)} Million VND`, "Revenue"];
                                                        case "Usage":
                                                            return [formatNumber(value), "Usage Count"];
                                                        case "Rating":
                                                            return [`${value}⭐`, name];
                                                        default:
                                                            return [value, name];
                                                    }
                                                }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                    padding: '12px'
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    paddingTop: '20px'
                                                }}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="Usage"
                                                stroke={chartColors.usage}
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: chartColors.usage }}
                                                activeDot={{ r: 6, fill: chartColors.usage }}
                                            />
                                            <Line
                                                yAxisId="revenue"
                                                type="monotone"
                                                dataKey="Revenue (M)"
                                                stroke={chartColors.revenue}
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: chartColors.revenue }}
                                                activeDot={{ r: 6, fill: chartColors.revenue }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="Rating"
                                                stroke={chartColors.rating}
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: chartColors.rating }}
                                                activeDot={{ r: 6, fill: chartColors.rating }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    py: 4,
                                    color: theme.palette.text.secondary
                                }}
                            >
                                <Typography variant="body1">
                                    Please select services to compare
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default ServiceStatistics; 