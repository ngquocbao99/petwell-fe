import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

interface DeleteConfirmDialogProps {
  open: boolean;
  postTitle: string;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  postTitle,
  processing,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
        Confirm Delete
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete this knowledge post?
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 600,
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "grey.300",
          }}
        >
          "{postTitle}"
        </Typography>
        <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          color="inherit"
          sx={{ borderRadius: 2 }}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ borderRadius: 2, fontWeight: 600 }}
          disabled={processing}
          startIcon={
            processing && <CircularProgress size={18} color="inherit" />
          }
        >
          {processing ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
