import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Eye, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  fetchForumPosts,
  fetchKnowledgePosts,
  createPostAction,
  setNeedRefresh,
} from "../store/postSlice";
import SidebarForum from "@components/SidebarForum";
import CreatePostModal from "@components/CreatePostModal";
import { searchForumPosts } from "../utils/fetchFroumPost";

function formatCommentTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return date.toLocaleDateString("en-GB");
}

const Forum: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { forumPosts, knowledgePosts, loading, lastFetchTime, needRefresh } =
    useSelector((state: RootState) => state.posts);
  const { userId, token, role } = useSelector((state: RootState) => state.user);
  const [activeCategory, setActiveCategory] = useState(
    location.state?.category || "forum"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Tính toán số trang
  const totalPages = Math.ceil(
    (activeCategory === "forum" ? forumPosts.length : knowledgePosts.length) /
      postsPerPage
  );

  // Lấy danh sách bài viết cho trang hiện tại
  const getCurrentPosts = () => {
    const posts = activeCategory === "forum" ? forumPosts : knowledgePosts;
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return posts.slice(startIndex, endIndex);
  };

  // Xử lý chuyển trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const shouldFetch = () => {
      if (needRefresh) return true;
      if (activeCategory === "knowledge" && knowledgePosts.length === 0)
        return true;
      if (activeCategory === "forum" && forumPosts.length === 0) return true;
      if (lastFetchTime && Date.now() - lastFetchTime > 5 * 60 * 1000)
        return true;
      return false;
    };

    if (shouldFetch()) {
      if (activeCategory === "knowledge") {
        dispatch(fetchKnowledgePosts());
      } else {
        dispatch(fetchForumPosts());
      }
    }
  }, [
    activeCategory,
    dispatch,
    knowledgePosts.length,
    forumPosts.length,
    lastFetchTime,
    needRefresh,
  ]);

  // Reset currentPage when changing category
  useEffect(() => {
    setCurrentPage(1);
    // Fetch data immediately when changing category
    if (activeCategory === "knowledge") {
      dispatch(fetchKnowledgePosts());
    } else {
      dispatch(fetchForumPosts());
    }
  }, [activeCategory, dispatch]);

  const handleCreateSuccess = async (data: {
    title: string;
    content: string;
    images?: string[];
    isPublic?: boolean;
    tags?: string[];
  }) => {
    await dispatch(createPostAction({ ...data, type: activeCategory }));
    if (activeCategory === "knowledge") {
      dispatch(fetchKnowledgePosts());
    } else {
      dispatch(fetchForumPosts());
    }
    setShowCreateModal(false);
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await searchForumPosts(searchTerm.trim());
      setSearchResults(res.data || []);
    } catch (err) {
      setSearchError("Có lỗi xảy ra khi tìm kiếm.");
    } finally {
      setSearchLoading(false);
    }
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults(null);
    setSearchError("");
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-4 pt-24">
        <div className="flex-1">
          <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
            <div
              className="px-6 py-2 flex justify-between items-center"
              style={{ backgroundColor: "#ffb366" }}
            >
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
            </div>
            {[1, 2, 3].map((_, idx) => (
              <div
                key={idx}
                className="flex items-center px-6 py-6"
                style={{ backgroundColor: "#fffaf6" }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-6"></div>
                <div className="flex-1">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-64">
          <div className="border rounded-lg p-4 bg-white shadow-lg">
            <div className="h-8 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((_, idx) => (
                <div
                  key={idx}
                  className="h-6 w-full bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-4 pt-24">
      <div className="flex-1">
        {activeCategory === "knowledge" && (
          <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
            <div
              className="px-6 py-2 flex justify-between items-center"
              style={{ backgroundColor: "#ffb366" }}
            >
              <h2 className="text-lg font-semibold text-white">Notification</h2>
              {userId &&
                token &&
                ["admin", "manager", "doctor", "staff"].includes(
                  role?.toLowerCase()
                ) && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-white text-[#ffb366] px-4 py-1 rounded-full flex items-center gap-2 hover:bg-opacity-90 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Post
                  </button>
                )}
            </div>
            {getCurrentPosts().map((post, idx) => (
              <div key={post._id}>
                <div
                  className="flex items-center px-6 py-6"
                  style={{ backgroundColor: "#fffaf6" }}
                >
                  {post.userId?.avatar ? (
                    <img
                      src={post.userId.avatar}
                      alt={post.userId?.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 mr-6"
                    />
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#ffa726] mr-6 flex items-center justify-center text-white font-bold text-lg">
                      {post.userId?.fullName?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <Link
                      to={`/general/knowledge/${post._id}`}
                      state={{ from: "detail" }}
                    >
                      <div className="text-lg font-medium text-blue-600 hover:underline mb-1">
                        {post.title}
                      </div>
                    </Link>
                    <div className="text-xs text-gray-500 mb-0.5">
                      {post.userId?.fullName} •{" "}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-gray-500 text-sm ml-6">
                    <div
                      className="flex items-center text-gray-500"
                      title={`Views (${post.views || 0})`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {post.views || 0}
                    </div>
                  </div>
                </div>
                {idx !== getCurrentPosts().length - 1 && (
                  <div className="border-t" />
                )}
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 border-t">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === index + 1
                        ? "bg-[#ffb366] text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeCategory === "forum" && (
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 px-6 py-3 bg-[#fffaf6] border-b"
          >
            <input
              type="text"
              placeholder="Search post title..."
              className="flex-1 border rounded px-3 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-[#ffb366] text-white px-4 py-2 rounded hover:bg-[#ffa726] transition"
              disabled={searchLoading}
            >
              Search
            </button>
            {searchResults && (
              <button
                type="button"
                className="ml-2 px-3 py-2 rounded border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition"
                onClick={handleClearSearch}
              >
                Clear
              </button>
            )}
          </form>
        )}

        {activeCategory === "forum" && (
          <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
            <div
              className="px-6 py-2 flex justify-between items-center"
              style={{ backgroundColor: "#ffb366" }}
            >
              <h2 className="text-lg font-semibold text-white">
                General Forum
              </h2>
              {userId && token && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-[#ffb366] px-4 py-1 rounded-full flex items-center gap-2 hover:bg-opacity-90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Post
                </button>
              )}
            </div>
            {(searchResults !== null ? searchResults : getCurrentPosts()).map(
              (post, idx) => (
                <div key={post._id}>
                  <div
                    className="flex items-center px-6 py-6"
                    style={{ backgroundColor: "#fffaf6" }}
                  >
                    {post.userId?.avatar ? (
                      <img
                        src={post.userId.avatar}
                        alt={post.userId?.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 mr-6"
                      />
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#ffa726] mr-6 flex items-center justify-center text-white font-bold text-lg">
                        {post.userId?.fullName?.[0] || "?"}
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <Link
                        to={`/general/forum/${post._id}`}
                        state={{ from: "detail" }}
                      >
                        <div className="text-lg font-medium text-blue-600 hover:underline mb-1">
                          {post.title}
                        </div>
                      </Link>

                      <div className="flex items-center justify-between w-full text-xs text-gray-500 mb-0.5">
                        <div>
                          {post.userId?.fullName || "Anonymous"} •{" "}
                          {new Date(post.createdAt).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm ml-6">
                      <div className="flex items-center text-gray-500">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.totalComments || 0}
                      </div>
                      <div
                        className="flex items-center text-gray-500"
                        title={`Views (${post.views || 0})`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {post.views || 0}
                      </div>
                      {post.latestCommentUserName && post.latestCommentTime && (
                        <div className="flex flex-col items-center ml-6 min-w-[100px]">
                          <span className="font-bold text-base">
                            {post.latestCommentUserName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatCommentTime(post.latestCommentTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {idx !== getCurrentPosts().length - 1 && (
                    <div className="border-t" />
                  )}
                </div>
              )
            )}
            {searchResults !== null && searchResults.length === 0 && (
              <div className="px-6 py-6 text-center text-gray-500">
                No posts found.
              </div>
            )}
            {searchError && (
              <div className="px-6 py-2 text-red-500 text-center">
                An error occurred while searching.
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 border-t">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === index + 1
                        ? "bg-[#ffb366] text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <SidebarForum
        activeCategory={activeCategory}
        onChangeCategory={setActiveCategory}
      />

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        activeCategory={activeCategory}
      />
    </div>
  );
};

export default Forum;
