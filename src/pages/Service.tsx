import { useEffect, useState } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import ServiceCard from "../components/ServiceCard";
import toast, { Toaster } from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";

type ServiceType = {
  id: string;
  image: string;
  title: string;
  desc: string;
  price: string;
  link: string;
};

const ServicePage: React.FC = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await Axios({ ...SummaryApi.service.list });
        const rawServices = response.data?.data || [];

        // lọc bỏ các dịch vụ đã bị xóa
        const filteredServices = rawServices.filter(
          (item: any) =>
            item.isDeleted === false || item.isDeleted === undefined
        );

        // Sắp xếp theo updatedAt mới nhất, nếu không có thì theo createdAt
        filteredServices.sort((a: any, b: any) => {
          const dateA = a.updatedAt
            ? new Date(a.updatedAt).getTime()
            : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
          const dateB = b.updatedAt
            ? new Date(b.updatedAt).getTime()
            : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
          return dateB - dateA;
        });

        const mapped = filteredServices.map((item: any) => ({
          id: item._id,
          image: item.imageUrl,
          title: item.name,
          desc: item.description,
          price: item.price ? `${item.price.toLocaleString()}₫` : "Contact",
          link: `/services/${item._id}`,
          clinicId: item.clinicId?._id || "",
          clinicName: item.clinicId?.name || "Unknown",
          category: item.category || "",
        }));
        setServices(mapped);
      } catch {
        toast.error("Failed to load services");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <Box sx={{ backgroundColor: "#fff", minHeight: "100vh", pt: 4 }}>
      <Toaster position="top-center" reverseOrder={false} />

      <Typography
        variant="h4"
        align="center"
        color="primary"
        fontWeight={700}
        gutterBottom
      >
        OUR SERVICES
      </Typography>
      <Typography align="center" sx={{ mb: 8 }}>
        PETWELL offers a full range of the best health care services for your
        pets.
      </Typography>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              gap: 3,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                height={350}
                sx={{ borderRadius: 3, width: 350 }}
              />
            ))}
          </Box>
        ) : services.length === 0 ? (
          <Typography align="center" color="error" sx={{ mt: 4 }}>
            No services found.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
            }}
          >
            {services.map((service) => (
              <Box key={service.id} sx={{ flex: "0 0 350px", maxWidth: 350 }}>
                <ServiceCard {...service} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ServicePage;
