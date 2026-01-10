import React from "react";
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

type Props = {
  id: string;
  image: string;
  title: string;
  desc: string;
  price: string;
  link: string;
};

const ServiceCard: React.FC<Props> = ({
  id,
  image,
  title,
  desc,
  price,
  link,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        boxShadow: 3,
        transition: "box-shadow 0.3s, transform 0.3s",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-4px) scale(1.03)",
        },
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Price Chip */}
      <Chip
        label={price}
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          bgcolor: "#4caf50",
          color: "white",
          fontWeight: "bold",
          zIndex: 2,
          fontSize: "0.75rem",
        }}
      />

      <CardActionArea
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
        onClick={() => navigate(link)}
      >
        {/* Aspect Ratio 1:1 */}
        <Box
          sx={{
            width: "100%",
            aspectRatio: "1 / 1",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#f5f5f5",
          }}
        >
          <CardMedia
            component="img"
            image={image || "/api/placeholder/350/350"}
            alt={title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </Box>
        <CardContent sx={{ flex: 1, pt: 2 }}>
          <Typography gutterBottom variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.4,
              height: "4.2em",
            }}
          >
            {desc}
          </Typography>
        </CardContent>
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: "#f57c00",
              fontWeight: 700,
              py: 1.2,
              fontSize: "0.875rem",
              "&:hover": {
                bgcolor: "#ef6c00",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s",
            }}
          >
            VIEW DETAILS
          </Button>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default ServiceCard;
