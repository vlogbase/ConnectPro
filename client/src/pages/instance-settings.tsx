import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import InstanceSettings from "@/components/admin/InstanceSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstanceSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [instanceId, setInstanceId] = useState<number | null>(null);

  // Extract instance ID from URL path
  useEffect(() => {
    const match = location.match(/\/admin\/instances\/(\d+)\/settings/);
    if (match && match[1]) {
      setInstanceId(parseInt(match[1], 10));
    }
  }, [location]);

  // Fetch instance data for verification
  const { data: instance, isLoading: instanceLoading } = useQuery({
    queryKey: instanceId ? [`/api/instances/${instanceId}`] : null,
    enabled: !!instanceId,
  });

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/");
    return null;
  }

  // Redirect if instance doesn't exist or user doesn't have access
  if (!instanceLoading && instanceId && !instance) {
    navigate("/admin");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/admin">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
        </Button>
        
        {instanceLoading ? (
          <Skeleton className="h-9 w-64 mb-2" />
        ) : (
          <>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {instance?.name || "Instance Settings"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure your instance settings and preferences
            </p>
          </>
        )}
      </div>
      
      {instanceId && <InstanceSettings instanceId={instanceId} />}
    </div>
  );
}