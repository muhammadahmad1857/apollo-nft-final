import Header from "@/components/header";
import  NFTGrid  from "@/components/marketplace/nftGrid";
import PageHeading from "@/components/marketplace/pageHeading";
import Footer from "@/components/footer";
const MarketplacePage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Header/>
      <main className="py-24 space-y-16">
        <PageHeading />
        <NFTGrid />
      </main>
      <Footer/>
    </div>
  );
};

export default MarketplacePage;