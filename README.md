# DABanking

## Development
```
npm install -g truffle truffle-lattener
```

### Compile
```
rm -rf build/contracts && truffle compile
```

### migrate to local chain
```
truffle migrate --reset
```

### test
```
truffle test
```
To run specific test:
```
truffle test [path/to/test/file.ext]

ex:
truffle test ./test/JoinPackageViaEther.js
``` 

### Remove ganache data
```
cd ~/Library/Application\ Support/Ganache
rm -rf *
```

## Deployment
### Deploy to public chain (testnet or mainnet)
```
truffle migrate --network [netWordName] --reset
```
netWordName=`ropsten`, `mainnet` (see `truffle-config.js` file)

### Verifying code

```
truffle-flattener ./contracts/ReserveFund.sol  > out/ReserveFund.sol
truffle-flattener ./contracts/DABANKING.sol  > out/DABANKING.sol
truffle-flattener ./contracts/Wallet.sol  > out/Wallet.sol
truffle-flattener ./contracts/Citizen.sol  > out/Citizen.sol
```

Go to each file and remove duplicate `pragma solidity 0.4.25;` declarations, only keep one on top. 

