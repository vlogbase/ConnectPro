import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Define form schema
const serviceSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.string().optional(),
  categoryId: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  serviceId?: number;
  isEdit?: boolean;
}

export default function ServiceForm({ serviceId, isEdit = false }: ServiceFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Fetch service details if editing
  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: [`/api/services/${serviceId}`],
    enabled: isEdit && !!serviceId,
  });
  
  // Initialize form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      categoryId: "",
      location: "",
      remote: true,
    },
  });
  
  // Update form values when service data is loaded
  useState(() => {
    if (serviceData && isEdit) {
      form.reset({
        title: serviceData.title,
        description: serviceData.description,
        price: serviceData.price || "",
        categoryId: serviceData.categoryId ? String(serviceData.categoryId) : "",
        location: serviceData.location || "",
        remote: serviceData.remote,
      });
    }
  });
  
  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      return apiRequest("POST", "/api/services", {
        ...data,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userId}/services`] });
      toast({
        title: "Success",
        description: "Your service has been created successfully.",
      });
      navigate("/services");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      return apiRequest("PUT", `/api/services/${serviceId}`, {
        ...data,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userId}/services`] });
      toast({
        title: "Success",
        description: "Your service has been updated successfully.",
      });
      navigate(`/services/${serviceId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: ServiceFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create or edit services",
        variant: "destructive",
      });
      return;
    }
    
    if (isEdit && serviceId) {
      updateServiceMutation.mutate(data);
    } else {
      createServiceMutation.mutate(data);
    }
  };
  
  // Loading state
  if (isEdit && serviceLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }
  
  // If user is not logged in
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to create or edit services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">
            You need to be logged in to offer professional services.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <a href="/api/login">Log in</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Service" : "Create a New Service"}</CardTitle>
        <CardDescription>
          {isEdit 
            ? "Update the details of your professional service" 
            : "Share your professional services with the network"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Web Development Services" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for your service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you offer, your experience, and what clients can expect" 
                      rows={5}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of your service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., $100/hr or $500 per project" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      How you charge for your services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading categories...
                          </SelectItem>
                        ) : (
                          <>
                            <SelectItem value="">No category</SelectItem>
                            {categories.map((category: any) => (
                              <SelectItem 
                                key={category.id} 
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The category your service belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., San Francisco, CA" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Where you provide your services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="remote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Remote Service</FormLabel>
                      <FormDescription>
                        Can you provide this service remotely?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(isEdit ? `/services/${serviceId}` : "/services")}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending
                ? "Saving..."
                : isEdit ? "Update Service" : "Create Service"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
