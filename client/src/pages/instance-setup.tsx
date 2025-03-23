import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Setup wizard steps
type SetupStepType = "basic" | "policies" | "federation" | "domain" | "summary";

export default function InstanceSetup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<SetupStepType>("basic");
  const [progress, setProgress] = useState(20);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    registrationType: "open",
    contentModeration: {
      enabled: true,
      keywords: [] as string[],
    },
    requiredFields: {
      name: true,
      bio: false,
      workHistory: false,
      skills: false,
    },
    federationRules: {
      autoShare: true,
      requireApproval: false,
      federationScope: "all", // all, allowlist, blocklist
      allowedDomains: [] as string[],
      blockedDomains: [] as string[],
    },
    domain: "",
  });

  // Handle form field changes
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle nested form field changes
  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  // Navigate to next step
  const goToNextStep = () => {
    switch (currentStep) {
      case "basic":
        setCurrentStep("policies");
        setProgress(40);
        break;
      case "policies":
        setCurrentStep("federation");
        setProgress(60);
        break;
      case "federation":
        setCurrentStep("domain");
        setProgress(80);
        break;
      case "domain":
        setCurrentStep("summary");
        setProgress(100);
        break;
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case "policies":
        setCurrentStep("basic");
        setProgress(20);
        break;
      case "federation":
        setCurrentStep("policies");
        setProgress(40);
        break;
      case "domain":
        setCurrentStep("federation");
        setProgress(60);
        break;
      case "summary":
        setCurrentStep("domain");
        setProgress(80);
        break;
    }
  };

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      // Format data for API
      const instanceData = {
        name: formData.name,
        description: formData.description,
        logo: formData.logo,
        registrationType: formData.registrationType,
        contentModeration: formData.contentModeration,
        federationRules: formData.federationRules,
        domain: formData.domain || undefined,
        adminId: user?.userId,
      };
      
      return apiRequest("POST", "/api/instances", instanceData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userId}/instances`] });
      toast({
        title: "Success!",
        description: "Your instance has been created successfully.",
      });
      navigate("/admin");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create instance. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle submit
  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an instance",
        variant: "destructive",
      });
      return;
    }
    
    createInstanceMutation.mutate();
  };

  // If user isn't logged in, redirect to login
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Create Your Instance</CardTitle>
            <CardDescription>
              Set up your own professional networking server
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p className="mb-6 text-gray-600">
              Please log in to create and manage your own instances.
            </p>
            <Button asChild>
              <a href="/api/login">Log in</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Instance Name</Label>
                <Input
                  id="name"
                  placeholder="My Professional Network"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Choose a unique name for your professional networking instance
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A professional networking platform for..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Describe the purpose of your instance to help others understand what it's about
                </p>
              </div>

              <div className="space-y-2">
                <Label>Instance Logo</Label>
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
                            // In a full implementation, this would handle file upload
                            // and set the logo URL in the formData
                            if (e.target.files?.length) {
                              const file = e.target.files[0];
                              // For now, just store the file name
                              updateFormData("logo", file.name);
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    {formData.logo && (
                      <p className="text-xs text-primary mt-1">
                        Selected: {formData.logo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case "policies":
        return (
          <>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Registration Type</Label>
                <RadioGroup
                  value={formData.registrationType}
                  onValueChange={(value) => updateFormData("registrationType", value)}
                  className="flex flex-col space-y-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="registration-open" />
                    <Label htmlFor="registration-open" className="font-normal">
                      Open (anyone can join)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="invite" id="registration-invite" />
                    <Label htmlFor="registration-invite" className="font-normal">
                      Invite-only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="registration-admin" />
                    <Label htmlFor="registration-admin" className="font-normal">
                      Admin approval required
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-gray-500">
                  Control who can join your instance
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="content-moderation"
                    checked={formData.contentModeration.enabled}
                    onCheckedChange={(checked) => 
                      updateNestedFormData("contentModeration", "enabled", checked === true)
                    }
                  />
                  <Label htmlFor="content-moderation">Enable content moderation</Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Automatically filter content based on keywords
                </p>
              </div>

              <div className="space-y-2">
                <Label>Required Profile Fields</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-name"
                      checked={formData.requiredFields.name}
                      onCheckedChange={(checked) => 
                        updateNestedFormData("requiredFields", "name", checked === true)
                      }
                    />
                    <Label htmlFor="field-name" className="font-normal">Name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-bio"
                      checked={formData.requiredFields.bio}
                      onCheckedChange={(checked) => 
                        updateNestedFormData("requiredFields", "bio", checked === true)
                      }
                    />
                    <Label htmlFor="field-bio" className="font-normal">Bio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-work"
                      checked={formData.requiredFields.workHistory}
                      onCheckedChange={(checked) => 
                        updateNestedFormData("requiredFields", "workHistory", checked === true)
                      }
                    />
                    <Label htmlFor="field-work" className="font-normal">Work History</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-skills"
                      checked={formData.requiredFields.skills}
                      onCheckedChange={(checked) => 
                        updateNestedFormData("requiredFields", "skills", checked === true)
                      }
                    />
                    <Label htmlFor="field-skills" className="font-normal">Skills</Label>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Choose which profile fields are mandatory for users
                </p>
              </div>
            </div>
          </>
        );

      case "federation":
        return (
          <>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-share"
                    checked={formData.federationRules.autoShare}
                    onCheckedChange={(checked) => 
                      updateNestedFormData("federationRules", "autoShare", checked === true)
                    }
                  />
                  <Label htmlFor="auto-share">Automatically share activities</Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Allow activities to be automatically shared with federated instances
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-approval"
                    checked={formData.federationRules.requireApproval}
                    onCheckedChange={(checked) => 
                      updateNestedFormData("federationRules", "requireApproval", checked === true)
                    }
                  />
                  <Label htmlFor="require-approval">Require admin approval for federation</Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  New federation requests will need your approval
                </p>
              </div>

              <div className="space-y-2">
                <Label>Federation Scope</Label>
                <RadioGroup
                  value={formData.federationRules.federationScope}
                  onValueChange={(value) => 
                    updateNestedFormData("federationRules", "federationScope", value)
                  }
                  className="flex flex-col space-y-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="scope-all" />
                    <Label htmlFor="scope-all" className="font-normal">
                      Allow all instances (recommended)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="allowlist" id="scope-allowlist" />
                    <Label htmlFor="scope-allowlist" className="font-normal">
                      Allowlist (only approved instances)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blocklist" id="scope-blocklist" />
                    <Label htmlFor="scope-blocklist" className="font-normal">
                      Blocklist (all except blocked instances)
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-gray-500">
                  Control which instances can federate with yours
                </p>
              </div>
            </div>
          </>
        );

      case "domain":
        return (
          <>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain (Optional)</Label>
                <Input
                  id="domain"
                  placeholder="mynetwork.example.com"
                  value={formData.domain}
                  onChange={(e) => updateFormData("domain", e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Enter a custom domain if you want to use one for your instance
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-md">
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
            </div>
          </>
        );

      case "summary":
        return (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instance Summary</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Name:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.name}</dd>
                    </div>
                    {formData.description && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Description:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formData.description}</dd>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Registration:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formData.registrationType === "open" && "Open (anyone can join)"}
                        {formData.registrationType === "invite" && "Invite-only"}
                        {formData.registrationType === "admin" && "Admin approval required"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Content Moderation:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formData.contentModeration.enabled ? "Enabled" : "Disabled"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Federation:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formData.federationRules.autoShare ? "Auto-share enabled" : "Manual sharing"}
                        {formData.federationRules.requireApproval && ", approval required"}
                      </dd>
                    </div>
                    {formData.domain && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Custom Domain:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formData.domain}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Information</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  By creating this instance, you agree to the following:
                </p>
                <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                  <li>You are responsible for all content posted on your instance</li>
                  <li>You will ensure your instance follows our community guidelines</li>
                  <li>You understand that federation allows content to be shared between instances</li>
                </ul>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {currentStep === "basic" && "Create Your Instance"}
            {currentStep === "policies" && "Set Instance Policies"}
            {currentStep === "federation" && "Configure Federation"}
            {currentStep === "domain" && "Domain Setup"}
            {currentStep === "summary" && "Review & Create"}
          </CardTitle>
          <CardDescription>
            {currentStep === "basic" && "Set up your own professional networking server"}
            {currentStep === "policies" && "Define how users join and interact with your instance"}
            {currentStep === "federation" && "Control how your instance connects with others"}
            {currentStep === "domain" && "Set up a custom domain for your instance (optional)"}
            {currentStep === "summary" && "Review your instance configuration before creating"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium">
                Step {
                  currentStep === "basic" ? "1" : 
                  currentStep === "policies" ? "2" : 
                  currentStep === "federation" ? "3" : 
                  currentStep === "domain" ? "4" : "5"
                } of 5
              </span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {currentStep !== "basic" ? (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
            >
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          {currentStep !== "summary" ? (
            <Button
              onClick={goToNextStep}
              disabled={currentStep === "basic" && !formData.name}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createInstanceMutation.isPending}
            >
              {createInstanceMutation.isPending ? "Creating..." : "Create Instance"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
