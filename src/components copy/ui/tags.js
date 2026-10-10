// H1
export const H1 = ({ name, className }) => {
  return (
    <>
      <h1
        className={`text-3xl laptop:text-4xl font-bold text-custom-text1  ${className}`}
      >
        {name}
      </h1>
    </>
  );
};

// H2
export const H2 = ({ name, className }) => {
  return (
    <>
      <h2
        className={`text-3xl laptop:text-4xl font-bold text-custom-text1 ${className}`}
      >
        {name}
      </h2>
    </>
  );
};

// H3
export const H3 = ({ name, className }) => {
  return (
    <>
      <h3
        className={`text-xl laptop:text-2xl font-bold text-custom-text1 ${className}`}
      >
        {name}
      </h3>
    </>
  );
};

// H4
export const H4 = ({ name, className }) => {
  return (
    <>
      <h4
        className={`text-xl laptop:text-2xl font-semibold text-custom-text1 ${className}`}
      >
        {name}
      </h4>
    </>
  );
};

// H5
export const H5 = ({ name, className }) => {
  return (
    <>
      <h5
        className={`text-lg laptop:text-xl font-semibold text-custom-text1 ${className}`}
      >
        {name}
      </h5>
    </>
  );
};

// H6
export const H6 = ({ name, className, ...props }) => {
  return (
    <>
      <h6
        className={`text-base laptop:text-xl font-medium text-custom-text2  ${className}`}
        {...props}
      >
        {name}
      </h6>
    </>
  );
};

// P
export const P = ({ name, className }) => {
  return (
    <>
      <p className={`text-base font-normal text-custom-text2 ${className}`}>
        {name}
      </p>
    </>
  );
};
