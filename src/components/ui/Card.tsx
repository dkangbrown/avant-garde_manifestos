import React from "react";

export function Card({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`bg-white border rounded-lg shadow ${className}`}
    />
  );
}

export function CardContent({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`p-2 ${className}`} />;
}
