import Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

export function getAblyClient() {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_KEY || "" });
  }
  return ablyClient;
}
