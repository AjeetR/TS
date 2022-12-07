import fs, { read } from "fs";
import path from "path";
import  { callDownloadS3File } from './awsS3'

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

//Reading json file
export const readFile = async (): Promise<Object> => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, "accounts.json"),
      "utf-8",
      (error, result: string) => {
        if (error) {
          reject(error);
        } 
        else if(result == '')
        { resolve('No Data found') }
        else{ 
          resolve(JSON.parse(result))
        }
      }
    );
   });
};

//Writing to json file
export const writeToFile = async (newAccount: string): Promise<Object> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(__dirname, "accounts.json"), newAccount, (error) => {
        if (error) {
          reject(error);
        }
        resolve("Operation Successfully");
      }
    );
  });
};

//creating new account
export const createAccount = async (req: CreateAccount) => {
  try {
    const accounts: Accounts = await readFile() as Accounts;
    const newAccountData: Accounts = {
      [req.accountId]: {
        accountType: req.accountType,
        apiKey: req.apiKey,
        apiPassword: req.apiPassword,
      },
    };
    const accountAdded = Object.assign(accounts, newAccountData);
    await writeToFile(JSON.stringify(accountAdded))
  } catch (error) {
    return error;
  }
};

//fetching all account details
export const getAllAccounts = async () => {
  try {
    const data = await callDownloadS3File();
    console.log(data)
    return data;
    // await callDownloadS3File().then(result => {/
    //   console.log(result)
    //   readFile().then(res => {
    //     const accounts : Accounts = res as Accounts
    //   Object.keys(accounts).map((key) => {
    //     delete accounts[key]["apiPassword"];          //removing apiPassword in the response
    //   });
    //   return accounts;
    //   }).catch(error => {console.log(error)})
    // }).catch(err => {return err})
  } catch (error) {
    return error;
  }
};

//get account
export const getAccount = async (req: any) => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    if (accounts[req.accountId] !== undefined) {
      const result = {
        [req.accountId]: accounts[req.accountId]
      }
      return result
    }else{
      return ({ "statusCode": 404, "message": `No Data found for accountId : ${req.accountId}` })
    }
  } catch (error) {
    return error;
  }
};

//updating account details
export const updateAccount = async (req: any) => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    if (accounts[req.params.accountId] !== undefined) {
      const newAccountData: Accounts = {
        [req.params.accountId]: {
          accountType: req.body.accountType,
          apiKey: req.body.apiKey,
          apiPassword: req.body.apiPassword,
        },
      };
      const accountAdded = Object.assign(accounts, newAccountData);
      const updated = await writeToFile(JSON.stringify(accountAdded))
      return updated;
    }else {
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
    const accounts: Accounts = (await readFile()) as Accounts;
    delete accounts[req.params.accountId];
    await writeToFile(JSON.stringify(accounts))
    return accounts;
  } catch (error) {
    return error;
  }
}

// export const s3Bucket = () => {

// }
