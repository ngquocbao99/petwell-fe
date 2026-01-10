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
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "../common/SummarryAPI";

interface StaffType {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  address: string;
  avatar: string;
  isActive: boolean;
  isBlock: boolean;
  isVerified: boolean;
  password: string;
  repassword: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const StaffManage = () => {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);

  const [formData, setFormData] = useState<Omit<StaffType, "id">>({
    email: "",
    fullName: "",
    phone: "",
    role: "staff",
    address: "",
    avatar: "",
    isActive: true,
    isBlock: false,
    isVerified: true,
    password: "",
    repassword: "",
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [actionType, setActionType] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  // State cho search
  const [searchTerm, setSearchTerm] = useState("");
  // State cho filter block
  const [blockFilter, setBlockFilter] = useState<
    "all" | "blocked" | "unblocked"
  >("all");

  // Lọc staff theo searchTerm và blockFilter
  const filteredStaffList = staffList.filter((staff) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      staff.email.toLowerCase().includes(term) ||
      staff.fullName.toLowerCase().includes(term);
    const matchBlock =
      blockFilter === "all" ||
      (blockFilter === "blocked" && staff.isBlock) ||
      (blockFilter === "unblocked" && !staff.isBlock);
    return matchSearch && matchBlock;
  });

  //lấy danh sách staff từ API
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await Axios({ ...SummaryApi.staff.listByManager });
      setStaffList(
        (res.data.data || [])
          .map((item: any) => ({
            id: item._id,
            email: item.email,
            fullName: item.fullName,
            phone: String(item.phone),
            role: item.role,
            address: item.address,
            avatar: item.avatar,
            isActive: item.isActive,
            isBlock: item.isBlock,
            isVerified: item.isVerified,
            updatedAt: item.updatedAt || null,
            createdAt: item.createdAt || null,
          }))
          .sort((a, b) => {
            if (a.isBlock !== b.isBlock) {
              // Sắp xếp theo trạng thái Block
              return Number(a.isBlock) - Number(b.isBlock); // Active trước Blocked
            }
            return a.fullName //sắp xếp theo tên
              .toLowerCase()
              .localeCompare(b.fullName.toLowerCase());
          })
      );
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("You do not have permission to view staff list.");
      } else if (err.response?.status === 401) {
        toast.error("Please log in again.");
      } else {
        toast.error("Failed to load staff list. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Hàm lấy chi tiết staff
  const openDetail = async (staff: StaffType) => {
    try {
      const res = await Axios(SummaryApi.staff.detail(staff.id));
      if (res?.data?.success && res.data.data) {
        setSelectedStaff({
          id: res.data.data._id,
          email: res.data.data.email,
          fullName: res.data.data.fullName,
          phone: String(res.data.data.phone),
          role: res.data.data.role,
          address: res.data.data.address,
          avatar: res.data.data.avatar,
          isActive: res.data.data.isActive,
          isBlock: res.data.data.isBlock,
          isVerified: res.data.data.isVerified,
          createdAt: res.data.data.createdAt,
          updatedAt: res.data.data.updatedAt,
           password: "",
          repassword: ""
        });
        setDetailOpen(true);
      } else {
        toast.error("Failed to fetch staff detail.");
      }
    } catch (err) {
      toast.error("Error loading staff detail.");
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
  };

  // Hàm xử lý thay đổi input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Hàm mở form tạo mới hoặc chỉnh sửa staff
  const openCreateForm = () => {
    setFormData({
      email: "",
      fullName: "",
      phone: "",
      role: "staff",
      address: "",
      avatar: "",
      isActive: true,
      isBlock: false,
      isVerified: false,
      password: "",
      repassword: "",
    });
    setEditId(null);
    setSelectedAvatarFile(null);
    setAvatarPreview("");
    setFormOpen(true);
  };

  // Hàm mở form chỉnh sửa staff
  const openEditForm = (staff: StaffType) => {
    // Khi edit, không có password và repassword
    const { password, repassword, ...rest } = staff;
    setFormData({ ...rest, phone: String(staff.phone), password: '', repassword: '' });
    setEditId(staff.id);
    setSelectedAvatarFile(null);
    setAvatarPreview(staff.avatar || "");
    setFormOpen(true);
  };

  // Hàm xử lý thay đổi file avatar
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      setSelectedAvatarFile(null);
      // Nếu đang cập nhật, giữ lại preview ảnh cũ
      if (editId && selectedStaff && selectedStaff.avatar) {
        setAvatarPreview(selectedStaff.avatar);
      } else {
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview("");
        }
      }
      if (e.target) e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      setSelectedAvatarFile(null);
      // Nếu đang cập nhật, giữ lại preview ảnh cũ
      if (editId && selectedStaff && selectedStaff.avatar) {
        setAvatarPreview(selectedStaff.avatar);
      } else {
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview("");
        }
      }
      if (e.target) e.target.value = "";
      return;
    }
    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Hàm upload avatar lên server
  const uploadAvatar = async (file: File): Promise<string | null> => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    try {
      const res = await Axios.post("/api/v1/upload/", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success && res.data.data.url) return res.data.data.url;
    } catch (err) {
      console.error("Avatar upload error:", err);
    }
    toast.error("Avatar upload failed!");
    if (!editId) {
      // Tạo mới: xóa preview và không hiện tên file
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
      setSelectedAvatarFile(null);
    } else {
      // Cập nhật: luôn giữ lại preview ảnh cũ, kể cả khi avatarPreview bị mất
      if (selectedStaff && selectedStaff.avatar) {
        setAvatarPreview(selectedStaff.avatar);
      } else {
        setAvatarPreview("");
      }
      setSelectedAvatarFile(null);
    }
    return null;
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
    setEditId(null);
  };

  // Hàm validate form
  // Kiểm tra các trường bắt buộc và định dạng
  const validateForm = () => {
    // Cảnh báo tổng thể nếu thiếu bất kỳ trường nào
    if (
      !formData.email?.trim() ||
      !formData.fullName?.trim() ||
      !formData.phone?.toString().trim() ||
      !formData.address?.trim() ||
      (!editId &&
        (!formData.password || !formData.repassword) &&
        !selectedAvatarFile) // Chỉ kiểm tra password khi tạo mới
      // Khi cập nhật, không bắt buộc phải có selectedAvatarFile hay avatarPreview, chỉ cần giữ lại ảnh cũ nếu có
    ) {
      toast.error("Please fill in all required fields.");
      return false;
    }

    // Sau đó kiểm tra chi tiết từng trường để hiển thị lỗi cụ thể
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      toast.error("Invalid email format");
      return false;
    }

    // Kiểm tra tên đầy đủ không chứa ký tự đặc biệt và bắt đầu bằng chữ cái
    if (!/^[a-zA-ZÀ-ỹ]/.test(formData.fullName.trim())) {
      toast.error("Full Name must start with a letter");
      return false;
    }

  // Kiểm tra số điện thoại bắt đầu bằng 0 và có độ dài từ 10 đến 11 chữ số
  if (!/^0\d{9,10}$/.test(formData.phone.toString().trim())) {
    toast.error("Invalid phone number");
    return false;
  }

  // Chỉ kiểm tra password khi tạo mới
  if (!editId) {
    if (!formData.password || !formData.repassword) {
      toast.error("Please enter both password fields.");
      return false;
    }
    if (formData.password.length < 6 || formData.repassword.length < 6) {
      toast.error("Password and re-password must be at least 6 characters.");
      return false;
    }
    if (formData.password !== formData.repassword) {
      toast.error("Passwords do not match.");
      return false;
    }
  }
  return true;
};

