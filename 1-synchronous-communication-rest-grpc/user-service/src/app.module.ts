/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc — đăng ký controller và service cho User gRPC Service.
 * (EN: Root module — registers controller and service for User gRPC Service.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    AppController,
} from "./app.controller"
import {
    AppService,
} from "./app.service"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),],
    controllers: [AppController],
    providers: [AppService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
