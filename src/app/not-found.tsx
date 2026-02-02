
import Footer from "@/components/footer";
import Header from "@/components/header";
import {NotFound as NotFoundUI} from "@/components/notFound";
import React from "react";

const NotFound = () => {
  return (
    <>
    <Header/>
    <div className="grid place-items-center">
    
      <NotFoundUI title="Go Home" link="/"/>

    </div>
    <Footer/>
    </>
  );
};

export default NotFound;
