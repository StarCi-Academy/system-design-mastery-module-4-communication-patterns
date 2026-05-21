/**
 * Controller REST Gateway — nhận HTTP request, chuyển tiếp sang gRPC backend.
 * (EN: REST Gateway Controller — receives HTTP requests, forwards to gRPC backends.)
 */
import {
    Controller,
    Get,
    Inject,
    Logger,
    OnModuleInit,
    Param,
} from "@nestjs/common"
import {
    ClientGrpc,
} from "@nestjs/microservices"
import {
    firstValueFrom,
    Observable,
} from "rxjs"

/**
 * Interface gRPC User — khớp `user.proto` service definition.
 * (EN: gRPC User interface — matches `user.proto` service definition.)
 */
interface UserGrpc {/**
 * Logic — Đọc/truy vấn dữ liệu qua `getUser`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getUser`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getUser(data: { id: number }): Observable<{ id: number; name: string; email: string }>
}

/**
 * Interface gRPC Product — khớp `product.proto` service definition.
 * (EN: gRPC Product interface — matches `product.proto` service definition.)
 */
interface ProductGrpc {/**
 * Logic — Đọc/truy vấn dữ liệu qua `getProduct`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getProduct`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getProduct(data: { id: number }): Observable<{ id: number; name: string; price: number }>
}

/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
export class AppController implements OnModuleInit {
    private readonly logger = new Logger(AppController.name)
    private userSvc!: UserGrpc
    private productSvc!: ProductGrpc

    constructor(
        @Inject("USER_SERVICE") private readonly userClient: ClientGrpc,
        @Inject("PRODUCT_SERVICE") private readonly productClient: ClientGrpc,
    ) {}

    /**
     * Logic — lấy gRPC stub từ client khi module khởi tạo.
     * Code — gọi `getService()` theo đúng tên service trong proto.
     * (EN Logic: Gets gRPC stubs from clients when module initializes.)
     * (EN Code: Calls `getService()` matching the service name in proto.)
     */
    onModuleInit() {
        this.userSvc = this.userClient.getService<UserGrpc>("UserService")
        this.productSvc = this.productClient.getService<ProductGrpc>("ProductService")
    }

    /**
     * Logic — client gọi REST `GET /users/:id`, gateway chuyển sang gRPC `GetUser`.
     * Code — `firstValueFrom` chuyển Observable gRPC thành Promise cho REST response.
     * (EN Logic: Client calls REST `GET /users/:id`, gateway forwards to gRPC `GetUser`.)
     * (EN Code: `firstValueFrom` converts gRPC Observable to Promise for REST response.)
     */
    @Get("users/:id")
    async getUser(@Param("id") id: string) {
        this.logger.log(`REST → gRPC: GetUser id=${id}`)
        return firstValueFrom(this.userSvc.getUser({ id: +id }))
    }

    /**
     * Logic — client gọi REST `GET /products/:id`, gateway chuyển sang gRPC `GetProduct`.
     * Code — tương tự `getUser`, chuyển tiếp sang Product gRPC backend.
     * (EN Logic: Client calls REST `GET /products/:id`, gateway forwards to gRPC `GetProduct`.)
     * (EN Code: Same as `getUser`, forwards to Product gRPC backend.)
     */
    @Get("products/:id")
    async getProduct(@Param("id") id: string) {
        this.logger.log(`REST → gRPC: GetProduct id=${id}`)
        return firstValueFrom(this.productSvc.getProduct({ id: +id }))
    }
}
