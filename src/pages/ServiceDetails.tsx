import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIosNewIcon,
  AccessTime as AccessTimeIcon,
  LocalHospital as LocalHospitalIcon,
} from "@mui/icons-material";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";
import ReviewSection from "../components/ReviewSection";

interface ServiceDetailType {
  _id: string;
  name: string;
  description: string;
  price?: number;
  imageUrl: string;
  category?: string;
  updatedAt?: string;
  clinicId?: {
    _id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
  };
}

// khai báo kiểu ReviewType để sử dụng trong component
interface ReviewType {
  _id: string;
  customerId?: { _id: string; fullName: string };
  doctorId?: { _id: string; fullName: string };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceDetailType[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  const currentUser = { id: localStorage.getItem("userId") };

  useEffect(() => {
    const fetchSidebarServices = async () => {
      setSidebarLoading(true);
      try {
        const res = await Axios({ ...SummaryApi.service.list });
        setServices(
          (res.data?.data || []).filter((item: any) => !item.isDeleted)
        );
      } catch {
        toast.error("Failed to load service list");
      } finally {
        setSidebarLoading(false);
      }
    };
    fetchSidebarServices();
  }, []);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await Axios({ ...SummaryApi.service.detail(id) });
        setService(response.data?.data || null);
      } catch {
        toast.error("Failed to load service details");
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    // lấy danh sách review của service
    const fetchReviews = async () => {
      if (!id) return;
      setReviewLoading(true);
      try {
        const res = await Axios({
          ...SummaryApi.review.getReviewByServiceId(id),
        });
        const sorted = res.data?.data?.sort((a: ReviewType, b: ReviewType) => {
          if (b.rating === a.rating) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return b.rating - a.rating;
        });
        setReviews(sorted);
      } catch {
        toast.error("Failed to load reviews");
      } finally {
        setReviewLoading(false);
      }
    };

    fetchServiceDetails();
    fetchReviews();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!service) {
    return (
      <Typography align="center" color="error" sx={{ mt: 8 }}>
        Service not found.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", bgcolor: "#faf8f6", minHeight: "100vh" }}>
      <Box
        sx={{
          width: 260,
          bgcolor: "#fff7ea",
          px: 2,
          py: 3,
          borderRight: "1px solid #f0e2cf",
          display: { xs: "none", md: "block" },
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <img
            src="/logo192.png"
            alt="PetWell"
            style={{ width: 60, height: 60, borderRadius: "50%" }}
          />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Services
        </Typography>
        {sidebarLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>
            {services.map((item) => (
              <ListItem key={item._id} disablePadding>
                <ListItemButton
                  component={Link}
                  to={`/services/${item._id}`}
                  selected={item._id === id}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    color: item._id === id ? "#e57c23" : "#222",
                    bgcolor: item._id === id ? "#fff3e0" : "transparent",
                    fontWeight: item._id === id ? 700 : 400,
                    "&:hover": { bgcolor: "#fff3e0" },
                  }}
                >
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontWeight: item._id === id ? 700 : 400,
                      fontSize: 15,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ flex: 1, p: { xs: 1, md: 4 }, mt: { xs: 0, md: "64px" } }}>
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            background: "#fff",
            borderRadius: 2,
            boxShadow: 2,
          }}
        >
          <Button
            startIcon={<ArrowBackIosNewIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 2,
              mt: 2,
              ml: 2,
              color: "#e57c23",
              fontWeight: 700,
              ":hover": { background: "#f9e6d0" },
            }}
          >
            Go back
          </Button>
          <Box
            sx={{ display: { xs: "block", md: "flex" }, gap: 4, px: 4, pb: 4 }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={service.imageUrl}
                alt={service.name}
                style={{
                  width: "100%",
                  maxWidth: 500,
                  maxHeight: 350,
                  objectFit: "cover",
                  borderRadius: 12,
                  background: "#f5f5f5",
                  border: "1px solid #f2f2f2",
                }}
              />
            </Box>
            <Box sx={{ flex: 2, mt: { xs: 3, md: 0 } }}>
              <Typography
                variant="overline"
                color="#e57c23"
                fontWeight={700}
                sx={{ letterSpacing: 1 }}
              >
                SERVICE
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                {service.name}
              </Typography>
              {service.price && (
                <Typography
                  variant="h6"
                  color="#e57c23"
                  fontWeight={700}
                  sx={{ mb: 2 }}
                >
                  {service.price.toLocaleString()} ₫
                </Typography>
              )}
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Service Category
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {service.category || "No category specified"}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccessTimeIcon sx={{ color: "#e57c23", fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    24/7
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LocalHospitalIcon sx={{ color: "#e57c23", fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Clinic: {service.clinicId?.name || "PetWell"}
                  </Typography>
                </Box>
              </Box>
              <Button
                component={Link}
                to={`/book-appointment?serviceId=${service._id}&clinicId=${service.clinicId?._id}`}
                variant="contained"
                sx={{
                  background: "#e57c23",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: 16,
                  boxShadow: "none",
                  ":hover": { background: "#cf6b0c" },
                }}
              >
                Book now
              </Button>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ px: 4, pb: 4 }}>
            {reviewLoading ? (
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <ReviewSection
                reviews={reviews}
                currentUserId={currentUser.id || ""}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceDetails;
