import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import circuit from './circuit.json';
import { Address, createClient, createPublicClient, encodeFunctionData, Hex, hexToBigInt, hexToNumber, http, parseEther, toHex } from "viem";
import { polygonAmoy } from "viem/chains";
import { ENTRYPOINT_ADDRESS_V07, UserOperation, bundlerActions, getAccountNonce, getUserOperationHash, signUserOperationHashWithECDSA } from "permissionless";
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico";
import { privateKeyToAccount } from "viem/accounts";
import { AbiCoder, hexlify } from "ethers";
import { AddressesIMT, PROOF_SYSTEM_CONSTANTS } from "microch";



export async function sendUserOperationNoirJS(to: string, amount: string, accountIdentifier: string, sessionOwnerPrivateKey: string, sessionAllowedSmartContracts: string[], sessionAllowedToAddresses: string[]){

    /*********************************** User operation preparation ***************************************** */  

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
  
  
  // Convert currency unit from ether to wei
  const parsedAmountValue = parseEther(amount) //function paramter
  const data = "0x" 

  const callData = encodeFunctionData({
      abi: [
          {
              inputs: [
                  { name: "dest", type: "address" },
                  { name: "value", type: "uint256" },
                  { name: "func", type: "bytes" }
              ],
              name: "execute",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function"
          }
      ],
      args: [to as `0x${string}`, parsedAmountValue, data]
    })
    
  const sessionOwner = privateKeyToAccount(sessionOwnerPrivateKey as Hex) 
  const nonce = await getAccountNonce(publicClient, {
      sender: accountIdentifier as Address,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
  })
    const gasPrice = await bundlerClient.getUserOperationGasPrice()

    const userOperation = {
      sender: accountIdentifier,
      nonce: nonce,
      callData: callData,
      maxFeePerGas: gasPrice.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas,
      verificationGasLimit:BigInt(480000),
      /*verificationGasLimit:BigInt(280000),
      callGasLimit: BigInt(118553),
      preVerificationGas: BigInt(62164),*/
      // dummy signature
      signature:
        "0x01d111a05edeb1519ca9f7233832a709e62791fa90bc3fc835af06009922fd03000000000000000000000000ce27ecca076ef955d5bb72c51a5d7ac603c8616a0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000416cda0e788069dd5b8d63ae97a8f7f2d71e2cc529c0bc132c4fed89285142cd886cb122c006db5c3836a1e626e6002ca90b3bfe28667bd1e7371b28cdeb07d3021b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008600a2b11d0b6b3dc01f8d319d25c07876b7726e3f428f6acd6f2756fcef92b475700f7c56b634d40d6430d26634668e7d41f7138a2ee62d5d19b3688524a838f75034b794da3c2a98760a79ce86d6577458acfb51fabe8cc023af9eb328d7fb3031ffe9907efba37c1aebe2e1a7c8d1a56cf64f093dcfe76bcb25aee9b970184c825400d26a0457cf0040f9e7e3eb960f15710baa9bcd8f7de268f6b9e5e57d6fe24d0207eceb890a8be45f4ecabf9f7bca53bf66d570c6f0f6822b7811eec5f5512ed296629a9a1167c658358e95378d8022fe8483ef1f61d4e9d6364e34c98e903e76f1dd725d8a02c8f2545c3b15620ae8b8863012892c7cec781169439321f1d19cabaa2f2f1d61504ec251a483f2f06e4a52edb5e697b0430f8d6fd8a2c930ad23cf855eb12d57e49f4070f18f48be466f99a8092d9459d1276859442ea332d38e119a2783f5eece9fae455bd8c4d9595d8440730b28865ba810657e24c181a4d649464ac8963a30cf0e4233d55e12274e4b5f691231daac97ae6acc082c81ea059257abd5e1936d9a5b00ec2780543c283cefbbcdff7579739fe4b03d84c2521217d975aa80a98cba53e83265a52c2b92195bd74b3238996a003ab1c39b622775a7d0e335feabe8d98fd69a53b59ec5abcdc5f862a7740ae8648566962d21561caadd5f0eae8dbcc6776df133533b35d5d23aa881e7b7756e62fe4f896a116b83f9b32556582086b797c9a23c7911ba9946a988c90c97eaba82577c195e104701b3ab9fe9a6ddd6fe5010299cfa2266b24580f414b4ca422fd5da947d9012cba2056197c9a0427263516ba41d9b6c89d02eaf4ef577368a0800ca35fefae0fe0b2f0949e3009c672562f174e862af2c7d5976b0ccdb53aa95dc829d371180d8e3fd0dcf320e18d497aa78278dc429ebc76cdeb2d002a5e712990ac18b7a20a45245213e4a75e1796ee19b10dae86ef90a3dfa590b59b2693c85a0c6e327821bc37a026e43664667bac6f5def02e75c8e6e3b563a4f915f1d019ef2a88e040785c1d0d034a9f66ee4a65383065e23e6ae94344bd7aa2072619d1eb531b734189662cf680c82d6a2a6e43400e68278240d453e6d764fff93bd9d10faef3c4013f7882aa273461278f40bb731cd6fe40382a0df218c17352c1deaff41b95a3a0ddda351bef5520d2cdad8d4659597806eb6cf7aec2ca7c98140222f31fd7e772a778ea5101bcec7c2469e1616e855f7225b6b09f0427036e79cbd9e010b680b1d946a4a2bb95c6196b1d191e8ffab8dd34a590df20fcddffe92ea15407f386e1d4b67a3d9bc5adc9bb882c840c0f014ebcdabfbf3cab03546c8900f4fc5521b2fcd6c808b517a014433379eeff3cf958e821c9cd6c2066e740e6e788a0933b12b9ec0c38c40836374dd0666eff2887acb7e6427479bbc5d70f7d86c35e1362b2d9ccec6ed06179bb5d43d8a2bc479012867fc31baee127ac6da45f494cb079309cf020bde5dfcfa5195cfc9902fc0a8b4f607c9a03c0adc2f1648c307abf1fc26f0ccee62ec23b1a2f74d8914712337f96d7ce530b0b6923e309135fce0192c05938208cd2d2f3c926587c9ccc5c9f1bcc4433bb8ec296a7db6856aef3d77d42bacdea0297e2b6e73f9f51dba25ce72ac2a19a0cae3621d97fa03c2c1d0349813019292499ff0e7550da84b12b879841fc490eb3180744388da6c5f86f61b3b22bdd982070b97d092f67a38137f9b0e3853375feec622bd8b2c872ab6c0d38f05f725a987f0008be38a6402c6cefb49a0d10b51995ec43e81201a4834d5dfbc08775402fc53f49c2d96eba58177d4717f2d23f652da5b3821a81993e5e5c3432e480c3b8d4db72ffb640fa7e073ce26403e0e1f740e42b6156c86c305996f1a2ac6cad33826a7ab85959d2c949f1c4228ed767db136ab091b3156fdc87185a62b1d83a87db08aafa7a920f63e6d94a6bfe8f67863eae9ca2ae3252029b2dd3d1df7c155458683bd57b850295450a8a98eb2cb293b94d3c2e34651a3ad39edcc0df201f116bd168b3512b4c482686a8d3b7e2b62ffadd0c005f6f20d253e583c2ca35a181942bbc4ae35a6263ee8402c2d220a2e3c29407e0cff53ef09fe25c726149b7f5b34d4fb78102d9d086fbbf58ca44cf07f0a6d9b46edc30caad6616921b66d589662a975b0f4e81dd5eaed6fc788c812791422ec5931e8408e000d300fd1e05eba83b6cadcf63a33a67ff5a1bedd6872d482420f55c54ad3a506dfc90e8a83b9d85ad434cf5f3ae82156ce5236ac661e836eec85a70d583e72e472b912cff8c78547ac4241940fd559532dcb6915bd05304548a916e11ee7ab240e1f15ab0cf4e8f53b2f5e44809347d6efe49682c59d3c8ba5f8b5260a22a6ccc021174b6a29918bbae7dd084bf004c2429eb3f19e52bd84123bf7f3db7c19edd94b2b4c5a6e2eb78448628b6a3aa547814d5711ab727917dbacf27c0d304fb52b1e1c4fc21cb28310fc7e56ee2c9cd7e02fe60c0eb6e2c6955dbf76a5afb84075160dc267ef42c84201be8e5fdb6b325a81d1e35ee7992e48a62a8be7209631447c03fa6a017bedf2887ed3b14c8211d8f76e6879e8601a57832c1cadd65b224d072eb8235141eb2bd2fbe25ed73a27add8763e8eccb90aedd34f8333775b15bf9b0b57d4bcf6f168ffea409a0b9194a3b038161e28688f20436583a4cf38e287b11e3e947d4288478d56317d7fc637a86fa434208687326f48115294fdff670acb0eb9a280efbf0c52728f0ca85ca1c6c8dbc99a1c2a593fdbee3de310dc628d9320ff34bdd43cb0aa4fb4ded1138e93bb1a9724e564534b36e4d56c5a76a59bfb0933381e78cd8868f4083e6b777f51571947cb6cea630c6c0d998e585397a4040a0cddb6c557f1caff63fa6579e4ae5f960415debadbf190536f6eefd23ee8f903f31f24056e23ac32a756cf0773bee867175776e58cc4f6e366dfbca8f8674e05c0198ce2a414ad05ebf52c266cf3c16343ef5cea2fe280a3cb4bc9ac7baf14" as Hex
  }
 //Details: preVerificationGas is not enough, required: 122608, got: 62164
  const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation({
    userOperation,
  })
  
  const sponsoredUserOperation: UserOperation<"v0.7"> = {
    ...userOperation,
    ...sponsorUserOperationResult,
  }

  console.log("Received paymaster sponsor result:", sponsorUserOperationResult)


  let userOpHash = getUserOperationHash({
      userOperation: sponsoredUserOperation,
      chainId: polygonAmoy.id,
      entryPoint: ENTRYPOINT_ADDRESS_V07
  })
  let op = BigInt(hexlify(userOpHash))
  op %= PROOF_SYSTEM_CONSTANTS.SNARK_SCALAR_FIELD


  /*********************************** User operation signature and proof generation ***************************************** */ 
    
  const transaction= {
    dest: BigInt(to),
    value: amount,
    functionSelector: BigInt("0x0"),
    Erc20TransferTo: BigInt("0x0")
  }

  const transactions = [
      transaction
  ]

  const sessionAllowedSmartContractTree: AddressesIMT = new AddressesIMT(17, 0, 2); 
  const sessionAllowedToAddressesTree= new AddressesIMT(17, 0, 2); 

  for (let address of sessionAllowedSmartContracts) {
      await sessionAllowedSmartContractTree.addAddress(BigInt(address));
  }

  for (let address of sessionAllowedToAddresses) {
      await sessionAllowedToAddressesTree.addAddress(BigInt(address));
  }
  console.log()
  const circuitInputs = {
    account_identifier: accountIdentifier,
    session_key_identifier: sessionOwner.address,
    allowed_smart_contract_tree_root: toHex(sessionAllowedSmartContractTree.root),
    allowed_to_tree_root: toHex(sessionAllowedToAddressesTree.root),
    op: toHex(op),
    dest:[] as string[],
    value: [] as string[],
    function_selector: [] as string[], 
    erc20_transfer_to:[] as string[], 
    eth_to_siblings: [] as string[][], 
    eth_to_path_indices: [] as string[],     
    allowed_smart_contract_call_siblings: [] as string[][],
    allowed_smart_contract_call_path_indices: [] as string[],
    erc20_to_address_siblings: [] as string[][],
    erc20_to_address_path_indices: [] as string[] 
  }

  for(let tx of transactions){
    
    circuitInputs.dest.push(toHex(tx.dest))
    circuitInputs.value.push(toHex(parseEther(tx.value)))
    circuitInputs.function_selector.push(toHex(tx.functionSelector))
    circuitInputs.erc20_transfer_to.push(toHex(tx.Erc20TransferTo))
    if(tx.value != "0"){
      const index= await sessionAllowedToAddressesTree.indexOf(BigInt(tx.dest));
      const allowedToProof= await sessionAllowedToAddressesTree.generateMerkleProof(index);
      circuitInputs.eth_to_siblings.push(allowedToProof.siblings.map(v => toHex(v)))
      circuitInputs.eth_to_path_indices.push(toHex(Number("0b" + allowedToProof.pathIndices.join(""))))
    }else{
      //static value
      circuitInputs.eth_to_siblings.push(["0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0"])
      circuitInputs.eth_to_path_indices.push("0x0")
    }

    if(tx.functionSelector != BigInt("0x0")){
      const index= await sessionAllowedSmartContractTree.indexOf(BigInt(tx.dest));
      const allowedSmartContractProof= await sessionAllowedSmartContractTree.generateMerkleProof(index);
      circuitInputs.allowed_smart_contract_call_siblings.push(allowedSmartContractProof.siblings.map(v => toHex(v)))
      circuitInputs.allowed_smart_contract_call_path_indices.push(toHex(Number("0b" + allowedSmartContractProof.pathIndices.join(""))))
    }else{
      //static value
      circuitInputs.allowed_smart_contract_call_siblings.push(["0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0"])
      circuitInputs.allowed_smart_contract_call_path_indices.push("0x0")
    }
    if(tx.Erc20TransferTo != BigInt("0x0")){
      const index= await sessionAllowedToAddressesTree.indexOf(BigInt(tx.Erc20TransferTo));
      const allowedSmartContractProof= await sessionAllowedToAddressesTree.generateMerkleProof(index);
      circuitInputs.erc20_to_address_siblings.push(allowedSmartContractProof.siblings.map(v => toHex(v)))
      circuitInputs.erc20_to_address_path_indices.push(toHex(Number("0b" + allowedSmartContractProof.pathIndices.join(""))))
    }else{
      //static value
      circuitInputs.erc20_to_address_siblings.push(["0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0"])
      circuitInputs.erc20_to_address_path_indices.push("0x0")
    }
  }
  
  try {

        const backend = new BarretenbergBackend(circuit);
        const noir = new Noir(circuit);
        /*const input = {
          account_identifier: "0x8448FF4B2733B52F62D81CA46D64BD16786299CD" ,
          session_key_identifier: "0x6E7448A6335D5C947953994D071D4DC1F6E5BE96",
          allowed_smart_contract_tree_root: "0x3EAEC455733FCB842E16346E72602C86E0833338A37BE60DF5D1BE1AB6F6721",
          allowed_to_tree_root: "0x1DDC75D2360B14E1E30D42D4E0A2F57584B807068BA7A6175B55D5168837622F",
          op: "0x92C100EF61D009F9838D0220E6C9E4287FB5417D4B65A482BC726517C01F890",
      
          dest: ["0x2555E3A97C4AC9705D70B9E5B9B6CC6FE2977A74"],
          value: ["0x2386F26FC10000"],
          function_selector: ["0x0"],
          erc20_transfer_to: ["0x0"],
      
          eth_to_siblings: [[
            "0xFAE129DAFF0FB52FEA5453479DCB5AAFB8FD4424",
            "0x2035F0AABE2DDD25C8AE5DB994900E2CF147A6AA289E32A33756D8449A4F277D",
            "0x1069673DCDB12263DF301A6FF584A7EC261A44CB9DC68DF067A4774460B1F1E1",
            "0x18F43331537EE2AF2E3D758D50F72106467C6EEA50371DD528D57EB2B856D238",
            "0x7F9D837CB17B0D36320FFE93BA52345F1B728571A568265CAAC97559DBC952A",
            "0x2B94CF5E8746B3F5C9631F4C5DF32907A699C58C94B2AD4D7B5CEC1639183F55",
            "0x2DEE93C5A666459646EA7D22CCA9E1BCFED71E6951B953611D11DDA32EA09D78",
            "0x78295E5A22B84E982CF601EB639597B8B0515A88CB5AC7FA8A4AABE3C87349D",
            "0x2FA5E5F18F6027A6501BEC864564472A616B2E274A41211A444CBE3A99F3CC61",
            "0xE884376D0D8FD21ECB780389E941F66E45E7ACCE3E228AB3E2156A614FCD747",
            "0x1B7201DA72494F1E28717AD1A52EB469F95892F957713533DE6175E5DA190AF2",
            "0x1F8D8822725E36385200C0B201249819A6E6E1E4650808B5BEBC6BFACE7D7636",
            "0x2C5D82F66C914BAFB9701589BA8CFCFB6162B0A12ACF88A8D0879A0471B5F85A",
            "0x14C54148A0940BB820957F5ADF3FA1134EF5C4AAA113F4646458F270E0BFBFD0",
            "0x190D33B12F986F961E10C0EE44D8B9AF11BE25588CAD89D416118E4BF4EBE80C",
            "0x22F98AA9CE704152AC17354914AD73ED1167AE6596AF510AA5B3649325E06C92",
            "0x2A7C7C9B6CE5880B9F6F228D72BF6A575A526F29C66ECCEEF8B753D38BBA7323"
      
          ]],
          eth_to_path_indices: ["0x0"],
          allowed_smart_contract_call_siblings: [["0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0"]],
          allowed_smart_contract_call_path_indices: ["0x0"],
          erc20_to_address_siblings: [["0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0", "0x0", "0x0", "0x0", "0x0","0x0", "0x0", "0x0"]],
          erc20_to_address_path_indices: ["0x0"],
      };*/
        console.log('logs', 'Generating witness... ⌛');
        const { witness, returnValue } = await noir.execute(circuitInputs);
        console.log("return Value: ", returnValue)
        const proof = await backend.generateProof(witness);
        console.log('logs', 'Generating proof... ✅');
        console.log('Proof: ', proof.proof);
        console.log('publicInputs: ', proof.publicInputs);
        console.log(hexToBigInt(proof.publicInputs[8] as `0x${string}`))
        console.log("session tree root: ", hexToBigInt(proof.publicInputs[7] as `0x${string}`))
        /*console.log('logs', 'Verifying proof... ⌛');
        const isValid = await backend.verifyProof(proof)
        // or to cache and use the verification key:
        // const verificationKey = await backend.getVerificationKey();
        // const verifier = new Verifier();
        // const isValid = await verifier.verifyProof(proof, verificationKey);
        if (isValid) console.log('logs', 'Verifying proof... ✅');*/

        const signature = await signUserOperationHashWithECDSA({
          account: sessionOwner,
          userOperation: sponsoredUserOperation,
          chainId: polygonAmoy.id,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        })

      const defaultEncode= AbiCoder.defaultAbiCoder();
      const finalSignature = defaultEncode.encode(
            ["uint256","address","bytes","bytes"],
            [ hexToBigInt(proof.publicInputs[8] as `0x${string}`), sessionOwner.address, signature, proof.proof]);
      sponsoredUserOperation.signature= finalSignature as `0x${string}`;

      /*********************************** User operation submission ************************************************************* */

        const userOperationHash = await bundlerClient.sendUserOperation({
          userOperation: sponsoredUserOperation,
        })

        console.log("Received User Operation hash:", userOperationHash)

        console.log("Querying for receipts...")
        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: userOperationHash,
        })
        const txHash = receipt.receipt.transactionHash

        console.log(`UserOperation included: https://amoy.polygonscan.com/tx/${txHash}`)

        return {
            txHash: txHash
        }
      } catch (err) {
        console.log(err)
        console.log('logs', 'Oh 💔 Wrong guess');
      }
      
}