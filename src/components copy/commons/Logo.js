
import { getUser } from "@/lib/auth";
import React from "react";

const Logo =async () => {
   const user =await getUser();
  return (
    <>
      {/* Logo */}
      <h1 className="text-2xl font-bold mb-6 text-center md:text-left">
        FL Affiliate
      </h1>

      {/* Centered User Card */}
      <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center mb-8">
        {/* User Icon */}
        <div className="text-purple-500 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.121 17.804A4 4 0 019 16h6a4 4 0 013.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Shop Name */}
        <p className="text-purple-600 font-semibold">{user?.name}</p>

        {/* Shop ID */}
        <p className="text-gray-500 text-sm">ID {user?.email}</p>
      </div>
    </>
  );
};

export default Logo;
