import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileCard from "@/components/profile/ProfileCard";
import InstancesList from "@/components/admin/InstancesList";
import ServiceDirectory from "@/components/services/ServiceDirectory";
import ActivityFeed from "@/components/ui/ActivityFeed";
import PostCreator from "@/components/feed/PostCreator";
import PostCard from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch posts for feed
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Page Title */}
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Home Feed</h1>
        <p className="text-sm text-gray-500 mt-1">Latest updates from your network</p>
      </div>

      {/* 3 Column Layout */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-12">
        {/* Left Column - Profile Card */}
        <div className="sm:col-span-3">
          {!authLoading && user ? (
            <ProfileCard userId={user.userId} isCurrentUser={true} />
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden mb-5">
              <div className="h-24 bg-gradient-to-r from-primary to-primary/70"></div>
              <div className="px-4 py-5">
                <div className="flex justify-center -mt-12">
                  <Skeleton className="h-24 w-24 rounded-full border-4 border-white" />
                </div>
                <div className="text-center mt-2">
                  <Skeleton className="h-5 w-32 mx-auto mb-1" />
                  <Skeleton className="h-3 w-48 mx-auto" />
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <div className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instances List */}
          <InstancesList />
        </div>

        {/* Middle Column - Feed */}
        <div className="sm:col-span-6">
          {/* Post Creator */}
          <PostCreator />

          {/* Feed Posts */}
          {postsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white shadow rounded-lg mb-5">
                  <div className="p-5">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-4">
                        <Skeleton className="h-8 w-16 rounded" />
                        <Skeleton className="h-8 w-16 rounded" />
                      </div>
                      <Skeleton className="h-8 w-16 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : posts.length === 0 ? (
            <div className="bg-white shadow rounded-lg mb-5">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-6">Be the first to share something with your network!</p>
              </div>
            </div>
          ) : (
            posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
        
        {/* Right Column - Services & Activity */}
        <div className="sm:col-span-3">
          {/* Services Directory */}
          <ServiceDirectory />

          {/* Network Activity */}
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
