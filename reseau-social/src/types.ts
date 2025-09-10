export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface CommentType {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface PostType {
  _id: string;
  content?: string; // Legacy field
  textContent?: string; // New field from backend
  author: User;
  type: 'Proverbe' | 'Conte' | 'Histoire';
  mediaType?: 'none' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  audioUrl?: string; // Legacy field for backward compatibility
  language?: string;
  region?: string;
  likes: string[]; // Array of user IDs
  comments: CommentType[]; // Array of comment objects
  createdAt: string;
}