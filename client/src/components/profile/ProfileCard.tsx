import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface ProfileCardProps {
  userId: number;
  isCurrentUser?: boolean;
}

export default function ProfileCard({ userId, isCurrentUser = false }: ProfileCardProps) {
  const { user: authUser } = useAuth();
  
  // Fetch user details
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user services count
  const { data: services = [] } = useQuery({
    queryKey: [`/api/users/${userId}/services`],
    enabled: !!userId,
  });

  // Fetch user instances count
  const { data: instances = [] } = useQuery({
    queryKey: [`/api/users/${userId}/instances`],
    enabled: !!userId && isCurrentUser,
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden mb-5">
        <CardContent className="p-4">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-24 bg-gray-200 w-full rounded-md"></div>
            <div className="flex justify-center -mt-12">
              <div className="h-24 w-24 rounded-full bg-gray-300 border-4 border-white"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
            <div className="w-full mt-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center w-1/3">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mt-1"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden mb-5">
        <CardContent className="p-4 text-center">
          <p className="text-gray-500">User not found</p>
        </CardContent>
      </Card>
    );
  }

  // Get display name
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden mb-5">
      <div className="h-24 bg-gradient-to-r from-primary to-primary/70"></div>
      <CardContent className="px-4 py-5">
        <div className="flex justify-center -mt-12">
          <Avatar className="h-24 w-24 rounded-full border-4 border-white">
            <AvatarImage src={user.profileImageUrl || ""} alt={displayName} />
            <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center mt-2">
          <h3 className="text-xl font-medium text-gray-900">{displayName}</h3>
          <p className="text-sm text-gray-500">{user.headline || `@${user.username}`}</p>
        </div>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <div className="text-center">
              <span className="text-lg font-bold">0</span>
              <p className="text-xs text-gray-500">Connections</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold">{services.length}</span>
              <p className="text-xs text-gray-500">Services</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold">{instances.length}</span>
              <p className="text-xs text-gray-500">Instances</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {isCurrentUser ? (
            <Button className="w-full" variant="default">
              Edit Profile
            </Button>
          ) : (
            <Button className="w-full" variant="default">
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
