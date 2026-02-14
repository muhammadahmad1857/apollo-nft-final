"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Loader from "@/components/loader";
import React, { Suspense } from "react";

const auctionFacts = [
  "Auctions allow NFT creators to reach multiple bidders and find the best market price!",
  "Did you know? Auction settlement on blockchain is transparent and cannot be manipulated.",
  "Fun fact: Dutch auctions start high and decrease over time to optimize selling speed.",
  "Interesting: Smart contracts automatically transfer ownership to the highest bidder upon settlement.",
  "Did you know? Auction history is permanently recorded on the blockchain for transparency.",
  "Fun fact: Bidders can place multiple bids and increase their offers in real-time.",
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <Suspense fallback={<Loader text="Loading Auction data..." facts={auctionFacts}/>}>{children}</Suspense>
      <Footer />
    </>
  );
};

export default Layout;
