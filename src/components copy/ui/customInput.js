export default function CustomInput({
  className = "",
  placeholder = "",
  type,
  ...props
}) {
  return (
    <input
      type={type}
      {...props}
      className={`py-1 px-3 rounded-md border border-custom-border w-full ${className}`}
      placeholder={placeholder}
    />
  );
}
