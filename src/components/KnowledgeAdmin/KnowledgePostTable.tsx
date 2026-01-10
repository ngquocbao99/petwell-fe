import React from "react";
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

interface Post {
  _id: string;
  title: string;
  content: string;
  images?: string[];
  createdAt: string;
}

interface KnowledgePostTableProps {
  posts: Post[];
  loading: boolean;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

const KnowledgePostTable: React.FC<KnowledgePostTableProps> = ({
  posts,
  loading,
  onEdit,
  onDelete,
}) => {
  // Function to strip HTML tags for display in table
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <Paper elevation={4} sx={{ borderRadius: 4, overflow: "hidden" }}>
      <TableContainer>
        <MuiTable>
          <TableHead
            sx={{
              background: "linear-gradient(90deg, #ffb366 0%, #ffa726 100%)",
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  width: 90,
                  textAlign: "center",
                }}
              >
                Image
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  width: 290,
                }}
              >
                Title
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                Content
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  width: 190,
                }}
              >
                Created At
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  width: 120,
                  textAlign: "center",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress color="primary" />
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No knowledge posts found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow
                  key={post._id}
                  sx={{
                    transition: "background 0.2s",
                    ":hover": { background: "#fff3e0" },
                  }}
                >
                  <TableCell sx={{ textAlign: "center" }}>
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={post.images[0]}
                        alt="thumb"
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #eee",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#bbb",
                          fontSize: 13,
                          border: "1px solid #eee",
                          borderRadius: 8,
                          bgcolor: "#fafafa",
                        }}
                      >
                        No image
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{post.title}</TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 350,
                      whiteSpace: "pre-line",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Box
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          // Clean and limit HTML content for display
                          let cleanContent = post.content
                            .replace(
                              /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                              ""
                            ) // Remove scripts
                            .replace(
                              /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
                              ""
                            ) // Remove styles
                            .replace(/<iframe[^>]*>[^<]*<\/iframe>/gi, ""); // Remove iframes

                          // Get text content for length check
                          const textContent = stripHtmlTags(cleanContent);

                          if (textContent.length > 120) {
                            // If text is too long, truncate and show plain text
                            return textContent.slice(0, 120) + "...";
                          }

                          return cleanContent;
                        })(),
                      }}
                      sx={{
                        "& p": { margin: 0, marginBottom: "4px" },
                        "& p:last-child": { marginBottom: 0 },
                        "& strong": { fontWeight: "bold" },
                        "& em": { fontStyle: "italic" },
                        "& u": { textDecoration: "underline" },
                        fontSize: "14px",
                        lineHeight: 1.4,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(post.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", minWidth: 90 }}>
                    <Tooltip title="Edit" arrow>
                      <IconButton color="primary" onClick={() => onEdit(post)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" arrow>
                      <IconButton color="error" onClick={() => onDelete(post)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </Paper>
  );
};

export default KnowledgePostTable;
