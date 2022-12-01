import fs, { read } from "fs";
import path from "path";

export interface CreateAccount {
  accountId: string;
  accountType: number;
  apiKey: string;
  apiPassword: string;
}

export interface Account {
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
        const responseData = JSON.parse(result);
        resolve(responseData);
      }
    );
  });
};

//Writing to json file
export const writeToFile = async (newAccount : Accounts): Promise<Object> => {
    return new Promise((resolve, reject) => {
        // fs.writeFile(path.join(__dirname,"./accounts.json"), newAccount, "utf-8", error => {
        //     if (error) {
        //       reject(error);
        //     }
        //     resolve('Writtedn to file');
        //   });
    });
  };

//creating new account
export const createAccount = async (req: CreateAccount) => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    const newAccountData : Accounts = {
      [req.accountId]: {
        accountType: req.accountType,
        apiKey: req.apiKey,
        apiPassword: req.apiPassword
      },
    };
    const accountAdded = Object.assign(accounts, newAccountData)
    return (accountAdded);
  } catch (error) {
    return error;
  }
};

//fetching all account details
export const getAccounts = async () => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    //data is accounts
    Object.keys(accounts).map((key) => {
      delete accounts[key]["apiPassword"];
    });
    return accounts;
  } catch (error) {
    return error;
  }
};

//updating account details
export const updateAccount = async (accountId: BigInteger) => {
  try {
    const accounts: string = (await readFile()) as string;
    const jsonAccounts = JSON.parse(accounts);
  } catch (error) {}
};

// export const s3Bucket = () => {

// }
