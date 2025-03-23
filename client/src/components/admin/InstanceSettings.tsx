import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

// Instance settings schema
const instanceSettingsSchema = z.object({
  // Branding settings
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  logo: z.string().optional(),
  
  // Policies settings
  registrationType: z.enum(["open", "invite", "admin"]),
  contentModeration: z.object({
    enabled: z.boolean().default(true),
    keywords: z.array(z.string()).default([]),
    keywordsText: z.string().optional(),
  }),
  requiredFields: z.object({
    firstName: z.boolean().default(true),
    lastName: z.boolean().default(false),
    bio: z.boolean().default(false),
    workHistory: z.boolean().default(false),
    skills: z.boolean().default(false),
  }),
  
  // Federation settings
  federationRules: z.object({
    autoShare: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    federationScope: z.enum(["all", "allowlist", "blocklist"]).default("all"),
    allowedDomains: z.array(z.string()).default([]),
    blockedDomains: z.array(z.string()).default([]),
    domainsText: z.string().optional(),
  }),
  
  // Domain settings
  domain: z.string().optional(),
});

type InstanceSettingsFormValues = z.infer<typeof instanceSettingsSchema>;

interface InstanceSettingsProps {
  instanceId: number;
}

/**
 * InstanceSettings Component
 * 
 * This component provides a comprehensive settings interface for managing
 * existing instances. It allows admins to update branding, policies,
 * federation rules, and domain settings.
 */
