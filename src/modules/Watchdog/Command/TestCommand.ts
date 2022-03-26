import { TelegramConfig } from '#/Messaging/Domain/types';
import { DependencyInjection } from '@inti5/object-manager';
import * as CLI from 'classy-commander';
import { Config } from '@inti5/configuration';
import { Telegram } from 'telegraf';


@CLI.command('test', Object, 'Test')
@DependencyInjection()
export class DumpCommand
    implements CLI.Command<Object>
{
    
    @Config('module.messaging.telegram')
    protected _telegramConfig : TelegramConfig;
    
    public async execute () : Promise<void>
    {
    
    }
    
    
}
