import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * Define steps for the wizard
 * This helps with programmatic navigation through the instance creation process
 */
type SetupStep = "branding" | "policies" | "federation" | "domain";

/**
 * Enhanced instance setup schema with additional configuration options
 * - Added requiredFields to specify which profile fields are mandatory
 * - Enhanced contentModeration to include keywords to filter
 * - Added federationScope to define how federation with other instances works
 */
const instanceSchema = z.object({
  // Branding step fields
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  logo: z.string().optional(),
  
  // Policies step fields
  registrationType: z.enum(["open", "invite", "admin"]),
  contentModeration: z.object({
    enabled: z.boolean().default(true),
    keywords: z.array(z.string()).default([]),
    keywordsText: z.string().optional(), // This is just for UI purposes
  }),
  requiredFields: z.object({
    firstName: z.boolean().default(true),
    lastName: z.boolean().default(false),
    bio: z.boolean().default(false),
    workHistory: z.boolean().default(false),
    skills: z.boolean().default(false),
  }),
  
  // Federation step fields
  federationRules: z.object({
    autoShare: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    federationScope: z.enum(["all", "allowlist", "blocklist"]).default("all"),
    allowedDomains: z.array(z.string()).default([]),
    blockedDomains: z.array(z.string()).default([]),
    domainsText: z.string().optional(), // This is just for UI purposes
  }),
  
  // Domain step fields
  domain: z.string().optional(),
});

type InstanceFormValues = z.infer<typeof instanceSchema>;

interface InstanceCreationModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Enhanced InstanceCreationModal component
 * 
 * This component implements a multi-step wizard for creating new instances with 
 * comprehensive configuration options for branding, policies, federation and custom domains.
 */
