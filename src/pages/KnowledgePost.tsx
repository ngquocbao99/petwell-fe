import React, { useEffect, useState } from "react";
import Axios from "@utils/Axios";
import {
  Box,
  Typography,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Container,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

const POSTS_PER_SLIDE = 3;

const KnowledgePostList: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await Axios.get(
          "/api/v1/forum/view-knowledge-post?page=1&limit=10"
        );
        setPosts(res.data?.data || []);
      } catch {
        setPosts([]);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Tính toán các bài sẽ hiển thị ở slide hiện tại
  const maxIndex = Math.max(0, posts.length - POSTS_PER_SLIDE);
  const visiblePosts = posts.slice(slideIndex, slideIndex + POSTS_PER_SLIDE);

  const prevSlide = () => setSlideIndex((prev) => Math.max(0, prev - 1));
  const nextSlide = () => setSlideIndex((prev) => Math.min(maxIndex, prev + 1));

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: "relative" }}>
      <Typography
        variant="h4"
        align="center"
        color="primary"
        fontWeight={700}
        gutterBottom
        sx={{ mb: 4 }}
      >
        Knowledge Post
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Typography align="center" color="text.secondary">
          No knowledge posts found.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              gap: 3,
              justifyContent: "center",
              minHeight: 400,
              flexWrap: "nowrap",
              position: "relative",
            }}
          >
            {/* Nút chuyển slide */}
            {posts.length > POSTS_PER_SLIDE && (
              <>
                <IconButton
                  onClick={prevSlide}
                  disabled={slideIndex === 0}
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
                  disabled={slideIndex >= maxIndex}
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
            {visiblePosts.map((post) => {
              let firstImage = "";
              if (Array.isArray(post.images) && post.images.length > 0) {
                firstImage = post.images[0];
              }
              return (
                <Box
                  key={post._id}
                  sx={{
                    width: 350,
                    minWidth: 280,
                    maxWidth: 350,
                    bgcolor: "#fff9f0",
                    borderRadius: 3,
                    boxShadow: 2,
                    cursor: "pointer",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                  onClick={() => setSelectedPost(post)}
                >
                  {firstImage && (
                    <CardMedia
                      component="img"
                      image={firstImage}
                      alt={post.title}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <Box sx={{ p: 2, flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {post.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {new Date(post.createdAt).toLocaleString()}
                    </Typography>

                    {/* Nội dung được render đúng định dạng HTML từ CKEditor */}
                    <Box
                      sx={{
                        mb: 1,
                        typography: "body2",
                        overflow: "hidden",
                        maxHeight: 80,
                        "& p": { mb: 1 },
                      }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(post.content || ""),
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {/* Dialog hiển thị chi tiết bài viết */}
      <Dialog
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", pr: 4 }}>
          <Box flexGrow={1}>{selectedPost?.title}</Box>
          <IconButton
            onClick={() => setSelectedPost(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedPost?.createdAt &&
              new Date(selectedPost.createdAt).toLocaleString()}
          </Typography>

          {/* Render nội dung bài viết có định dạng HTML từ CKEditor */}
          <Box
            sx={{
              mb: 2,
              typography: "body1",
              "& p": { mb: 2 },
              "& img": {
                maxWidth: "100%",
                height: "auto",
                borderRadius: 1,
                boxShadow: 1,
              },
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(selectedPost?.content || ""),
            }}
          />

          {/* Hiển thị tất cả ảnh nhỏ bên dưới (nếu có nhiều ảnh) */}
          {selectedPost?.images && selectedPost.images.length > 1 && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 2,
                flexWrap: "wrap",
                justifyContent: "flex-start",
              }}
            >
              {selectedPost.images.map((img: string, idx: number) => (
                <CardMedia
                  key={idx}
                  component="img"
                  image={img}
                  alt={`attachment-${idx + 1}`}
                  sx={{
                    width: 100,
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #eee",
                    boxShadow: 1,
                  }}
                />
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default KnowledgePostList;
