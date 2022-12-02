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
        resolve(JSON.parse(result));
      }
    );
  });
};

// export const readFile_ = async (): Promise<Object> => {
//   return new Promise((resolve, reject) => {
//     fs.readFile(path.join(__dirname, "accounts.json"),"utf-8",(error, result: string) => {
//         if (error) {
//           reject(error);
//         }
//         const responseData = JSON.parse(result);
//         resolve(responseData);
//       });
//   });
// };

//Writing to json file
export const writeToFile = async (newAccount: string): Promise<Object> => {
  const buff = Buffer.from(newAccount, "utf-8");
  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(__dirname, "accounts.json"), buff, (error) => {
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
    writeToFile(JSON.stringify(accountAdded))
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    return error;
  }
};

//fetching all account details
export const getAllAccounts = async () => {
  try {
    const accounts: Accounts = (await readFile()) as Accounts;
    //no apiPassword in the response
    Object.keys(accounts).map((key) => {
      delete accounts[key]["apiPassword"];
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
    return accounts[req.accountId]
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
