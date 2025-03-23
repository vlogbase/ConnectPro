import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import InstancesList from "@/components/admin/InstancesList";
import InstanceCreationModal from "@/components/admin/InstanceCreationModal";
import ActivityFeed from "@/components/ui/ActivityFeed";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Admin Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your instances and federation settings</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-line mr-1.5"></i>
            Create New Instance
          </Button>
        </div>
      </div>

      <Tabs defaultValue="instances" className="space-y-6">
        <TabsList className="border-b border-gray-200 w-full">
          <TabsTrigger value="instances" className="text-sm font-medium">Instances</TabsTrigger>
          <TabsTrigger value="federation" className="text-sm font-medium">Federation</TabsTrigger>
          <TabsTrigger value="activity" className="text-sm font-medium">Activity</TabsTrigger>
          <TabsTrigger value="settings" className="text-sm font-medium">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <InstancesList />
            </div>
            <div className="md:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Instance Management</CardTitle>
                  <CardDescription>
                    Create and manage your professional networking instances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">What can I do with instances?</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>Create professional communities for your organization or interest group</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>Customize registration policies and content moderation settings</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>Federate with other instances to expand your network</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>Use your own custom domain for branding</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <i className="ri-add-line mr-1.5"></i>
                    Create New Instance
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="federation" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle>Federation Requests</CardTitle>
                  <CardDescription>
                    Manage federation requests from other instances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                      <i className="ri-link text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">No federation requests</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Federation requests will appear here when other instances want to connect
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Federation Guide</CardTitle>
                  <CardDescription>
                    Learn how federation works between instances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">What is federation?</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Federation allows your instance to communicate with other instances, sharing profile updates, posts, and services between networks.
                    </p>
                    
                    <h4 className="text-sm font-medium mb-2">How it works:</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>Instances connect using the ActivityPub protocol</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>You can decide which instances to federate with</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-check-line text-green-500 mt-0.5 mr-2"></i>
                        <span>Control what types of activities are shared</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <Link href="/admin/federation">
                      <i className="ri-settings-line mr-1.5"></i>
                      Manage Federation Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <ActivityFeed />
            </div>
            <div className="md:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Metrics</CardTitle>
                  <CardDescription>
                    Overview of federation activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-gray-500">Total Posts</h4>
                      <p className="text-3xl font-bold text-primary mt-1">0</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-gray-500">Services</h4>
                      <p className="text-3xl font-bold text-primary mt-1">0</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-gray-500">Federations</h4>
                      <p className="text-3xl font-bold text-primary mt-1">0</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-gray-500">Users</h4>
                      <p className="text-3xl font-bold text-primary mt-1">1</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <Link href="/admin/analytics">
                      <i className="ri-bar-chart-line mr-1.5"></i>
                      View Detailed Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure global settings for all your instances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">User Settings</h4>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Global Admin Access</p>
                            <p className="text-xs text-gray-500">Act as admin across all instances</p>
                          </div>
                          <div className="h-6 w-11 bg-gray-200 rounded-full relative">
                            <div className="h-5 w-5 bg-white rounded-full absolute left-1 top-0.5 shadow"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Activity Notifications</p>
                            <p className="text-xs text-gray-500">Get notified of federation activity</p>
                          </div>
                          <div className="h-6 w-11 bg-primary rounded-full relative">
                            <div className="h-5 w-5 bg-white rounded-full absolute right-1 top-0.5 shadow"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Default Federation Settings</h4>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Auto-Accept Federation</p>
                            <p className="text-xs text-gray-500">Automatically accept federation requests</p>
                          </div>
                          <div className="h-6 w-11 bg-gray-200 rounded-full relative">
                            <div className="h-5 w-5 bg-white rounded-full absolute left-1 top-0.5 shadow"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Federate Profile Updates</p>
                            <p className="text-xs text-gray-500">Share profile changes with federated instances</p>
                          </div>
                          <div className="h-6 w-11 bg-primary rounded-full relative">
                            <div className="h-5 w-5 bg-white rounded-full absolute right-1 top-0.5 shadow"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <Button disabled>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InstanceCreationModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
