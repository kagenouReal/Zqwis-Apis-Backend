import { NextResponse } from "next/server";
import { message } from "@/system/lib/responses";

// Wraps an API route handler with try-catch and logging
export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { status: false, message: message.api.serverError },
        { status: 500 }
      );
    }
  };
}
