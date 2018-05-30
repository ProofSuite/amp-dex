# cd contracts/tokens
abigen --sol ./Token1.sol --pkg interfaces --out ./token.go
# cd ..
# abigen --sol ./Exchange.sol --pkg interfaces --out $PROOFTRADINGENGINE/dex/interfaces/exchange.go
