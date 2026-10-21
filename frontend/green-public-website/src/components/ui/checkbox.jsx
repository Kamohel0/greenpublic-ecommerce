import React from "react";

export const Checkbox = ({ id, className = "", defaultChecked, disabled, ...props }) => {
  return (
    <input
      type="checkbox"
      id={id}
      defaultChecked={defaultChecked}
      disabled={disabled}
      className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
};