export default function InstanceSettings({ instanceId }: InstanceSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("branding");

  // Fetch instance data
  const { data: instance, isLoading } = useQuery({
    queryKey: [`/api/instances/${instanceId}`],
    enabled: !!instanceId,
  });

  // Initialize the form with fetched data
  const form = useForm<InstanceSettingsFormValues>({
    resolver: zodResolver(instanceSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
      logo: "",
      registrationType: "open",
      contentModeration: {
        enabled: true,
        keywords: [],
        keywordsText: "",
      },
      requiredFields: {
        firstName: true,
        lastName: false,
        bio: false,
        workHistory: false,
        skills: false,
      },
      federationRules: {
        autoShare: true,
        requireApproval: false,
        federationScope: "all",
        allowedDomains: [],
        blockedDomains: [],
        domainsText: "",
      },
      domain: "",
    },
  });

  // Update form when instance data is loaded
  useEffect(() => {
    if (instance) {
      // Set preview logo
      if (instance.logo) {
        setPreviewLogo(instance.logo);
      }

      // Convert keywords arrays to comma-separated strings for UI
      const keywordsText = instance.contentModeration?.keywords?.join(", ") || "";
      let domainsText = "";
      
      if (instance.federationRules?.federationScope === "allowlist" && instance.federationRules?.allowedDomains?.length) {
        domainsText = instance.federationRules.allowedDomains.join(", ");
      } else if (instance.federationRules?.federationScope === "blocklist" && instance.federationRules?.blockedDomains?.length) {
        domainsText = instance.federationRules.blockedDomains.join(", ");
      }

      // Reset form with instance data
      form.reset({
        name: instance.name,
        description: instance.description || "",
        logo: instance.logo || "",
        registrationType: instance.registrationType || "open",
        contentModeration: {
          enabled: instance.contentModeration?.enabled ?? true,
          keywords: instance.contentModeration?.keywords || [],
          keywordsText,
        },
        requiredFields: {
          firstName: instance.requiredFields?.firstName ?? true,
          lastName: instance.requiredFields?.lastName ?? false,
          bio: instance.requiredFields?.bio ?? false,
          workHistory: instance.requiredFields?.workHistory ?? false,
          skills: instance.requiredFields?.skills ?? false,
        },
        federationRules: {
          autoShare: instance.federationRules?.autoShare ?? true,
          requireApproval: instance.federationRules?.requireApproval ?? false,
          federationScope: instance.federationRules?.federationScope || "all",
          allowedDomains: instance.federationRules?.allowedDomains || [],
          blockedDomains: instance.federationRules?.blockedDomains || [],
          domainsText,
        },
        domain: instance.domain || "",
      });
    }
  }, [form, instance]);

  // Update instance mutation
  const updateInstanceMutation = useMutation({
    mutationFn: async (data: InstanceSettingsFormValues) => {
      // Process text fields into arrays before sending to API
      const processedData = {
        ...data,
        contentModeration: {
          ...data.contentModeration,
          keywords: data.contentModeration.keywordsText ? 
            data.contentModeration.keywordsText.split(',').map(k => k.trim()) : 
            []
        },
        federationRules: {
          ...data.federationRules,
          allowedDomains: data.federationRules.federationScope === 'allowlist' && data.federationRules.domainsText ? 
            data.federationRules.domainsText.split(',').map(d => d.trim()) : 
            [],
          blockedDomains: data.federationRules.federationScope === 'blocklist' && data.federationRules.domainsText ? 
            data.federationRules.domainsText.split(',').map(d => d.trim()) : 
            []
        }
      };
      
      // Remove UI-only fields before sending to API
      delete processedData.contentModeration.keywordsText;
      delete processedData.federationRules.domainsText;
      
      return apiRequest("PUT", `/api/instances/${instanceId}`, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/instances/${instanceId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userId}/instances`] });
      toast({
        title: "Success",
        description: "Instance settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update instance settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: InstanceSettingsFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update instance settings.",
        variant: "destructive",
      });
      return;
    }

    updateInstanceMutation.mutate(data);
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to a storage service
      // For demo purposes, we'll just create a local URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewLogo(dataUrl);
        form.setValue("logo", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="branding">Server Branding</TabsTrigger>
          <TabsTrigger value="policies">Local Policies</TabsTrigger>
          <TabsTrigger value="federation">Federation</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Server Branding</CardTitle>
                  <CardDescription>
                    Configure how your instance appears to users and other instances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Branding Preview */}
                  <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-white shadow-sm border flex items-center justify-center">
                          {previewLogo ? (
                            <img 
                              src={previewLogo} 
                              alt="Server logo" 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                              {form.watch("name") ? form.watch("name").charAt(0).toUpperCase() : "S"}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {form.watch("name") || "Your Server Name"}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {form.watch("description") || "No description provided"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Server Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Server Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="My Professional Network" />
                        </FormControl>
                        <FormDescription>
                          The name of your professional networking instance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Server Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="A professional networking platform for..."
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the purpose of your instance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Server Logo Upload */}
                  <FormItem>
                    <FormLabel>Server Logo</FormLabel>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {previewLogo ? (
                          <div className="mx-auto h-24 w-24 overflow-hidden rounded-md mb-4">
                            <img src={previewLogo} alt="Logo preview" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <div className="flex text-sm text-gray-600 justify-center">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => logoInputRef.current?.click()}
                            className="relative rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                          >
                            {previewLogo ? "Change logo" : "Upload a logo"}
                            <input
                              ref={logoInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </Button>
                          {!previewLogo && <p className="pl-1 flex items-center">or drag and drop</p>}
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                      </div>
                    </div>
                    <FormDescription>
                      This logo will represent your instance across the network
                    </FormDescription>
                  </FormItem>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit"
                    disabled={updateInstanceMutation.isPending}
                  >
                    {updateInstanceMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Local Policies</CardTitle>
                  <CardDescription>
                    Configure the rules and requirements for your instance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Registration Type */}
                  <FormField
                    control={form.control}
                    name="registrationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Mode</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select registration type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">
                              <div className="flex flex-col">
                                <span>Open (anyone can join)</span>
                                <span className="text-xs text-gray-500">
                                  New users can sign up without restrictions
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="invite">
                              <div className="flex flex-col">
                                <span>Invite-only</span>
                                <span className="text-xs text-gray-500">
                                  Users need an invitation to register
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex flex-col">
                                <span>Admin approval required</span>
                                <span className="text-xs text-gray-500">
                                  New registrations require admin approval
                                </span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Control how new users can join your instance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Required Profile Fields */}
                  <FormItem>
                    <FormLabel>Required Profile Fields</FormLabel>
                    <div className="border rounded-md p-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="requiredFields.firstName"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>First Name</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requiredFields.lastName"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Last Name</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requiredFields.bio"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Bio</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requiredFields.workHistory"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Work History</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requiredFields.skills"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Skills</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormDescription>
                      Choose which profile fields are mandatory for users to fill out
                    </FormDescription>
                  </FormItem>
                  
                  {/* Content Moderation */}
                  <FormField
                    control={form.control}
                    name="contentModeration.enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Enable content moderation</FormLabel>
                          <FormDescription>
                            Automatically filter content based on keywords
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
                  
                  {form.watch("contentModeration.enabled") && (
                    <FormField
                      control={form.control}
                      name="contentModeration.keywordsText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moderation Keywords</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="word1, word2, phrase1, phrase2"
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter keywords or phrases to filter, separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit"
                    disabled={updateInstanceMutation.isPending}
                  >
                    {updateInstanceMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="federation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Federation Settings</CardTitle>
                  <CardDescription>
                    Configure how your instance interacts with other instances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Auto-sharing Activities */}
                  <FormField
                    control={form.control}
                    name="federationRules.autoShare"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Automatically share activities</FormLabel>
                          <FormDescription>
                            Share posts, profile updates, and service offers with federated instances
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
                  
                  {/* Federation Approval */}
                  <FormField
                    control={form.control}
                    name="federationRules.requireApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Require admin approval for federation</FormLabel>
                          <FormDescription>
                            New federation requests from other instances will need your approval
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
                  
                  {/* Federation Scope */}
                  <FormField
                    control={form.control}
                    name="federationRules.federationScope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Federation Scope</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-3"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="all" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Allow all instances (recommended)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="allowlist" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Allowlist (only approved instances)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="blocklist" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Blocklist (all except blocked instances)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Control which instances can federate with yours
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {/* Allowed/Blocked Domains */}
                  {(form.watch("federationRules.federationScope") === "allowlist" || 
                    form.watch("federationRules.federationScope") === "blocklist") && (
                    <FormField
                      control={form.control}
                      name="federationRules.domainsText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("federationRules.federationScope") === "allowlist" 
                              ? "Allowed Domains" 
                              : "Blocked Domains"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="domain1.com, domain2.org, domain3.net"
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter domain names separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit"
                    disabled={updateInstanceMutation.isPending}
                  >
                    {updateInstanceMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="domain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Domain Settings</CardTitle>
                  <CardDescription>
                    Configure the domain name and SSL settings for your instance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Domain Input */}
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Domain</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="mynetwork.example.com" />
                        </FormControl>
                        <FormDescription>
                          Enter a custom domain if you want to use one for your instance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* DNS Configuration Instructions */}
                  {form.watch("domain") && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">DNS Configuration</h4>
                      <p className="text-sm text-blue-700 mb-2">
                        To use your custom domain, configure the following DNS records:
                      </p>
                      <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs">
                        <div>CNAME record: <span className="text-blue-600">@</span> pointing to <span className="text-green-600">{import.meta.env.VITE_APP_HOSTNAME || "your-app-hostname.com"}</span></div>
                      </div>
                      <div className="mt-3 bg-white p-3 rounded border border-blue-200 text-xs">
                        <h5 className="font-medium mb-1">SSL Certificate Setup</h5>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Verify your DNS records have propagated</li>
                          <li>Request an SSL certificate using Let's Encrypt</li>
                          <li>Configure your web server to use the certificate</li>
                        </ol>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-blue-600">
                          DNS changes may take up to 48 hours to propagate.
                        </p>
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                          Check Domain Status
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit"
                    disabled={updateInstanceMutation.isPending}
                  >
                    {updateInstanceMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}