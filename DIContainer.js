/**
 * 简单的依赖注入容器
 * 减少全局变量依赖，提升代码可测试性
 */
export class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        console.log('🔧 依赖注入容器初始化');
    }

    /**
     * 注册服务
     */
    register(name, factory, options = {}) {
        this.services.set(name, {
            factory,
            singleton: options.singleton || false
        });
    }

    /**
     * 获取服务实例
     */
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`服务 "${name}" 未注册`);
        }

        // 单例模式
        if (service.singleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, service.factory(this));
            }
            return this.singletons.get(name);
        }

        // 每次创建新实例
        return service.factory(this);
    }

    /**
     * 检查服务是否已注册
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * 清理容器
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}

/**
 * 改进的错误处理器
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalErrorHandling();
        console.log('🔧 错误处理器初始化');
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError('全局错误', event.error || event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('未处理的Promise拒绝', event.reason);
            event.preventDefault(); // 防止控制台输出
        });
    }

    /**
     * 记录错误
     */
    logError(category, error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            category,
            message: error?.message || error,
            stack: error?.stack,
            context,
            id: Math.random().toString(36).substr(2, 9)
        };

        this.errorLog.push(errorEntry);
        
        // 限制日志大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // 控制台输出（开发模式）
        try {
            var isProd = (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV === 'production');
            if (!isProd) {
                console.error(`[${category}]`, error, context);
            }
        } catch (e) {
            // 在浏览器环境下没有 process，直接安全打印
            console.error(`[${category}]`, error, context);
        }

        // 触发错误事件
        window.dispatchEvent(new CustomEvent('applicationError', {
            detail: errorEntry
        }));
    }

    /**
     * 安全执行函数
     */
    safeExecute(fn, errorCategory = '未知操作', fallback = null) {
        try {
            return fn();
        } catch (error) {
            this.logError(errorCategory, error);
            return fallback;
        }
    }

    /**
     * 异步安全执行
     */
    async safeExecuteAsync(fn, errorCategory = '异步操作', fallback = null) {
        try {
            return await fn();
        } catch (error) {
            this.logError(errorCategory, error);
            return fallback;
        }
    }

    /**
     * 获取错误日志
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * 清空错误日志
     */
    clearErrorLog() {
        this.errorLog = [];
    }
}

// 创建全局实例
export const container = new DIContainer();
export const errorHandler = new ErrorHandler();