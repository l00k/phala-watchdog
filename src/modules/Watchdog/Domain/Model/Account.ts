import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Annotation as API } from 'core/api-backend';



@ORM.Entity({
    tableName: 'watchdog_account'
})
@API.Resource('Watchdog/Account')
export class Account
    extends AbstractModel<Account>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    @API.Groups([
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    public id : number;
    
    
    @ORM.Property({ unique: true })
    @API.Property()
    @API.Groups([
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    public address : string;
    
    
    public constructor (data? : Partial<Account>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}
