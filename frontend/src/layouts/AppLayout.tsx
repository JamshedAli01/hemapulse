import { useCallback, useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  Activity, 
  Menu, 
  X, 
  LayoutDashboard, 
  Droplet, 
  Users, 
  Building2, 
  Bell, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Requests', href: '/requests', icon: Droplet },
  { name: 'Donors', href: '/donors', icon: Users },
  { name: 'Hospitals', href: '/hospitals', icon: Building2 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const refreshUnreadCount = useCallback(() => {
    if (!user) {
      setUnreadCount(null);
      return;
    }
    notificationService
      .listNotifications()
      .then((notifications) => {
        setUnreadCount(
          notifications.filter((notification) => notification.status !== 'READ').length
        );
      })
      .catch((error) => {
        console.error('Failed to load notification count', error);
      });
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    window.addEventListener('hemapulse:notifications-updated', refreshUnreadCount);
    return () => {
      window.removeEventListener('hemapulse:notifications-updated', refreshUnreadCount);
    };
  }, [refreshUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 text-primary">
              <Activity className="h-6 w-6" />
              <Link to="/dashboard" className="text-xl font-bold tracking-tight">HemaPulse</Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-16",
                    isActive 
                      ? "border-primary text-foreground" 
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span className="relative mr-2 inline-flex">
                    <item.icon className="h-4 w-4" />
                    {item.name === 'Notifications' && unreadCount !== null && unreadCount > 0 && (
                      <span className="pointer-events-none absolute -right-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Right items */}
            <div className="hidden md:flex items-center space-x-3">
              {user && (
                <div className="flex flex-col text-right mr-2">
                  <span className="text-sm font-semibold leading-none">{user.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">{user.role}</span>
                </div>
              )}
              <NavLink
                to="/profile"
                className={({ isActive }) => cn(
                  "p-2 rounded-full transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                )}
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </NavLink>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface">
            {user && (
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email} · {user.role}</p>
              </div>
            )}
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                    isActive
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <span className="relative mr-3 inline-flex">
                      <item.icon className="h-5 w-5" />
                      {item.name === 'Notifications' && unreadCount !== null && unreadCount > 0 && (
                        <span className="pointer-events-none absolute -right-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    {item.name}
                  </div>
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                  isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </div>
              </NavLink>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-3" />
                  Log out
                </div>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
