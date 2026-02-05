import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PendingAmountCard({ pendingAmount, onWithdraw, isWithdrawing }: {
  pendingAmount: number;
  onWithdraw: () => Promise<void>;
  isWithdrawing: boolean;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Pending Amount</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-2xl font-bold">Ξ {pendingAmount}</span>
        <Button
          onClick={onWithdraw}
          disabled={isWithdrawing}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw"}
        </Button>
      </CardContent>
    </Card>
  );
}
