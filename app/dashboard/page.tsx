"use client";

import { useState, useEffect } from "react";

const DashboardPage = () => {
  const totalSeats = 80;
  const rowSeats = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3]; // The seating arrangement
  const [seats, setSeats] = useState<boolean[]>(Array(totalSeats).fill(false)); // Seat availability
  const [seatsBooked, setSeatsBooked] = useState<number[]>([]); // Store booked seat numbers
  const [numSeats, setNumSeats] = useState<number>(0); // Seats to book
  const [error, setError] = useState<string | null>(null);

  let token:any; 

    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      token = storedToken;
    }

  // Fetch initial seat data (optional, assuming seats are stored in API)
  useEffect(() => {
    const fetchAvailableSeats = async () => {
      try {
        if (!token) {
          setError("User not authenticated");
          return;
        }

        const res = await fetch("/api/booking", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setSeats((prev) =>
            prev.map((_, index) =>
              data.availableSeats.includes(index + 1) ? false : true
            )
          );
        } else {
          setError(data.error || "Failed to fetch available seats");
        }
      } catch (err) {
        setError("Failed to fetch available seats. Try again.");
      }
    };

    fetchAvailableSeats();
  }, [token]); // Ensure it refetches on token change

  const bookSeats = async () => {
    try {
      if (!token) {
        setError("User not authenticated");
        return;
      }

      if (numSeats <= 0 || numSeats > 7) {
        setError("You can book up to 7 seats at a time.");
        return;
      }

      const res = await fetch("/api/booking", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch available seats");
        return;
      }

      let seatsBookedTemp: number[] = [];
      let remainingSeats = numSeats;

      // Try to book seats in rows first
      for (let i = 0; i < rowSeats.length; i++) {
        if (remainingSeats === 0) {
          setSeatsBooked((prev) => [...prev, ...seatsBookedTemp]);
          break;
        }

        const rowStartIndex = rowSeats
          .slice(0, i)
          .reduce((acc, seatsInRow) => acc + seatsInRow, 0);
        const rowEndIndex = rowStartIndex + rowSeats[i];
        const availableSeatsInRow = seats
          .slice(rowStartIndex, rowEndIndex)
          .filter((seat) => !seat).length;

        if (availableSeatsInRow >= remainingSeats) {
          // Book the seats in the current row
          for (let j = rowStartIndex; j < rowEndIndex; j++) {
            if (
              !seats[j] &&
              remainingSeats > 0 &&
              data.availableSeats.includes(j + 1)
            ) {
              seatsBookedTemp.push(j + 1);
              remainingSeats--;
            }
          }
        }
      }

      // If seats are still remaining, try to book from adjacent rows
      if (remainingSeats > 0) {
        for (let i = 0; i < rowSeats.length; i++) {
          if (remainingSeats === 0) {
            setSeatsBooked((prev) => [...prev, ...seatsBookedTemp]);
            break;
          }

          const rowStartIndex = rowSeats
            .slice(0, i)
            .reduce((acc, seatsInRow) => acc + seatsInRow, 0);
          const rowEndIndex = rowStartIndex + rowSeats[i];

          for (let j = rowStartIndex; j < rowEndIndex; j++) {
            if (
              !seats[j] &&
              remainingSeats > 0 &&
              data.availableSeats.includes(j + 1)
            ) {
              seatsBookedTemp.push(j + 1);
              remainingSeats--;
            }
          }
        }
      }

      // If there are still remaining seats to be booked, show an error
      if (remainingSeats > 0) {
        setError("Not enough adjacent seats available.");
        return;
      }

      // Optimistic UI update: Update seats immediately before booking
      setSeats((prev) =>
        prev.map((booked, index) =>
          seatsBookedTemp.includes(index + 1) ? true : booked
        )
      );

      // Send booking request to API
      const bookingRes = await fetch("/api/booking", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seatsBooked: seatsBookedTemp, action: "book" }),
      });

      const bookingData = await bookingRes.json();

      if (!bookingData.ok) {
        setError(bookingData.error);
        return;
      }

      setError(null); // Clear any error messages after successful booking
    } catch (err) {
      setError("Failed to book seats. Try again.");
    }
  };

  const resetSeats = async () => {
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();

      if (res.ok) {
        setSeats(Array(totalSeats).fill(false));
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to reset seats. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-justify-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Ticket Booking</h1>

      <div className="flex flex-col justify-evenly items-center lg:flex-row gap-6">
        {/* Seats Grid */}
        <div>
          <div className="grid grid-cols-7 gap-2">
            {seats.map((booked, index) => (
              <div
                key={index}
                className={`h-10 w-10 flex justify-center items-center rounded cursor-pointer ${
                  booked ? "bg-yellow-500" : "bg-green-500"
                } `}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center flex gap-x-4">
            <p className="flex justify-center items-center rounded bg-yellow-500 p-3">Booked Seats = {seats.filter((seat) => seat).length}</p>
            <p className="flex justify-center items-center rounded bg-green-500 p-3">Available Seats = {seats.filter((seat) => !seat).length}</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="w-full lg:w-1/3 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">
            <div className="flex space-x-2">
              <p className="mr-1">Book Seats</p>
              {seatsBooked.map((seat, index) => (
                <div
                  key={index}
                  className="h-10 w-10 flex justify-center items-center rounded bg-yellow-500 "
                >
                  {seat}
                </div>
              ))}
            </div>
          </h2>
          <div className="flex items-center mb-4">
            <input
              type="number"
              value={numSeats}
              onChange={(e) => setNumSeats(parseInt(e.target.value, 10))}
              placeholder="Enter number of seats"
              className="w-full border border-gray-300 rounded px-3 py-2 mr-2"
            />
            <button
              onClick={bookSeats}
              className="w-20 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Book
            </button>
          </div>

          <button
            onClick={resetSeats}
            className="w-full bg-blue-500 text-white py-2 rounded mt-2 hover:bg-red-600"
          >
            Reset Booking
          </button>

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
