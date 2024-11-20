"use client"

import { Badge, Button, Container, Group, TagsInput, TextInput, Text, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { isAddress } from 'viem';
import { useState } from 'react';
import { deployAccountAndOpenNewZKSessionWithPaymaster } from './DeployNewAccountAndNewZkSession';
import { sendOneUserOperationWithPaymaster } from './SendOneUserOperation';
import { sendTwoUserOperationWithPaymaster } from './SendTwoUserOperation';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import circuit from './circuit.json';
import { sendUserOperationNoirJS } from './SendUserOperationNoir';


interface Props {
    accountAddress: string
  }

export function UserOperationsManagement(props: Props) {

  const [accountCreationTransaction, setAccountCreationTransaction] = useState("");
  const [sendEthTransaction, setSendEthTransaction] = useState("");
  const [sendEthAndErc20Transaction, setSendEthAndErc20Transaction] = useState("");

  const [accountAddress, setAccountAddress] = useState("");

  const [isSessionLoading, setISessionLoading] = useState(true);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [isSendEthTransactionLoading, setIsSendEthTransactionLoading] = useState(false);
  const [isSendEthAndErc20Transaction, setIsSendEthAndErc20Transaction] = useState(false);

  
  const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
          smartContractAddresses: [],
          toAddresses: [],
        },

        validate: (values) => {
            return {
              toAddresses: !values.toAddresses.every((address: string) => isAddress(address)) ? 'Invalid smart contract address' : null,
              smartContractAddresses: !values.smartContractAddresses.every((address: string) => isAddress(address)) ? 'Invalid smart contract address' : null,
            };
        },
  });

  const transferNativeCoinForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      accountAddress: '',
      amount: '',
    },

    validate: (values) => {
        return {
            accountAddress: !isAddress(values.accountAddress) ? 'Invalid account address' : null,
          };
    },
  });

  const batchTransactionsForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      nativeCoinTransferAccountAddress: '',
      nativeCoinTransferamount: '',
      erc20Address: '',
      erc20ReceiverAccountAddress: '',
      erc20Transferamount: '',
    },

    validate: (values) => {
        return {
          nativeCoinTransferAccountAddress: !isAddress(values.nativeCoinTransferAccountAddress) ? 'Invalid account address' : null,
          erc20ReceiverAccountAddress: !isAddress(values.erc20ReceiverAccountAddress) ? 'Invalid account address' : null,
          erc20Address: !isAddress(values.erc20Address) ? 'Invalid account address' : null,
        };
    },
  });

  async function deployAccountAndOpenNewSession() {

    setIsTransactionLoading(true)
    const zkSessionKey= await deployAccountAndOpenNewZKSessionWithPaymaster(form.getValues().smartContractAddresses, form.getValues().toAddresses)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unreachable code error
    BigInt.prototype["toJSON"] = function () {
      return this.toString();
    };
    localStorage.setItem("zkSessionKey",  JSON.stringify(zkSessionKey));
    setAccountAddress(zkSessionKey.accountIdentifier)
    setAccountCreationTransaction(zkSessionKey.txHash)
    setIsTransactionLoading(false)
  }  

  async function sendUserOperationWithNoirCircuit() {
    if (typeof window !== "undefined") {
      const zkSessionKey = JSON.parse(localStorage.getItem("zkSessionKey") || "");
      setIsSendEthTransactionLoading(true)
      const result= await sendUserOperationNoirJS(transferNativeCoinForm.getValues().accountAddress, transferNativeCoinForm.getValues().amount, zkSessionKey.accountIdentifier, zkSessionKey.sessionOwnerPrivateKey, zkSessionKey.sessionAllowedSmartContracts, zkSessionKey.sessionAllowedToTree)
      setSendEthTransaction(result.txHash)
      setIsSendEthTransactionLoading(false)
    }
  }

  async function sendUserOperation() {
    if (typeof window !== "undefined") {
      const zkSessionKey = JSON.parse(localStorage.getItem("zkSessionKey") || "");
      setIsSendEthTransactionLoading(true)
      const result= await sendOneUserOperationWithPaymaster(transferNativeCoinForm.getValues().accountAddress, transferNativeCoinForm.getValues().amount, zkSessionKey.accountIdentifier, zkSessionKey.sessionOwnerPrivateKey, zkSessionKey.sessionAllowedSmartContracts, zkSessionKey.sessionAllowedToTree)
      setSendEthTransaction(result.txHash)
      setIsSendEthTransactionLoading(false)
    }
  }

  async function sendTwoUserOperations() {
    if (typeof window !== "undefined") {
      const zkSessionKey = JSON.parse(localStorage.getItem("zkSessionKey") || "");
      setIsSendEthAndErc20Transaction(true)
      const result= await sendTwoUserOperationWithPaymaster(batchTransactionsForm.getValues().nativeCoinTransferAccountAddress, batchTransactionsForm.getValues().nativeCoinTransferamount, batchTransactionsForm.getValues().erc20Address, batchTransactionsForm.getValues().erc20ReceiverAccountAddress, batchTransactionsForm.getValues().erc20Transferamount, zkSessionKey.accountIdentifier, zkSessionKey.sessionOwnerPrivateKey, zkSessionKey.sessionAllowedSmartContracts, zkSessionKey.sessionAllowedToTree)
      setSendEthAndErc20Transaction(result.txHash)
      setIsSendEthAndErc20Transaction(false)
    }
  }

  async function nextStep(){
    setISessionLoading(false)
  }

  return (
    <>
     <Container size={1000}  ta="center">
      {isSessionLoading && ( <div>

        <TagsInput
            label="Session scope-permission: Smart contract interaction"
            description="Press Enter to submit an address"
            placeholder="Enter smart contract addresses that the session is allowed to interact with"
            key={form.key('smartContractAddresses')}
            {...form.getInputProps('smartContractAddresses')}
            maxTags={3}
        />

        <TagsInput
            label="Session scope-permission: Value transfer"
            description="Press Enter to submit an address"
            placeholder="Enter addresses for who the session is allowed to send value(native coin and ERC20 token)"
            key={form.key('toAddresses')}
            {...form.getInputProps('toAddresses')}
            maxTags={3}
        />

        <Group justify="center" mt="xl">
            <Button
            onClick={deployAccountAndOpenNewSession}
            >
            Submit
            </Button>
        </Group>

        {isTransactionLoading && ( <div>
        <Loader color="blue" mt={'xl'}/>
        </div>
        )}

        {accountCreationTransaction && ( <div>
          <Badge color={"green"} variant="light" mt={'xl'} size="35">
          <Text size='xl'>
            Transaction:  
            <a href={`https://amoy.polygonscan.com/tx/${accountCreationTransaction}`} target="_blank">
                {accountCreationTransaction}
            </a>
          </Text>
          </Badge>
          <br/>
          <Badge color={"cyan"} variant="light" mt={'xl'} size="35">
            <Text size='xl' /*fw={700}*/>
              Account address:
              <a href={`https://amoy.polygonscan.com/address/${accountAddress}`} target="_blank">
                {accountAddress}
            </a>
            </Text>
          </Badge>
          <br/>
          <Button onClick={nextStep} mt={'xl'}>Next step</Button>
          </div>
        )}
        </div>
      )}
      {!isSessionLoading && ( <div>
        <Badge
          size="xl"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          h={36}
          mb={'xl'}
        >
          Example 1: Native token transfer
        </Badge>

        <TextInput
            label="Account address"
            placeholder="Account address"
            key={transferNativeCoinForm.key('accountAddress')}
            {...transferNativeCoinForm.getInputProps('accountAddress')}
        />

        <TextInput
            label="Amount(ETH)"
            placeholder="Amount(ETH)"
            key={transferNativeCoinForm.key('amount')}
            {...transferNativeCoinForm.getInputProps('amount')}
        />

        <Group justify="center" mt="xl">
            <Button
            onClick={sendUserOperationWithNoirCircuit}
            >
            Submit
            </Button>
        </Group>
        {isSendEthTransactionLoading && ( <div>
        <Loader color="blue" mt={'xl'}/>
        </div>
        )}
        {sendEthTransaction && ( <div>
          <Badge color={"green"} variant="light" mt={'xl'} size="35">
          <Text size='xl'>
            Transaction:  
            <a href={`https://amoy.polygonscan.com/tx/${sendEthTransaction}`} target="_blank">
                {sendEthTransaction}
            </a>
          </Text>
          </Badge>
        </div>)}
        {/*<Badge
          size="xl"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          mt={'xl'}
          h={36}
          mb={'xl'}
        >
          Example 2: Batch Transactions(Native coin transfer + ERC20 token transfer)
        </Badge>
        <br/>
        <Text fw={700}>Transaction 1: Native coin transfer</Text>
        <TextInput
            label="Account address"
            placeholder="Account address"
            key={batchTransactionsForm.key('nativeCoinTransferAccountAddress')}
            {...batchTransactionsForm.getInputProps('nativeCoinTransferAccountAddress')}
        />

        <TextInput
            label="Amount(ETH)"
            placeholder="Amount(ETH)"
            key={batchTransactionsForm.key('nativeCoinTransferamount')}
            {...batchTransactionsForm.getInputProps('nativeCoinTransferamount')}
        />
        <Text fw={700}>Transaction 2: ERC20 token transfer</Text>

        <TextInput
            label="ERC20 token address"
            placeholder="ERC20 token address "
            key={batchTransactionsForm.key('erc20Address')}
            {...batchTransactionsForm.getInputProps('erc20Address')}
        />

        <TextInput
            label="Receiver account address"
            placeholder="Receiver account address"
            key={batchTransactionsForm.key('erc20ReceiverAccountAddress')}
            {...batchTransactionsForm.getInputProps('erc20ReceiverAccountAddress')}
        />

        <TextInput
            label="Amount"
            placeholder="Amount"
            key={batchTransactionsForm.key('erc20Transferamount')}
            {...batchTransactionsForm.getInputProps('erc20Transferamount')}
        />

        <Group justify="center" mt="xl">
            <Button
            onClick={sendTwoUserOperations}
            >
            Submit
            </Button>
        </Group>
        {isSendEthAndErc20Transaction && ( <div>
        <Loader color="blue" mt={'xl'}/>
        </div>
        )}
         {sendEthAndErc20Transaction && ( <div>
          <Badge color={"green"} variant="light" mt={'xl'} size="35">
          <Text size='xl'>
            Transaction:  
            <a href={`https://amoy.polygonscan.com/tx/${sendEthAndErc20Transaction}`} target="_blank">
                {sendEthAndErc20Transaction}
            </a>
          </Text>
          </Badge>
        </div>)}*/}
        </div>
      )}
    </Container>
    </>
  );
}