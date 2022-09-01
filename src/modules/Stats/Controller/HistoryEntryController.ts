import { CrudController } from '#/BackendCore/Controller/CrudController';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import * as Api from '@inti5/api-backend';
import { API } from '@inti5/api-backend';
import * as Router from '@inti5/express-router';
import * as ORM from '@mikro-orm/core';


@Router.Headers.CacheControl('public, max-age=900')
export class HistoryEntryController
    extends CrudController<HistoryEntry>
{
    
    protected static readonly ENTITY = HistoryEntry;
    
    @API.CRUD.GetCollection(
        () => HistoryEntry,
        { path: '#PATH#/by_stakepool/:id' }
    )
    @API.Serialize<Api.Domain.Collection<HistoryEntry>>({
        items: {
            snapshot: {
                date: true,
            },
            intermediateStep: true,
            commission: true,
            workersNum: true,
            workersActiveNum: true,
            stakeTotal: true,
            cap: true,
            stakeFree: true,
            stakeReleasing: true,
            stakeRemaining: true,
            withdrawals: true,
            currentApr: true,
            avgApr: true,
        },
        total: true,
    })
    public async getStakePoolHistoryCollection (
        @Router.Param.Id()
            id : number,
        @API.Pagination([ 200 ])
            pagination : Api.Domain.Pagination
    ) : Promise<Api.Domain.Collection<HistoryEntry>>
    {
        return super._getCollection(
            { stakePoolEntry: { id } },
            { snapshot: { id: ORM.QueryOrder.DESC } },
            pagination
        );
    }
    
}
