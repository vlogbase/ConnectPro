import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import InstanceCard from "./InstanceCard";
import InstanceCreationModal from "./InstanceCreationModal";

export default function InstancesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const { data: instances = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/users/${user?.userId}/instances`],
    enabled: !!user?.userId,
  });
  
  // Handle joining an instance with an invite code
  const handleJoinInstance = async () => {
    if (!inviteCode) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a real implementation, this would send a request to join an instance
      // For now, we'll add a placeholder success message
      toast({
        title: "Success!",
        description: "Request to join instance has been sent. The admin will review your request.",
      });
      setInviteCode("");
      setIsJoinModalOpen(false);
      // Refetch instances after joining
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join instance. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        <CardHeader className="px-4 py-5 sm:px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg leading-6 font-medium text-gray-900">Your Instances</CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500">Servers you manage</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-1"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
            Join Instance
          </Button>
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
      
      {/* Join Instance Dialog */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join an Instance</DialogTitle>
            <DialogDescription>
              Enter the invite code to join an existing professional network instance.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input 
                id="inviteCode" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter the invite code" 
              />
            </div>
            <p className="text-sm text-gray-500">
              This code is provided by instance administrators to allow new members to join their network.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleJoinInstance}>
              Join Instance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
