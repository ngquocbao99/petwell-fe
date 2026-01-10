import PostDetail from "@components/PostDetail";
import { getKnowledgePostById } from "@utils/fetchFroumPost";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";

const KnowledgeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postComments, setPostComments] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const postRes = await getKnowledgePostById(id);
        setPost(postRes.data);
        setPostComments(postRes.data.comments || []);
        setUserDetails(postRes.data.userId);
      } catch (err: any) {
        console.error("Error loading knowledge post:", err);
        setError(err.response?.data?.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded text-center pt-24">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          {error || "Post not found"}
        </h2>
        <a href="/general" className="text-blue-600 hover:underline">
          Back to Knowledge
        </a>
      </div>
    );
  }

  const sanitizedContent = DOMPurify.sanitize(post.content);

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-2 pt-24">
      <div className="flex-1">
        <PostDetail
          post={{
            title: post.title,
            content: sanitizedContent, // Sanitize để ngăn XSS
            author: post.userId?.fullName || post.userId?.name || "Unknown",
            date: new Date(post.createdAt).toLocaleString(),
            comments: postComments.length.toString(),
            views: post.views?.toString() || "0",
            reactions: post.reactions || [],
            reactionCounts: post.reactionCounts || {},
            totalReactions: post.totalReactions || 0,
            images: post.images || [],
            avatar: userDetails?.avatar,
          }}
          breadcrumb={["Home", "Knowledge", post.title]}
          postId={post._id}
          type="knowledge"
        />
      </div>
    </div>
  );
};

export default KnowledgeDetail;
