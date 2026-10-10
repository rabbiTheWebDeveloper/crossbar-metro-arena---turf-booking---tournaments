export default function CustomCart({ children, className }) {
  return (
    <>
      <div className={`p-5 laptop:p-8 rounded-xl shadow border border-custom-border ${className}`}>
        {children}
      </div>
    </>
  );
}
