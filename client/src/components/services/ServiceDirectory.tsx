import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ServiceCard from "./ServiceCard";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ServiceDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services", selectedCategory],
    queryFn: async () => {
      const url = new URL("/api/services", window.location.origin);
      if (selectedCategory) {
        url.searchParams.append("categoryId", selectedCategory);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? undefined : value);
  };

  return (
    <Card className="mb-5">
      <CardHeader className="px-4 py-5 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">Services Directory</CardTitle>
        <CardDescription className="text-sm text-gray-500">Recent services in your network</CardDescription>
      </CardHeader>
      
      <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900">Filter by category</span>
        <Select 
          value={selectedCategory || "all"} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All</SelectItem>
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
      
      <CardContent className="p-0">
        {servicesLoading ? (
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-4 px-4">
                <div className="flex space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="mt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : services.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">No services found</p>
            <Button asChild variant="outline">
              <Link href="/services">View all services</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {services.slice(0, 3).map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
            <li className="px-4 py-4 border-t border-gray-200">
              <Link href="/services" className="text-sm font-medium text-primary hover:text-primary/90">
                View all services <span aria-hidden="true">&rarr;</span>
              </Link>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
