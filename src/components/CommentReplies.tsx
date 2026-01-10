import { MessageCircle } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  addComment,
  reactToCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "../store/commentSlice";
import ReactionButton from "./ReactionButton";
import CommentMenu from "./CommentMenu";
import toast from "react-hot-toast";

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

interface CommentRepliesProps {
  replies: Comment[];
  level?: number;
  postId: string;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  replyContent: { [key: string]: string };
  setReplyContent: (content: { [key: string]: string }) => void;
  setReplyingTo: (commentId: string | null) => void;
  showReplies: { [key: string]: boolean };
  setShowReplies: (show: { [key: string]: boolean }) => void;
  showPicker: { [key: string]: boolean };
  setShowPicker: (show: { [key: string]: boolean }) => void;
  localReactions: { [key: string]: any };
  setLocalReactions: (reactions: { [key: string]: any }) => void;
  handleReaction: (commentId: string, action: string) => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
  editingComment: string | null;
  setEditingComment: (commentId: string | null) => void;
  editContent: { [key: string]: string };
  setEditContent: (content: { [key: string]: string }) => void;
  showMenu: { [key: string]: boolean };
  setShowMenu: (show: { [key: string]: boolean }) => void;
}

const CommentReplies: React.FC<CommentRepliesProps> = ({
  replies,
  level = 1,
  postId,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  setReplyingTo,
  showReplies,
  setShowReplies,
  showPicker,
  setShowPicker,
  localReactions,
  setLocalReactions,
  handleReaction,
  handleDeleteComment,
  editingComment,
  setEditingComment,
  editContent,
  setEditContent,
  showMenu,
  setShowMenu,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userId } = useSelector((state: RootState) => state.user);

  if (!replies.length) return null;

  return (
    <div className={`ml-${Math.min(level * 8, 24)} mt-3 space-y-3`}>
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="relative bg-white border border-[#ffe0b2] rounded-xl p-3 flex gap-3 items-start shadow-sm"
        >
          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#ffe0b2] rounded-r-xl" />
          {reply.avatar ? (
            <img
              src={reply.avatar}
              alt={reply.author}
              className="w-8 h-8 rounded-full object-cover border border-gray-200 z-10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#ffd180] flex items-center justify-center text-white font-bold text-base z-10">
              {(reply.author && reply.author[0]) || "?"}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">
                {reply.author}
              </span>
              <span className="bg-[#fff3e0] text-[#b26a00] rounded px-2 py-0.5 text-xs">
                {dayjs(reply.time).fromNow()}
              </span>
            </div>
            <div className="text-gray-800 mt-1 mb-1 text-[15px]">
              {reply.content}
            </div>
            <hr className="my-2 border-t border-dashed border-[#ffe0b2]" />
            <div className="flex gap-2 text-xs text-gray-500 items-center">
              <ReactionButton
                comment={localReactions[reply.id] || reply}
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
                  onReply(reply.id);
                }}
              >
                Reply
              </button>
              {userId &&
                reply.userId?._id &&
                String(userId) === String(reply.userId._id) && (
                  <CommentMenu
                    commentId={reply.id}
                    content={reply.content}
                    onEdit={(commentId) => {
                      setEditingComment(
                        editingComment === commentId ? null : commentId
                      );
                      setEditContent({
                        ...editContent,
                        [commentId]: reply.content,
                      });
                    }}
                    onDelete={() => handleDeleteComment(reply.id)}
                    showMenu={showMenu[reply.id] || false}
                    onToggleMenu={() =>
                      setShowMenu({
                        ...showMenu,
                        [reply.id]: !showMenu[reply.id],
                      })
                    }
                  />
                )}
            </div>
            {replyingTo === reply.id && (
              <div className="border border-yellow-400 mt-3 animate-in fade-in duration-300">
                <div className="bg-gray-50 border border-gray-100 rounded p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      Reply to{" "}
                      <span className="font-semibold">{reply.author}</span>
                    </p>
                  </div>
                  <textarea
                    className="w-full mb-2 border rounded p-2 focus:border-blue-300 focus:ring focus:ring-blue-200 resize-none"
                    rows={3}
                    placeholder="Write your reply..."
                    autoFocus
                    value={replyContent[reply.id] || ""}
                    onChange={(e) =>
                      setReplyContent({
                        ...replyContent,
                        [reply.id]: e.target.value,
                      })
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
                        const content = replyContent[reply.id];
                        if (content && replyingTo) {
                          try {
                            await dispatch(
                              addComment({
                                postId,
                                content,
                                parentCommentId: replyingTo,
                              })
                            );
                            toast.success("Comment sent successfully!");
                            setReplyingTo(null);
                            setReplyContent({});
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
            {reply.replies && reply.replies.length > 0 && (
              <CommentReplies
                replies={reply.replies}
                level={level + 1}
                postId={postId}
                onReply={onReply}
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
      ))}
    </div>
  );
};

export default CommentReplies;
