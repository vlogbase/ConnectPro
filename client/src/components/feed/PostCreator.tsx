import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PostCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const queryClient = useQueryClient();

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string, mediaUrl?: string }) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      setPostContent("");
      setMediaUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Your post has been published.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish your post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePostSubmit = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive",
      });
      return;
    }

    if (!postContent.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: postContent.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
    });
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user) return "?";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">Sign in to share posts with your network</p>
            <Button asChild variant="default">
              <a href="/api/login">Log in with Replit</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-5">
      <CardContent className="p-4">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profile_image_url || ""} alt={user.username} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <Textarea
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Share something with your network..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />
            
            <div className="mt-3 flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded"
                >
                  <i className="ri-image-line mr-1"></i>
                  Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded"
                >
                  <i className="ri-video-line mr-1"></i>
                  Video
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded"
                >
                  <i className="ri-service-line mr-1"></i>
                  Service
                </Button>
              </div>
              <Button
                type="button"
                onClick={handlePostSubmit}
                disabled={!postContent.trim() || createPostMutation.isPending}
                className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
