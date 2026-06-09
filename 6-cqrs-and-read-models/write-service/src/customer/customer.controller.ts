/**
 * HTTP controller — Command side. POST /customer/update dispatches an
 * UpsertCustomerCommand on the CQRS CommandBus.
 * (VI: Controller phía ghi — POST /customer/update đẩy UpsertCustomerCommand lên CommandBus.)
 */
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UpsertCustomerCommand } from './commands';

@Controller('customer')
/**
 * Class `CustomerController` — thành phần lab (controller/service/module).
 * (EN: Class `CustomerController` — lesson lab component.)
 */
export class CustomerController {
    private readonly logger = new Logger(CustomerController.name);

    constructor(private readonly commandBus: CommandBus) {}

    @Post('update')
    async update(
        @Body() body: { id: string; name: string; email: string },
    ): Promise<unknown> {
        this.logger.log(`Received update request for customer "${body.id}"`);
        return this.commandBus.execute(
            new UpsertCustomerCommand(body.id, body.name, body.email),
        );
    }
}
