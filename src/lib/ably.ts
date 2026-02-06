import Ably from "ably";

export const ably = new Ably.Rest({
  key: process.env.ABLY_API_KEY, // your server-side key
});

export async function pushToAbly(channelName: string, event: string, data: unknown) {
  await ably.channels.get(channelName).publish(event, data);
}
