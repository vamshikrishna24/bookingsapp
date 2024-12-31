// app/api/booking/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "jwt"; // Use your secret key here

export async function GET(req: Request) {
  try {
    // Get the token from the Authorization header
    const token = req.headers.get("Authorization")?.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Verify the JWT token and extract the userId
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get all booked seat IDs for the current user
    const bookings = await prisma.booking.findMany({
      select: { seatIds: true },
    });

    // Flatten all booked seat IDs and create an array of booked seats
    const bookedSeats = bookings.flatMap((booking) => booking.seatIds);

    // Calculate the available seats by checking the total number of seats (80)
    const totalSeats = 80;
    const availableSeats = [];

    for (let i = 1; i <= totalSeats; i++) {
      if (!bookedSeats.includes(i)) {
        availableSeats.push(i);
      }
    }

    return NextResponse.json({
      availableSeats,
      bookedSeats: bookedSeats.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching available seats" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Get the token from the Authorization header
    const token = req.headers.get("Authorization")?.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }


    // Verify the JWT token and extract the userId
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;
    
    if(action == "reset")
    {
      await prisma.booking.deleteMany({});
      return NextResponse.json({ message: 'Seats reset successfully.' });
    }

    const { seatsBooked } = body;
 
    if (!seatsBooked || seatsBooked.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Please provide seats to book." },
        { status: 400 }
      );
    }

    // Create a new booking in the database
    const booking = await prisma.booking.create({
      data: {
        userId,
        seatIds: seatsBooked,
      },
    });

    return NextResponse.json({
      message: "Seats booked successfully",
      booking,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to book seats. Try again." },
      { status: 500 }
    );
  }
}
