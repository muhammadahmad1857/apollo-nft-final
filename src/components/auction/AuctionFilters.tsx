"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function AuctionFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [endingSoon, setEndingSoon] = useState(params.get("endingSoon") === "true");

  const hasFilters = search || min || max || endingSoon;

  function applyFilters() {
    const query = new URLSearchParams();

    if (search) query.set("q", search);
    if (min) query.set("min", min);
    if (max) query.set("max", max);
    if (endingSoon) query.set("endingSoon", "true");

    router.push(`/auction?${query.toString()}`);
  }

  function resetFilters() {
    setSearch("");
    setMin("");
    setMax("");
    setEndingSoon(false);
    router.push("/auction");
  }

  return (
    <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl transition-all">
      <CardContent className="p-6 flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <Input
          placeholder="Search NFT title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-500"
        />

        {/* Min & Max Bid */}
        <Input
          type="number"
          placeholder="Min bid"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-500"
        />
        <Input
          type="number"
          placeholder="Max bid"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-500"
        />

        {/* Ending soon */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="endingSoon"
            checked={endingSoon}
            onCheckedChange={(v:any) => setEndingSoon(Boolean(v))}
            className="accent-black dark:accent-white"
          />
          <label htmlFor="endingSoon" className="text-sm font-medium text-black dark:text-white">
            Ending soon
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {hasFilters && (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="border-gray-400 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={applyFilters}
            className="bg-black dark:bg-white text-white dark:text-black font-semibold px-6 py-2 rounded-md shadow-sm hover:shadow-md transition"
          >
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
