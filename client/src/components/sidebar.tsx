import { Link, useLocation } from "wouter";
import { 
  Users, 
  BarChart3, 
  GraduationCap, 
  Tag, 
  Upload, 
  Download, 
  User,
  LogOut,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Gauge },
    { name: "Workers", href: "/workers", icon: Users },
    { name: "Courses", href: "/courses", icon: GraduationCap },
    { name: "Certifications", href: "/certifications", icon: Tag },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const tools = [
    { name: "Import Excel", href: "/workers?import=true", icon: Upload },
    { name: "Export Data", href: "/reports?export=true", icon: Download },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Users className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WorkerPro</h1>
            <p className="text-sm text-gray-500">HR Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Tools
          </p>
          {tools.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600 h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">HR Manager</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
