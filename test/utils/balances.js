/**
 * @description Returns an object with the token1, token2 & WETH balance of trader1 & trader2; & WETH balance of rewardAccount;
 */
export const getBalances = async (trader1, trader2, rewardAccount, token1, token2, weth) => {
    let trader1BalanceOfToken1 = await token1.balanceOf(trader1);
    let trader1BalanceOfToken2 = await token2.balanceOf(trader1);
    let trader1BalanceOfWETH = await weth.balanceOf(trader1);
    let trader2BalanceOfToken1 = await token1.balanceOf(trader2);
    let trader2BalanceOfToken2 = await token2.balanceOf(trader2);
    let trader2BalanceOfWETH = await weth.balanceOf(trader2);
    let rewardAccountBalanceOfWETH = await weth.balanceOf(rewardAccount);
    return {
        trader1BalanceOfToken1: trader1BalanceOfToken1,
        trader1BalanceOfToken2: trader1BalanceOfToken2,
        trader1BalanceOfWETH: trader1BalanceOfWETH,
        trader2BalanceOfToken1: trader2BalanceOfToken1,
        trader2BalanceOfToken2: trader2BalanceOfToken2,
        trader2BalanceOfWETH: trader2BalanceOfWETH,
        rewardAccountBalanceOfWETH: rewardAccountBalanceOfWETH
    };
};