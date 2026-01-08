// src/components/UI.tsx
import React, { ReactNode } from 'react';
import { Wrench, ChevronRight, Home, Calendar, PlusCircle, MapPin, User, Trophy } from 'lucide-react';

// Header Props - masaüstü navigasyon için
interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', label: 'Vitrin', icon: Home },
    { id: 'reservations', label: 'Kiraladıklarım', icon: Calendar },
    { id: 'add', label: 'Alet Paylaş', icon: PlusCircle },
    { id: 'leaderboard', label: 'Liderlik', icon: Trophy },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            ToolShare
          </h1>
        </div>

        {/* Masaüstü Navigasyonu */}
        <nav className="hidden lg:flex flex-1 justify-center items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}

// NavButton için Interface tanımlıyoruz
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode; // Lucide iconları veya herhangi bir React elemanı için
  label: string;
}

export const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
        active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ProfileMenuItem için Interface tanımlıyoruz
interface ProfileMenuItemProps {
  icon: ReactNode;
  label: string;
  status?: string; // Soru işareti bu propun opsiyonel olduğunu belirtir
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ icon, label, status }) => {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
            {status}
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>
    </button>
  );
}