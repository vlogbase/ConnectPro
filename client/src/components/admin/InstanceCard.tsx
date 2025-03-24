import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink, BarChart2 } from "lucide-react";

interface InstanceCardProps {
  instance: {
    id: number;
    name: string;
    description?: string;
    domain?: string;
    active: boolean;
    createdAt: string;
  };
}

export default function InstanceCard({ instance }: InstanceCardProps) {
  // Get initials for instance avatar
  const getInitials = () => {
    return instance.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get background color based on name (for visual variety)
  const getBackgroundColor = () => {
    const colors = [
      'bg-primary/10',
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
      'bg-primary/10': 'text-primary',
      'bg-purple-100': 'text-purple-600',
      'bg-blue-100': 'text-blue-600',
      'bg-green-100': 'text-green-600',
      'bg-yellow-100': 'text-yellow-600',
      'bg-red-100': 'text-red-600',
    };
    
    return colorMap[bgColor] || 'text-gray-600';
  };

  // Prevent event propagation to avoid triggering the Link when clicking on buttons
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <li className="px-4 py-4 hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/instances/${instance.id}`} className="flex-1 flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full ${getBackgroundColor()} flex items-center justify-center`}>
              <span className={`${getTextColor()} text-sm font-medium`}>{getInitials()}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {instance.name}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {instance.domain || `instance-${instance.id}.connectpro.com`}
            </p>
          </div>
          <div>
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
        </Link>
        <div className="flex items-center space-x-2 ml-2" onClick={handleButtonClick}>
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0" title="Analytics">
            <Link href={`/admin/instances/${instance.id}/analytics`}>
              <span className="sr-only">Analytics</span>
              <BarChart2 className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0" title="Settings">
            <Link href={`/admin/instances/${instance.id}/settings`}>
              <span className="sr-only">Settings</span>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          {instance.domain && (
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0" title="Visit Instance">
              <a href={`https://${instance.domain}`} target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Visit</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
