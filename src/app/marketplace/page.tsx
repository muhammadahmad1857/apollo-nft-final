import Header from "@/components/header";
import  NFTGrid  from "@/components/marketplace/nftGrid";
import PageHeading from "@/components/marketplace/pageHeading";
import Footer from "@/components/footer";
import { BlockedUserTopBanner } from "@/components/blocked-user-top-banner";
const MarketplacePage = () => {
  return (
    <div className="min-h-screen  text-zinc-900 dark:text-zinc-100">
        <Header/>
      <main className="py-28 space-y-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-16">
          <BlockedUserTopBanner message="Your account is temporarily blocked. Marketplace actions may be unavailable. Contact us at hello@blaqclouds.io if this is a mistake." />
        </div>
        <PageHeading />
        <NFTGrid />
      </main>
      <Footer/>
    </div>
  );
};

export default MarketplacePage;