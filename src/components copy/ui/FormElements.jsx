import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const InputField = ({ type, placeholder, name, register }) => {
  const [showPassword, setShowPassword] = useState(false);

  return type === "password" ? (
    <div className="relative">
      <input
        {...register(name)}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="button"
        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  ) : (
    <input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
};

export const Button = ({ text  ,loading}) => (
  <button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3 rounded-lg font-medium transition" disabled={loading}>
    {text}
  </button>
);
