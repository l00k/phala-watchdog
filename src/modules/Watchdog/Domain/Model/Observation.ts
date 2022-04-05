import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account, StakePool } from '#/Phala/Domain/Model';
import { ObservationConfiguration } from '#/Watchdog/Domain/Model/Observation/ObservationConfiguration';
import {
    NotificationType,
    ObservationNotifications
} from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { User } from '#/Watchdog/Domain/Model/User';
import { Annotation as API } from '@inti5/api-backend';
import { Assert } from '@inti5/validator/Object';
import * as ORM from '@mikro-orm/core';
import { EntityData } from '@mikro-orm/core/typings';
import { EntityManager } from '@mikro-orm/mysql';
import * as Trans from 'class-transformer';



export enum ObservationMode
{
    Owner = 'owner',
    Delegator = 'delegator',
}


@ORM.Entity({
    tableName: 'watchdog_observation'
})
@API.Resource('Watchdog/Observation')
export class Observation
    extends AbstractModel<Observation>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.ManyToOne(() => User, { eager: true })
    public user : User;
    
    @ORM.ManyToOne(() => StakePool, { eager: true })
    @API.Property(() => StakePool)
    public stakePool : StakePool;
    
    @ORM.ManyToOne(() => Account, { nullable: true, eager: true })
    @API.Property(() => Account)
    public account : Account;
    
    @ORM.Enum({ items: () => ObservationMode, nullable: true })
    @API.Property()
    @Assert()
    public mode : ObservationMode;
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => ObservationConfiguration)
    public config : ObservationConfiguration = new ObservationConfiguration();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => ObservationNotifications)
    public lastNotifications : ObservationNotifications = new ObservationNotifications();
    
    
    public constructor (data? : EntityData<Observation>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
    public getConfig<K extends keyof ObservationConfiguration> (key : K) : ObservationConfiguration[K]
    {
        if (this.config[key] === undefined) {
            this.config = Trans.plainToClassFromExist(new ObservationConfiguration(), this.config);
        }
        
        return this.config[key];
    }
    
    public getLastNotification (notificationType : NotificationType) : number
    {
        return this.lastNotifications[notificationType];
    }
    
    public updateLastNotification (notificationType : NotificationType)
    {
        this.lastNotifications[notificationType] = Date.now();
    }
    
}