import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface InstanceSummaryCardProps {
  instanceId: number;
}

export default function InstanceSummaryCard({ instanceId }: InstanceSummaryCardProps) {
  // Fetch instance details
  const { data: instance, isLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}`],
    enabled: !!instanceId,
  });

  // Fetch instance federation status
  const { data: federations = [], isLoading: federationsLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}/federations`],
    enabled: !!instanceId,
  });
  
  // Get instance initials for avatar
  const getInitials = () => {
    if (!instance) return "??";
    return instance.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Get background color for avatar
  const getBackgroundColor = () => {
    if (!instance) return "bg-gray-200";
    
    const colors = [
      'bg-primary-100',
      'bg-purple-100',
      'bg-blue-100',
      'bg-green-100',
      'bg-yellow-100',
      'bg-red-100',
    ];
    
    // Simple hash function to consistently get same color for same name
    const hashCode = instance.name.split('').reduce(
      (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0
    );
    
    return colors[Math.abs(hashCode) % colors.length];
  };

  // Get text color to match background
  const getTextColor = () => {
    const bgColor = getBackgroundColor();
    const colorMap: Record<string, string> = {
      'bg-primary-100': 'text-primary-600',
      'bg-purple-100': 'text-purple-600',
      'bg-blue-100': 'text-blue-600',
      'bg-green-100': 'text-green-600',
      'bg-yellow-100': 'text-yellow-600',
      'bg-red-100': 'text-red-600',
      'bg-gray-200': 'text-gray-600',
    };
    
    return colorMap[bgColor] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full rounded" />
        </CardFooter>
      </Card>
    );
  }

  if (!instance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instance Not Found</CardTitle>
          <CardDescription>
            The requested instance could not be found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            The instance you're looking for may have been deleted or is no longer available.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin">Back to Admin Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{instance.name}</CardTitle>
        <CardDescription>
          Instance Overview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-full ${getBackgroundColor()} flex items-center justify-center`}>
            {instance.logo ? (
              <img 
                src={instance.logo} 
                alt={instance.name} 
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span className={`${getTextColor()} text-lg font-medium`}>{getInitials()}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{instance.domain || `instance-${instance.id}.connectpro.com`}</p>
            <div className="mt-1">
              {instance.active ? (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {instance.description && (
          <p className="text-sm text-gray-600">{instance.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Registration Type:</span>
            <span className="font-medium">
              {instance.registrationType === "open" && "Open"}
              {instance.registrationType === "invite" && "Invite-only"}
              {instance.registrationType === "admin" && "Admin approval"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Federated With:</span>
            <span className="font-medium">
              {federationsLoading ? (
                <Skeleton className="h-4 w-8 inline-block" />
              ) : (
                federations.length
              )} instances
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Created:</span>
            <span className="font-medium">
              {new Date(instance.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/admin/instances/${instance.id}`}>
            Manage Instance
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
