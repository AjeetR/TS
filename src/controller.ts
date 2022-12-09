
import { callDownloadS3File, uploads3File } from './awsS3'
import {encrypt, decrypt} from './common'

export interface CreateAccount {
  accountId: string;
  accountType: number;
  apiKey: string;
  apiPassword: string;
}

export interface Account {
  [x: string]: any;
  accountType: number;
  apiKey: string;
  apiPassword?: string;
}

export interface Accounts {
  [accountId: string]: Account;
}

//creating new account
export const createAccount = async (req: CreateAccount) => {
  try {
    const data: any = await callDownloadS3File();
    const accounts : Accounts = JSON.parse(data) as Accounts
    if(req.accountId !== undefined){
    const newAccountData: Accounts = {
      [req.accountId]: {
        accountType: req.accountType,
        apiKey: req.apiKey,
        apiPassword: await encrypt(req.apiPassword),
      },
    };
    const accountAdded = Object.assign(accounts, newAccountData);
    const upload : any = await uploads3File(accountAdded)
    const response = `Account created with Id ${req.accountId} and ${upload}`
    return response;
  }else{
    return({"statusCpde":400, "message":"Bad Request"})
  }
  } catch (error) {
    console.log(error)
    return error;
  }
};

//fetching all account details
export const getAllAccounts = async () => {
  try {
    const data: any = await callDownloadS3File();
    const accounts : Accounts = JSON.parse(data) as Accounts
    Object.keys(accounts).map((key) => {
      delete accounts[key]["apiPassword"];          //removing apiPassword in the response
    });
    return accounts;
  } catch (error) {
    return error;
  }
};

//get account
export const getAccount = async (req: any) => {
  try {
    const data: any = await callDownloadS3File();
    const accounts : Accounts = JSON.parse(data) as Accounts
    if (accounts[req.accountId] !== undefined) {
      const result = {
        [req.accountId]: accounts[req.accountId]
      }
      return result
    } else {
      return ({ "statusCode": 404, "message": `No Data found for accountId : ${req.accountId}` })
    }
  } catch (error) {
    return error;
  }
};

//updating account details
export const updateAccount = async (req: any) => {
  try {
    const data: any = await callDownloadS3File();
    const accounts : Accounts = JSON.parse(data) as Accounts
    if (accounts[req.params.accountId] !== undefined) {
      const newAccountData: Accounts = {
        [req.params.accountId]: {
          accountType: req.body.accountType,
          apiKey: req.body.apiKey,
          apiPassword: req.body.apiPassword,
        },
      };
      const updatedAccount = Object.assign(accounts, newAccountData);
      const upload : any = await uploads3File(updatedAccount)
      const response = `Updated account ${req.params.accountId} and ${upload}`
      return response;
    } else {
      let response = { "statusCode": 404, "message": `No Data found for accountId : ${req.params.accountId}` }
      return (response)
    }
  } catch (error) {
    return error;
  }

};

//Delete Account
export const deleteAccount = async (req: any) => {
  try {
    const data: any = await callDownloadS3File();
    const accounts : Accounts = JSON.parse(data) as Accounts
    delete accounts[req.params.accountId];
    const upload : any = await uploads3File(accounts)
    const response = `deleted account ${req.params.accountId} and ${upload}`
    return response;
  } catch (error) {
    return error;
  }
}

