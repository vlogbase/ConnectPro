import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ProfileCard from "@/components/profile/ProfileCard";
import PostCard from "@/components/feed/PostCard";
import { format } from "date-fns";
import { AnimatedProfileNavigation, AnimatedBadge, AnimatedProfileCard } from "@/components/profile/AnimatedProfileNavigation";
import { BriefcaseIcon, GraduationCapIcon, LightbulbIcon, FileTextIcon, UserIcon } from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(location.includes("/edit"));
  const [editWorkExpModal, setEditWorkExpModal] = useState(false);
  const [editEducationModal, setEditEducationModal] = useState(false);
  const [editSkillsModal, setEditSkillsModal] = useState(false);
  
  // Determine if this is the current user's profile
  const userId = id ? parseInt(id) : user?.userId;
  const isCurrentUser = user && userId === user.userId;
  
  // Redirect to login if trying to access own profile without being logged in
  useEffect(() => {
    if (!id && !authLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your profile",
        variant: "destructive",
      });
      navigate("/");
    }
    
    // If trying to edit someone else's profile, redirect to view mode
    if (location.includes("/edit") && !isCurrentUser && !authLoading) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own profile",
        variant: "destructive",
      });
      navigate(`/profile/${id || ''}`);
    }
  }, [id, authLoading, user, navigate, toast, location, isCurrentUser]);

  // Fetch user details
  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user's work experiences
  const { data: workExperiences = [], isLoading: workExpsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/work-experiences`],
    enabled: !!userId,
  });

  // Fetch user's education
  const { data: educations = [], isLoading: educationsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/educations`],
    enabled: !!userId,
  });

  // Fetch user's skills
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/skills`],
    enabled: !!userId,
  });

  // Fetch user's posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/posts`],
    enabled: !!userId,
  });

  // Fetch user's services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/services`],
    enabled: !!userId,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      setEditMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUser) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const profileData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      headline: formData.get("headline") as string,
      bio: formData.get("bio") as string,
      // In a real app, handle profileImageUrl upload
    };

    updateProfileMutation.mutate(profileData);
  };

  // If still loading auth and no ID was provided, show skeleton
  if (!id && authLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Get display name for user
  const getDisplayName = (userData: any) => {
    if (!userData) return "";
    return userData.firstName && userData.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData.username;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left column - Profile card and basic info */}
        <div className="md:col-span-4">
          {/* Profile Card */}
          <ProfileCard 
            userId={userId || 0} 
            isCurrentUser={isCurrentUser} 
            onEditProfile={() => setEditMode(true)} 
          />

          {/* Services Card */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-lg">Services</CardTitle>
              <CardDescription>Services offered by {getDisplayName(profileUser)}</CardDescription>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-5 w-16 rounded-full mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No services listed yet</p>
                  {isCurrentUser && (
                    <Button asChild variant="outline" className="mt-2">
                      <Link href="/services/new">Add Service</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service: any) => (
                    <div key={service.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <i className="ri-service-line text-primary-600"></i>
                        </div>
                      </div>
                      <div>
                        <Link href={`/services/${service.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                          {service.title}
                        </Link>
                        {service.price && (
                          <p className="text-sm text-gray-500">{service.price}</p>
                        )}
                        {service.category && (
                          <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-800">
                            {service.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isCurrentUser && (
                    <Button asChild variant="outline" className="w-full mt-2">
                      <Link href="/services/new">Add Service</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Main profile content */}
        <div className="md:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {profileLoading ? (
                    <Skeleton className="h-8 w-48" />
                  ) : (
                    getDisplayName(profileUser)
                  )}
                </CardTitle>
                <CardDescription>
                  {profileLoading ? (
                    <Skeleton className="h-4 w-64 mt-1" />
                  ) : (
                    profileUser?.headline || `@${profileUser?.username}`
                  )}
                </CardDescription>
              </div>
              {isCurrentUser && !editMode && (
                <Button onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )}
              {isCurrentUser && editMode && (
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" form="profile-edit-form">
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="about">
                <TabsList className="border-b border-gray-200 w-full">
                  <TabsTrigger value="about" className="text-sm font-medium">About</TabsTrigger>
                  <TabsTrigger value="experience" className="text-sm font-medium">Experience</TabsTrigger>
                  <TabsTrigger value="education" className="text-sm font-medium">Education</TabsTrigger>
                  <TabsTrigger value="skills" className="text-sm font-medium">Skills</TabsTrigger>
                  <TabsTrigger value="posts" className="text-sm font-medium">Posts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="pt-4">
                  {editMode ? (
                    <form id="profile-edit-form" onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            defaultValue={profileUser?.firstName || ""}
                            placeholder="First Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            defaultValue={profileUser?.lastName || ""}
                            placeholder="Last Name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                          id="headline"
                          name="headline"
                          defaultValue={profileUser?.headline || ""}
                          placeholder="Your professional headline"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">About</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          rows={5}
                          defaultValue={profileUser?.bio || ""}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                    </form>
                  ) : profileLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-800 whitespace-pre-line">
                        {profileUser?.bio || "No bio provided yet."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="experience" className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Work Experience</h3>
                    {isCurrentUser && (
                      <Button variant="outline" size="sm" onClick={() => setEditWorkExpModal(true)}>
                        <i className="ri-add-line mr-1"></i> Add
                      </Button>
                    )}
                  </div>
                  
                  {workExpsLoading ? (
                    <div className="space-y-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-4 w-full mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : workExperiences.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No work experience listed yet</p>
                      {isCurrentUser && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditWorkExpModal(true)}>
                          Add Work Experience
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {workExperiences.map((exp: any) => (
                        <div key={exp.id} className="group relative">
                          {isCurrentUser && (
                            <div className="absolute top-0 right-0 invisible group-hover:visible">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <i className="ri-pencil-line"></i>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          )}
                          <h4 className="text-base font-medium">{exp.title}</h4>
                          <p className="text-sm">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(exp.startDate), 'MMM yyyy')} - {exp.current ? 'Present' : exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : ''}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="education" className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Education</h3>
                    {isCurrentUser && (
                      <Button variant="outline" size="sm" onClick={() => setEditEducationModal(true)}>
                        <i className="ri-add-line mr-1"></i> Add
                      </Button>
                    )}
                  </div>
                  
                  {educationsLoading ? (
                    <div className="space-y-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-4 w-full mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : educations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No education listed yet</p>
                      {isCurrentUser && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditEducationModal(true)}>
                          Add Education
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {educations.map((edu: any) => (
                        <div key={edu.id} className="group relative">
                          {isCurrentUser && (
                            <div className="absolute top-0 right-0 invisible group-hover:visible">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <i className="ri-pencil-line"></i>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          )}
                          <h4 className="text-base font-medium">{edu.school}</h4>
                          <p className="text-sm">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(edu.startDate), 'yyyy')} - {edu.endDate ? format(new Date(edu.endDate), 'yyyy') : 'Present'}
                          </p>
                          {edu.description && (
                            <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="skills" className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Skills</h3>
                    {isCurrentUser && (
                      <Button variant="outline" size="sm" onClick={() => setEditSkillsModal(true)}>
                        <i className="ri-add-line mr-1"></i> Add
                      </Button>
                    )}
                  </div>
                  
                  {skillsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full" />
                      ))}
                    </div>
                  ) : skills.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No skills listed yet</p>
                      {isCurrentUser && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditSkillsModal(true)}>
                          Add Skills
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill: any) => (
                        <div key={skill.id} className="group relative">
                          <Badge variant="secondary" className="py-1.5 text-sm bg-gray-100 hover:bg-gray-200">
                            {skill.skill.name}
                            {skill.endorsements > 0 && (
                              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{skill.endorsements}</span>
                            )}
                          </Badge>
                          {isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 absolute -top-1 -right-1 rounded-full bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100"
                            >
                              <i className="ri-close-line text-xs"></i>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="posts" className="pt-4">
                  {postsLoading ? (
                    <>
                      {[1, 2].map((i) => (
                        <div key={i} className="mb-5">
                          <div className="p-5 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-48" />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No posts yet</p>
                    </div>
                  ) : (
                    <div>
                      {posts.map((post: any) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Work Experience Modal */}
      <Dialog open={editWorkExpModal} onOpenChange={setEditWorkExpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Work Experience</DialogTitle>
            <DialogDescription>
              Add details about your professional experience
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="San Francisco, CA" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="current"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="current">I currently work here</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} placeholder="Describe your role and achievements..." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditWorkExpModal(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={editEducationModal} onOpenChange={setEditEducationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
            <DialogDescription>
              Add details about your educational background
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input id="school" placeholder="University of Example" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input id="degree" placeholder="Bachelor of Science" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy">Field of Study</Label>
              <Input id="fieldOfStudy" placeholder="Computer Science" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eduStartDate">Start Date</Label>
                <Input id="eduStartDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eduEndDate">End Date</Label>
                <Input id="eduEndDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eduDescription">Description</Label>
              <Textarea id="eduDescription" rows={3} placeholder="Describe your studies, activities, and achievements..." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditEducationModal(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Skills Modal */}
      <Dialog open={editSkillsModal} onOpenChange={setEditSkillsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skills</DialogTitle>
            <DialogDescription>
              Add skills to showcase your expertise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skillSearch">Search Skills</Label>
              <Input id="skillSearch" placeholder="Search for skills..." />
            </div>
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Popular Skills</p>
                <div className="flex flex-wrap gap-2">
                  {["JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS", "Python", "Git", "UI/UX Design"].map((skill) => (
                    <Badge key={skill} variant="outline" className="cursor-pointer hover:bg-primary/10">
                      + {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Selected Skills</p>
              <div className="flex flex-wrap gap-2">
                {/* Show selected skills here */}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSkillsModal(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
