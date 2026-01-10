import React from "react";
import { Box, Button } from "@mui/material";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      mt={3}
      gap={1}
    >
      <Button
        variant="outlined"
        size="small"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      {[...Array(totalPages)].map((_, idx) => (
        <Button
          key={idx}
          variant={currentPage === idx + 1 ? "contained" : "outlined"}
          size="small"
          color={currentPage === idx + 1 ? "primary" : "inherit"}
          onClick={() => onPageChange(idx + 1)}
          sx={{ minWidth: 36 }}
        >
          {idx + 1}
        </Button>
      ))}
      <Button
        variant="outlined"
        size="small"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </Box>
  );
};

export default Pagination;
