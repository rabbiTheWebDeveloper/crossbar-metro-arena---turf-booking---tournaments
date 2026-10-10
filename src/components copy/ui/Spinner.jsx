const Spinner = ({ size = "xl", color = "blue" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-16 h-16", // Add a new large size
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className={`animate-spin inline-block ${selectedSize} border-4 border-${color}-600 border-t-transparent rounded-full`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;
