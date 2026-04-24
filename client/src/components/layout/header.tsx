import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Menu, User, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLocalLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/local-logout");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch {
      // Fall back to Replit logout
      window.location.href = "/api/logout";
    }
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`font-medium transition-colors ${
        location === href
          ? "text-primary-500"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Shield className="text-white h-4 w-4" />
                </div>
                <span className="text-xl font-semibold text-slate-900">SafeGuard Mutual</span>
              </div>
            </Link>
            <span className="text-sm bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full">
              Non-Profit
            </span>
          </div>

          {isAuthenticated ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {navLink("/", "Dashboard")}
                {navLink("/policies", "Policies")}
                {navLink("/claims", "Claims")}
                {navLink("/payment", "Payments")}
              </nav>

              <div className="flex items-center space-x-4">
                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </span>
                      </div>
                      <span className="hidden md:inline text-sm font-medium text-slate-900">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLocalLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu button */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              {/* Public Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {navLink("/coverage", "Coverage")}
                {navLink("/about", "About")}
                {navLink("/contact", "Support")}
              </nav>

              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 font-medium">
                    Get Coverage
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
