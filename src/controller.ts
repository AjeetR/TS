import fs, { read } from "fs";
import path from "path";
import { downloadS3File, uploads3File } from './awsS3'

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
        resolve(JSON.parse(result));
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
        resolve("Written to file");
      }
    );
  });
};

//creating new account
export const createAccount = async (req: CreateAccount) => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
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
    await downloadS3File();
    const accounts: Accounts = await readFile() as Accounts;
    Object.keys(accounts).map((key) => {
      delete accounts[key]["apiPassword"];          //removing apiPassword in the response
    });
    return accounts;

  } catch (error) {
    return error;
  }
};

//get account
export const getAccount = async (req : any) => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    const result = {
      [req.accountId] : accounts[req.accountId]
    }
    return result
  } catch (error) {
    return error;
  }
};

//updating account details
export const updateAccount = async (req : any) => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    const newAccountData: Accounts = {
      [req.params.accountId]: {
        accountType: req.body.accountType,
        apiKey: req.body.apiKey,
        apiPassword: req.body.apiPassword,
      },
    };
    const accountAdded = Object.assign(accounts, newAccountData);
    await writeToFile(JSON.stringify(accountAdded))
  } catch (error) {
    return error;
  }
};

//Delete Account
export const deleteAccount = async(req : any) => {
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
