import { readFileSync } from 'fs'
import { join } from 'path'
const { expect } = require("chai");

//EVM JS
import { Transaction, TxData } from '@ethereumjs/tx'
import VM from '@ethereumjs/vm'
import Common, { Chain, Hardfork } from '@ethereumjs/common'
const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin })
const { Address, Account, BN, toBuffer, setLengthLeft, rlp, setLengthRight, keccak256 } = require('ethereumjs-util')
let vm = new VM({ common });
const solc = require('solc')
import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'

describe("Deploy and interact with ERC-20 in the jsEVM", async function () {

    let contractAddress
    let accountAddress
    const tokenSymbol = "TOK"
    const accountPk = Buffer.from(
        'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
        'hex',
    )

    it("Should deploy the erc20", async () => {

        //Create account with balance
        accountAddress = Address.fromPrivateKey(accountPk)
        const acctData = {
            nonce: 0,
            balance: new BN(10).pow(new BN(18)), // 1 eth
        }
        const account = Account.fromAccountData(acctData)
        await vm.stateManager.putAccount(accountAddress, account)
        //Compile smart contracts
        const solcOutput = await compileContracts()
        if (solcOutput === undefined) {
            throw new Error('Compilation failed')
        }

        //Get bytecode from compiled smart contract
        const bytecode = getTokenDeploymentBytecode(solcOutput)
        //Deploy to evm
        contractAddress = await deployContract(vm, accountPk, bytecode, tokenSymbol)

    })

    it("Should check symbol", async () => {
        const symbol = await getSymbol(vm, contractAddress, accountAddress)
        expect(symbol).to.equal(tokenSymbol)
    })

    it("Should mint tokens", async () => {
        const supplyBefore = await getTotalSupply(vm, contractAddress, accountAddress)
        expect(Number(supplyBefore)).to.equal(0)

        //Mint
        const amount = 1000000
        await mint(vm, accountPk, contractAddress, amount, accountAddress.toString())
        const supplyAfter = await getTotalSupply(vm, contractAddress, accountAddress)
        expect(Number(supplyAfter)).to.equal(amount)
    })

    it("Should get contract storage", async () => {
        const dumpedStorage = await vm.stateManager.dumpStorage(contractAddress)
        expect(dumpedStorage).not.equal({});
    })
});

async function deployContract(
    vm,
    senderPrivateKey,
    deploymentBytecode,
    token,
) {
    // Contracts are deployed by sending their deployment bytecode to the address 0
    // The contract params should be abi-encoded and appended to the deployment bytecode.
    const params = AbiCoder.encode(['string'], [token])
    const txData = {
        value: 0,
        gasLimit: 2000000, // We assume that 2M is enough,
        gasPrice: 1,
        data: '0x' + deploymentBytecode.toString('hex') + params.slice(2),
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey)

    const deploymentResult = await vm.runTx({ tx })

    if (deploymentResult.execResult.exceptionError) {
        throw deploymentResult.execResult.exceptionError
    }

    return deploymentResult.createdAddress
}


async function getAccountNonce(vm, accountPrivateKey) {
    const address = Address.fromPrivateKey(accountPrivateKey)
    const account = await vm.stateManager.getAccount(address)
    return account.nonce
}


async function mint(
    vm,
    senderPrivateKey,
    contractAddress,
    amount,
    address
) {
    const params = AbiCoder.encode(['address', 'uint256'], [address, amount])
    const sigHash = new Interface(['function mint(address, uint256)']).getSighash('mint')
    const txData = {
        to: contractAddress,
        value: 0,
        gasLimit: 2000000, // We assume that 2M is enough,
        gasPrice: 1,
        data: sigHash + params.slice(2),
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey)
    const setMintResult = await vm.runTx({ tx })

    if (setMintResult.execResult.exceptionError) {
        throw setMintResult.execResult.exceptionError
    }
}

async function getTotalSupply(vm, contractAddress, caller) {
    const sigHash = new Interface(['function totalSupply()']).getSighash('totalSupply')
    const symbolResult = await vm.runCall({
        to: contractAddress,
        caller: caller,
        origin: caller, // The tx.origin is also the caller here
        data: Buffer.from(sigHash.slice(2), 'hex'),
    })

    if (symbolResult.execResult.exceptionError) {
        throw symbolResult.execResult.exceptionError
    }

    const results = AbiCoder.decode(['uint256'], symbolResult.execResult.returnValue)

    return results[0]
}

async function getSymbol(vm, contractAddress, caller) {
    const sigHash = new Interface(['function symbol()']).getSighash('symbol')
    const symbolResult = await vm.runCall({
        to: contractAddress,
        caller: caller,
        origin: caller, // The tx.origin is also the caller here
        data: Buffer.from(sigHash.slice(2), 'hex'),
    })

    if (symbolResult.execResult.exceptionError) {
        throw symbolResult.execResult.exceptionError
    }

    const results = AbiCoder.decode(['string'], symbolResult.execResult.returnValue)

    return results[0]
}

function getTokenDeploymentBytecode(solcOutput) {
    return solcOutput.contracts['contracts/Token.sol'].Token.evm.bytecode.object
}

/**
 * This function creates the input for the Solidity compiler.
 *
 * For more info about it, go to https://solidity.readthedocs.io/en/v0.5.10/using-the-compiler.html#compiler-input-and-output-json-description
 */
function getSolcInput() {
    const content = readFileSync(join(`${process.cwd()}/test/evm`, 'contracts', 'Token.sol'), 'utf8')
    return {
        language: 'Solidity',
        sources: {
            'contracts/Token.sol': {
                content,
            },
            // If more contracts were to be compiled, they should have their own entries here
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: 'petersburg',
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    }
}


/**
 * This function compiles all the contracts in `contracts/` and returns the Solidity Standard JSON
 * output. If the compilation fails, it returns `undefined`.
 *
 * To learn about the output format, go to https://solidity.readthedocs.io/en/v0.5.10/using-the-compiler.html#compiler-input-and-output-json-description
 */
function compileContracts() {

    const input = getSolcInput()
    const output = JSON.parse(solc.compile(JSON.stringify(input)))

    let compilationFailed = false

    if (output.errors) {
        for (const error of output.errors) {
            if (error.severity === 'error') {
                console.error(error.formattedMessage)
                compilationFailed = true
            } else {
                console.warn(error.formattedMessage)
            }
        }
    }

    if (compilationFailed) {
        return undefined
    }

    return output
}