"""
采购管理系统 - FastAPI应用入口
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import sys
from app.core.config import settings
from app.core.exception_handler import (
    global_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    sqlalchemy_exception_handler
)

app = FastAPI(
    title="永业环境采购管理系统API",
    description="湖南永业环境科技有限公司 - 采购管理系统，提供BOM、供应商、报价、合同管理功能",
    version="1.0.0"
)

# 添加异常捕获中间件 - 确保所有异常都能被打印
class ExceptionLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # 在中间件中捕获异常并打印
            error_info = f"""
{'='*80}
【异常捕获中间件】捕获到未处理的异常:
路径: {request.method} {request.url.path}
查询参数: {dict(request.query_params)}
错误类型: {type(exc).__name__}
错误消息: {str(exc)}

完整堆栈跟踪:
"""
            print(error_info, flush=True)
            print(error_info, file=sys.stderr, flush=True)
            traceback.print_exc()
            traceback.print_exc(file=sys.stderr)
            print(f"{'='*80}\n", flush=True)
            # 重新抛出异常，让全局异常处理器处理
            raise

# 注册中间件 - 必须在异常处理器之前注册
app.add_middleware(ExceptionLoggingMiddleware)

# 注册全局异常处理器
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)

# CORS配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "永业环境采购管理系统API",
        "company": "湖南永业环境科技有限公司",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# 注册API路由
from app.api import auth, bom, quotation, supplier, contract, contract_template, user, material

app.include_router(auth.router, prefix="/api/v1")
app.include_router(bom.router, prefix="/api/v1")
app.include_router(quotation.router, prefix="/api/v1")
app.include_router(supplier.router, prefix="/api/v1")
app.include_router(material.router, prefix="/api/v1")
app.include_router(contract.router, prefix="/api/v1")
app.include_router(contract_template.router, prefix="/api/v1")
app.include_router(user.router, prefix="/api/v1")

