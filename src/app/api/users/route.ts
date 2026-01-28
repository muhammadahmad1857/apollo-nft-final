// Next.js 13+ app router version
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma'; // your Prisma client

export async function POST(req: NextRequest) {
  try {
    const { address, name, avatar } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Upsert: create if not exists, update if exists
    const user = await db.user.upsert({
      where: { walletAddress: address },
      update: { name, avatarUrl:avatar },
      create: { walletAddress: address, name, avatarUrl: avatar },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
