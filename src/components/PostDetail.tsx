import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  MessageCircle,
  Bookmark,
  Flag,
  Share2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  reactToPostAction,
  setNeedRefresh,
  updatePostAction,
  deletePostAction,
} from "../store/postSlice";
import { addComment } from "../store/commentSlice";
import toast from "react-hot-toast";
import ReactionButton from "./ReactionButton";
import CreatePostModal from "./CreatePostModal";

interface Post {
  title: string;
  content: string;
  author: string;
  userId?: string;
  date: string;
  comments: string;
  views: string;
  isExpert?: boolean;
  role?: string;
  reactions?: string[];
  reactionCounts?: { [key: string]: number };
  totalReactions?: number;
  images?: string[];
  avatar?: string;
  tags?: string[];
}

interface ReactionPayload {
  reactions: string[];
  reactionCounts: { [key: string]: number };
  totalReactions: number;
}

const PostDetail: React.FC<{
  post: Post;
  breadcrumb: string[];
  postId?: string;
  type?: "knowledge" | "forum";
}> = ({ post, breadcrumb, postId, type = "forum" }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postReactions, setPostReactions] = useState({
    reactions: post.reactions || [],
    reactionCounts: post.reactionCounts || {},
    totalReactions: post.totalReactions || 0,
  });
  const [showPicker, setShowPicker] = useState<{ [key: string]: boolean }>({});
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const currentUserId = useSelector((state: RootState) => state.user.userId);
  const isAuthor = post.userId === currentUserId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(setNeedRefresh(true));
    };
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleSendComment = async () => {
    const token = localStorage.getItem("accesstoken");
    if (!token) {
      toast.error("Please login to comment!");
      navigate("/auth/login");
      return;
    }
    if (!commentContent.trim()) {
      toast.error("Please enter comment content!");
      return;
    }
    if (!postId) {
      toast.error("Missing content or postId!");
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(
        addComment({ postId, content: commentContent })
      );
      if (result.payload) {
        setCommentContent("");
        setShowCommentBox(false);
        toast.success("Comment sent successfully!");
      }
    } catch (err) {
      toast.error("Failed to send comment!");
    } finally {
      setLoading(false);
    }
  };

  const handlePostReaction = async (action: string) => {
    try {
      const token = localStorage.getItem("accesstoken");
      if (!token) {
        toast.error("Please login to add reaction!");
        navigate("/auth/login");
        return;
      }
      if (!postId) return;
      const result = await dispatch(reactToPostAction({ postId, action }));
      if (result.payload) {
        const payload = result.payload as ReactionPayload;
        setPostReactions({
          reactions: payload.reactions || [],
          reactionCounts: payload.reactionCounts || {},
          totalReactions: payload.totalReactions || 0,
        });
        setShowPicker((prev) => ({ ...prev, [postId]: false }));
        toast.success("Reaction added successfully!");
      }
    } catch (err) {
      toast.error("Cannot add reaction!");
    }
  };

  const handleUpdatePost = async (data: {
    title: string;
    content: string;
    images?: string[];
    isPublic?: boolean;
    tags?: string[];
  }) => {
    if (!postId) return;
    try {
      const result = await dispatch(updatePostAction({ postId, data }));
      if (result.payload) {
        toast.success("Post updated successfully!");
        setShowEditModal(false);
      }
    } catch (err) {
      toast.error("Failed to update post!");
    }
  };

  const handleDeletePost = async () => {
    if (!postId) return;
    try {
      const result = await dispatch(deletePostAction(postId));
      if (result.payload) {
        toast.success("Post deleted successfully!");
        navigate("/general", { state: { category: type } });
      }
    } catch (err) {
      toast.error("Delete post failed!");
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex-1">
      <nav className="text-sm text-gray-500 mb-6 flex items-center flex-wrap">
        {breadcrumb.map((label, idx) => (
          <React.Fragment key={idx}>
            {idx !== 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            )}
            {idx < breadcrumb.length - 1 ? (
              <Link
                to={idx === 0 ? "/" : "/general"}
                state={{ category: type }}
                className="hover:text-gray-800 transition-colors"
              >
                {label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="border border-yellow-400 bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">{post.title}</h1>
        <div className="flex items-center mb-4">
          {post.avatar ? (
            <img
              src={post.avatar}
              alt={post.author}
              className="w-12 h-12 rounded-full object-cover border border-gray-200 mr-4"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#ffa726] flex items-center justify-center text-white font-bold text-lg mr-4">
              {(post.author && post.author[0]) || "?"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-gray-900">
                {post.author}
              </span>
              {post.role && (
                <span className="bg-gray-100 text-xs px-2 py-0.5 rounded border border-gray-200 ml-2 text-gray-700">
                  {post.role}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">{post.date}</div>
          </div>
          <div className="ml-auto flex gap-2">
            {isAuthor && !post.isExpert && type !== "knowledge" && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="border px-3 py-1 rounded text-gray-600 border-gray-300 hover:bg-gray-100 transition"
                  title="More actions"
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mb-4 text-gray-800 text-[16px] leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {post.images.map((image, index) => (
              <div key={index} className="relative aspect-video">
                <img
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        {type !== "knowledge" && (
          <div className="flex gap-8 pt-4 text-gray-600 px-2">
            {!post.isExpert && (
              <>
                <ReactionButton
                  comment={{
                    ...postReactions,
                    id: postId || "",
                  }}
                  showPicker={showPicker}
                  setShowPicker={setShowPicker}
                  handleReaction={(_, action) => handlePostReaction(action)}
                />
                <button
                  className="flex items-center gap-2 hover:text-blue-500 transition"
                  onClick={() => {
                    const token = localStorage.getItem("accesstoken");
                    if (!token) {
                      toast.error("Please login to comment!");
                      navigate("/auth/login");
                      return;
                    }
                    setShowCommentBox((v) => !v);
                  }}
                >
                  <MessageCircle className="w-5 h-5" /> Comment
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {type !== "knowledge" && showCommentBox && (
        <div className="mt-4 relative bg-gray-50 border border-gray-200 rounded p-4">
          <textarea
            className="w-full border rounded p-2 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm resize-none"
            rows={3}
            placeholder="Write your comment..."
            value={commentContent}
            onChange={(e) => {
              setCommentContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            style={{ minHeight: 48, maxHeight: 300, overflowY: "auto" }}
            autoFocus
          />
          <div className="flex justify-end mt-2 gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              onClick={handleSendComment}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Comment"}
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
              onClick={() => setShowCommentBox(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <CreatePostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleUpdatePost}
        activeCategory={type}
        initialData={{
          title: post.title,
          content: post.content,
          images: post.images,
          tags: post.tags,
        }}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center text-red-600">
              Confirm Delete Post
            </h3>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
