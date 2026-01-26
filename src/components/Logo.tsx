"use client";
import { useTheme } from "next-themes";
import Image from "next/image";

const Logo = ({width=110,height=50,show=true}:{width?:number,height?:number,show?:boolean}) => {
  const { resolvedTheme } = useTheme();

  console.log("resolvedTheme:", resolvedTheme);
  return (
    <Image

      className={`w-${width} h-${height} object-contain ${show ? "block" : "hidden"}`}
      width={width}
      height={height}
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