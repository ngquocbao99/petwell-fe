import React from "react";
import { Box, Typography } from "@mui/material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";

interface CKEditorWrapperProps {
  content: string;
  editorConfig: any;
  editId: string | null;
  onChange: (event: any, editor: any) => void;
  onReady: (editor: any) => void;
  error?: string;
}

const CKEditorWrapper: React.FC<CKEditorWrapperProps> = ({
  content,
  editorConfig,
  editId,
  onChange,
  onReady,
  error,
}) => {
  return (
    <Box
      className="knowledge-editor-container"
      sx={{
        "& .ck-editor": {
          borderRadius: 2,
          border: "1px solid #ddd",
        },
        "& .ck-editor__editable": {
          minHeight: "300px",
          maxHeight: "500px",
          padding: "20px",
          fontSize: "14px",
          lineHeight: 1.6,
        },
      }}
    >
      <Typography fontWeight={600} mb={1}>
        Content <span style={{ color: "red" }}>*</span>
      </Typography>
      {editorConfig && (
        <CKEditor
          key={editId || "new"}
          editor={ClassicEditor}
          config={editorConfig}
          data={content}
          onChange={onChange}
          onReady={onReady}
        />
      )}
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: "block" }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CKEditorWrapper;
