"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AuctionFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [endingSoon, setEndingSoon] = useState(
    params.get("endingSoon") === "true"
  );

  function applyFilters() {
    const query = new URLSearchParams();

    if (search) query.set("q", search);
    if (min) query.set("min", min);
    if (max) query.set("max", max);
    if (endingSoon) query.set("endingSoon", "true");

    router.push(`/auction?${query.toString()}`);
  }

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 shadow-lg rounded-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6 flex flex-wrap gap-4 items-end justify-between">
        <Input
          placeholder="Search NFT title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-xs rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-400"
        />

        <Input
          type="number"
          placeholder="Min bid"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-28 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-400"
        />

        <Input
          type="number"
          placeholder="Max bid"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-28 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-400"
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="endingSoon"
            checked={endingSoon}
            onCheckedChange={(v:any) => setEndingSoon(Boolean(v))}
            className="accent-purple-500"
          />
          <label htmlFor="endingSoon" className="text-sm font-medium text-gray-700">
            Ending soon
          </label>
        </div>

        <Button
          onClick={applyFilters}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Apply
        </Button>
      </CardContent>
    </Card>
  );
}
