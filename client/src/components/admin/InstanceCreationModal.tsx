import { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define steps for the wizard
type SetupStep = "basic" | "policies" | "federation" | "domain";

// Basic instance setup schema
const instanceSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  registrationType: z.enum(["open", "invite", "admin"]),
  contentModeration: z.object({
    enabled: z.boolean(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  federationRules: z.object({
    autoShare: z.boolean(),
    requireApproval: z.boolean(),
    allowedDomains: z.array(z.string()).optional(),
    blockedDomains: z.array(z.string()).optional(),
  }).optional(),
  domain: z.string().optional(),
  logo: z.string().optional(),
});

type InstanceFormValues = z.infer<typeof instanceSchema>;

interface InstanceCreationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InstanceCreationModal({ open, onClose }: InstanceCreationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<SetupStep>("basic");

  // Initialize the form with default values
  const form = useForm<InstanceFormValues>({
    resolver: zodResolver(instanceSchema),
    defaultValues: {
      name: "",
      description: "",
      registrationType: "open",
      contentModeration: {
        enabled: true,
        keywords: [],
      },
      federationRules: {
        autoShare: true,
        requireApproval: false,
        allowedDomains: [],
        blockedDomains: [],
      },
      domain: "",
      logo: "",
    },
  });

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: async (data: InstanceFormValues) => {
      return apiRequest("POST", "/api/instances", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userId}/instances`] });
      toast({
        title: "Success",
        description: "Your instance has been created successfully.",
      });
      onClose();
      form.reset();
      setCurrentStep("basic");
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
    switch (currentStep) {
      case "basic":
        setCurrentStep("policies");
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
        setCurrentStep("basic");
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
    setCurrentStep("basic");
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Professional Network" />
                  </FormControl>
                  <FormDescription>
                    Choose a name for your professional networking instance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mb-4">
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

            <FormItem className="mb-4">
              <FormLabel>Server Logo</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          // In a real app, you would handle the file upload
                          // and set the logo URL in the form
                          if (e.target.files?.length) {
                            // form.setValue("logo", URL);
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </FormItem>
          </>
        );

      case "policies":
        return (
          <>
            <FormField
              control={form.control}
              name="registrationType"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Registration Type</FormLabel>
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
                      <SelectItem value="open">Open (anyone can join)</SelectItem>
                      <SelectItem value="invite">Invite-only</SelectItem>
                      <SelectItem value="admin">Admin approval required</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Control who can join your instance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentModeration.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable content moderation</FormLabel>
                    <FormDescription>
                      Automatically filter content based on keywords
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormItem className="mb-4">
              <FormLabel>Required Profile Fields</FormLabel>
              <div className="space-y-2">
                {["Name", "Bio", "Work History", "Skills"].map((field) => (
                  <label key={field} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      defaultChecked={field === "Name"}
                    />
                    <span className="text-sm text-gray-700">{field}</span>
                  </label>
                ))}
              </div>
              <FormDescription>
                Choose which profile fields are mandatory for users
              </FormDescription>
            </FormItem>
          </>
        );

      case "federation":
        return (
          <>
            <FormField
              control={form.control}
              name="federationRules.autoShare"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Automatically share activities</FormLabel>
                    <FormDescription>
                      Allow activities to be automatically shared with federated instances
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="federationRules.requireApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Require admin approval for federation</FormLabel>
                    <FormDescription>
                      New federation requests will need your approval
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormItem className="mb-4">
              <FormLabel>Federation Scope</FormLabel>
              <div className="space-y-2 mt-1">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="federation-scope"
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">Allow all instances (recommended)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="federation-scope"
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Allowlist (only approved instances)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="federation-scope"
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Blocklist (all except blocked instances)</span>
                </label>
              </div>
            </FormItem>
          </>
        );

      case "domain":
        return (
          <>
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem className="mb-4">
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

            <div className="mb-4 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">DNS Configuration</h4>
              <p className="text-sm text-blue-700 mb-2">
                To use a custom domain, you'll need to set up the following DNS records:
              </p>
              <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs">
                <div>CNAME record: <span className="text-blue-600">@</span> pointing to <span className="text-green-600">{process.env.REPLIT_DOMAINS?.split(",")[0] || "your-replit-domain.com"}</span></div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                DNS changes may take up to 48 hours to propagate.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Instance Summary</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Name:</dt>
                  <dd className="text-sm text-gray-900">{form.watch("name")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Registration:</dt>
                  <dd className="text-sm text-gray-900">{form.watch("registrationType")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Moderation:</dt>
                  <dd className="text-sm text-gray-900">{form.watch("contentModeration.enabled") ? "Enabled" : "Disabled"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Auto-federation:</dt>
                  <dd className="text-sm text-gray-900">{form.watch("federationRules.autoShare") ? "Enabled" : "Disabled"}</dd>
                </div>
              </dl>
            </div>
          </>
        );
    }
  };

  // Get the appropriate button text based on the current step
  const getNextButtonText = () => {
    return currentStep === "domain" ? "Create Instance" : "Next Step";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === "basic" && "Create New Instance"}
            {currentStep === "policies" && "Configure Policies"}
            {currentStep === "federation" && "Federation Settings"}
            {currentStep === "domain" && "Domain & Summary"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "basic" && "Set up your own server instance to connect with the federation network."}
            {currentStep === "policies" && "Configure how users join and interact with your instance."}
            {currentStep === "federation" && "Control how your instance federates with others."}
            {currentStep === "domain" && "Configure your domain and review your settings."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {renderStepContent()}
          </form>
        </Form>

        <DialogFooter className="flex justify-between sm:justify-between">
          {currentStep !== "basic" ? (
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
            >
              Back
            </Button>
          ) : (
            <div></div>
          )}
          <Button
            type="button"
            onClick={goToNextStep}
            disabled={
              (currentStep === "basic" && !form.watch("name")) ||
              createInstanceMutation.isPending
            }
          >
            {createInstanceMutation.isPending ? "Creating..." : getNextButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
