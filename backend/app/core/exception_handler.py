"""
全局异常处理中间件
捕获所有未处理的异常并记录日志
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError

async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    import traceback
    import sys
    
    # 获取异常堆栈跟踪 - 使用 exc_info 参数
    try:
        # 方式1: 使用 traceback.format_exception 获取完整堆栈
        exc_type, exc_value, exc_tb = type(exc), exc, exc.__traceback__
        if exc_tb:
            error_trace = ''.join(traceback.format_exception(exc_type, exc_value, exc_tb))
        else:
            error_trace = f"{type(exc).__name__}: {str(exc)}\n(无堆栈跟踪信息)"
    except Exception as e:
        error_trace = f"无法获取堆栈跟踪: {str(e)}\n异常信息: {type(exc).__name__}: {str(exc)}"
    
    # 强制输出到控制台 - 使用多种方式确保能看到
    error_info = f"""
{'='*80}
【全局异常处理器】捕获到错误:
路径: {request.method} {request.url.path}
查询参数: {dict(request.query_params)}
错误类型: {type(exc).__name__}
错误消息: {str(exc)}

完整堆栈跟踪:
{error_trace}
{'='*80}
"""
    
    # 方式1: 直接写入 stderr
    try:
        sys.stderr.write(error_info)
        sys.stderr.flush()
    except:
        pass
    
    # 方式2: print 到 stdout
    try:
        print(error_info, flush=True)
    except:
        pass
    
    # 方式3: print 到 stderr
    try:
        print(error_info, file=sys.stderr, flush=True)
    except:
        pass
    
    # 方式4: 使用 traceback.print_exc 直接打印
    try:
        print(f"\n{'='*80}", flush=True)
        print(f"【全局异常处理器 - traceback.print_exc】", flush=True)
        print(f"路径: {request.method} {request.url.path}", flush=True)
        traceback.print_exc(file=sys.stderr)
        traceback.print_exc()
        print(f"{'='*80}\n", flush=True)
    except:
        pass
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "服务器内部错误，请稍后重试",
            "error_type": type(exc).__name__
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求验证异常处理器"""
    import sys
    
    errors = exc.errors()
    error_messages = [f"{err['loc']}: {err['msg']}" for err in errors]
    
    # 输出到控制台
    print(f"\n{'='*80}", file=sys.stderr, flush=True)
    print(f"【请求验证异常】捕获到错误:", file=sys.stderr, flush=True)
    print(f"路径: {request.method} {request.url.path}", file=sys.stderr, flush=True)
    print(f"错误详情: {error_messages}", file=sys.stderr, flush=True)
    print(f"完整错误信息: {errors}", file=sys.stderr, flush=True)
    print(f"{'='*80}\n", file=sys.stderr, flush=True)
    
    # 同时输出到stdout
    print(f"\n{'='*80}", flush=True)
    print(f"【请求验证异常】捕获到错误:", flush=True)
    print(f"路径: {request.method} {request.url.path}", flush=True)
    print(f"错误详情: {error_messages}", flush=True)
    print(f"完整错误信息: {errors}", flush=True)
    print(f"{'='*80}\n", flush=True)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors}
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP异常处理器"""
    import sys
    
    # 输出到控制台（400以上状态码才输出）
    if exc.status_code >= 400:
        print(f"\n{'='*80}", file=sys.stderr, flush=True)
        print(f"【HTTP异常】捕获到错误:", file=sys.stderr, flush=True)
        print(f"路径: {request.method} {request.url.path}", file=sys.stderr, flush=True)
        print(f"状态码: {exc.status_code}", file=sys.stderr, flush=True)
        print(f"错误详情: {exc.detail}", file=sys.stderr, flush=True)
        print(f"{'='*80}\n", file=sys.stderr, flush=True)
        
        # 同时输出到stdout
        print(f"\n{'='*80}", flush=True)
        print(f"【HTTP异常】捕获到错误:", flush=True)
        print(f"路径: {request.method} {request.url.path}", flush=True)
        print(f"状态码: {exc.status_code}", flush=True)
        print(f"错误详情: {exc.detail}", flush=True)
        print(f"{'='*80}\n", flush=True)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """数据库异常处理器"""
    import traceback
    import sys
    
    error_trace = traceback.format_exc()
    
    # 强制输出到控制台
    print(f"\n{'='*80}", file=sys.stderr, flush=True)
    print(f"【数据库异常处理器】捕获到错误:", file=sys.stderr, flush=True)
    print(f"路径: {request.method} {request.url.path}", file=sys.stderr, flush=True)
    print(f"错误类型: {type(exc).__name__}", file=sys.stderr, flush=True)
    print(f"错误消息: {str(exc)}", file=sys.stderr, flush=True)
    print(f"\n完整堆栈跟踪:", file=sys.stderr, flush=True)
    print(error_trace, file=sys.stderr, flush=True)
    print(f"{'='*80}\n", file=sys.stderr, flush=True)
    
    # 同时输出到stdout
    print(f"\n{'='*80}", flush=True)
    print(f"【数据库异常处理器】捕获到错误:", flush=True)
    print(f"路径: {request.method} {request.url.path}", flush=True)
    print(f"错误类型: {type(exc).__name__}", flush=True)
    print(f"错误消息: {str(exc)}", flush=True)
    print(f"\n完整堆栈跟踪:", flush=True)
    print(error_trace, flush=True)
    print(f"{'='*80}\n", flush=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "数据库操作失败，请稍后重试"}
    )
