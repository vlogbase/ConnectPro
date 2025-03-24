import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import InstanceSummaryCard from "@/components/instances/InstanceSummaryCard";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

// Predefined colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function InstanceAnalytics() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("week"); // week, month, year
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to view instance analytics",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [authLoading, user, navigate, toast]);

  // Get instance ID from params or return to instances list
  const instanceId = id ? parseInt(id) : null;
  
  useEffect(() => {
    if (!instanceId && !authLoading) {
      navigate("/admin");
    }
  }, [instanceId, authLoading, navigate]);

  // Fetch instance details
  const { data: instance, isLoading: instanceLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}`],
    enabled: !!instanceId,
  });

  // Check if user is admin of this instance
  const isAdmin = user && instance && instance.adminId === user.userId;

  useEffect(() => {
    if (!instanceLoading && !isAdmin && !authLoading) {
      toast({
        title: "Access denied",
        description: "You don't have permission to view this instance's analytics",
        variant: "destructive",
      });
      navigate("/admin");
    }
  }, [isAdmin, instanceLoading, authLoading, navigate, toast]);

  // Fetch analytics data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}/analytics/users`, timeRange],
    enabled: !!instanceId && isAdmin,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}/analytics/posts`, timeRange],
    enabled: !!instanceId && isAdmin,
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}/analytics/services`, timeRange],
    enabled: !!instanceId && isAdmin,
  });

  const { data: federationData, isLoading: federationLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}/analytics/federation`],
    enabled: !!instanceId && isAdmin,
  });

  // Prepare example data for dashboard (this would come from the backend in a real app)
  const getDemoAnalyticsData = () => {
    // Date range based on selected time range
    let startDate = new Date();
    let endDate = new Date();
    const daysInTimeRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    
    // New users over time
    const newUsersData = Array.from({ length: daysInTimeRange }).map((_, i) => {
      const date = subDays(new Date(), daysInTimeRange - i - 1);
      return {
        date: format(date, 'MM/dd'),
        users: Math.floor(Math.random() * 10) + 1,
      };
    });
    
    // Posts by type
    const postsByType = [
      { name: 'Text', value: Math.floor(Math.random() * 100) + 20 },
      { name: 'Image', value: Math.floor(Math.random() * 80) + 10 },
      { name: 'Link', value: Math.floor(Math.random() * 50) + 5 },
    ];
    
    // Services by category
    const servicesByCategory = [
      { name: 'Development', value: Math.floor(Math.random() * 40) + 10 },
      { name: 'Design', value: Math.floor(Math.random() * 30) + 5 },
      { name: 'Marketing', value: Math.floor(Math.random() * 20) + 5 },
      { name: 'Writing', value: Math.floor(Math.random() * 25) + 3 },
    ];
    
    // Activity by hour
    const activityByHour = Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      activity: Math.floor(Math.random() * 50) + 5,
    }));
    
    // Federation stats
    const federationStats = [
      { name: 'Connected', value: Math.floor(Math.random() * 15) + 3 },
      { name: 'Pending', value: Math.floor(Math.random() * 5) + 1 },
      { name: 'Rejected', value: Math.floor(Math.random() * 3) },
    ];
    
    return {
      newUsersData,
      postsByType,
      servicesByCategory,
      activityByHour,
      federationStats,
      userMetrics: {
        total: Math.floor(Math.random() * 1000) + 100,
        active: Math.floor(Math.random() * 500) + 50,
        growth: Math.floor(Math.random() * 30) + 1,
      },
      contentMetrics: {
        posts: Math.floor(Math.random() * 2000) + 200,
        comments: Math.floor(Math.random() * 5000) + 500,
        services: Math.floor(Math.random() * 300) + 30,
      }
    };
  };

  // Get demo data (would be replaced with real data from the API)
  const analyticsData = getDemoAnalyticsData();

  // Loading state
  if (authLoading || instanceLoading) {
    return (
      <div className="container py-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          <div className="grid gap-6 mt-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64 mt-6" />
        </div>
      </div>
    );
  }

  // Instance not found or user is not admin
  if (!instance || !isAdmin) {
    return null; // Redirect will happen via useEffect
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instance Analytics</h1>
          <p className="text-muted-foreground">{instance.name} - Analytics Dashboard</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate(`/admin/instances/${instanceId}/settings`)}>
            Settings
          </Button>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="space-y-6">
        {/* Summary metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData.userMetrics.total}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">+{analyticsData.userMetrics.growth}%</span> from previous period
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData.contentMetrics.posts}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">+12%</span> from previous period
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData.contentMetrics.services}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">+8%</span> from previous period
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b pb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="federation">Federation</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>New Users Over Time</CardTitle>
                  <CardDescription>Daily new user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsData.newUsersData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Posts by Type</CardTitle>
                  <CardDescription>Distribution of content by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.postsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.postsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Hour</CardTitle>
                  <CardDescription>User activity distribution by hour of day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.activityByHour}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="activity" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user sign-ups over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsData.newUsersData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Active users vs total users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2">{analyticsData.userMetrics.active}</div>
                      <div className="text-muted-foreground">Active Users</div>
                      <div className="text-sm mt-4">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {Math.round((analyticsData.userMetrics.active / analyticsData.userMetrics.total) * 100)}% of Total
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                  <CardDescription>User profile completion by field</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">87%</div>
                      <div className="text-sm text-muted-foreground">Profile Photo</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">92%</div>
                      <div className="text-sm text-muted-foreground">Full Name</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">63%</div>
                      <div className="text-sm text-muted-foreground">Work Experience</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">58%</div>
                      <div className="text-sm text-muted-foreground">Skills</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Content Tab */}
          <TabsContent value="content">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Content Creation</CardTitle>
                  <CardDescription>Posts, comments and reactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Posts', count: analyticsData.contentMetrics.posts },
                          { name: 'Comments', count: analyticsData.contentMetrics.comments },
                          { name: 'Reactions', count: analyticsData.contentMetrics.comments * 2 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Posts by Type</CardTitle>
                  <CardDescription>Distribution of content formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.postsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.postsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Popular Content</CardTitle>
                  <CardDescription>Most viewed and engaged content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">Post Title {i+1}</div>
                          <div className="text-sm text-muted-foreground">by User{i+1}</div>
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div>
                            <span className="font-medium">{Math.floor(Math.random() * 100) + 50}</span> Views
                          </div>
                          <div>
                            <span className="font-medium">{Math.floor(Math.random() * 20) + 5}</span> Comments
                          </div>
                          <div>
                            <span className="font-medium">{Math.floor(Math.random() * 30) + 10}</span> Reactions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Services Tab */}
          <TabsContent value="services">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Services by Category</CardTitle>
                  <CardDescription>Distribution of services offered</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.servicesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.servicesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Services Growth</CardTitle>
                  <CardDescription>New services listed over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsData.newUsersData.map(item => ({
                          date: item.date,
                          services: Math.floor(item.users * 0.7),
                        }))}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="services" stroke="#82ca9d" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Top Service Providers</CardTitle>
                  <CardDescription>Users with most services and highest ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">User</th>
                          <th className="text-left pb-2">Services</th>
                          <th className="text-left pb-2">Avg. Rating</th>
                          <th className="text-left pb-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3">User {i+1}</td>
                            <td className="py-3">{Math.floor(Math.random() * 10) + 3}</td>
                            <td className="py-3">{(Math.random() * 2 + 3).toFixed(1)} / 5</td>
                            <td className="py-3">${Math.floor(Math.random() * 1000) + 500}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Federation Tab */}
          <TabsContent value="federation">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Federation Status</CardTitle>
                  <CardDescription>Connected and pending instances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.federationStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.federationStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Federation Activity</CardTitle>
                  <CardDescription>Inter-instance engagement statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { type: 'Inbound Posts', count: Math.floor(Math.random() * 200) + 50 },
                          { type: 'Outbound Posts', count: Math.floor(Math.random() * 150) + 30 },
                          { type: 'Inbound Comments', count: Math.floor(Math.random() * 300) + 100 },
                          { type: 'Outbound Comments', count: Math.floor(Math.random() * 250) + 80 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Connected Instances</CardTitle>
                  <CardDescription>Federated instances and their statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Instance</th>
                          <th className="text-left pb-2">Status</th>
                          <th className="text-left pb-2">Users</th>
                          <th className="text-left pb-2">Shared Content</th>
                          <th className="text-left pb-2">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3">instance-{i+1}.domain.com</td>
                            <td className="py-3">
                              <Badge variant="outline" className={i % 3 === 0 ? "bg-green-100 text-green-800" : i % 3 === 1 ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}>
                                {i % 3 === 0 ? "Connected" : i % 3 === 1 ? "Pending" : "Limited"}
                              </Badge>
                            </td>
                            <td className="py-3">{Math.floor(Math.random() * 1000) + 200}</td>
                            <td className="py-3">{Math.floor(Math.random() * 500) + 50}</td>
                            <td className="py-3">{format(subDays(new Date(), Math.floor(Math.random() * 7)), 'MMM dd, yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}