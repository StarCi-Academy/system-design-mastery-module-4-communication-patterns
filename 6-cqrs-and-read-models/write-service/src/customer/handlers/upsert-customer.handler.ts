import { Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    UpsertCustomerCommand,
} from "../commands"
import {
    Customer,
} from "../../entities"
import {
    CustomerProfileUpdatedEvent,
} from "../events"

@CommandHandler(UpsertCustomerCommand)
export class UpsertCustomerHandler
  implements ICommandHandler<UpsertCustomerCommand, Customer>
{
  private readonly logger = new Logger(UpsertCustomerHandler.name);

  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpsertCustomerCommand): Promise<Customer> {
    let row = await this.repo.findOne({ where: { id: command.id } });
    if (!row) {
      row = this.repo.create({
        id: command.id,
        name: command.name,
        email: command.email,
      });
      this.logger.log(`Created new customer profile for ID "${command.id}"`);
    } else {
      row.name = command.name;
      row.email = command.email;
      this.logger.log(`Updated existing customer profile for ID "${command.id}"`);
    }
    await this.repo.save(row);
    
    this.logger.log(`Publishing CustomerProfileUpdatedEvent for ID "${command.id}" to EventBus`);
    await this.eventBus.publish(
      new CustomerProfileUpdatedEvent(command.id, command.name, command.email),
    );
    return row;
  }
}
