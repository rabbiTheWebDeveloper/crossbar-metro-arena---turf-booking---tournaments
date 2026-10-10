"use client";

export default function CustomButton({
  className = "",
  onClick = () => {},
  children,
  type = "button",
}) {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <button
      className={`bg-primary-color1 text-white py-1.5 px-5 rounded-lg text-base font-medium ${className}`}
      onClick={handleClick}
      type={type}
    >
      {children}
    </button>
  );
}
