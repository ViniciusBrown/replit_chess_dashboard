import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Menu, 
  LayoutDashboard, 
  FolderInput, 
  Brain, 
  User, 
  Settings, 
  LogOut, 
  LucideIcon,
  BarChart4
} from "lucide-react";

type NavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Import Games", path: "/import", icon: FolderInput },
  { title: "Analysis", path: "/analysis", icon: BarChart4 },
  { title: "Training", path: "/training", icon: Brain },
  { title: "Profile", path: "/profile", icon: User },
  { title: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar */}
      <div
        className={`bg-primary text-white w-64 flex-shrink-0 flex flex-col h-full transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          fixed lg:relative z-40`}
      >
        <div className="p-4 flex items-center border-b border-primary-dark">
          <BarChart4 className="mr-2 h-6 w-6" />
          <h1 className="font-serif text-xl font-bold">Chess Tutor</h1>
        </div>
        
        <nav className="py-4 flex-1">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`px-4 py-2 flex items-center ${
                    location === item.path
                      ? "bg-primary-dark"
                      : "hover:bg-primary-dark"
                  } transition-colors`}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-primary-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-primary-dark">
                  {user?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm opacity-75">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
}
