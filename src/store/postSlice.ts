import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  getAllForumPosts, 
  getAllKnowledgePosts, 
  getForumPostById, 
  getKnowledgePostById,
  reactToPost,
  createPost,
  updatePost,
  deletePost
} from "../utils/fetchFroumPost";

interface Post {
  _id: string;
  title: string;
  content: string;
  userId: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
  views: number;
  reactions?: any[];
  reactionCounts?: { [key: string]: number };
  totalReactions?: number;
  images?: string[];
  totalComments?: number;
  latestCommentUserName?: string;
  latestCommentTime?: string;
  tags?: string[];
}

interface PostState {
  forumPosts: Post[];
  knowledgePosts: Post[];
  currentPost: Post | null;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  needRefresh: boolean;
}

const initialState: PostState = {
  forumPosts: [],
  knowledgePosts: [],
  currentPost: null,
  loading: false,
  error: null,
  lastFetchTime: null,
  needRefresh: false
};

export const fetchForumPosts = createAsyncThunk(
  "posts/fetchForumPosts",
  async () => {
    const response = await getAllForumPosts();
    return response.data;
  }
);

export const fetchKnowledgePosts = createAsyncThunk(
  "posts/fetchKnowledgePosts",
  async () => {
    const response = await getAllKnowledgePosts();
    return response.data;
  }
);

export const fetchForumPostById = createAsyncThunk(
  "posts/fetchForumPostById",
  async (id: string) => {
    const response = await getForumPostById(id);
    return response.data;
  }
);

export const fetchKnowledgePostById = createAsyncThunk(
  "posts/fetchKnowledgePostById",
  async (id: string) => {
    const response = await getKnowledgePostById(id);
    return response.data;
  }
);

export const reactToPostAction = createAsyncThunk(
  "posts/reactToPost",
  async ({ postId, action }: { postId: string; action: string }) => {
    const response = await reactToPost(postId, action);
    return { postId, reaction: response.data };
  }
);

export const createPostAction = createAsyncThunk(
  "posts/createPost",
  async (data: {
    title: string;
    content: string;
    images?: string[];
    isPublic?: boolean;
    tags?: string[];
    type: string;
  }) => {
    const response = await createPost(data);
    return response.data;
  }
);

export const updatePostAction = createAsyncThunk(
  "posts/updatePost",
  async ({ postId, data }: { postId: string; data: {
    title: string;
    content: string;
    images?: string[];
    isPublic?: boolean;
    tags?: string[];
  }}) => {
    const response = await updatePost(postId, data);
    return response.data;
  }
);

export const deletePostAction = createAsyncThunk(
  "posts/deletePost",
  async (postId: string) => {
    const response = await deletePost(postId);
    return response.data;
  }
);

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setLastFetchTime: (state) => {
      state.lastFetchTime = Date.now();
    },
    setNeedRefresh: (state, action) => {
      state.needRefresh = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Forum Posts
      .addCase(fetchForumPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForumPosts.fulfilled, (state, action) => {
        state.forumPosts = action.payload;
        state.loading = false;
        state.lastFetchTime = Date.now();
        state.needRefresh = false;
      })
      .addCase(fetchForumPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch forum posts";
      })
      // Fetch Knowledge Posts
      .addCase(fetchKnowledgePosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKnowledgePosts.fulfilled, (state, action) => {
        state.knowledgePosts = action.payload;
        state.loading = false;
        state.lastFetchTime = Date.now();
        state.needRefresh = false;
      })
      .addCase(fetchKnowledgePosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch knowledge posts";
      })
      // Fetch Forum Post By Id
      .addCase(fetchForumPostById.fulfilled, (state, action) => {
        state.currentPost = action.payload;
      })
      // Fetch Knowledge Post By Id
      .addCase(fetchKnowledgePostById.fulfilled, (state, action) => {
        state.currentPost = action.payload;
      })
      // React to Post
      .addCase(reactToPostAction.fulfilled, (state, action) => {
        const { postId, reaction } = action.payload;
        if (state.currentPost?._id === postId) {
          state.currentPost.reactions = reaction.reactions;
          state.currentPost.reactionCounts = reaction.reactionCounts;
          state.currentPost.totalReactions = reaction.totalReactions;
        }
        const updatePostReactions = (posts: Post[]) => {
          posts.forEach(post => {
            if (post._id === postId) {
              post.reactions = reaction.reactions;
              post.reactionCounts = reaction.reactionCounts;
              post.totalReactions = reaction.totalReactions;
            }
          });
        };
        updatePostReactions(state.forumPosts);
        updatePostReactions(state.knowledgePosts);
      })
      // Create Post
      .addCase(createPostAction.fulfilled, (state, action) => {
        const newPost = action.payload;
        if (newPost.type === "forum") {
          state.forumPosts.unshift(newPost);
        } else {
          state.knowledgePosts.unshift(newPost);
        }
      })
      // Update Post
      .addCase(updatePostAction.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const updatePostInArray = (posts: Post[]) => {
          const index = posts.findIndex(post => post._id === updatedPost._id);
          if (index !== -1) {
            posts[index] = updatedPost;
          }
        };
        updatePostInArray(state.forumPosts);
        updatePostInArray(state.knowledgePosts);
        if (state.currentPost?._id === updatedPost._id) {
          state.currentPost = updatedPost;
        }
      })
      // Delete Post
      .addCase(deletePostAction.fulfilled, (state, action) => {
        const deletedPostId = action.payload._id;
        state.forumPosts = state.forumPosts.filter(post => post._id !== deletedPostId);
        state.knowledgePosts = state.knowledgePosts.filter(post => post._id !== deletedPostId);
        if (state.currentPost?._id === deletedPostId) {
          state.currentPost = null;
        }
      });
  }
});

export const { setLastFetchTime, setNeedRefresh } = postSlice.actions;
export default postSlice.reducer; 