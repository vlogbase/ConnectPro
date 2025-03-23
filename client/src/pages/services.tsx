import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ServiceCard from "@/components/services/ServiceCard";

export default function Services() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState("");
  
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Fetch services with filters
  const { data: services = [], isLoading: servicesLoading, refetch } = useQuery({
    queryKey: ["/api/services", searchQuery, selectedCategory, location],
    queryFn: async () => {
      const url = new URL("/api/services", window.location.origin);
      if (searchQuery) {
        url.searchParams.append("q", searchQuery);
      }
      if (selectedCategory) {
        url.searchParams.append("categoryId", selectedCategory);
      }
      if (location) {
        url.searchParams.append("location", location);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  // Handle filter changes
  useEffect(() => {
    refetch();
  }, [searchQuery, selectedCategory, location, refetch]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Services Directory</h2>
          <p className="mt-1 text-sm text-gray-500">Discover professional services offered by network members</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {user && (
            <Button asChild>
              <Link href="/services/new">
                <i className="ri-add-line mr-1.5"></i>
                Offer a Service
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
                <Input
                  type="text"
                  placeholder="Search services..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">All Categories</SelectItem>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : (
                      categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <Button variant="outline" className="w-full" onClick={() => refetch()}>
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services listing */}
      <div className="grid gap-6 md:grid-cols-3">
        {servicesLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex items-center space-x-3 mt-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : services.length === 0 ? (
          <div className="md:col-span-3 text-center py-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
              <i className="ri-service-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">No services found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || selectedCategory || location 
                ? "Try adjusting your search filters"
                : "Be the first to offer a service"}
            </p>
            {user && (
              <div className="mt-6">
                <Button asChild>
                  <Link href="/services/new">Offer a Service</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Services grid
          services.map((service: any) => (
            <Card key={service.id} className="overflow-hidden">
              <Link href={`/services/${service.id}`}>
                <div className="relative h-40 bg-gradient-to-r from-gray-200 to-gray-100 overflow-hidden group">
                  <div className="absolute inset-0 bg-primary opacity-0 transition-opacity group-hover:opacity-10"></div>
                  <div className="absolute bottom-4 left-4">
                    {service.category && (
                      <Badge className="bg-white/90 text-primary">
                        {service.category.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center h-full text-5xl text-gray-300">
                    <i className="ri-service-line"></i>
                  </div>
                </div>
              </Link>
              <CardContent className="p-4">
                <Link href={`/services/${service.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-primary cursor-pointer">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {service.description || "No description provided"}
                  </p>
                </Link>
                <div className="flex items-center space-x-3 mt-4">
                  <Link href={`/profile/${service.user.id}`} className="flex items-center space-x-2 hover:text-primary">
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                      {service.user.profileImageUrl ? (
                        <img 
                          src={service.user.profileImageUrl} 
                          alt={service.user.username} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          {service.user.firstName && service.user.lastName 
                            ? `${service.user.firstName[0]}${service.user.lastName[0]}`
                            : service.user.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {service.user.firstName && service.user.lastName
                        ? `${service.user.firstName} ${service.user.lastName}`
                        : service.user.username}
                    </span>
                  </Link>
                  {service.price && (
                    <span className="text-sm font-medium ml-auto">
                      {service.price}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
