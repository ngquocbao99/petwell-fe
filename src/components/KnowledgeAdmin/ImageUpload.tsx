import React from "react";
import { Box, Button, Typography } from "@mui/material";

interface ImageUploadProps {
  images: string[];
  imagePreviews: string[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number, isUploaded: boolean) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  imagePreviews,
  onImageChange,
  onRemoveImage,
  maxImages = 5,
}) => {
  return (
    <Box mt={3} mb={2}>
      <Typography fontWeight={600} mb={1}>
        Images (max {maxImages})
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {images.map((url, idx) => (
          <Box key={url} position="relative">
            <img
              src={url}
              alt="uploaded"
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #eee",
              }}
            />
            <Button
              size="small"
              onClick={() => onRemoveImage(idx, true)}
              sx={{
                position: "absolute",
                top: -10,
                right: -10,
                minWidth: 0,
                p: 0,
                bgcolor: "white",
                borderRadius: "50%",
                border: "1px solid #ccc",
                width: 24,
                height: 24,
              }}
            >
              ✕
            </Button>
          </Box>
        ))}
        {imagePreviews.map((url, idx) => (
          <Box key={url} position="relative">
            <img
              src={url}
              alt="preview"
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #eee",
              }}
            />
            <Button
              size="small"
              onClick={() => onRemoveImage(idx, false)}
              sx={{
                position: "absolute",
                top: -10,
                right: -10,
                minWidth: 0,
                p: 0,
                bgcolor: "white",
                borderRadius: "50%",
                border: "1px solid #ccc",
                width: 24,
                height: 24,
              }}
            >
              ✕
            </Button>
          </Box>
        ))}
        {images.length + imagePreviews.length < maxImages && (
          <Button
            variant="outlined"
            component="label"
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              borderStyle: "dashed",
            }}
          >
            +
            <input
              type="file"
              accept="image/*"
              hidden
              multiple
              onChange={onImageChange}
            />
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ImageUpload;
