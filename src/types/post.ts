export interface Post {
  id: string;
  author: string;
  title: string;
  joinDate: string;
  posts: string;
  likes: string;
  likeCount: number;
  likedByMe: boolean;
  content: string;
  timestamp: string;
  isOriginalPoster: boolean;
  userAvatar: string | null;
  signature?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isIgnored?: boolean;
  isDeleted?: boolean;
}
