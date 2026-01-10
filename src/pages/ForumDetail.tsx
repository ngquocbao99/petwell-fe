import Comments from "@components/Comments";
import PostDetail from "@components/PostDetail";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchForumPostById, reactToPostAction } from "../store/postSlice";
import { fetchComments } from "../store/commentSlice";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";

const ForumDetail: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { currentPost, loading: postLoading } = useSelector(
    (state: RootState) => state.posts
  );
  const { comments, loading: commentsLoading } = useSelector(
    (state: RootState) => state.comments
  );
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        await dispatch(fetchForumPostById(id));
        await dispatch(fetchComments(id));

        // Fetch user details
        if (currentPost?.userId?._id) {
          const userRes = await Axios({
            ...SummaryApi.userDetails(currentPost.userId._id),
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
            },
          });
          setUserDetails(userRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [id, dispatch, currentPost?.userId?._id]);

  if (!currentPost || !currentPost.userId) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded text-center">
        <h2 className="text-xl font-bold mb-4 text-red-600">Post not found</h2>
        <Link
          to="/general"
          state={{ category: "forum" }}
          className="text-blue-600 hover:underline"
        >
          Back to General Forum
        </Link>
      </div>
    );
  }

  const postComments = comments[id] || [];

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-2 pt-24">
      <div className="flex-1">
        <PostDetail
          post={{
            title: currentPost.title || "",
            content: currentPost.content || "",
            author: currentPost.userId?.fullName || "Anonymous",
            userId: currentPost.userId?._id || "",
            date: new Date(currentPost.createdAt).toLocaleString(),
            comments: postComments.length.toString(),
            views: currentPost.views?.toString() || "0",
            reactions: currentPost.reactions || [],
            reactionCounts: currentPost.reactionCounts || {},
            totalReactions: currentPost.totalReactions || 0,
            images: currentPost.images || [],
            avatar: userDetails?.avatar,
            tags: currentPost.tags || [],
          }}
          breadcrumb={["Home", "Forum", currentPost.title || "Post"]}
          postId={currentPost._id}
          type="forum"
        />
        <Comments comments={postComments} postId={currentPost._id || ""} />
      </div>
    </div>
  );
};

export default ForumDetail;
