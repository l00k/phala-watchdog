import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { StakePoolIssueCrawlerState } from '#/Stats/Domain/Model/AppState/StakePoolIssueCrawlerState';
import { CommissionChange, Contribution, Event, EventType, Slash } from '#/Stats/Domain/Model/Event';
import { Issue } from '#/Stats/Domain/Model/Issue';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Inject, Injectable } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Timeout } from '@inti5/utils/Timeout';
import moment from 'moment';


@Injectable({ tag: 'tasker.handler' })
export class StakePoolIssuesCrawler
    extends AbstractCrawler
{
    
    protected static readonly NEW_STAKEPOOL_THRESHOLD = 7;
    protected static readonly BAD_BEHAVIOR_DAY_THRESHOLD = 2;
    protected static readonly BAD_BEHAVIOR_PERCENT_THRESHOLD = 0.1;
    protected static readonly MEANINGFUL_STAKE_RATIO = 0.1;
    
    
    @Inject({ ctorArgs: [ StakePoolIssuesCrawler.name ] })
    protected _logger : Logger;
    
    protected _appStateClass : any = StakePoolIssueCrawlerState;
    protected _appState : AppState<StakePoolIssueCrawlerState>;
    
    
    @Task({
        cronExpr: '40 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async run ()
    {
        return super.run();
    }
    
    protected async _process ()
    {
        await this._findBadBahaviours();
        
        // todo ld 2022-03-07 22:34:26
        // await this.findSlashes();
    }
    
    protected async _findBadBahaviours ()
    {
        this._entityManager = this._entityManagerWrapper.getDirectEntityManager();
        
        const issueRepository = this._entityManager.getRepository(Issue);
        const eventRepository = this._entityManager.getRepository(Event);
        
        // get bad behavour issue
        const badBehaviorIssue = await issueRepository.findOne(Issue.BAD_BEHAVIOR_ID);
        
        // fetch change commission events
        const commissionEvents : Event<CommissionChange>[] = await eventRepository.find(
            {
                type: { $eq: EventType.CommissionChange },
                blockNumber: { $gt: this._appState.value.badBehaviorLastBlock },
                additionalData: {
                    delta: { $gte: StakePoolIssuesCrawler.BAD_BEHAVIOR_PERCENT_THRESHOLD }
                }
            },
            [ 'stakePool' ]
        );
        if (!commissionEvents.length) {
            return;
        }
        
        // fetch contribution and change commission events
        const blockHash : string = (await this._phalaApi.rpc.chain.getBlockHash(this._appState.value.badBehaviorLastBlock)).toString();
        const blockDateUts : number = <any>(await this._phalaApi.query.timestamp.now.at(blockHash)).toJSON();
        
        const aboveDate = moment(blockDateUts).subtract(StakePoolIssuesCrawler.BAD_BEHAVIOR_DAY_THRESHOLD).toDate();
        const contributionEvents : Event<Contribution>[] = await eventRepository.find(
            {
                type: { $eq: EventType.Contribution },
                blockDate: { $gt: aboveDate }
            }
        );
        
        for (const commissionEvent of commissionEvents) {
            const stakePoolEntry = commissionEvent.stakePoolEntry;
            
            const createDeltaTime = moment(commissionEvent.blockDate).diff(stakePoolEntry.createdAt, 'day', true);
            if (createDeltaTime <= StakePoolIssuesCrawler.NEW_STAKEPOOL_THRESHOLD) {
                // it is new pool - skip this case
                continue;
            }
            
            const recentContribution = contributionEvents.find(contributionEvent => {
                if (contributionEvent.stakePoolEntry.id != stakePoolEntry.id) {
                    return false;
                }
                
                if (contributionEvent.sourceAccount.id != stakePoolEntry.stakePool.owner.id) {
                    return false;
                }
                
                if (contributionEvent.blockNumber > commissionEvent.blockNumber) {
                    return false;
                }
                
                const deltaTime = moment(commissionEvent.blockDate).diff(contributionEvent.blockDate, 'day', true);
                if (deltaTime > StakePoolIssuesCrawler.BAD_BEHAVIOR_DAY_THRESHOLD) {
                    return false;
                }
                
                const ratio = contributionEvent.amount / stakePoolEntry.lastHistoryEntry.stakeTotal;
                if (ratio < StakePoolIssuesCrawler.MEANINGFUL_STAKE_RATIO) {
                    return false;
                }
                
                return true;
            });
            
            if (recentContribution) {
                const badBehaviorEvent = new Event({
                    stakePoolEntry: stakePoolEntry,
                    blockNumber: commissionEvent.blockNumber,
                    blockDate: commissionEvent.blockDate,
                    type: EventType.BadBehavior,
                    additionalData: {}
                }, this._entityManager);
                
                this._entityManager.persist(badBehaviorEvent);
                
                // mark stakepool
                await stakePoolEntry.issues.loadItems();
                if (!stakePoolEntry.issues.contains(badBehaviorIssue)) {
                    stakePoolEntry.issues.add(badBehaviorIssue);
                }
            }
            
            this._appState.value.badBehaviorLastBlock = commissionEvent.blockNumber;
            this._entityManager.persist(this._appState);
        }
        
        await this._entityManager.flush();
    }
    
    protected async _findSlashes ()
    {
        this._entityManager = this._entityManagerWrapper.getDirectEntityManager();
        
        const issueRepository = this._entityManager.getRepository(Issue);
        const eventRepository = this._entityManager.getRepository(Event);
        
        // get slash issue
        const slashedIssue = await issueRepository.findOne(Issue.SLASHED_ID);
        
        // fetch change commission events
        const slashEvents : Event<Slash>[] = await eventRepository.find(
            {
                type: { $eq: EventType.Slash },
                blockNumber: { $gt: this._appState.value.slashesLastBlock },
            },
            [ 'stakePool' ]
        );
        if (!slashEvents.length) {
            return;
        }
        
        for (const slashEvent of slashEvents) {
            const stakePool = slashEvent.stakePoolEntry;
            
            // mark stakepool
            await stakePool.issues.loadItems();
            if (!stakePool.issues.contains(slashedIssue)) {
                stakePool.issues.add(slashedIssue);
            }
            
            this._appState.value.slashesLastBlock = slashEvent.blockNumber;
            this._entityManager.persist(this._appState);
        }
        
        await this._entityManager.flush();
    }
    
}