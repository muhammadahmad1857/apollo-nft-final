"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import React, { Suspense } from "react";
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
      <Footer />
    </>
  );
};

export default Layout;
