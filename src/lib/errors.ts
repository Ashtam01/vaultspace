export class AppError extends Error {
  public statusCode: number
  
  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Missing Permission") {
    super(message, 403)
    this.name = "AuthorizationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Not authenticated") {
    super(message, 401)
    this.name = "AuthenticationError"
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed") {
    super(message, 400)
    this.name = "ValidationError"
  }
}
