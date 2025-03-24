import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [activeSection, setActiveSection] = useState("about");
  
  // Determine if this is the current user's profile
  const userId = id ? parseInt(id) : user?.userId;
  const isCurrentUser = user && userId === user?.userId;
  
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

  // Define profile sections with content
  const profileSections = [
    {
      id: "about",
      label: "About",
      icon: <UserIcon className="h-4 w-4" />,
      content: (
        <div className="pt-4">
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
        </div>
      )
    },
    {
      id: "experience",
      label: "Experience",
      icon: <BriefcaseIcon className="h-4 w-4" />,
      content: (
        <div className="pt-4">
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
                <AnimatedProfileCard key={exp.id} className="p-4 border border-gray-100">
                  {isCurrentUser && (
                    <div className="absolute top-2 right-2 invisible group-hover:visible">
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
                </AnimatedProfileCard>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: "education",
      label: "Education",
      icon: <GraduationCapIcon className="h-4 w-4" />,
      content: (
        <div className="pt-4">
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
                <AnimatedProfileCard key={edu.id} className="p-4 border border-gray-100">
                  {isCurrentUser && (
                    <div className="absolute top-2 right-2 invisible group-hover:visible">
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
                </AnimatedProfileCard>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: "skills",
      label: "Skills",
      icon: <LightbulbIcon className="h-4 w-4" />,
      content: (
        <div className="pt-4">
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
                  <AnimatedBadge color={skill.endorsements > 0 ? "primary" : "secondary"} className="py-1.5 text-sm">
                    {skill.skill.name}
                    {skill.endorsements > 0 && (
                      <span className="ml-1.5 text-xs bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded-full">
                        {skill.endorsements}
                      </span>
                    )}
                  </AnimatedBadge>
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
        </div>
      )
    },
    {
      id: "posts",
      label: "Posts",
      icon: <FileTextIcon className="h-4 w-4" />,
      content: (
        <div className="pt-4">
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
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left column - Profile card and basic info */}
        <div className="md:col-span-4">
          {/* Profile Card */}
          <ProfileCard 
            userId={userId || 0} 
            isCurrentUser={isCurrentUser || false} 
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
              <AnimatedProfileNavigation
                activeSectionId={activeSection}
                onSectionChange={setActiveSection}
                sections={profileSections}
                className="animated-profile-tabs"
              />
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="current-education"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="current-education">I'm currently studying here</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eduDescription">Description</Label>
              <Textarea id="eduDescription" rows={3} placeholder="Describe your studies and achievements..." />
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
              Add your professional skills to your profile
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-4">
              <Label htmlFor="skills">Select skills to add</Label>
              <div className="border border-gray-200 rounded-md p-4 h-60 overflow-y-auto">
                <div className="space-y-2">
                  {/* This would be populated by available skills */}
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>JavaScript</span>
                    <Button type="button" variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>React</span>
                    <Button type="button" variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>Node.js</span>
                    <Button type="button" variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>TypeScript</span>
                    <Button type="button" variant="outline" size="sm">Add</Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSkill">Add a custom skill</Label>
              <div className="flex space-x-2">
                <Input id="newSkill" placeholder="Enter a skill..." className="flex-1" />
                <Button type="button">Add</Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSkillsModal(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}