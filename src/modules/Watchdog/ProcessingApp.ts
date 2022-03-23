import { AbstractApp } from '#/AppBackend/Module/AbstractApp';
import { CrawlerService } from '#/Watchdog/Service/Crawler/CrawlerService';
import { ObjectManager } from '@inti5/object-manager';
import { TaskerService } from '#/AppBackend/Service/Tasker/TaskerService';


export class ProcessingApp
    extends AbstractApp
{

    protected async main ()
    {
        const objectManager = ObjectManager.getSingleton();

        const crawler = objectManager.getInstance(CrawlerService);
        await crawler.run();

        const tasker = objectManager.getInstance(TaskerService);
        await tasker.run();
    }

}