// Hàm xử lý submit form
const handleSubmit = () => {
  if (!validateForm()) return;
  if (!editId && !selectedAvatarFile) {
    toast.error("Please select an avatar image.");
    return;
  }
  setActionType(editId ? "update" : "create");
  setConfirmOpen(true);
};

// Hàm xử lý xác nhận hành động (tạo, cập nhật, xóa)
const handleConfirmAction = async () => {
  if (processing) return;

  // Không validate khi xóa
  if (actionType === "delete" && targetId) {
    setProcessing(true);
    try {
      await Axios({
        ...SummaryApi.staff.delete(targetId),
      });
      toast.success("Staff deleted successfully");
      setFormOpen(false);
      setConfirmOpen(false);
      setProcessing(false);
      setActionType(null);
      setTargetId(null);
      fetchStaff();
    } catch {
      toast.error("Action failed");
      setProcessing(false);
      setConfirmOpen(false);
    }
    return;
  }

  // Chỉ validate khi tạo hoặc cập nhật
  if (actionType === "create" || actionType === "update") {
    // Luôn đóng confirm dialog nếu validateForm trả về false để hiển thị toast chi tiết mỗi lần
    if (!validateForm()) {
      setProcessing(false);
      setConfirmOpen(false);
      return;
    }
    // Kiểm tra trùng email hoặc phone trước khi gọi API
    const isDuplicate = staffList.some((staff) => {
      // Nếu là update thì bỏ qua chính nó
      if (editId && staff.id === editId) return false;
      return (
        staff.email.trim().toLowerCase() ===
        formData.email.trim().toLowerCase() ||
        staff.phone.trim() === formData.phone.trim()
      );
    });
    if (isDuplicate) {
      toast.error("Another staff with this email or phone already exists");
      setProcessing(false);
      setConfirmOpen(false);
      return;
    }
  }

  // Nếu không có lỗi thì tiếp tục xử lý
  setProcessing(true);
  try {
    let avatarUrl = formData.avatar;
    if (selectedAvatarFile) {
      const uploadedUrl = await uploadAvatar(selectedAvatarFile);
      if (!uploadedUrl) {
        setProcessing(false);
        setConfirmOpen(false);
        return;
      }
      avatarUrl = uploadedUrl;
    }
    // Khi update, không gửi password và repassword
    let payload: any = { ...formData, avatar: avatarUrl, role: "staff" };
    if (actionType === "update") {
      delete payload.password;
      delete payload.repassword;
    }
    // kiểm tra xem có thay đổi gì không
    if (actionType === "update" && editId) {
      const currentStaff = staffList.find((s) => s.id === editId);
      if (currentStaff) {
        const isSame =
          currentStaff.email.trim() === formData.email.trim() &&
          currentStaff.fullName.trim() === formData.fullName.trim() &&
          currentStaff.phone.trim() === formData.phone.trim() &&
          currentStaff.address.trim() === formData.address.trim() &&
          !selectedAvatarFile &&
          avatarPreview === currentStaff.avatar;
        if (isSame) {
          toast("No changes detected.");
          setFormOpen(false);
          setProcessing(false);
          setConfirmOpen(false);
          return;
        }
      }
    }
    if (actionType === "update" && editId) {
      try {
        const res = await Axios({
          ...SummaryApi.staff.update(editId),
          data: payload,
        });
        if (res?.data?.success) {
          toast.success("Staff updated successfully");
        } else if (
          res?.data?.message ===
          "Another staff with this email or phone already exists"
        ) {
          toast.error(
            "Another staff with this email or phone already exists"
          );
          setProcessing(false);
          setConfirmOpen(false);
          return;
        } else if (
          res?.data?.message ===
          "Staff not found or not a valid staff account"
        ) {
          toast.error("Staff not found or not a valid staff account");
          setProcessing(false);
          setConfirmOpen(false);
          return;
        } else if (res?.data?.message) {
          toast.error(res.data.message);
          setProcessing(false);
          setConfirmOpen(false);
          return;
        } else {
          toast.error("Failed to update staff");
          setProcessing(false);
          setConfirmOpen(false);
          return;
        }
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response?.data?.message
        ) {
          toast.error(err.response.data.message);
        } else {
          toast.error("Failed to update staff");
        }
        setProcessing(false);
        setConfirmOpen(false);
        return;
      }
    } else if (actionType === "create") {
      try {
        const res = await Axios({
          ...SummaryApi.staff.create,
          data: payload,
        });
        if (res?.data?.success) {
          toast.success("Staff created successfully");
        } else if (res?.data?.message) {
          toast.error(res.data.message);
          setProcessing(false);
          setConfirmOpen(false);
          return;
        } else {
          toast.error("Failed to create staff");
          setProcessing(false);
          setConfirmOpen(false);
          return;
        }
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response?.data?.message
        ) {
          toast.error(err.response.data.message);
        } else if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string"
        ) {
          toast.error(err.message);
        } else {
          toast.error("Failed to create staff");
        }
        setProcessing(false);
        setConfirmOpen(false);
        return;
      }
    }
    setFormOpen(false);
    setConfirmOpen(false);
    setProcessing(false);
    setActionType(null);
    setTargetId(null);
    fetchStaff();
  } catch {
    toast.error("Action failed");
    setProcessing(false);
    setConfirmOpen(false);
  }
};

