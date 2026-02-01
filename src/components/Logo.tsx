"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

const Logo = ({width=110,height=50,show=true}:{width?:number,height?:number,show?:boolean}) => {
  const { resolvedTheme } = useTheme();

  console.log("resolvedTheme:", resolvedTheme);
  return (
    <Link href={'/'}>
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
    </Link>
  );
};
export default Logo;