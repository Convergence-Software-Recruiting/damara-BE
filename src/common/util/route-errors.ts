import type { Response } from "express";
import HttpStatusCodes from "../constants/HttpStatusCodes";


/******************************************************************************
                                 Classes
******************************************************************************/

/**
 * Error with status code and message.
 */
export class RouteError extends Error {
  public status: HttpStatusCodes;

  public constructor(status: HttpStatusCodes, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Handle validation errors.
 * Note: Currently using RouteError directly in parseReq, but keeping this for compatibility.
 */
export class ValidationError extends RouteError {

  public static MESSAGE = 'The validation function discovered one or ' + 
    'more errors.';

  public constructor(errors: unknown[]) {
    const msg = JSON.stringify({
      message: ValidationError.MESSAGE,
      errors,
    });
    super(HttpStatusCodes.BAD_REQUEST, msg);
  }
}

/**
 * Email already exists error (PostgreSQL unique constraint violation).
 */
export class EmailAlreadyExistsError extends RouteError {
  public static MESSAGE = 'EMAIL_ALREADY_EXISTS';

  public constructor() {
    super(HttpStatusCodes.CONFLICT, EmailAlreadyExistsError.MESSAGE);
  }
}

/**
 * Invalid credentials error (wrong studentId or password).
 */
export class InvalidCredentialsError extends RouteError {
  public static MESSAGE = 'INVALID_CREDENTIALS';

  public constructor() {
    super(HttpStatusCodes.UNAUTHORIZED, InvalidCredentialsError.MESSAGE);
  }
}

/**
 * Student ID already exists error.
 */
export class StudentIdAlreadyExistsError extends RouteError {
  public static MESSAGE = 'STUDENT_ID_ALREADY_EXISTS';

  public constructor() {
    super(HttpStatusCodes.CONFLICT, StudentIdAlreadyExistsError.MESSAGE);
  }
}

export type ErrorResponseBody = {
  error: string;
  message: string;
  details: Record<string, unknown>;
};

export function buildErrorResponse(
  error: string,
  message = error,
  details: Record<string, unknown> = {}
): ErrorResponseBody {
  return {
    error,
    message,
    details,
  };
}

export function sendErrorResponse(
  res: Response,
  status: HttpStatusCodes,
  error: string,
  message = error,
  details: Record<string, unknown> = {}
) {
  return res.status(status).json(buildErrorResponse(error, message, details));
}
