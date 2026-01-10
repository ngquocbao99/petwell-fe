import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";

// Service type
type ServiceType = {
  id: string;
  image: string;
  title: string;
  desc: string;
  price: string;
  category?: string;
  isDeleted?: boolean;
};

// Service form data type
interface ServiceFormData {
  name: string;
  description: string;
  price: number | "";
  category: string;
}

// Parse price string to number
const parsePrice = (priceStr: string): number =>
  parseInt(priceStr.replace(/[₫.,]/g, "")) || 0;

// Format price to VND currency
const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

const ServiceManage: React.FC = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    price: "",
    category: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", category: "" });
    setEditId(null);
    setSelectedImageFile(null);
    setImagePreview("");
  };

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await Axios({ ...SummaryApi.service.listForManager });
      const mapped = (response.data?.data || []).map((item: any) => ({
        id: item._id,
        image: item.imageUrl,
        title: item.name,
        desc: item.description,
        price: item.price ? formatPrice(item.price) : "Contact",
        category: item.category || "",
        isDeleted: item.isDeleted || false,
      }));
      mapped.sort((a, b) => {
        if (a.isDeleted !== b.isDeleted) return Number(a.isDeleted) - Number(b.isDeleted);
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
      setServices(mapped);
    } catch (err: any) {
      if (err.response?.status === 403) toast.error("You do not have permission to view services.");
      else if (err.response?.status === 401) toast.error("Please log in again");
      else toast.error("Failed to load service list. Please try again later.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  // Handle form input change
  const handleInputChange = (field: keyof ServiceFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Open create form
  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  // Open edit form
  const openEditForm = (service: ServiceType) => {
    setFormData({
      name: service.title,
      description: service.desc,
      price: service.price === "Contact" ? "" : parsePrice(service.price),
      category: service.category || "",
    });
    setEditId(service.id);
    setSelectedImageFile(null);
    setImagePreview(service.image || "");
    setFormOpen(true);
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      setSelectedImageFile(null);
      // Nếu đang cập nhật, giữ lại preview ảnh cũ
      if (editId && imagePreview) {
        setImagePreview(imagePreview);
      } else {
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview("");
        }
      }
      if (e.target) e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      setSelectedImageFile(null);
      // Nếu đang cập nhật, giữ lại preview ảnh cũ
      if (editId && imagePreview) {
        setImagePreview(imagePreview);
      } else {
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview("");
        }
      }
      if (e.target) e.target.value = "";
      return;
    }
    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Handle form submit
  const handleSubmit = () => {
    const { name, description, price, category } = formData;
    const priceNumber = Number(price);
    if (!name.trim() || !description.trim() || !category.trim() || price === "") {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (/^[^a-zA-ZÀ-ỹà-ỹ]/.test(name.trim())) {
      toast.error("Name must start with a letter.");
      return;
    }
     if (/^[^a-zA-ZÀ-ỹà-ỹ]/.test(description.trim())) {
      toast.error("Description must start with a letter.");
      return;
    }
     if (/^[^a-zA-ZÀ-ỹà-ỹ]/.test(category.trim())) {
      toast.error("Category must start with a letter.");
      return;
    }
    if (isNaN(priceNumber)) {
      toast.error("Price must be a number.");
      return;
    }
    if (priceNumber <= 0) {
      toast.error("Price must be a positive number.");
      return;
    }
    if (!editId && !selectedImageFile) {
      toast.error("Please select an image to upload.");
      return;
    }
    setActionType(editId ? "update" : "create");
    setConfirmOpen(true);
  };

  // Upload image
  const uploadImage = async (file: File): Promise<string | null> => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    try {
      const res = await Axios.post("/api/v1/upload/", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success && res.data.data.url) return res.data.data.url;
    } catch (err) {
      console.error("Image upload error:", err);
    }
    toast.error("Image upload failed!");
    if (!editId) {
      // Tạo mới: xóa preview và không hiện tên file
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview("");
      }
      setSelectedImageFile(null);
    } else {
      // Cập nhật: luôn giữ lại preview ảnh cũ
      // imagePreview đã là ảnh cũ, không đổi
      setSelectedImageFile(null);
    }
    return null;
  };

  // Handle confirm action (create, update, delete)
  const handleConfirmAction = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      let res;
      if (actionType === "delete" && targetId) {
        res = await Axios({ ...SummaryApi.service.delete(targetId) });
        if (res?.data.success) {
          toast.success("Service deleted successfully!");
          fetchServices();
        } else {
          toast.error("Failed to delete service.");
        }
        return;
      }
      let imageUrl = imagePreview;
      if (selectedImageFile) {
        const uploadedUrl = await uploadImage(selectedImageFile);
        if (!uploadedUrl) {
          setProcessing(false);
          setConfirmOpen(false);
          return;
        }
        imageUrl = uploadedUrl;
      } else if (!editId) {
        toast.error("Please select an image to upload.");
        setProcessing(false);
        setConfirmOpen(false);
        return;
      }
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price || 0,
        imageUrl,
        category: formData.category.trim(),
      };
      if (actionType === "create") {
        try {
          res = await Axios({ ...SummaryApi.service.create, data: payload });
          if (res?.data.success) {
            toast.success("Service created successfully!");
            setFormOpen(false);
            fetchServices();
            resetForm();
          } else {
            if (res?.data.message) toast.error(res.data.message);
          }
        } catch (err: any) {
          const msg = err?.response?.data?.message;
          if (msg) toast.error(msg);
        }
      } else if (actionType === "update" && editId) {
        const currentService = services.find((s) => s.id === editId);
        if (
          currentService &&
          currentService.title.trim() === formData.name.trim() &&
          currentService.desc.trim() === formData.description.trim() &&
          (currentService.price === "Contact"
            ? formData.price === ""
            : formatPrice(Number(formData.price)) === currentService.price) &&
          (currentService.category || "") === formData.category.trim() &&
          imagePreview === currentService.image
        ) {
          toast("No changes detected.");
          setFormOpen(false);
          setProcessing(false);
          setConfirmOpen(false);
          return;
        }
        try {
          res = await Axios({
            ...SummaryApi.service.update(editId),
            data: payload,
          });
          if (res?.data.success) {
            toast.success("Service updated successfully!");
            setFormOpen(false);
            fetchServices();
            resetForm();
          }
        } catch (err: any) {
          const msg = err?.response?.data?.message;
          if (msg === "Unauthorized") {
            toast.error("You are not authorized to update this service.");
          } else if (msg === "You are not allowed to update service for this clinic") {
            toast.error("You are not allowed to update service for this clinic.");
          } else if (msg === "Service not found or has been deleted" || msg === "Service not found or deleted") {
            toast.error("Service not found or has been deleted.");
          } else if (msg === "Another service with the same name already exists in this clinic") {
            toast.error("Another service with the same name already exists in this clinic.");
          } else if (msg) {
            toast.error(msg);
          }
        }
      }
    } finally {
      setConfirmOpen(false);
      setActionType(null);
      setTargetId(null);
      setProcessing(false);
    }
  };

  // Filtered services
  const filteredServices = services.filter((service) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      service.title.toLowerCase().includes(term) ||
      (service.category || "").toLowerCase().includes(term);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !service.isDeleted) ||
      (statusFilter === "inactive" && service.isDeleted);
    return matchSearch && matchStatus;
  });

  return (
    <Box sx={{ background: "#fff", minHeight: "100vh", pt: 4, px: 2, position: "relative", zIndex: 0 }}>
      <Toaster position="top-center" toastOptions={{ style: { zIndex: 14000 } }} />
      <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
        Service Management
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          placeholder="Search by name, category"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ width: 250 }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
          >
            Create
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 220, width: "100%" }}>
                    <Box sx={{ border: "4px solid #f3f3f3", borderTop: "4px solid #1976d2", borderRadius: "50%", width: 48, height: 48, animation: "spin 1s linear infinite", mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Waiting for services...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Box
                      sx={{
                        width: 200,
                        height: 200,
                        overflow: "hidden",
                        borderRadius: 2,
                        mx: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        component="img"
                        src={service.image}
                        alt={service.title}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{service.title}</TableCell>
                  <TableCell>{service.desc}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell align="right">{service.price}</TableCell>
                  <TableCell>
                    {service.isDeleted ? (
                      <span style={{ color: "#d32f2f", fontWeight: 600 }}>Inactive</span>
                    ) : (
                      <span style={{ color: "#388e3c", fontWeight: 600 }}>Active</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!service.isDeleted && (
                      <Box sx={{ display: "flex", flexDirection: "row", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
                        <IconButton onClick={() => openEditForm(service)}><EditIcon /></IconButton>
                        <IconButton onClick={() => { setActionType("delete"); setTargetId(service.id); setConfirmOpen(true); }} color="error"><DeleteIcon /></IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => !processing && setFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editId ? "Update Service" : "Create Service"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            margin="normal"
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            margin="normal"
            multiline
            rows={3}
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            margin="normal"
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              handleInputChange(
                "price",
                e.target.value === "" ? "" : parseInt(e.target.value)
              )
            }
            margin="normal"
            disabled={processing}
          />
          <Box mt={2}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={processing}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: 200, height: 200, marginTop: 8, borderRadius: 8 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (!processing) {
                setFormOpen(false);
                resetForm();
              }
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={processing}
          >
            {editId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !processing && setConfirmOpen(false)}
      >
        <DialogTitle>Confirm {actionType}</DialogTitle>
        <DialogContent>
          Are you sure you want to {actionType} this service?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => !processing && setConfirmOpen(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAction}
            disabled={processing}
          >
            {processing ? (
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  mr: 1,
                  width: 20,
                  height: 20,
                  border: "3px solid #fff",
                  borderTop: "3px solid #1976d2",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : null}
            Confirm
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceManage;
