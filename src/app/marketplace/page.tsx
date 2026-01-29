import Header from "@/components/header";
import  NFTGrid  from "@/components/marketplace/nftGrid";
import PageHeading from "@/components/marketplace/pageHeading";

const MarketplacePage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Header/>
      <main className="py-24 space-y-16">
        <PageHeading />
        <NFTGrid />
      </main>
    </div>
  );
};

export default MarketplacePage;