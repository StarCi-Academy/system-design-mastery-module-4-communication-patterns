/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc Audit Subscriber — đăng ký controller và service.
 * (EN: Root Audit Subscriber module — registers controller and service.)
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
