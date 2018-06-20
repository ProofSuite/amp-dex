import {soliditySha3 as keccak256} from 'web3-utils'

export const getOrderHash = (exchange, order) => {
    return keccak256(
        exchange.address,
        order.maker,
        order.tokenSell,
        order.tokenBuy,
        order.amountSell,
        order.amountBuy,
        order.feeMake,
        order.feeTake,
        order.expires,
        order.nonce
    )
};

export const getTradeHash = (orderHash, trade) => {
    return keccak256(
        orderHash,
        trade.taker,
        trade.amount,
        trade.tradeNonce
    )
};

export const getMatchOrderValues = (order, trade) => {
    return [
        order.amountBuy,
        order.amountSell,
        order.expires,
        order.nonce,
        order.feeMake,
        order.feeTake,
        trade.amount,
        trade.tradeNonce
    ]
};

export const getMatchOrderAddresses = (order, trade) => {
    return [
        order.tokenBuy,
        order.tokenSell,
        order.maker,
        trade.taker
    ]
};


export const getCancelOrderValues = (order) => {
    return [
        order.amountBuy,
        order.amountSell,
        order.expires,
        order.nonce,
        order.feeMake,
        order.feeTake
    ]
};

export const getCancelOrderAddresses = (order) => {
    return [
        order.tokenBuy,
        order.tokenSell,
        order.maker
    ]
};
