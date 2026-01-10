import { useState } from "react";
import { MessageCircle, Edit2, Trash2, MoreVertical } from "lucide-react";
import {
  createComment,
  reactToComment,
  updateComment,
  deleteComment,
} from "../utils/fetchComment";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ReactionButton from "./ReactionButton";
import CommentMenu from "./CommentMenu";
import CommentReplies from "./CommentReplies";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  addComment,
  reactToCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "../store/commentSlice";
dayjs.extend(relativeTime);

interface Comment {
  id: string;
  author: string;
  time: string;
  content: string;
  avatar?: string;
  userId: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  replies?: Comment[];
  reactions?: {
    userId: string;
    action: string;
    createdAt: string;
  }[];
  reactionCounts?: {
    like: number;
    love: number;
    haha: number;
    angry: number;
    sad: number;
    wow: number;
  };
}

interface CommentsProps {
  comments: Comment[];
  postId: string;
}

const Comments: React.FC<CommentsProps> = ({ comments, postId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId } = useSelector((state: RootState) => state.user);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>(
    {}
  );
  const [editContent, setEditContent] = useState<{ [key: string]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [showPicker, setShowPicker] = useState<{ [key: string]: boolean }>({});
  const [localReactions, setLocalReactions] = useState<{ [key: string]: any }>(
    {}
  );
  const [showMenu, setShowMenu] = useState<{ [key: string]: boolean }>({});
  const [showCommentBox, setShowCommentBox] = useState(true);

  const handleSendComment = async () => {
    if (!userId) {
      toast.error("Please login to comment!");
      return;
    }
    if (!commentContent.trim()) {
      toast.error("Please enter comment content!");
      return;
    }
    try {
      const result = await dispatch(
        addComment({ postId, content: commentContent })
      );
      if (result.payload) {
        setCommentContent("");
        setShowCommentBox(false);
        toast.success("Comment sent successfully!");
      }
    } catch (error) {
      toast.error("Failed to send comment!");
    }
  };

  const handleReaction = async (commentId: string, action: string) => {
    if (!userId) {
      toast.error("Please login to add reaction!");
      return;
    }
    try {
      await dispatch(reactToCommentAction({ commentId, action }));
      toast.success("Reaction added successfully!");
    } catch (error) {
      toast.error("Failed to add reaction!");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please login to delete comment!");
      return;
    }
    try {
      await dispatch(deleteCommentAction({ commentId, postId }));
      toast.success("Comment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete comment!");
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please login to edit comment!");
      return;
    }
    const content = editContent[commentId];
    if (!content?.trim()) {
      toast.error("Please enter comment content!");
      return;
    }
    try {
      await dispatch(updateCommentAction({ commentId, content }));
      setEditingComment(null);
      toast.success("Comment updated successfully!");
    } catch (error) {
      toast.error("Failed to update comment!");
    }
  };

  const renderCommentActions = (comment: Comment) => {
    const commentUserId = comment.userId?._id;

    return (
      <div className="flex gap-6 text-sm items-center pt-0">
        <ReactionButton
          comment={comment}
          showPicker={showPicker}
          setShowPicker={setShowPicker}
          handleReaction={handleReaction}
        />
        <button
          className="flex items-center gap-1 text-[#ff9800] font-medium hover:underline"
          onClick={() => {
            if (!userId) {
              toast.error("Please login to reply!");
              return;
            }
            setReplyingTo(replyingTo === comment.id ? null : comment.id);
          }}
        >
          Reply
        </button>
        {comment.replies && comment.replies.length > 0 && (
          <button
            className="hover:text-[#ff9800] font-medium underline"
            onClick={() =>
              setShowReplies((prev) => ({
                ...prev,
                [comment.id]: !prev[comment.id],
              }))
            }
          >
            {showReplies[comment.id]
              ? `Hide replies`
              : `Show replies (${comment.replies.length})`}
          </button>
        )}
        {userId &&
          commentUserId &&
          String(userId) === String(commentUserId) && (
            <CommentMenu
              commentId={comment.id}
              content={comment.content}
              onEdit={(commentId) => {
                setEditingComment(
                  editingComment === commentId ? null : commentId
                );
                setEditContent((prev) => ({
                  ...prev,
                  [commentId]: comment.content,
                }));
              }}
              onDelete={handleDeleteComment}
              showMenu={showMenu[comment.id] || false}
              onToggleMenu={() =>
                setShowMenu((prev) => ({
                  ...prev,
                  [comment.id]: !prev[comment.id],
                }))
              }
            />
          )}
      </div>
    );
  };

  const renderCommentContent = (comment: Comment) => {
    if (editingComment === comment.id) {
      return (
        <div className="border border-blue-400 mt-4 animate-in fade-in duration-300">
          <div className="bg-gray-50 border border-gray-100 rounded p-4">
            <textarea
              className="w-full mb-2 border rounded p-2 focus:border-blue-300 focus:ring focus:ring-blue-200 resize-none"
              rows={3}
              placeholder="Edit your comment..."
              autoFocus
              value={editContent[comment.id] || ""}
              onChange={(e) =>
                setEditContent((ec) => ({
                  ...ec,
                  [comment.id]: e.target.value,
                }))
              }
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height =
                  e.currentTarget.scrollHeight + "px";
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-xs"
                onClick={() => setEditingComment(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-xs"
                onClick={() => handleUpdateComment(comment.id)}
              >
                <Edit2 className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <div className="text-gray-800 mb-1">{comment.content}</div>;
  };

  return (
    <div className="border border-yellow-400 bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
        <MessageCircle className="h-5 w-5 text-blue-500" /> Comments (
        {comments.length})
      </h2>
      <div className="space-y-6">
        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-[#fff7e6] border border-[#ffe0b2] rounded-2xl p-5 shadow mb-4"
          >
            <div className="flex items-start gap-3">
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt={c.author}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#ffa726] flex items-center justify-center text-white font-bold text-lg">
                  {(c.author && c.author[0]) || "?"}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {c.author}
                  </span>
                  <span className="bg-[#ffe0b2] text-[#b26a00] rounded px-2 py-0.5 text-xs ml-2">
                    {dayjs(c.time).fromNow()}
                  </span>
                </div>
                {renderCommentContent(c)}
                <hr className="my-2 border-t border-dashed border-[#ffe0b2]" />
                {renderCommentActions(c)}
                {replyingTo === c.id && (
                  <div className="border border-yellow-400 mt-4 animate-in fade-in duration-300">
                    <div className="bg-gray-50 border border-gray-100 rounded p-4">
                      <div className="flex flex-row items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          Reply to{" "}
                          <span className="font-semibold">{c.author}</span>
                        </p>
                      </div>
                      <textarea
                        className="w-full mb-2 border rounded p-2 focus:border-blue-300 focus:ring focus:ring-blue-200 resize-none"
                        rows={3}
                        placeholder="Write your reply..."
                        autoFocus
                        value={replyContent[c.id] || ""}
                        onChange={(e) =>
                          setReplyContent((rc) => ({
                            ...rc,
                            [c.id]: e.target.value,
                          }))
                        }
                        onInput={(e) => {
                          e.currentTarget.style.height = "auto";
                          e.currentTarget.style.height =
                            e.currentTarget.scrollHeight + "px";
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-xs"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-xs"
                          onClick={async () => {
                            if (!userId) {
                              toast.error("Please login to reply!");
                              return;
                            }
                            const content = replyContent[c.id];
                            if (content && replyingTo) {
                              try {
                                await createComment(
                                  postId,
                                  content,
                                  replyingTo
                                );
                                toast.success("Comment sent successfully!");
                                window.location.reload();
                              } catch (error) {
                                toast.error("Failed to send reply!");
                              }
                            }
                          }}
                        >
                          <MessageCircle className="h-4 w-4" /> Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {c.replies &&
                  c.replies.length > 0 &&
                  showReplies[c.id] === true && (
                    <CommentReplies
                      replies={c.replies}
                      postId={postId}
                      onReply={setReplyingTo}
                      replyingTo={replyingTo}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      setReplyingTo={setReplyingTo}
                      showReplies={showReplies}
                      setShowReplies={setShowReplies}
                      showPicker={showPicker}
                      setShowPicker={setShowPicker}
                      localReactions={localReactions}
                      setLocalReactions={setLocalReactions}
                      handleReaction={handleReaction}
                      handleDeleteComment={handleDeleteComment}
                      editingComment={editingComment}
                      setEditingComment={setEditingComment}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      showMenu={showMenu}
                      setShowMenu={setShowMenu}
                    />
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
