export default function AuctionFilters() {
  // TODO: Implement search, filter, sort UI
  return (
    <div className="flex gap-2">
      <input type="text" placeholder="Search NFTs..." className="px-3 py-2 rounded bg-gray-800 text-white" />
      <select className="px-3 py-2 rounded bg-gray-800 text-white">
        <option>Ending Soon</option>
        <option>Highest Bid</option>
        <option>Lowest Bid</option>
        <option>New Listings</option>
      </select>
    </div>
  );
}
