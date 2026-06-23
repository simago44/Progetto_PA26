// factory/errorFactory.ts
import * as Message from "./messageStrings.ts";

export class AppError extends Error {
    status: number;

    constructor(status: number, msg: string, name: string) {
        super(msg);
        this.name = name
        this.status = status
    }
}

export const ErrorEnum = {
    MissingToken: 0,
    InvalidToken: 1,
    RouteNotFound: 2,
    NoAuthHeader: 3,
    NoPayloadHeader: 4,
    MalformedPayload: 5,
    UserNotFound: 6,
    BadRequest: 7,
    Unauthorized: 8,
    Forbidden: 9,
    NotFound: 10,
    InternalServer: 11,
    ServiceUnavailable: 12
} as const;
export type ErrorEnum = typeof ErrorEnum[keyof typeof ErrorEnum];

const errorMap: Record<ErrorEnum, { status: number; msg: string; name: string }> = {
    [ErrorEnum.MissingToken]: { status: 400, msg: Message.missingToken_message, name: "MissingTokenError" },
    [ErrorEnum.InvalidToken]: { status: 401, msg: Message.invalidToken_message, name: "InvalidTokenError" },
    [ErrorEnum.RouteNotFound]: { status: 404, msg: Message.routeNotFound_message, name: "RouteNotFoundError" },
    [ErrorEnum.NoAuthHeader]: { status: 400, msg: Message.noAuthHeader_message, name: "NoAuthHeaderError" },
    [ErrorEnum.NoPayloadHeader]: { status: 400, msg: Message.noPayloadHeader_message, name: "NoPayloadHeaderError" },
    [ErrorEnum.MalformedPayload]: { status: 400, msg: Message.malformedPayload_message, name: "MalformedPayloadError" },
    [ErrorEnum.UserNotFound]: { status: 404, msg: Message.userNotFound_message, name: "UserNotFoundError" },
    [ErrorEnum.BadRequest]: { status: 400, msg: Message.badRequest_message, name: "BadRequestError" },
    [ErrorEnum.Unauthorized]: { status: 401, msg: Message.unauthorized_message, name: "UnauthorizedError" },
    [ErrorEnum.Forbidden]: { status: 403, msg: Message.forbidden_message, name: "ForbiddenError" },
    [ErrorEnum.NotFound]: { status: 404, msg: Message.notFound_message, name: "NotFoundError" },
    [ErrorEnum.InternalServer]: { status: 500, msg: Message.internalServerError_message, name: "InternalServerError" },
    [ErrorEnum.ServiceUnavailable]: { status: 503, msg: Message.serviceUnavailable_message, name: "ServiceUnavailableError" },
};

export function createError(type: ErrorEnum): AppError {
    const { status, msg, name } = errorMap[type];
    const err = new AppError(status, msg, name);
    return err;
}

export function getErrorHTTPStatus(type: ErrorEnum): number {
    return errorMap[type].status
}

export function getErrorName(type: ErrorEnum): string {
    return errorMap[type].name
}