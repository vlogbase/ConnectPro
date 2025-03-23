import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import InstanceCard from "./InstanceCard";
import InstanceCreationModal from "./InstanceCreationModal";

export default function InstancesList() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: instances = [], isLoading } = useQuery({
    queryKey: [`/api/users/${user?.userId}/instances`],
    enabled: !!user?.userId,
  });

  if (!user) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden mb-5">
        <CardHeader className="px-4 py-5 sm:px-6">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">Your Instances</CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">
            Please log in to manage your server instances
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <Button asChild variant="default">
            <a href="/api/login">Log in</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">Your Instances</CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">Servers you manage</CardDescription>
        </CardHeader>
        <div className="border-t border-gray-200">
          {isLoading ? (
            <ul className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <li key={i} className="px-4 py-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : instances.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-gray-500 mb-4">You don't have any instances yet</p>
              <Button onClick={() => setIsModalOpen(true)}>
                Create Your First Instance
              </Button>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {instances.map((instance: any) => (
                <InstanceCard key={instance.id} instance={instance} />
              ))}
            </ul>
          )}
          
          {instances.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-200">
              <Button 
                type="button" 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex justify-center items-center px-4 py-2"
              >
                <i className="ri-add-line mr-2"></i>
                Create New Instance
              </Button>
            </div>
          )}
        </div>
      </Card>

      <InstanceCreationModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
