/**
 * Defines reusable HTTP error classes for backend services.
 * Services throw these typed errors so controllers can map failures to clear responses.
 */

export class NotFoundError extends Error {
  constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
}
export class ConflictError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ConflictError'; }
}
export class BadRequestError extends Error {
  constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
}
export class ForbiddenError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ForbiddenError'; }
}