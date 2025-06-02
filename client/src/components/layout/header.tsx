import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Menu } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const { user, isAuthenticated } = useAuth();

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
            <span className="text-sm bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full">Non-Profit</span>
          </div>
          
          {isAuthenticated ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/">
                  <a className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Dashboard</a>
                </Link>
                <Link href="/enrollment">
                  <a className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Coverage</a>
                </Link>
                <Link href="/claims">
                  <a className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Claims</a>
                </Link>
                <Link href="/payment">
                  <a className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Payments</a>
                </Link>
              </nav>

              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-slate-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Sign Out
                </Button>
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
                <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Coverage</a>
                <a href="#about" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">About</a>
                <a href="#contact" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Support</a>
              </nav>

              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost"
                  onClick={() => window.location.href = "/api/login"}
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 font-medium"
                >
                  Get Coverage
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
