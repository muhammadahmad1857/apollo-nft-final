
import Footer from "@/components/footer";
import Header from "@/components/header";
import {NotFound as NotFoundUI} from "@/components/notFound";
import React from "react";

const NotFound = () => {
  return (
    <>
    <Header/>
    <div className="grid items-center min-w-screen">
    
      <NotFoundUI title="Go Home" link="/"/>

    </div>
    <Footer/>
    </>
  );
};

export default NotFound;
