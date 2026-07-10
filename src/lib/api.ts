import { NextResponse } from "next/server";
import { z } from "zod";

/** Error with an HTTP status; thrown by handlers, converted by withApi(). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Wraps a route handler with uniform error handling. Internal errors are
 * logged server-side and returned as an opaque 500 — no stack traces or
 * internals ever reach the client.
 */
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("[api] unhandled error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/** Parse + validate a JSON body against a Zod schema. 400 on any failure. */
export async function parseBody<Schema extends z.ZodType>(
  req: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    throw new ApiError(400, `Validation failed — ${detail}`);
  }
  return result.data;
}

export function json(data: unknown, init?: ResponseInit): Response {
  return NextResponse.json(data, init);
}

/**
 * 404 for resources that don't exist OR don't belong to the caller.
 * Using the same response for both prevents resource enumeration.
 */
export function notFound(): never {
  throw new ApiError(404, "Not found");
}
