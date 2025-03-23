import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

export interface Post {
  id: number;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    headline?: string;
  };
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  // Get post comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: !!post.id,
  });

  // Get post reactions
  const { data: reactions = [] } = useQuery<{ id: number; userId: number; type: string }[]>({
    queryKey: [`/api/posts/${post.id}/reactions`],
    enabled: !!post.id,
  });

  // Check if current user has liked the post
  const userLiked = user ? reactions.some(r => r.userId === user.userId && r.type === "like") : false;
  
  // Count likes
  const likeCount = reactions.filter(r => r.type === "like").length;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      setCommentText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/reactions`, { type: "like" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/reactions`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format the display name
  const displayName = post.user.firstName && post.user.lastName
    ? `${post.user.firstName} ${post.user.lastName}`
    : post.user.username;

  // Format the time
  const formattedDate = new Date(post.createdAt);
  const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });

  // Handle comment submission
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on posts",
        variant: "destructive",
      });
      return;
    }
    
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText.trim());
    }
  };

  // Handle like button click
  const handleLikeClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }
    
    likePostMutation.mutate();
  };

  // Get initials for avatar fallback
  const getInitials = (userData: Post["user"]) => {
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName[0]}${userData.lastName[0]}`;
    }
    return userData.username.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="mb-5">
      <CardContent className="p-5">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.user.id}`}>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage src={post.user.profileImageUrl || ""} alt={displayName} />
              <AvatarFallback>{getInitials(post.user)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${post.user.id}`} className="text-sm font-medium text-gray-900 hover:underline">
              {displayName}
            </Link>
            <div className="text-sm text-gray-500">
              {post.user.headline ? `${post.user.headline} • ` : ""}{timeAgo}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-gray-800">{post.content}</p>
        </div>
        
        {post.mediaUrl && (
          <div className="mt-4">
            <img src={post.mediaUrl} alt="Post media" className="rounded-lg w-full h-64 object-cover" />
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLikeClick}
              className={`flex items-center ${userLiked ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <i className={`${userLiked ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'} mr-1.5`}></i>
              <span>{likeCount}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center text-gray-500 hover:text-gray-800"
            >
              <i className="ri-chat-1-line mr-1.5"></i>
              <span>{comments.length}</span>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center text-gray-500 hover:text-gray-800"
          >
            <i className="ri-share-line mr-1.5"></i>
            <span>Share</span>
          </Button>
        </div>
        
        {comments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.profileImageUrl || ""} alt={comment.user.username} />
                      <AvatarFallback>
                        {comment.user.firstName && comment.user.lastName
                          ? `${comment.user.firstName[0]}${comment.user.lastName[0]}`
                          : comment.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
                      <span className="font-medium text-gray-900">{comment.user.firstName && comment.user.lastName
                        ? `${comment.user.firstName} ${comment.user.lastName}`
                        : comment.user.username}
                      </span>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex space-x-2">
                      <button type="button">Like</button>
                      <button type="button">Reply</button>
                      <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Comment form */}
        <div className="mt-4 flex">
          <div className="flex-shrink-0 mr-3">
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profile_image_url || ""} alt={user.username} />
                <AvatarFallback>
                  {user.first_name && user.last_name
                    ? `${user.first_name[0]}${user.last_name[0]}`
                    : user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            )}
          </div>
          <form className="flex-1" onSubmit={handleAddComment}>
            <div className="flex items-center rounded-md border border-gray-300 overflow-hidden">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 block w-full px-3 py-2 border-0 focus:ring-0"
                placeholder="Add a comment..."
                disabled={!user || addCommentMutation.isPending}
              />
              <Button 
                type="submit" 
                variant="secondary"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium"
                disabled={!commentText.trim() || !user || addCommentMutation.isPending}
              >
                Post
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
