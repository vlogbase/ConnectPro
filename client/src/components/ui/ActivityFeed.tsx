import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: string;
  actorId: number | null;
  instanceId: number;
  createdAt: string;
  actor?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  instance: {
    id: number;
    name: string;
    logo?: string;
  };
}

export default function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/activities/recent"],
  });

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Follow":
        return (
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
            <i className="ri-user-add-line text-white"></i>
          </div>
        );
      case "Create":
        return (
          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <i className="ri-file-add-line text-white"></i>
          </div>
        );
      case "ProfileUpdate":
        return (
          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
            <i className="ri-profile-line text-white"></i>
          </div>
        );
      case "ServiceOffer":
        return (
          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <i className="ri-service-line text-white"></i>
          </div>
        );
      case "Federation":
        return (
          <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
            <i className="ri-link text-white"></i>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
            <i className="ri-question-line text-white"></i>
          </div>
        );
    }
  };

  // Get activity title text
  const getActivityTitle = (activity: ActivityItem) => {
    const actorName = activity.actor
      ? activity.actor.firstName && activity.actor.lastName
        ? `${activity.actor.firstName} ${activity.actor.lastName}`
        : activity.actor.username
      : "A user";

    switch (activity.type) {
      case "Follow":
        return <>{actorName} started following someone</>;
      case "Create":
        return <>{actorName} created a new post</>;
      case "ProfileUpdate":
        return <>{actorName} updated their profile</>;
      case "ServiceOffer":
        return <>{actorName} added a new service</>;
      case "Federation":
        return <>{activity.instance.name} established federation with another instance</>;
      default:
        return <>{actorName} performed an activity</>;
    }
  };

  // Get activity description text
  const getActivityDescription = (activity: ActivityItem) => {
    const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });
    
    switch (activity.type) {
      case "Follow":
        return `Connected through federation protocol. Profile details shared across instances.`;
      case "Create":
        return `Created a new post ${timeAgo}.`;
      case "ProfileUpdate":
        return `Updated their professional profile ${timeAgo}.`;
      case "ServiceOffer":
        return `A new service is now available in the directory.`;
      case "Federation":
        return `Both instances can now share profile updates and service listings automatically.`;
      default:
        return `This activity occurred ${timeAgo}.`;
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="px-4 py-5 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">Network Activity</CardTitle>
        <CardDescription className="text-sm text-gray-500">Recent federated activity</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="px-4 py-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-8 last:mb-0">
                <div className="relative pb-8">
                  {i !== 3 && (
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div>
                        <Skeleton className="h-4 w-2/3 mb-1" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <div className="mt-2">
                        <Skeleton className="h-10 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-gray-500 mb-2">No recent activity</p>
            <p className="text-xs text-gray-400">Activities will appear here as users interact with the network</p>
          </div>
        ) : (
          <div className="px-4 py-5">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {activities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx !== activities.length - 1 && (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              {activity.actor ? (
                                <Link href={`/profile/${activity.actor.id}`} className="font-medium text-gray-900 hover:underline">
                                  {getActivityTitle(activity)}
                                </Link>
                              ) : (
                                <span className="font-medium text-gray-900">
                                  {getActivityTitle(activity)}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {activity.instance && (
                                <>from <span className="font-medium">{activity.instance.name}</span> instance</>
                              )}
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>{getActivityDescription(activity)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <Link href="/activities" className="text-sm font-medium text-primary hover:text-primary/90">
                View all activity <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
