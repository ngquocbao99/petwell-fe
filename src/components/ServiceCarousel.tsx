// src/components/ServiceCarousel.tsx
import { useEffect, useState } from "react";
import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import toast from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";
import ServiceCard from "./ServiceCard";

type ServiceType = {
  id: string;
  image: string;
  title: string;
  desc: string;
  price: string;
  link: string;
};

const ServiceCarousel = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await Axios({ ...SummaryApi.service.list });
        const rawServices = response.data?.data || [];

        // Lọc lại trên frontend nếu cần
        const filteredServices = rawServices.filter(
          (item: any) =>
            item.isDeleted === false || item.isDeleted === undefined
        );

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 3 >= services.length ? 0 : prev + 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - 3 < 0 ? Math.max(0, services.length - 3) : prev - 3
    );
  };

  const visibleServices = services.slice(currentIndex, currentIndex + 3);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, position: "relative" }}>
      {loading ? (
        <Box sx={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {[...Array(3)].map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rectangular"
              height={350}
              sx={{ borderRadius: 3, width: 350, maxWidth: "100%" }}
            />
          ))}
        </Box>
      ) : services.length === 0 ? (
        <Typography align="center" color="error" sx={{ mt: 4 }}>
          No services found.
        </Typography>
      ) : (
        <>
          {services.length > 3 && (
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

          <Box
            sx={{
              display: "flex",
              gap: 3,
              justifyContent: "center",
              transition: "transform 0.3s ease-in-out",
              minHeight: 400,
            }}
          >
            {visibleServices.map((service) => (
              <Box key={service.id} sx={{ flex: "0 0 350px", maxWidth: 350 }}>
                <ServiceCard {...service} />
              </Box>
            ))}
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 1 }}
          >
            {Array.from({ length: Math.ceil(services.length / 3) }).map(
              (_, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentIndex(index * 3)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor:
                      Math.floor(currentIndex / 3) === index
                        ? "#1976d2"
                        : "#ccc",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}
                />
              )
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ServiceCarousel;
