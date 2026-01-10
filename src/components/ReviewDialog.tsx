import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Rating,
  Button,
  TextField,
  Box,
  IconButton, // Thêm IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import SummaryApi from "@common/SummarryAPI";
import Axios from "@utils/Axios";

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  review: {
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    appointmentId?: string;
    likes?: { userId: string }[];
  } | null;
  onUpdated: () => void;
  onCreated?: (review: any) => void;
}

const ReviewDialog: React.FC<ReviewDialogProps> = ({
  open,
  onClose,
  review,
  onUpdated,
  onCreated,
}) => {
  const [currentReview, setCurrentReview] = useState(review);
  const [isEditing, setIsEditing] = useState(false);
  const [newRating, setNewRating] = useState<number>(review?.rating || 0);
  const [newComment, setNewComment] = useState<string>(review?.comment || "");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Cập nhật review khi mở dialog hoặc khi review thay đổi
  useEffect(() => {
    setCurrentReview(review);
    setNewRating(review?.rating || 0);
    setNewComment(review?.comment || "");
    setIsEditing(false); // Reset về view mode mỗi khi mở dialog
  }, [review, open]);

  if (!review) return null;

  const isCreateMode = !currentReview || !currentReview._id;

  //  kiểm tra tính hợp lệ của đánh giá
  // ít nhất rating > 0 và comment không rỗng
  const isValid = newRating > 0 && newComment.trim().length > 0;

  // kiểm tra xem có phải đang ở chế độ tạo mới hay không
  const handleCreate = async () => {
    if (!isValid) {
      toast.error("Please provide both rating and comment.");
      return;
    }
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.review.create,
        data: {
          appointmentId: review.appointmentId,
          rating: Math.round(newRating),
          comment: newComment,
        },
      });
      toast.success("Review created successfully");

      if (onCreated) {
        onCreated(response.data.data);
      }
      onClose();
    } catch {
      toast.error("Failed to create review");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý cập nhật đánh giá
  // Kiểm tra xem có thay đổi gì không trước khi gửi yêu cầu cập nhật
  const handleUpdate = async () => {
    if (!isValid) {
      toast.error("Please provide both rating and comment.");
      return;
    }
    if (
      Math.round(newRating) === currentReview.rating &&
      newComment.trim() === currentReview.comment.trim()
    ) {
      toast("No changes detected.");
      setIsEditing(false);
      return;
    }
    try {
      setLoading(true);
      await Axios({
        ...SummaryApi.review.update(currentReview._id),
        data: {
          rating: Math.round(newRating),
          comment: newComment,
        },
      });
      toast.success("Review updated successfully");
      setCurrentReview({
        ...currentReview,
        rating: Math.round(newRating),
        comment: newComment,
        updatedAt: new Date().toISOString(),
      });
      onUpdated();
      setIsEditing(false);
    } catch {
      toast.error("Failed to update review");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý xóa đánh giá
  const handleDelete = async () => {
    try {
      await Axios({ ...SummaryApi.review.delete(review._id) });
      toast.success("Review deleted successfully");
      onUpdated();
      onClose();
    } catch {
      toast.error("Failed to delete review");
    }
  };

  // Kiểm tra xem có phải đang ở chế độ tạo mới hay không
  // Nếu không có review hoặc review không có _id thì là chế độ tạo mới
  const isCreateMode2 = !currentReview || !currentReview._id;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 2 }}>
          {isCreateMode2 ? "Create Review" : "Your Review"}
          <IconButton onClick={() => { setIsEditing(false); onClose(); }} size="small" sx={{ ml: 2 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {isCreateMode2 || isEditing ? (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Typography fontWeight={600}>Rating</Typography>
              <Rating
                value={newRating}
                precision={1}
                onChange={(e, value) => value && setNewRating(value)}
              />
              <TextField
                label="Your comment"
                multiline
                rows={4}
                fullWidth
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
            </Box>
          ) : (
            <Box>
              <Rating value={currentReview.rating} readOnly precision={1} />
              <Typography mt={1}>{currentReview.comment}</Typography>

              {/* Ngày cập nhật */}
              <Typography
                variant="caption"
                color="text.secondary"
                mt={1}
                display="block"
              >
                {currentReview.updatedAt ? "Updated at" : "Created at"}{" "}
                {dayjs(
                  currentReview.updatedAt || currentReview.createdAt
                ).format("DD/MM/YYYY HH:mm")}
              </Typography>

              {/* Số lượt like */}
              {Array.isArray(currentReview.likes) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mt={0.5}
                >
                  {currentReview.likes.length} like
                  {currentReview.likes.length === 1 ? "" : "s"}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "flex-end" }}>
          {isCreateMode2 ? (
            <Button
              onClick={handleCreate}
              disabled={loading}
              variant="contained"
            >
              Create
            </Button>
          ) : !isEditing ? (
            <Box display="flex" gap={1.5}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </Box>
          ) : (
            <Box display="flex" gap={1.5}>
              <Button
                onClick={handleUpdate}
                variant="contained"
                disabled={loading}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setNewRating(currentReview.rating);
                  setNewComment(currentReview.comment);
                }}
                disabled={loading}
                color="inherit"
              >
                Cancel
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this review?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setConfirmDelete(false);
              handleDelete();
            }}
            variant="contained"
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReviewDialog;
