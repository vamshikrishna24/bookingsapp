import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'User created successfully', user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
