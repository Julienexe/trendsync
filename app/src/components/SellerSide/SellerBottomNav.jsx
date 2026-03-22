import { NavLink } from "react-router-dom";
import { Home, TrendingUp, PlusCircle, Bell, User, MessageSquare } from "lucide-react";
import { useChat } from "../../utils/ChatContext";

const SellerBottomNav = () => {
  const { unreadNotifications } = useChat();
  const unreadCount = unreadNotifications.length;

  const navItems = [
    { to: "/seller/home", icon: Home, label: "Home" },
    { to: "/seller/trending2", icon: TrendingUp, label: "Trending" },
    { to: "/seller/add-product", icon: PlusCircle, label: "Add Product" },
    { to: "/seller/chat", icon: MessageSquare, label: "Chat", showBadge: true, badgeCount: unreadCount },
    { to: "/seller/notifications", icon: Bell, label: "Notifications" },
    { to: "/seller/account", icon: User, label: "Account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50 md:hidden">
      {navItems.map(({ to, icon: Icon, label, showBadge, badgeCount }) => (
        <NavLink 
          key={to} 
          to={to} 
          className="flex flex-col items-center text-xs relative"
          end 
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive 
                      ? "text-green-500 scale-110" 
                      : isDarkMode 
                        ? "text-gray-400" 
                        : "text-gray-500"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {showBadge && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  isActive 
                    ? "text-green-500 font-medium" 
                    : isDarkMode 
                      ? "text-gray-400" 
                      : "text-gray-500"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-6 h-0.5 bg-green-500 rounded-full"></span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default SellerBottomNav;