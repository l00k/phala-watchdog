import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Account } from '#/Phala/Domain/Model';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import * as Polkadot from '#/Polkadot';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import validateJsExt from 'validate.js';


export class AccountController
    extends CrudController<Account>
{
    
    protected static readonly ENTITY = Account;
    
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    
    @API.CRUD.GetItem(() => Account, { path: '#PATH#/find/:address' })
    @API.Serialize('*')
    public async findAccountByAddress (
        @Router.Param('address')
        @Assert({
            custom: { method: address => Polkadot.Utility.isAddress(address, 30) }
        })
            address : string
    ) : Promise<Account>
    {
        return this._phalaEntityFetcher.getOrCreateAccount(address);
    }
    
}
