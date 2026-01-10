import { useEffect, useState } from "react";
import { blockUnblockUser, fetchAllUsers } from "@utils/UsersAPI";
import { useSelector } from "react-redux";
import type { RootState } from "@store/store";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListAltIcon from "@mui/icons-material/FilterListAlt";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CreateUserAccount from "./CreateUserAccount";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";
import { X } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  status: string;
  avatar: string;
  isBlock: boolean;
  role: string;
  isActive: boolean;
  isVerified: boolean;
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 8;
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "",
  });
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "banned" | "unbanned"
  >("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await fetchAllUsers();
        setUsers(data);
      } catch (error) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!showFilterMenu) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative.ml-2")) setShowFilterMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterMenu]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };
  const currentUserRole = useSelector((state: RootState) =>
    state.user.role.toLowerCase()
  );

  const viewableRolesByRole: Record<string, string[]> = {
    admin: ["customer", "staff", "manager", "doctor"],
    // manager: ["customer", "staff", "doctor"],
    // staff: ["customer"],
  };

  let filteredUsers = users.filter((user) => {
    const userRole = user.role.toLowerCase();
    const selected = selectedRole.toLowerCase();
    const allowedRoles = viewableRolesByRole[currentUserRole] || [];
    return userRole === selected && allowedRoles.includes(userRole);
  });

  // Lọc theo trạng thái Ban/Unban
  if (filterStatus === "banned") {
    filteredUsers = filteredUsers.filter((user) => user.isBlock);
  } else if (filterStatus === "unbanned") {
    filteredUsers = filteredUsers.filter((user) => !user.isBlock);
  }

  // Sắp xếp: tài khoản bị ban xuống dưới cùng
  filteredUsers = [...filteredUsers].sort((a, b) => {
    if (a.isBlock === b.isBlock) return 0;
    return a.isBlock ? 1 : -1;
  });

  const roleTabs: string[] = ["customer", "manager"];
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      if (startPage > 2) {
        pageNumbers.push("...");
      }
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const userToken = useSelector((state: RootState) => state.user.token);

  const handleBanUnban = async (userId: string, isBlock: boolean) => {
    try {
      const result = await blockUnblockUser(userId, !isBlock, userToken);
      if (result.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, isBlock: !isBlock } : user
          )
        );
      }
    } catch (error) {
      console.error("Error during ban/unban:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const deleteResponse = await Axios({
        ...SummaryApi.user.deleteUser(userToDelete),
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (deleteResponse.data.success) {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== userToDelete)
        );
        toast.success("User deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user!");
    } finally {
      setIsDeleteClosing(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        setIsDeleteClosing(false);
      }, 300);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setEditForm({ fullName: "", email: "", role: "" });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const updateResponse = await Axios({
        ...SummaryApi.user.updateUser(editingUser._id),
        data: editForm,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (updateResponse.data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === editingUser._id ? { ...user, ...editForm } : user
          )
        );
        toast.success("User updated successfully!");
        handleCloseEditForm();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user!");
    }
  };

  return (
    <div className="min-h-screen-full mt-5 bg-gray-50">
      {/* Header with Stats */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <div className="flex space-x-4 items-center">
          <div className="flex bg-white rounded-lg p-1 shadow-sm text-sm">
            {roleTabs
              .filter((role) =>
                viewableRolesByRole[currentUserRole]?.includes(role)
              )
              .map((role) => (
                <button
                  key={role}
                  className={`px-4 py-2 ${
                    selectedRole === role
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  } rounded-md`}
                  onClick={() => handleRoleChange(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
          </div>
          {/* Filter Ban/Unban - single button with dropdown */}
          <div className="relative ml-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm hover:bg-gray-50 focus:outline-none"
              onClick={() => setShowFilterMenu((prev) => !prev)}
              type="button"
            >
              <FilterListAltIcon fontSize="small" />
              <span className="font-medium">
                {filterStatus === "all" && "All"}
                {filterStatus === "unbanned" && "Unbanned"}
                {filterStatus === "banned" && "Banned"}
              </span>
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showFilterMenu && (
              <div className="absolute z-10 mt-2 right-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg animate-fade-in">
                <button
                  className={`w-full text-left px-4 py-2 rounded-t-lg hover:bg-orange-50 ${
                    filterStatus === "all"
                      ? "bg-orange-100 text-orange-700 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setFilterStatus("all");
                    setShowFilterMenu(false);
                  }}
                >
                  All
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-green-50 ${
                    filterStatus === "unbanned"
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setFilterStatus("unbanned");
                    setShowFilterMenu(false);
                  }}
                >
                  Unbanned
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-b-lg hover:bg-red-50 ${
                    filterStatus === "banned"
                      ? "bg-red-100 text-red-700 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setFilterStatus("banned");
                    setShowFilterMenu(false);
                  }}
                >
                  Banned
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center text-xs"
          >
            <span className="mr-2">
              <AddIcon />
            </span>
            Add new
          </button>

          {/* <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center text-xs">
            <span className="mr-2">
              <FileUploadIcon />
            </span>
            Import members
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center text-xs">
            <span className="mr-2">
              <DownloadIcon />
            </span>
            Export members (Excel)
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center text-xs">
            <span className="mr-2">
              <FilterListAltIcon />
            </span>
            Filter
          </button> */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Avatar
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Member name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Email
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user._id}
                      className={`border-b hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.fullName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {user.phone || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-[200px] truncate">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center justify-center w-16 h-6 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isVerified
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {user.isVerified ? "Active" : "Unactive"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() =>
                              handleBanUnban(user._id, user.isBlock)
                            }
                            className={`inline-flex items-center justify-center w-16 h-6 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                              user.isBlock
                                ? "bg-red-200 text-red-800"
                                : "bg-green-200 text-green-800"
                            }`}
                            title={user.isBlock ? "Unban" : "Ban"}
                          >
                            {user.isBlock ? "Unban" : "Ban"}
                          </button>
                          {/* <button
                            onClick={() => handleEdit(user)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </button> */}
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No users found for this role.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <button
            className={`flex items-center px-3 py-2 ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="mr-1">←</span>
            Previous
          </button>

          <div className="flex space-x-2">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex items-center px-2"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  className={`w-8 h-8 rounded ${
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handlePageChange(page as number)}
                >
                  {String(page).padStart(2)}
                </button>
              )
            )}
          </div>

          <button
            className={`flex items-center px-3 py-2 ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <span className="ml-1">→</span>
          </button>
        </div>
      )}
      {showForm && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
            isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div
            className={`rounded-lg max-w-3xl w-full transform transition-all duration-300 ${
              isClosing
                ? "scale-95 translate-y-8 opacity-0"
                : "scale-100 translate-y-0 opacity-100"
            }`}
          >
            <CreateUserAccount
              onClose={() => {
                setIsClosing(true);
                setTimeout(() => {
                  setShowForm(false);
                  setIsClosing(false);
                }, 300);
              }}
            />
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
            isDeleteClosing ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div
            className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all duration-300 ${
              isDeleteClosing
                ? "scale-95 translate-y-8 opacity-0"
                : "scale-100 translate-y-0 opacity-100"
            }`}
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <DeleteIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteClosing(true);
                  setTimeout(() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                    setIsDeleteClosing(false);
                  }, 300);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* {showEditForm && editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <EditIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit User
                </h3>
              </div>
              <button
                onClick={handleCloseEditForm}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-gray-500 text-lg">×</span>
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="customer">Customer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={handleCloseEditForm}
                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Users;
