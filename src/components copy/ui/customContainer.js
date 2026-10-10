export default function CustomContainer({children}) {
  return (
    <>
      <div className="w-[90%] laptop:w-[85%] desktop:w-[1400px] m-auto">{children}</div>
    </>
  );
}