// Hàm xử lý xóa staff
const handleDelete = async (id: string) => {
  setActionType("delete");
  setTargetId(id);
  setConfirmOpen(true);
};

return (
  <Box sx={{ background: "#fff", minHeight: "100vh", p: 4 }}>
    <Toaster
      position="top-center"
      toastOptions={{ style: { zIndex: 14000 } }}
    />
    <Typography variant="h4" align="center" gutterBottom fontWeight={700}>
      Staff Management
    </Typography>

    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <TextField
        placeholder="Search by name, email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        sx={{ width: 250 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          select
          label="Block filter"
          value={blockFilter}
          onChange={(e) =>
            setBlockFilter(e.target.value as "all" | "blocked" | "unblocked")
          }
          size="small"
          sx={{ width: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unblocked">Active</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </TextField>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateForm}
          sx={{ minWidth: 110 }}
        >
          Create
        </Button>
      </Box>
    </Box>

    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <b>Avatar</b>
            </TableCell>
            <TableCell>
              <b>Email</b>
            </TableCell>
            <TableCell>
              <b>Full Name</b>
            </TableCell>
            <TableCell>
              <b>Status</b>
            </TableCell>
            <TableCell align="right">
              <b>Actions</b>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 220,
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      border: "4px solid #f3f3f3",
                      borderTop: "4px solid #1976d2",
                      borderRadius: "50%",
                      width: 48,
                      height: 48,
                      animation: "spin 1s linear infinite",
                      mb: 2,
                    }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    Waiting for staff...
                  </Typography>
                  <style>{`@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg); }}`}</style>
                </Box>
              </TableCell>
            </TableRow>
          ) : filteredStaffList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No staff found.
              </TableCell>
            </TableRow>
          ) : (
            filteredStaffList.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell>
                  <img
                    src={staff.avatar}
                    alt={staff.fullName}
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }}
                  />
                </TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>{staff.fullName}</TableCell>
                <TableCell>
                  <span
                    style={{
                      color: staff.isBlock ? "#d32f2f" : "#388e3c",
                      fontWeight: 600,
                    }}
                  >
                    {staff.isBlock ? "Blocked" : "Active"}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openDetail(staff)}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>

    {/* // Dialog for Create/Edit Staff */}
    <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
      <DialogTitle>{editId ? "Edit Staff" : "Create Staff"}</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          disabled={!!editId}
        />
        <TextField
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />
        {!editId && (
          <>
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Re-enter Password"
              name="repassword"
              type="password"
              value={formData.repassword}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
          </>
        )}
        <TextField
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />



        <Box mt={2}>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarFileChange}
          />
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
                marginTop: 8,
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseForm}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
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
        {actionType === "delete"
          ? "Are you sure you want to delete this staff?"
          : actionType === "update"
            ? "Are you sure you want to update this staff?"
            : "Are you sure you want to create this staff?"}
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
          <style>{`@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg); }}`}</style>
        </Button>
      </DialogActions>
    </Dialog>

    {/* Staff Detail Dialog */}
    <Dialog
      open={detailOpen}
      onClose={closeDetail}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Staff Details</DialogTitle>
      <DialogContent dividers>
        {selectedStaff ? (
          <Box>
            <Box display="flex" justifyContent="center" mb={2}>
              <img
                src={selectedStaff.avatar}
                alt={selectedStaff.fullName}
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto" }}
              />
            </Box>
            <Typography>
              <strong>Email:</strong> {selectedStaff.email}
            </Typography>
            <Typography>
              <strong>Full Name:</strong> {selectedStaff.fullName}
            </Typography>
            <Typography>
              <strong>Phone:</strong> {selectedStaff.phone}
            </Typography>
            <Typography>
              <strong>Address:</strong> {selectedStaff.address}
            </Typography>
            <Typography>
              <strong>Role:</strong> {selectedStaff.role}
            </Typography>
            <Typography>
              <strong>Status:</strong>{" "}
              {selectedStaff.isBlock ? "Blocked" : "Active"}
            </Typography>
            <Typography>
              <strong>Verified:</strong>{" "}
              {selectedStaff.isVerified ? "Yes" : "No"}
            </Typography>
            <Typography>
              <strong>Created At:</strong>{" "}
              {selectedStaff.createdAt
                ? new Date(selectedStaff.createdAt).toLocaleString()
                : "N/A"}
            </Typography>
            <Typography>
              <strong>Updated At:</strong>{" "}
              {selectedStaff.updatedAt
                ? new Date(selectedStaff.updatedAt).toLocaleString()
                : "N/A"}
            </Typography>
          </Box>
        ) : (
          <Typography>Loading...</Typography>
        )}
      </DialogContent>
      {/* //dùng DialogActions để hiển thị các nút Close, Edit, Delete */}
      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Button
          variant="text"
          color="inherit"
          onClick={closeDetail}
          sx={{ fontWeight: 500 }}
        >
          Close
        </Button>
        {/* // Hiển thị nút Edit và Delete nếu staff không bị block */}
        {!selectedStaff?.isBlock && (
          <Box display="flex" gap={1.5}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                closeDetail();
                openEditForm(selectedStaff);
              }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                closeDetail();
                handleDelete(selectedStaff.id);
              }}
            >
              Delete
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  </Box>
);
};

export default StaffManage;
