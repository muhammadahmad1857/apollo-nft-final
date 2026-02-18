import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <UserX className="h-24 w-24 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Artist Not Found</h1>
          <p className="text-muted-foreground text-lg">
            The artist profile you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/marketplace">
            <Button variant="default">Browse Marketplace</Button>
          </Link>
          <Link href="/auction">
            <Button variant="outline">View Auctions</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
