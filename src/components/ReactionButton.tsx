import React, { useState, useCallback, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";
import toast from "react-hot-toast";

const REACTION_ICONS = {
  like: <span style={{ fontSize: 28 }}>👍</span>,
  love: <span style={{ fontSize: 28 }}>❤️</span>,
  haha: <span style={{ fontSize: 28 }}>😂</span>,
  wow: <span style={{ fontSize: 28 }}>😮</span>,
  sad: <span style={{ fontSize: 28 }}>😢</span>,
  angry: <span style={{ fontSize: 28 }}>😠</span>,
};

interface ReactionButtonProps {
  comment: any;
  showPicker: { [key: string]: boolean };
  setShowPicker: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  handleReaction: (commentId: string, action: string) => Promise<void>;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  comment,
  showPicker,
  setShowPicker,
  handleReaction,
}) => {
  const userId = useSelector((state: RootState) => state.user.userId);
  const [localReactions, setLocalReactions] = useState(comment);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (!isUpdating) {
      const isReset =
        comment.id === localReactions.id &&
        comment.reactions?.length === 0 &&
        localReactions.reactions?.length > 0;

      if (isReset) {
        return;
      }
      setLocalReactions(comment);
    }
  }, [comment, isUpdating, localReactions]);

  useEffect(() => {
    const updateUserInfo = async () => {
      if (!localReactions.reactions?.length) return;

      const updatedReactions = await Promise.all(
        localReactions.reactions.map(async (reaction: any) => {
          if (reaction.fullName || reaction.user?.fullName) return reaction;

          try {
            const userRes = await Axios({
              ...SummaryApi.userDetails(reaction.userId),
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
              },
            });
            return {
              ...reaction,
              fullName: userRes.data.data.fullName,
              avatar: userRes.data.data.avatar,
            };
          } catch (error) {
            console.error("Error fetching user info:", error);
            return reaction;
          }
        })
      );

      setLocalReactions((prev) => ({
        ...prev,
        reactions: updatedReactions,
      }));
    };

    updateUserInfo();
  }, [localReactions.reactions?.length]);

  const userReaction =
    localReactions.userReaction ||
    localReactions.reactions?.find((r: any) => {
      const rid = r.userId || (r._doc && r._doc.userId);
      return String(rid) === String(userId);
    })?.action;

  const reactionCounts = localReactions.reactionCounts || {};
  const totalReactions =
    localReactions.totalReactions ??
    Object.values(reactionCounts)
      .filter((v): v is number => typeof v === "number")
      .reduce((a, b) => a + b, 0);

  const uniqueReactions = Array.from(
    new Map(
      (localReactions.reactions || []).map((r: any) => [r.userId.toString(), r])
    ).values()
  );

  const handleReactionClick = useCallback(
    async (action: string) => {
      if (!userId) {
        toast.error("Please login to add reaction!");
        return;
      }

      try {
        setIsUpdating(true);
        setLastAction(action);
        const newReactions = [...(localReactions.reactions || [])];
        const existingReactionIndex = newReactions.findIndex(
          (r: any) => String(r.userId) === String(userId)
        );
        let updatedReactions;
        if (existingReactionIndex !== -1) {
          newReactions.splice(existingReactionIndex, 1);
          updatedReactions = {
            ...localReactions,
            reactions: newReactions,
            reactionCounts: {
              ...reactionCounts,
              [action]: Math.max(0, (reactionCounts[action] || 0) - 1),
            },
            totalReactions: Math.max(0, totalReactions - 1),
            userReaction: null,
          };
        } else {
          newReactions.push({
            userId,
            action,
            createdAt: new Date().toISOString(),
          });
          updatedReactions = {
            ...localReactions,
            reactions: newReactions,
            reactionCounts: {
              ...reactionCounts,
              [action]: (reactionCounts[action] || 0) + 1,
            },
            totalReactions: totalReactions + 1,
            userReaction: action,
          };
        }
        setLocalReactions(updatedReactions);
        await handleReaction(comment.id, action);
        setShowPicker((prev) => ({ ...prev, [comment.id]: false }));
      } catch (error) {
        setLocalReactions(comment);
      } finally {
        setIsUpdating(false);
        setLastAction(null);
      }
    },
    [
      comment,
      localReactions,
      userId,
      reactionCounts,
      totalReactions,
      handleReaction,
      setShowPicker,
    ]
  );

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <div
          className="relative"
          onMouseEnter={() =>
            setShowPicker((prev) => ({ ...prev, [comment.id]: true }))
          }
          onMouseLeave={() =>
            setShowPicker((prev) => ({ ...prev, [comment.id]: false }))
          }
        >
          <button
            className="flex items-center gap-1 text-[#a0522d] font-medium hover:bg-gray-150 px-2  rounded-full transition-colors"
            onClick={async () => {
              if (userReaction) {
                await handleReactionClick(userReaction);
              } else {
                setShowPicker((prev) => ({ ...prev, [comment.id]: true }));
              }
            }}
          >
            {userReaction ? (
              <span className="flex items-center text-xl gap-1">
                {REACTION_ICONS[userReaction as keyof typeof REACTION_ICONS]}
              </span>
            ) : (
              <ThumbsUp className="h-5 w-5" />
            )}
          </button>
          {showPicker[comment.id] && (
            <div className="absolute bottom-full left-0  bg-white rounded-lg shadow-lg p-2 flex gap-2 border border-gray-200 z-50">
              {Object.entries(REACTION_ICONS).map(([action, icon]) => (
                <button
                  key={action}
                  onClick={() => handleReactionClick(action)}
                  className="flex flex-col items-center text-2xl hover:scale-125 transition-transform duration-200"
                  title={action}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>
        {uniqueReactions.length > 0 && (
          <div className="relative group">
            <span className="text-[#a0522d] font-medium cursor-pointer">
              {uniqueReactions.length}
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white border border-gray-300 rounded shadow-lg p-2 z-50 min-w-[120px] max-h-48 overflow-y-auto">
              {uniqueReactions.length > 0 ? (
                <ul>
                  {uniqueReactions.map((r: any, idx: number) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 py-1 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        {r.avatar || r.user?.avatar ? (
                          <img
                            src={r.avatar || r.user?.avatar}
                            alt={
                              r.fullName ||
                              r.user?.fullName ||
                              r.userName ||
                              r.userId
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#ffa726] flex items-center justify-center text-white text-xs font-bold">
                            {
                              (r.fullName ||
                                r.user?.fullName ||
                                r.userName ||
                                r.userId ||
                                "?")[0]
                            }
                          </div>
                        )}
                      </div>
                      <span className="truncate">
                        {r.fullName ||
                          r.user?.fullName ||
                          r.userName ||
                          r.userId}
                      </span>
                      {r.action && (
                        <span className="ml-1 flex-shrink-0">
                          {
                            REACTION_ICONS[
                              r.action as keyof typeof REACTION_ICONS
                            ]
                          }
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-400">No reactions yet</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionButton;