export default function InstanceCreationModal({ open, onClose }: InstanceCreationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<SetupStep>("branding");
  const [progress, setProgress] = useState<number>(25);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  // Initialize the form with default values
  const form = useForm<InstanceFormValues>({
    resolver: zodResolver(instanceSchema),
    defaultValues: {
      // Branding defaults
      name: "",
      description: "",
      logo: "",
      
      // Policies defaults
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
      
      // Federation defaults
      federationRules: {
        autoShare: true,
        requireApproval: false,
        federationScope: "all",
        allowedDomains: [],
        blockedDomains: [],
        domainsText: "",
      },
      
      // Domain defaults
      domain: "",
    },
  });

  // Update progress based on current step
  useEffect(() => {
    switch (currentStep) {
      case "branding":
        setProgress(25);
        break;
      case "policies":
        setProgress(50);
        break;
      case "federation":
        setProgress(75);
        break;
      case "domain":
        setProgress(100);
        break;
    }
  }, [currentStep]);

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: async (data: InstanceFormValues) => {
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
      
      return apiRequest("POST", "/api/instances", processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userId}/instances`] });
      toast({
        title: "Success",
        description: "Your instance has been created successfully.",
      });
      onClose();
      form.reset();
      setCurrentStep("branding");
      setPreviewLogo(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create instance. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: InstanceFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an instance.",
        variant: "destructive",
      });
      return;
    }

    createInstanceMutation.mutate(data);
  };

  // Navigation between steps
  const goToNextStep = () => {
    // Validate the current step fields before proceeding
    let canProceed = true;
    
    switch(currentStep) {
      case "branding":
        if (!form.getValues("name")) {
          form.setError("name", { 
            type: "required", 
            message: "Server name is required" 
          });
          canProceed = false;
        }
        if (canProceed) setCurrentStep("policies");
        break;
        
      case "policies":
        setCurrentStep("federation");
        break;
        
      case "federation":
        setCurrentStep("domain");
        break;
        
      case "domain":
        form.handleSubmit(onSubmit)();
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case "policies":
        setCurrentStep("branding");
        break;
      case "federation":
        setCurrentStep("policies");
        break;
      case "domain":
        setCurrentStep("federation");
        break;
    }
  };

  // Handle dialog close
  const handleClose = () => {
    onClose();
    form.reset();
    setCurrentStep("branding");
    setPreviewLogo(null);
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

  // Render the server branding step
  const renderBrandingStep = () => (
    <div className="space-y-6">
      {/* Server Branding Preview */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-sm overflow-hidden mb-6">
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
                {form.watch("description") || "Enter a description for your server..."}
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
              Choose a descriptive name for your professional networking instance
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
              Describe the purpose of your instance. This will be visible to users and other instances.
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
                className="relative cursor-pointer rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
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
          This logo will represent your instance across the network. Square images work best.
        </FormDescription>
      </FormItem>
    </div>
  );

  // Render the local policies step
  const renderPoliciesStep = () => (
    <div className="space-y-6">
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
    </div>
  );

  // Render the federation settings step
  const renderFederationStep = () => (
    <div className="space-y-6">
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
    </div>
  );

  // Render the custom domain setup step
  const renderDomainStep = () => (
    <div className="space-y-6">
      {/* Custom Domain Input */}
      <FormField
        control={form.control}
        name="domain"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custom Domain (Optional)</FormLabel>
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
      <div className="p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">DNS Configuration</h4>
        <p className="text-sm text-blue-700 mb-2">
          To use a custom domain, you'll need to set up the following DNS records:
        </p>
        <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs">
          <div>CNAME record: <span className="text-blue-600">@</span> pointing to <span className="text-green-600">{import.meta.env.VITE_APP_HOSTNAME || "your-app-hostname.com"}</span></div>
        </div>
        <div className="mt-3 bg-white p-3 rounded border border-blue-200 text-xs">
          <h5 className="font-medium mb-1">SSL Certificate Setup with Let's Encrypt</h5>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Verify your DNS records have propagated</li>
            <li>Install certbot: <span className="font-mono">sudo apt-get install certbot</span></li>
            <li>Request certificate: <span className="font-mono">sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com</span></li>
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
      
      {/* Instance Summary */}
      <div className="p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-800 mb-4">Instance Summary</h4>
        <div className="space-y-4">
          {/* Branding Summary */}
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 flex-shrink-0 rounded-md bg-white shadow overflow-hidden">
              {previewLogo ? (
                <img 
                  src={previewLogo} 
                  alt="Logo preview" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {form.watch("name") ? form.watch("name").charAt(0).toUpperCase() : "S"}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {form.watch("name") || "Server Name"}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1">
                {form.watch("description") || "No description provided"}
              </p>
            </div>
          </div>
          
          {/* Configuration Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <h5 className="text-gray-500 text-xs">Registration</h5>
              <p className="font-medium">
                {form.watch("registrationType") === "open" && "Open Registration"}
                {form.watch("registrationType") === "invite" && "Invite-only"}
                {form.watch("registrationType") === "admin" && "Admin Approval"}
              </p>
            </div>
            <div>
              <h5 className="text-gray-500 text-xs">Content Moderation</h5>
              <p className="font-medium">{form.watch("contentModeration.enabled") ? "Enabled" : "Disabled"}</p>
            </div>
            <div>
              <h5 className="text-gray-500 text-xs">Federation</h5>
              <p className="font-medium">
                {form.watch("federationRules.federationScope") === "all" && "All Instances"}
                {form.watch("federationRules.federationScope") === "allowlist" && "Allowlist"}
                {form.watch("federationRules.federationScope") === "blocklist" && "Blocklist"}
              </p>
            </div>
            <div>
              <h5 className="text-gray-500 text-xs">Auto-share</h5>
              <p className="font-medium">{form.watch("federationRules.autoShare") ? "Enabled" : "Disabled"}</p>
            </div>
            {form.watch("domain") && (
              <div className="col-span-2">
                <h5 className="text-gray-500 text-xs">Domain</h5>
                <p className="font-medium">{form.watch("domain")}</p>
              </div>
            )}
          </div>
          
          {/* Required Fields */}
          <div>
            <h5 className="text-gray-500 text-xs mb-1">Required Profile Fields</h5>
            <div className="flex flex-wrap gap-1.5">
              {form.watch("requiredFields.firstName") && (
                <Badge variant="outline" className="text-xs bg-primary/5">First Name</Badge>
              )}
              {form.watch("requiredFields.lastName") && (
                <Badge variant="outline" className="text-xs bg-primary/5">Last Name</Badge>
              )}
              {form.watch("requiredFields.bio") && (
                <Badge variant="outline" className="text-xs bg-primary/5">Bio</Badge>
              )}
              {form.watch("requiredFields.workHistory") && (
                <Badge variant="outline" className="text-xs bg-primary/5">Work History</Badge>
              )}
              {form.watch("requiredFields.skills") && (
                <Badge variant="outline" className="text-xs bg-primary/5">Skills</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "branding":
        return renderBrandingStep();
      case "policies":
        return renderPoliciesStep();
      case "federation":
        return renderFederationStep();
      case "domain":
        return renderDomainStep();
      default:
        return renderBrandingStep();
    }
  };

  // Get the appropriate button text based on the current step
  const getNextButtonText = () => {
    return currentStep === "domain" ? "Create Instance" : "Continue";
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === "branding" || progress >= 25 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <span className={`text-sm ${currentStep === "branding" ? "text-primary font-medium" : "text-gray-500"}`}>Branding</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-2">
          <div className="h-full bg-primary" style={{ width: `${Math.max(0, progress - 25)}%` }}></div>
        </div>
        <div className="flex items-center space-x-2">
          <div 
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === "policies" || progress >= 50 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <span className={`text-sm ${currentStep === "policies" ? "text-primary font-medium" : "text-gray-500"}`}>Policies</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-2">
          <div className="h-full bg-primary" style={{ width: `${Math.max(0, progress - 50)}%` }}></div>
        </div>
        <div className="flex items-center space-x-2">
          <div 
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === "federation" || progress >= 75 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            3
          </div>
          <span className={`text-sm ${currentStep === "federation" ? "text-primary font-medium" : "text-gray-500"}`}>Federation</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-2">
          <div className="h-full bg-primary" style={{ width: `${Math.max(0, progress - 75)}%` }}></div>
        </div>
        <div className="flex items-center space-x-2">
          <div 
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === "domain" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            4
          </div>
          <span className={`text-sm ${currentStep === "domain" ? "text-primary font-medium" : "text-gray-500"}`}>Domain</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Instance</DialogTitle>
          <DialogDescription>
            Set up your professional networking server
          </DialogDescription>
        </DialogHeader>
        
        {/* Step indicator */}
        <StepIndicator />
        
        <Form {...form}>
          <form className="space-y-4">
            {renderStepContent()}
          </form>
        </Form>
        
        <DialogFooter className="flex items-center justify-between">
          {currentStep !== "branding" && (
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={createInstanceMutation.isPending}
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={goToNextStep}
            disabled={createInstanceMutation.isPending}
          >
            {createInstanceMutation.isPending ? "Creating..." : getNextButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}