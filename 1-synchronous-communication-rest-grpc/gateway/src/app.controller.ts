/**
 * Controller REST Gateway — nhận HTTP request, chuyển tiếp sang gRPC backend.
 * (EN: REST Gateway Controller — receives HTTP requests, forwards to gRPC backends.)
 */
import {
    Controller,
    Get,
    Inject,
    Logger,
    NotFoundException,
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
interface UserGrpc {
    /**
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
interface ProductGrpc {
    /**
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
@Controller()
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
        // Resolve stub UserService từ proto — phải gọi đúng tên package/service.
        // (EN: Resolve UserService stub from proto — must match package/service name exactly.)
        this.userSvc = this.userClient.getService<UserGrpc>("UserService")
        // Resolve stub ProductService từ proto.
        // (EN: Resolve ProductService stub from proto.)
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
        // +id: ép kiểu string path param sang number vì proto dùng int32.
        // (EN: +id: coerce string path param to number because proto uses int32.)
        const user = await firstValueFrom(this.userSvc.getUser({ id: +id }))
        // Sentinel id:0 = không tìm thấy — map sang HTTP 404 thay vì trả 200 rỗng.
        // (EN: Sentinel id:0 = not found — map to HTTP 404 instead of empty 200.)
        if (!user.id) {
            throw new NotFoundException(`User ${id} not found`)
        }
        return user
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
        // +id: ép kiểu string path param sang number.
        // (EN: +id: coerce string path param to number.)
        const product = await firstValueFrom(this.productSvc.getProduct({ id: +id }))
        // Sentinel id:0 = không tìm thấy — map sang HTTP 404.
        // (EN: Sentinel id:0 = not found — map to HTTP 404.)
        if (!product.id) {
            throw new NotFoundException(`Product ${id} not found`)
        }
        return product
    }
}
