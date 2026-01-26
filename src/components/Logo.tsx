"use client";
import { useTheme } from "next-themes";
import Image from "next/image";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  console.log("resolvedTheme:", resolvedTheme);
  return (
    <Image
      className="w-27.5 h-12.5 object-contain"
      width={110}
      height={50}
      src={
        resolvedTheme === "dark"
          ? "/logo-light.png"
          : "/logo-dark.png"
      }
      alt="Logo"
    />
  );
};
export default Logo;