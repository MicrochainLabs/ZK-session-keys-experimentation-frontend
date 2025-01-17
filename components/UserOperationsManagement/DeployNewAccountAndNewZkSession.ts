import { ENTRYPOINT_ADDRESS_V07,UserOperation,bundlerActions, getAccountNonce, getSenderAddress, getUserOperationHash, signUserOperationHashWithECDSA } from "permissionless";
import { Address, createClient, createPublicClient, encodeFunctionData, Hex, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { AddressesIMT, SessionClaimsIMT } from "microch";



export async function deployAccountAndOpenNewZKSessionWithPaymaster(sessionAllowedSmartContracts: string[], accountAllowedToAddressesTree: string[]){

    const publicClient = createPublicClient({
        transport: http("https://rpc-amoy.polygon.technology/"),
        chain: polygonAmoy,
    })
    
    const chain = "polygon-amoy";
    const apiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
    const endpointUrl = `https://api.pimlico.io/v2/${chain}/rpc?apikey=${apiKey}`
    
    const bundlerClient = createClient({
        transport: http(endpointUrl),
        chain: polygonAmoy,
    })
        .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
        .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07))
    
    const paymasterClient = createClient({
        transport: http(endpointUrl),
        chain: polygonAmoy,
    }).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07))


    const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x7934a31391b517f85bbf3c68fecc96b86d54e7b0"

    const ownerPrivateKey = generatePrivateKey()
    const owner = privateKeyToAccount(ownerPrivateKey)

    const factory = SIMPLE_ACCOUNT_FACTORY_ADDRESS
    const factoryData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "owner", type: "address" },
                    { name: "salt", type: "uint256" },
                ],
                name: "createAccount",
                outputs: [{ name: "ret", type: "address" }],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        args: [owner.address, BigInt(0)],
    })

    const senderAddress = await getSenderAddress(publicClient, {
        factory,
        factoryData,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
    })

    const sessionTree = new SessionClaimsIMT(2, 0, 2);

    const sessionAllowedSmartContractTree: AddressesIMT = new AddressesIMT(17, 0, 2);
    for (let address of sessionAllowedSmartContracts) {
        await sessionAllowedSmartContractTree.addAddress(BigInt(address));
    }

    const sessionAllowedToTree: AddressesIMT = new AddressesIMT(17, 0, 2);
    for (let address of accountAllowedToAddressesTree) {
        await sessionAllowedToTree.addAddress(BigInt(address));
    }

    const sessionOwnerPrivateKey = generatePrivateKey()
    const sessionOwner = privateKeyToAccount(sessionOwnerPrivateKey)

    sessionTree.addClaim(BigInt(senderAddress))
    sessionTree.addClaim(BigInt(sessionOwner.address))
    sessionTree.addClaim(sessionAllowedSmartContractTree.root)
    sessionTree.addClaim(sessionAllowedToTree.root)

    const addSessionCallData = encodeFunctionData({
        abi: [
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_address",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "sessionTreeRoot",
                    "type": "uint256"
                  }
                ],
                "name": "addNewZKSessionKey",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              }
        ],
        args: [sessionOwner.address, sessionTree.root]
    })

    const gasPrice = await bundlerClient.getUserOperationGasPrice()

    console.log("senderAddress", senderAddress)
    console.log("owner private key", ownerPrivateKey)

    const userOperation = {
        sender: senderAddress,
        nonce: BigInt(0),
        factory: factory as Address,
        factoryData,
        callData:addSessionCallData,
        maxFeePerGas: gasPrice.fast.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas,
        // dummy signature, needs to be there so the SimpleAccount doesn't immediately revert because of invalid signature length
        signature:
            "0xa15569dd8f8324dbeabf8073fdec36d4b754f53ce5901e283c6de79af177dc94557fa3c9922cd7af2a96ca94402d35c39f266925ee6407aeb32b31d76978d4ba1c" as Hex,
    }

    const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation({
        userOperation,
    })
    
    const sponsoredUserOperation: UserOperation<"v0.7"> = {
        ...userOperation,
        ...sponsorUserOperationResult,
    }
    
    console.log("Received paymaster sponsor result:", sponsorUserOperationResult)

    const signature = await signUserOperationHashWithECDSA({
        account: owner,
        userOperation: sponsoredUserOperation,
        chainId: polygonAmoy.id,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
    })
    sponsoredUserOperation.signature = signature

    const userOperationHash = await bundlerClient.sendUserOperation({
        userOperation: sponsoredUserOperation,
    })
    
    console.log("Received User Operation hash:", userOperationHash)
    
    // let's also wait for the userOperation to be included, by continually querying for the receipts
    console.log("Querying for receipts...")
    const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
    })
    const txHash = receipt.receipt.transactionHash
    
    console.log(`UserOperation included: https://amoy.polygonscan.com/tx/${txHash}`)
  

    return {
        accountIdentifier: senderAddress,
        ownerPrivateKey: ownerPrivateKey,
        sessionOwnerPrivateKey:sessionOwnerPrivateKey,
        sessionAllowedSmartContracts: sessionAllowedSmartContracts,
        sessionAllowedToTree: accountAllowedToAddressesTree,
        txHash: txHash
    }
}