import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, Link } from "wouter";

interface FeedTabsProps {
  defaultValue?: string;
  children?: React.ReactNode;
}

export default function FeedTabs({ defaultValue = "home", children }: FeedTabsProps) {
  const [tabValue, setTabValue] = useState(defaultValue);
  const [location, navigate] = useLocation();

  const handleTabChange = (value: string) => {
    setTabValue(value);
    
    // Navigate to the corresponding page
    switch (value) {
      case "home":
        navigate("/");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "services":
        navigate("/services");
        break;
      case "admin":
        navigate("/admin");
        break;
    }
  };

  return (
    <div className="border-b border-gray-200">
      <Tabs 
        value={tabValue} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="-mb-px flex space-x-8" aria-label="Tabs">
          <TabsTrigger 
            value="home"
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300"
          >
            Home Feed
          </TabsTrigger>
          <TabsTrigger 
            value="profile"
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300"
          >
            My Profile
          </TabsTrigger>
          <TabsTrigger 
            value="services"
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300"
          >
            Services Directory
          </TabsTrigger>
          <TabsTrigger 
            value="admin"
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300"
          >
            Admin Panel
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
