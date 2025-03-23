import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface ServiceCardProps {
  service: {
    id: number;
    title: string;
    description?: string;
    price?: string;
    location?: string;
    category?: {
      id: number;
      name: string;
      color?: string;
    } | null;
    user: {
      id: number;
      username: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  // Format the display name
  const displayName = service.user.firstName && service.user.lastName
    ? `${service.user.firstName} ${service.user.lastName}`
    : service.user.username;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (service.user.firstName && service.user.lastName) {
      return `${service.user.firstName[0]}${service.user.lastName[0]}`;
    }
    return service.user.username.substring(0, 2).toUpperCase();
  };

  // Get category color for badge
  const getCategoryColor = () => {
    if (service.category?.color) {
      return service.category.color;
    }
    
    // Default color mapping based on category name
    const colorMap: Record<string, string> = {
      'Design': 'bg-blue-100 text-blue-800',
      'Development': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-green-100 text-green-800',
      'Consulting': 'bg-yellow-100 text-yellow-800',
      'Writing': 'bg-pink-100 text-pink-800',
    };
    
    return colorMap[service.category?.name || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <li className="py-4 px-4 hover:bg-gray-50 cursor-pointer">
      <Link href={`/services/${service.id}`}>
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={service.user.profileImageUrl || ""} alt={displayName} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {service.title}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {displayName}{service.price ? ` · ${service.price}` : ''}
            </p>
            <div className="mt-1">
              {service.category && (
                <Badge variant="outline" className={getCategoryColor()}>
                  {service.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
