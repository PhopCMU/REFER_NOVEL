import React from "react";

export type IconProps = {
  name: string;
  className?: string;
  title?: string;
  inline?: boolean;
};
export const Icon: React.FC<IconProps> = ({
  name,
  className = "",
  title,
  inline,
}) => {
  return (
    <span
      className={`material-symbols-outlined align-middle ${
        inline ? "" : "w-6 inline-flex items-center justify-center"
      } ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      title={title}
    >
      {name}
    </span>
  );
};
