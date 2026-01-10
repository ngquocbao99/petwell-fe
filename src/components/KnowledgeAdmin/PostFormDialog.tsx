import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import CKEditorWrapper from "./CKEditorWrapper";
import ImageUpload from "./ImageUpload";

interface PostFormDialogProps {
  open: boolean;
  editId: string | null;
  form: { title: string; content: string };
  errors: { title?: string; content?: string };
  images: string[];
  imagePreviews: string[];
  processing: boolean;
  editorConfig: any;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onEditorChange: (event: any, editor: any) => void;
  onEditorReady: (editor: any) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number, isUploaded: boolean) => void;
}

const PostFormDialog: React.FC<PostFormDialogProps> = ({
  open,
  editId,
  form,
  errors,
  images,
  imagePreviews,
  processing,
  editorConfig,
  onClose,
  onSubmit,
  onFormChange,
  onEditorChange,
  onEditorReady,
  onImageChange,
  onRemoveImage,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "primary.main" }}>
        {editId ? "Edit Knowledge Post" : "Add New Knowledge Post"}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Title"
          name="title"
          value={form.title}
          onChange={onFormChange}
          fullWidth
          required
          sx={{ mb: 2 }}
          error={!!errors.title}
          helperText={errors.title}
        />

        <CKEditorWrapper
          content={form.content}
          editorConfig={editorConfig}
          editId={editId}
          onChange={onEditorChange}
          onReady={onEditorReady}
          error={errors.content}
        />

        <ImageUpload
          images={images}
          imagePreviews={imagePreviews}
          onImageChange={onImageChange}
          onRemoveImage={onRemoveImage}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, fontWeight: 600 }}
          disabled={processing || !!errors.title || !!errors.content}
          startIcon={
            processing && <CircularProgress size={18} color="inherit" />
          }
        >
          {editId ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PostFormDialog;
