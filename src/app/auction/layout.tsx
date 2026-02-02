"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Loader from "@/components/loader";
import React, { Suspense } from "react";
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <Suspense fallback={<Loader text="Loading Auction data..."/>}>{children}</Suspense>
      <Footer />
    </>
  );
};

export default Layout;
