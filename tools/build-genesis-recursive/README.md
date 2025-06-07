## Flow to build recursive test
1. Copy from `zkevm-testvectors-server/tools-inputs/data/calldata/input-recursive-prover.json` to `testvecotr-gen-recursive`
2. `npm run build:input-recursive`

## Information

- Genesis: 
    - Contracts: 
        - PresComp
        - UniswapV2Factory
        - 2 * ERC20 Token
        
- Flow: 
    - Mint ERC20
    - Create Pair
    - send ERC20 to Pair
    - mint LP tokens
    - send ERC20
    - perform Swap
    - Tx Modexp
    - Tx sha256
    - Tx ecAdd
    - Tx ecMul
    - Tx ecPairing
    - Tx ecrecover