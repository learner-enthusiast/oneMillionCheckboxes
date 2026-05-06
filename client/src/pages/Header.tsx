import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/state/auth/AuthContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, Zap, User, ChevronDown } from "lucide-react";

const HEADER_HIDDEN_PATHS = ["/login", "/oidc/auth"];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (HEADER_HIDDEN_PATHS.includes(location.pathname)) return null;

  const handleLogout = () => {
    logout?.();
    navigate("/login", { replace: true });
  };

  const username = (user as any)?.username || "User";
  const email = (user as any)?.email || "No email";
  const initials = username
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-blue-500/30 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_24px_rgba(37,99,235,0.35)] backdrop-blur-sm">
      {/* Subtle animated shimmer line at top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 shadow-inner group-hover:bg-white/20 transition-colors">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              APP <span className="text-blue-200 font-light">Mantra</span>
            </span>
            <Badge
              variant="outline"
              className="hidden sm:flex border-blue-300/40 text-blue-100 text-[10px] px-1.5 py-0 h-4 rounded-full bg-blue-500/20"
            >
              Beta
            </Badge>
          </button>

          {/* Desktop: User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2.5 px-3 py-2 h-auto rounded-xl text-white hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 transition-all duration-150"
                  >
                    <Avatar className="h-7 w-7 border border-white/30 shadow-sm">
                      <AvatarFallback className="bg-blue-400/40 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold">{username}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-blue-200 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-52 rounded-xl border border-gray-100 shadow-2xl shadow-blue-900/10 p-1"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {username}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {email}
                    </p>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="mx-1 my-1" />

                  {/* <DropdownMenuItem
                    className="gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 cursor-pointer"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profile
                  </DropdownMenuItem> */}

                  {/* <DropdownMenuSeparator className="mx-1 my-1" /> */}

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile: Sheet Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white rounded-xl"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Sheet Header */}
                  <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border-2 border-white/30 shadow-md">
                        <AvatarFallback className="bg-blue-400/40 text-white text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                          {username}
                        </span>
                        <span className="text-xs text-blue-200 truncate">
                          {email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sheet Nav Items */}
                  <nav className="flex-1 px-3 py-4 space-y-1">
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      Profile
                    </button>
                  </nav>

                  {/* Sheet Footer */}
                  <div className="border-t border-gray-100 px-3 py-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
