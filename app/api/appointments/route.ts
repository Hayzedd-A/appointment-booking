import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Settings from "@/models/Settings";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const admin = searchParams.get("admin"); // Check if admin request

    if (admin === "true") {
      // Admin can get all appointments
      const appointments = await Appointment.find().sort({ dateTime: 1 });
      return NextResponse.json(appointments);
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    const settings = await Settings.findOne();
    if (!settings) {
      return NextResponse.json(
        { error: "Settings not configured" },
        { status: 500 },
      );
    }

    const selectedDate = new Date(date);
    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(selectedDate).toLowerCase();
    console.log("The day of the weeK ", dayOfWeek);
    if (!settings.workingDays.includes(dayOfWeek)) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Get booked appointments for the day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      dateTime: { $gte: startOfDay, $lt: endOfDay },
    });

    const bookedTimes = bookedAppointments.map((apt) => {
      const time = new Date(apt.dateTime);
      return `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`;
    });

    // Generate available slots
    const [startHour, startMinute] = settings.startTime.split(":").map(Number);
    const [endHour, endMinute] = settings.endTime.split(":").map(Number);

    const availableSlots: string[] = [];
    let currentTime = startHour * 60 + startMinute;

    while (currentTime < endHour * 60 + endMinute) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

      if (!bookedTimes.includes(timeStr)) {
        availableSlots.push(timeStr);
      }

      currentTime += settings.sessionDuration;
    }

    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, phone, extraInfo, type, address, dateTime, sessions } = body;

    // Basic validation
    if (!name || !phone || !type || !dateTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (type === "accommodate" && !address) {
      return NextResponse.json(
        { error: "Address is required for accommodate type" },
        { status: 400 },
      );
    }

    // Check availability
    const settings = await Settings.findOne();
    if (!settings) {
      return NextResponse.json(
        { error: "Settings not configured" },
        { status: 500 },
      );
    }

    const appointmentDate = new Date(dateTime);

    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(appointmentDate).toLowerCase();

    if (!settings.workingDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "Selected day is not a working day" },
        { status: 400 },
      );
    }

    const [startHour, startMinute] = settings.startTime.split(":").map(Number);
    const [endHour, endMinute] = settings.endTime.split(":").map(Number);
    const appointmentHour = appointmentDate.getHours();
    const appointmentMinute = appointmentDate.getMinutes();

    const appointmentTime = appointmentHour * 60 + appointmentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (appointmentTime < startTime || appointmentTime >= endTime) {
      return NextResponse.json(
        { error: "Appointment time is outside working hours" },
        { status: 400 },
      );
    }

    // Check for conflicts
    const appointmentEndTime = new Date(
      appointmentDate.getTime() + sessions * settings.sessionDuration * 60000,
    );
    const conflictingAppointments = await Appointment.find({
      dateTime: {
        $lt: appointmentEndTime,
        $gte: appointmentDate,
      },
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: "Time slot is already booked" },
        { status: 400 },
      );
    }

    const appointment = new Appointment({
      name,
      phone,
      extraInfo,
      type,
      address: type === "accommodate" ? address : undefined,
      dateTime: appointmentDate,
      sessions,
    });

    await appointment.save();
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}
