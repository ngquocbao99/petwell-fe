import axios from "axios";
import SummaryApi from "../common/SummarryAPI";
import { baseURL } from "../common/SummarryAPI";

export const getCommentsByPostId = async (postId: string) => {
  const config = SummaryApi.comment.getByPostId(postId);
  const res = await axios({
    baseURL,
    ...config,
  });
  return res.data;
};

export const createComment = async (postId: string, content: string, parentCommentId?: string) => {
  const config = SummaryApi.comment.create(postId);
  const token = localStorage.getItem("accesstoken");
  const res = await axios({
    baseURL,
    ...config,
    data: { content, parentCommentId },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.data;
};

export const reactToComment = async (commentId: string, action: string) => {
  const config = SummaryApi.comment.react(commentId);
  const token = localStorage.getItem("accesstoken");
  try {
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
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateComment = async (commentId: string, content: string) => {
  const config = SummaryApi.comment.update(commentId);
  const token = localStorage.getItem("accesstoken");
  try {
    const res = await axios({
      baseURL,
      ...config,
      data: { content },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteComment = async (commentId: string) => {
  const config = SummaryApi.comment.delete(commentId);
  const token = localStorage.getItem("accesstoken");
  try {
    const res = await axios({
      baseURL,
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
