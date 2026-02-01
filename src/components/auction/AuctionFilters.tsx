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
    <Card>
      <CardContent className="p-4 flex flex-wrap gap-4 items-end">
        <Input
          placeholder="Search NFT title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Input
          type="number"
          placeholder="Min bid"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-32"
        />

        <Input
          type="number"
          placeholder="Max bid"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-32"
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="endingSoon"
            checked={endingSoon}
            onCheckedChange={(v:any) => setEndingSoon(Boolean(v))}
          />
          <label htmlFor="endingSoon" className="text-sm font-medium">
            Ending soon
          </label>
        </div>

        <Button onClick={applyFilters}>Apply</Button>
      </CardContent>
    </Card>
  );
}
