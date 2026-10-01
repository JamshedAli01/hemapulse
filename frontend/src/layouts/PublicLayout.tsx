
import { Outlet, Link, NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Activity } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-6 w-6" />
            <Link to="/" className="text-xl font-bold tracking-tight">HemaPulse</Link>
          </div>
          <nav className="flex items-center space-x-6">
            <NavLink 
              to="/login" 
              className={({ isActive }) => cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              Login
            </NavLink>
            <NavLink 
              to="/register" 
              className={({ isActive }) => cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              Register
            </NavLink>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-surface border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HemaPulse. All rights reserved.</p>
      </footer>
    </div>
  );
}
