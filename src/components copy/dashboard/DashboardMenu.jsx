/* eslint-disable @next/next/no-img-element */
"use client";
import Logout from "@/app/(auth)/_component/LogOut";
import { CustomContainer } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react"; // Import useState

// Define all menus
const allMenus = [
  {
    id: crypto.randomUUID(),
    name: "All Multi funnel Website Report",
    url: "/dashboard/website-funnel-report",
  },
  {
    id: crypto.randomUUID(),
    name: "All Landing Page Report",
    url: "/dashboard/website-landing-page",
  },
  {
    id: crypto.randomUUID(),
    name: "Report",
    url: "/dashboard/report",
  },
  {
    id: crypto.randomUUID(),
    name: "On Boarding Report",
    url: "/dashboard/on-boarding-report",
  },
  {
    id: crypto.randomUUID(),
    name: "Dashboard",
    url: "/dashboard/me",
  },
  {
    id: crypto.randomUUID(),
    name: "Affiliation Report",
    url: "/dashboard/affiliation-report",
  },
  {
    id: crypto.randomUUID(),
    name: "Account",
    url: "/dashboard/account",
  },

];

export default function DashboardMenu({ session }) {
  const route = usePathname();
  const userName = session.user.name; 
  const permession = session.user.permissions; 
  const [loading, setLoading] = useState(false); // Loading state

  const filteredMenus = 
    permession.length > 0 && permession.some(perm => allMenus.some(menu => menu.url === perm))
      ? allMenus.filter(menu => permession.includes(menu.url))
      : [
          allMenus.find(menu => menu.url === "/dashboard/dashboard"),
          allMenus.find(menu => menu.url === "/dashboard/account"),
        ].filter(Boolean);

  // Handle link click
  const handleLinkClick = () => {
    setLoading(true); // Set loading state to true
  };

  return (
    <section className="my-10">
      <CustomContainer>
        {/* User Profile Section */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <img
              src={'/avatar.jpg'}
              alt={`${userName}'s avatar`}
              className="w-10 h-10 rounded-full border border-gray-300"
            />
            <span className="text-lg font-semibold text-custom-text1">
              {userName}
            </span>
          </div>
          <Logout />
        </div>
        {/* Menu List */}
        <ul className="flex tab:items-center tab:justify-center gap-2 tab:gap-5 flex-wrap">
          {filteredMenus.map((menu) => (
            <li key={menu.id}>
              <Link
                href={menu.url}
                onClick={handleLinkClick} // Trigger loading state on click
                className={`text-sm tab:text-lg font-medium text-custom-text1 py-1 px-3 rounded ${
                  route === menu.url
                    ? "bg-primary-color1 text-white"
                    : "bg-gray-200"
                }`}
              >
                {menu.name}
              </Link>
            </li>
          ))}
        </ul>
      </CustomContainer>
    </section>
  );
}
