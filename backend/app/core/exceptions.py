from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AuthenticationError(Exception):
    def __init__(self, detail: str = "Invalid credentials"):
        self.detail = detail


class AuthorizationError(Exception):
    def __init__(self, detail: str = "Not authorized"):
        self.detail = detail


class NotFoundError(Exception):
    def __init__(self, detail: str = "Resource not found"):
        self.detail = detail


class ConflictError(Exception):
    def __init__(self, detail: str = "Resource already exists"):
        self.detail = detail


class ValidationError(Exception):
    def __init__(self, detail: str = "Validation failed"):
        self.detail = detail


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(
        request: Request, exc: AuthenticationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=401,
            content={"detail": exc.detail},
        )

    @app.exception_handler(AuthorizationError)
    async def authorization_error_handler(
        request: Request, exc: AuthorizationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=403,
            content={"detail": exc.detail},
        )

    @app.exception_handler(NotFoundError)
    async def not_found_error_handler(
        request: Request, exc: NotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"detail": exc.detail},
        )

    @app.exception_handler(ConflictError)
    async def conflict_error_handler(
        request: Request, exc: ConflictError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=409,
            content={"detail": exc.detail},
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": exc.detail},
        )
