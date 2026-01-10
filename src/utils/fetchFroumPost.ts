import axios from "axios";
import SummaryApi from "../common/SummarryAPI";
import { baseURL } from "../common/SummarryAPI";

export const getForumPostById = async (id: string) => {
  try {
    const config = SummaryApi.forumPost.getById(id);
    const res = await axios({
      baseURL,
      ...config,
    });
    return res.data;
  } catch (error) {

    throw error;
  }
};

export const getKnowledgePostById = async (id: string) => {
  try {
    const config = SummaryApi.knowledgePost.getById(id);
    const res = await axios({
      baseURL,
      ...config,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getAllForumPosts = async (page: number = 1, limit: number = 5) => {
  try {
    const config = SummaryApi.forumPost.getAll(page, limit);
    const res = await axios({
      baseURL,
      ...config,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getAllKnowledgePosts = async (page: number = 1, limit: number = 5) => {
  try {
    const config = SummaryApi.knowledgePost.getAll(page, limit);
    const res = await axios({
      baseURL,
      ...config,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getForumStatistics = async () => {
  try {
    const config = SummaryApi.forumPost.getStatistics;
    const res = await axios({
      baseURL,
      ...config,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const reactToPost = async (postId: string, action: string) => {
  try {
    const config = SummaryApi.forumPost.react(postId);
    const token = localStorage.getItem("accesstoken");
    const userId = localStorage.getItem("userId");
    const res = await axios({
      baseURL,
      ...config,
      data: { action },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error) {

    throw error;
  }
};

export const createPost = async (data: {
  title: string;
  content: string;
  images?: string[];
  isPublic?: boolean;
  tags?: string[];
  type: string;
}) => {
  try {
    const config = SummaryApi.forumPost.create;
    const token = localStorage.getItem("accesstoken");
    const res = await axios({
      baseURL,
      ...config,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updatePost = async (postId: string, data: {
  title: string;
  content: string;
  images?: string[];
  isPublic?: boolean;
  tags?: string[];
}) => {
  try {
    const config = SummaryApi.forumPost.update(postId);
    const token = localStorage.getItem("accesstoken");
    const res = await axios({
      baseURL,
      ...config,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deletePost = async (postId: string) => {
  try {
    const config = SummaryApi.forumPost.delete(postId);
    const token = localStorage.getItem("accesstoken");
    const res = await axios({
      baseURL,
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const searchForumPosts = async (q: string) => {
  try {
    const config = SummaryApi.forumPost.search(q);
    const res = await axios({
      baseURL,
      ...config,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

