"use client";

import { BidModel, UserModel } from "@/generated/prisma/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { truncateAddress } from "@/lib/truncate";

export function BidHistory({ bids }: { bids: (BidModel & { bidder: UserModel })[] }) {
  if (!bids.length)
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">No bids yet</p>
    );

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">
        Bid History
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.map((bid, index) => (
            <TableRow key={bid.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {bid.bidder.name || "Unknown"}
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {truncateAddress(bid.bidder.walletAddress)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {bid.bidder.walletAddress}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-right text-cyan-600 dark:text-cyan-400 font-semibold">
                {bid.amount} APOLLO
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
