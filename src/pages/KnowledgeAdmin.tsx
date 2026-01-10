import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  fetchKnowledgePosts,
  createPostAction,
  updatePostAction,
  deletePostAction,
  setNeedRefresh,
} from "../store/postSlice";
import { Box, Button, Snackbar, Alert, Typography, Fade } from "@mui/material";
import { Add } from "@mui/icons-material";
import Axios from "@utils/Axios";

// Components
import KnowledgePostTable from "../components/KnowledgeAdmin/KnowledgePostTable";
import PostFormDialog from "../components/KnowledgeAdmin/PostFormDialog";
import DeleteConfirmDialog from "../components/KnowledgeAdmin/DeleteConfirmDialog";
import Pagination from "../components/KnowledgeAdmin/Pagination";

// Hooks
import { useCKEditorConfig } from "../hooks/useCKEditorConfig";

import "ckeditor5/ckeditor5.css";

const KnowledgeAdmin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { knowledgePosts, loading } = useSelector(
    (state: RootState) => state.posts
  );
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>(
    {}
  );
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    postId: string | null;
    postTitle: string;
  }>({
    open: false,
    postId: null,
    postTitle: "",
  });

  // CKEditor states
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Use CKEditor config hook
  const editorConfig = useCKEditorConfig(isLayoutReady);

  const postsPerPage = 5;
  const totalPages = Math.ceil(knowledgePosts.length / postsPerPage);
  const sortedPosts = [...knowledgePosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const paginatedPosts = sortedPosts.slice(
    (page - 1) * postsPerPage,
    page * postsPerPage
  );

  useEffect(() => {
    dispatch(fetchKnowledgePosts());
    setPage(1);
    setIsLayoutReady(true);

    return () => setIsLayoutReady(false);
  }, [dispatch]);

  // Effect to update editor when opening dialog for editing
  useEffect(() => {
    if (editorInstance && open && editId) {
      // Small delay to ensure editor is ready
      setTimeout(() => {
        editorInstance.setData(form.content || "");
      }, 100);
    }
  }, [editorInstance, open, editId]);

  const handleOpen = (post?: any) => {
    if (post) {
      setEditId(post._id);
      setForm({ title: post.title, content: post.content });
      setImages(post.images || []);
      setImagePreviews([]);
      setSelectedFiles([]);
    } else {
      setEditId(null);
      setForm({ title: "", content: "" });
      setImages([]);
      setImagePreviews([]);
      setSelectedFiles([]);
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setForm({ title: "", content: "" });
    setErrors({});
    setSnackbar((prev) => ({ ...prev, open: false }));
    // Reset editor instance to ensure clean state
    if (editorInstance) {
      editorInstance.setData("");
    }
    setImages([]);
    setImagePreviews([]);
    setSelectedFiles([]);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // CKEditor content change handler
  const handleEditorChange = (event: any, editor: any) => {
    const data = editor.getData();
    setForm({ ...form, content: data });
  };

  const handleEditorReady = (editor: any) => {
    console.log("Editor is ready to use!", editor);
    setEditorInstance(editor);
    // Set data to ensure proper formatting display
    if (form.content) {
      editor.setData(form.content);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length + selectedFiles.length > 5) {
      setSnackbar({
        open: true,
        message: "Maximum 5 images allowed!",
        severity: "error",
      });
      return;
    }
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...validFiles.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeImage = (index: number, isUploaded: boolean) => {
    if (isUploaded) {
      setImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const newErrors: { title?: string; content?: string } = {};
    if (!form.title.trim()) newErrors.title = "Title is required.";
    // Strip HTML tags for content validation
    const textContent = form.content.replace(/<[^>]*>/g, "").trim();
    if (!textContent) newErrors.content = "Content is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setProcessing(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("image", file);
          const uploadRes = await Axios.post("/api/v1/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (uploadRes.data.success && uploadRes.data.data.url) {
            return uploadRes.data.data.url;
          }
          throw new Error("Upload failed");
        });
        uploadedUrls = await Promise.all(uploadPromises);
      }
      const allImages = [...images, ...uploadedUrls];
      if (editId) {
        await dispatch(
          updatePostAction({
            postId: editId,
            data: { ...form, images: allImages },
          })
        ).unwrap();
        setSnackbar({
          open: true,
          message: "Post updated successfully!",
          severity: "success",
        });
      } else {
        await dispatch(
          createPostAction({ ...form, type: "knowledge", images: allImages })
        ).unwrap();
        setSnackbar({
          open: true,
          message: "Post created successfully!",
          severity: "success",
        });
      }
      dispatch(setNeedRefresh(true));
      handleClose();
      dispatch(fetchKnowledgePosts());
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Something went wrong!",
        severity: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessing(true);
    try {
      await dispatch(deletePostAction(id)).unwrap();
      setSnackbar({
        open: true,
        message: "Post deleted successfully!",
        severity: "success",
      });
      dispatch(setNeedRefresh(true));
      dispatch(fetchKnowledgePosts());
    } catch (e: any) {
      setSnackbar({ open: true, message: "Delete failed!", severity: "error" });
      console.log("error", e.response?.status);
      if (e?.response?.status === 403) {
        setSnackbar({
          open: true,
          message: "You do not have permission to delete this post.",
          severity: "error",
        });
      }
    } finally {
      setProcessing(false);
      setDeleteConfirm({ open: false, postId: null, postTitle: "" });
    }
  };

  const handleDeleteClick = (post: any) => {
    setDeleteConfirm({
      open: true,
      postId: post._id,
      postTitle: post.title,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.postId) {
      handleDelete(deleteConfirm.postId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, postId: null, postTitle: "" });
  };

  return (
    <Fade in timeout={600}>
      <Box mx="auto">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            color="#fa7e24"
            gutterBottom
          >
            Knowledge Post Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{
              backgroundColor: "#fa7e24",
              borderRadius: 3,
              fontWeight: 600,
              boxShadow: 2,
              textTransform: "none",
            }}
          >
            Add New
          </Button>
        </Box>

        <KnowledgePostTable
          posts={paginatedPosts}
          loading={loading}
          onEdit={handleOpen}
          onDelete={handleDeleteClick}
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <PostFormDialog
          open={open}
          editId={editId}
          form={form}
          errors={errors}
          images={images}
          imagePreviews={imagePreviews}
          processing={processing}
          editorConfig={editorConfig}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onFormChange={handleChange}
          onEditorChange={handleEditorChange}
          onEditorReady={handleEditorReady}
          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
        />

        <DeleteConfirmDialog
          open={deleteConfirm.open}
          postTitle={deleteConfirm.postTitle}
          processing={processing}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            sx={{ fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default KnowledgeAdmin;
