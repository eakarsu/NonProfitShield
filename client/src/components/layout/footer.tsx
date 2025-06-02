import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Shield className="text-white h-4 w-4" />
              </div>
              <span className="text-xl font-semibold">SafeGuard Mutual</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-md">
              A member-owned, non-profit insurance mutual leveraging AI and blockchain technology 
              to provide fair, transparent coverage.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">Licensed in all 50 states</span>
              <span className="text-sm text-slate-500">•</span>
              <span className="text-sm text-slate-500">A+ Rating</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Coverage</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">Auto Insurance</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Home Insurance</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Renters Insurance</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Umbrella Policy</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Financial Reports</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Member Benefits</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-slate-400 text-sm">
            © 2024 SafeGuard Mutual. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
