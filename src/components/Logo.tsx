"use client";
import Image from "next/image";
import Link from "next/link";

const Logo = ({width=110,height=50,show=true}:{width?:number,height?:number,show?:boolean}) => {
  return (
    <Link href={'/'} className={show ? "block" : "hidden"}>
    <Image

      className={`w-${width} h-${height} object-contain  dark:hidden block`}
      width={width}
      height={height}
      src={
        "/logo-dark.png"
      }

      alt="Logo"
    />
      <Image

      className={`w-${width} h-${height} object-contain  dark:block hidden`}
      width={width}
      height={height}
      src={
        "/logo-light.png"
      }
      
      alt="Logo"
    />
    </Link>
  );
};
export default Logo;