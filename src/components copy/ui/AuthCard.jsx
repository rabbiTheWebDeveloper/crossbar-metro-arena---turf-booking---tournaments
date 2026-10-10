import React from "react";

const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 mb-6">{subtitle}</p>
      {children}
      <div className="mt-6">{footer}</div>
    </div>
  );
};

export default AuthCard;
