import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, Bell, LogOut, User, Settings } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Logo */}
              <Link href="/dashboard">
                <a className="flex items-center">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H21V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 3L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 7H9C7.89543 7 7 7.89543 7 9V10C7 11.1046 7.89543 12 9 12C10.1046 12 11 12.8954 11 14V15C11 16.1046 10.1046 17 9 17H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 14V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7C4 4.79086 5.79086 3 8 3H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="ml-2 text-xl font-bold">ChessTutor</span>
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard">
                <a className={`${isActive("/dashboard") || isActive("/") ? "border-white" : "border-transparent hover:border-white/80"} text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/games">
                <a className={`${isActive("/games") ? "border-white" : "border-transparent hover:border-white/80"} text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  My Games
                </a>
              </Link>
              <Link href="/progress">
                <a className={`${isActive("/progress") ? "border-white" : "border-transparent hover:border-white/80"} text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Progress
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
            >
              <Bell className="h-5 w-5" />
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center text-white">
                    <span>{user?.username.charAt(0).toUpperCase() || "U"}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary-dark"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/dashboard">
            <a
              className={`${
                isActive("/dashboard") || isActive("/")
                  ? "bg-primary-dark text-white"
                  : "text-white/80 hover:bg-primary-dark hover:text-white"
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Dashboard
            </a>
          </Link>
          <Link href="/games">
            <a
              className={`${
                isActive("/games")
                  ? "bg-primary-dark text-white"
                  : "text-white/80 hover:bg-primary-dark hover:text-white"
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              My Games
            </a>
          </Link>
          <Link href="/progress">
            <a
              className={`${
                isActive("/progress")
                  ? "bg-primary-dark text-white"
                  : "text-white/80 hover:bg-primary-dark hover:text-white"
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Progress
            </a>
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-primary-dark">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-dark flex items-center justify-center text-white">
                <span>{user?.username.charAt(0).toUpperCase() || "U"}</span>
              </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-white">{user?.username}</div>
              <div className="text-sm font-medium text-white/80">{user?.email}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button className="block px-4 py-2 text-base font-medium text-white/80 hover:text-white hover:bg-primary-dark w-full text-left">
              Profile
            </button>
            <button className="block px-4 py-2 text-base font-medium text-white/80 hover:text-white hover:bg-primary-dark w-full text-left">
              Settings
            </button>
            <button 
              className="block px-4 py-2 text-base font-medium text-white/80 hover:text-white hover:bg-primary-dark w-full text-left"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
