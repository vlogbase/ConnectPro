import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Extract initials for avatar fallback
  const getInitials = () => {
    if (!user) return "?";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-auto text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-primary">ConnectPro</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={`${location === "/" ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Home
              </Link>
              <Link href={isAuthenticated ? `/profile/${user?.userId}` : "/profile"} className={`${location.startsWith("/profile") ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                My Profile
              </Link>
              <Link href="/services" className={`${location.startsWith("/services") ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Services
              </Link>
              {isAuthenticated && (
                <Link href="/admin" className={`${location.startsWith("/admin") ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <Input 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md" 
                placeholder="Search" 
                type="search"
              />
            </div>
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <i className="ri-notification-3-line text-xl"></i>
              </Button>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-3 relative rounded-full">
                    <span className="sr-only">Open user menu</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profile_image_url || ""} alt={user?.username || ""} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user?.userId}`}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/api/logout">Log out</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" className="ml-4">
                <a href="/api/login">Log in with Replit</a>
              </Button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <span className="sr-only">Open main menu</span>
              <i className="ri-menu-line h-6 w-6"></i>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
