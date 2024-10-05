import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IUser } from "../../../entities/User";
import { kSolAddress } from "../../../services/solana/Constants";
import { HeliusManager } from "../../../services/solana/HeliusManager";
import { BotHelper, Message } from "./BotHelper";
import { HeliusAsset } from "../../../services/solana/HeliusTypes";
import { UserManager } from "../../UserManager";

export class BotSendHelper extends BotHelper {

    kMinSolForFees = 0.01;

    constructor() {
        console.log('BotSendHelper', 'constructor');

        const replyMessage: Message = {
            text: '',
        };

        super('send', replyMessage);
    }

    async commandReceived(ctx: any, user: IUser) {
        console.log('WALLET', 'commandReceived', 'user:', user, 'ctx:', ctx);

        const message = ctx.update.message.text;
        const parts = message.split(' ');
        if (parts[0] != '/send'){
            this.replyWithError(ctx, 'Unknown command');
            return;
        }
        if (parts[3] != 'to' && parts[3] != 'TO'){
            this.replyWithError(ctx, 'Unknown command');
            return;
        }

        const amount = parseFloat(parts[1]);
        let tokenStr = parts[2];
        let toUser = '' + parts[4];

        if (isNaN(amount)){
            this.replyWithError(ctx, 'Unknown command');
            return;
        }

        let toWalletAddress: string | undefined = undefined;
        if (toUser.startsWith('@')){
            //TODO: get address from our DB by username
            toWalletAddress = await UserManager.getUserWalletByTelegramUsername(toUser);
        }
        else {
            this.replyWithError(ctx, `You can only send to Telegram users. Example: "/send 1000 BONK to @heymike777"`);
            return;
        }

        console.log('!toWalletAddress:', toWalletAddress);

        // get token by tokenStr
        // check if I have enough tokens (and at least 0.01 SOL for fees)
        const assets = await HeliusManager.getAssetsByOwner(user.wallet.publicKey);
        console.log('assets:', JSON.stringify(assets));

        if (!assets.nativeBalance || assets.nativeBalance?.lamports < this.kMinSolForFees * LAMPORTS_PER_SOL){
            let error = `Not enough SOL for gas fees. You need at least ${this.kMinSolForFees} SOL on balance.`;
            if (assets.nativeBalance){
                error += `\n\nYou have ${assets.nativeBalance.lamports / LAMPORTS_PER_SOL} SOL`;
                error += `\n\nFund your TipMe wallet: ${user.wallet.publicKey}`;
            }
            this.replyWithError(ctx, error);
            return;
        }

        if (tokenStr.toUpperCase() == 'SOL'){
            tokenStr = 'SOL';

            if (assets.nativeBalance.lamports < (amount + this.kMinSolForFees) * LAMPORTS_PER_SOL){
                let error = `Not enough SOL. You need at least ${amount + this.kMinSolForFees} SOL on balance.`;
                if (assets.nativeBalance){
                    error += `\n\nYou have ${assets.nativeBalance.lamports / LAMPORTS_PER_SOL} SOL`;
                    error += `\n\nFund your TipMe wallet: ${user.wallet.publicKey}`;
                }
                this.replyWithError(ctx, error);
                return;
            }
        }

        let asset: HeliusAsset | undefined = undefined;
        for (const item of assets.items) {
            const assetName = item.token_info?.symbol;
            const assetId = item.id;

            const tokenStrUpper = tokenStr.toUpperCase();

            if (
                (assetName && assetName.toUpperCase() == tokenStrUpper) ||
                (assetId && assetId.toUpperCase() == tokenStrUpper)){
                
                if (item.token_info?.balance && item.token_info.balance >= amount * (10 ** item.token_info.decimals)){
                    asset = item;
                    break;
                }
                else {
                    this.replyWithError(ctx, `Not enough ${assetName || assetId}. You have ${item.token_info?.balance / (10 ** item.token_info.decimals)} ${assetName || assetId}`);
                    return;
                }
            }
        }

        if (!asset){
            this.replyWithError(ctx, `You don't have ${tokenStr}`);
            return;
        }

        console.log('!asset:', asset);

        const assetName = asset.token_info?.symbol || asset.id;

        ctx.reply(`Ok, sending ${amount} ${assetName} to ${toUser}`, {
            parse_mode: 'HTML', 
            link_preview_options: {
                is_disabled: true
            },
        });

    }

    async replyWithError(ctx: any, error: string) {
        ctx.reply('🔴 ' + error);
    }

}