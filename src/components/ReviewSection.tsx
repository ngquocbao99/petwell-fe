import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Rating,
  IconButton,
  Tooltip,
} from "@mui/material";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt"; // Chưa like
import ThumbUpIcon from "@mui/icons-material/ThumbUp"; // Đã like
import Axios from "@utils/Axios";
import toast from "react-hot-toast";
import SummaryApi from "@common/SummarryAPI";

interface ReviewLike {
  userId: string;
}

interface ReviewType {
  _id: string;
  customerId?: {
    _id: string;
    fullName: string;
  };
  doctorId?: {
    _id: string;
    fullName: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  likes?: ReviewLike[];
  isDeleted?: boolean; // ✅ Thêm dòng này
}

interface ReviewSectionProps {
  reviews: ReviewType[];
  currentUserId?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  currentUserId,
}) => {
  const [reviewList, setReviewList] = useState<ReviewType[]>([]);

  useEffect(() => {
    const filtered = reviews.filter((r) => !r.isDeleted); // ✅ Lọc review đã xóa mềm
    setReviewList(filtered);
  }, [reviews]);

  const handleToggleLike = async (reviewId?: string) => {
    if (!reviewId || reviewId === "undefined") {
      toast.error("Invalid review ID");
      return;
    }

    try {
      const res = await Axios(SummaryApi.review.like(reviewId));
      const response = res.data?.data;

      if (!response || !response.reviewId) {
        toast.error("Missing review data in response");
        return;
      }

      setReviewList((prev) =>
        prev.map((r) => {
          if (r._id !== response.reviewId) return r;

          const liked = response.likedByCurrentUser;
          const newLikes = liked
            ? [...(r.likes || []), { userId: currentUserId! }]
            : (r.likes || []).filter((l) => l.userId !== currentUserId);

          return { ...r, likes: newLikes };
        })
      );

      toast.success(res.data.message || "Like updated successfully");
    } catch (err) {
      console.error("Toggle like error:", err);
      toast.error("An error occurred while processing your like");
    }
  };

  const sortedReviewList = [...reviewList].sort((a, b) => {
    const aIsOwner = a.customerId?._id === currentUserId;
    const bIsOwner = b.customerId?._id === currentUserId;
    if (aIsOwner && !bIsOwner) return -1;
    if (!aIsOwner && bIsOwner) return 1;

    const aLikes = a.likes?.length || 0;
    const bLikes = b.likes?.length || 0;
    if (bLikes !== aLikes) return bLikes - aLikes;

    const aDate = new Date(a.updatedAt || a.createdAt).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt).getTime();
    return bDate - aDate;
  });

  return (
    <Box
      sx={{
        mt: 4,
        p: 3,
        borderRadius: 2,
        backgroundColor: "#f9f9f9",
        boxShadow: 1,
      }}
    >
      <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
        Service Reviews
      </Typography>

      {sortedReviewList.length === 0 ? (
        <Typography variant="body2" textAlign="center" fontStyle="italic">
          No reviews yet.
        </Typography>
      ) : (
        <List>
          {sortedReviewList.map((review, index) => {
            const isLiked = review.likes?.some(
              (like) => like.userId === currentUserId
            );

            return (
              <React.Fragment key={review._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    mb: 2,
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    boxShadow: 1,
                    p: 2,
                  }}
                  secondaryAction={
                    <Box display="flex" alignItems="center">
                      <Tooltip title={isLiked ? "Bỏ thích" : "Thích"}>
                        <IconButton
                          onClick={() => handleToggleLike(review._id)}
                        >
                          {isLiked ? (
                            <ThumbUpIcon color="primary" />
                          ) : (
                            <ThumbUpAltIcon color="disabled" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{
                          ml: 0.5,
                          minWidth: 18,
                          textAlign: "center",
                        }}
                      >
                        {review.likes?.length || 0}
                      </Typography>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {review.customerId?.fullName || "Anonymous"}
                          {review.customerId?._id === currentUserId && " (you)"}
                        </Typography>
                        <Rating
                          value={review.rating}
                          readOnly
                          size="small"
                          precision={0.5}
                          sx={{ mt: 0.5 }}
                        />
                        {review.doctorId?.fullName && (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mt: 0.5 }}
                          >
                            Doctor: {review.doctorId.fullName}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {review.comment && (
                          <Typography
                            variant="body1"
                            color="text.primary"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {review.comment}
                          </Typography>
                        )}
                        {(review.updatedAt || review.createdAt) && (
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            {new Date(
                              review.updatedAt || review.createdAt
                            ).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>

                {index < sortedReviewList.length - 1 && (
                  <Divider key={`divider-${review._id}`} component="li" />
                )}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ReviewSection;
