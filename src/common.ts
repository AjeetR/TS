// import pemstrip from "pemstrip";
import crypto from "crypto";
import AWS from "aws-sdk";
require('dotenv').config()

const kms = new AWS.KMS();

export const encrypt = async (str: any): Promise<any> => {
    if (process.env.DATA_KEY) {
      const iv = await generateRandom(16);
        const key = Buffer.from(process.env.DATA_KEY ?? "", "base64");
        const cipher = crypto.createCipheriv("aes256", key, iv);
        let encrypted = cipher.update(str, "utf8", "hex");
        encrypted += cipher.final("hex");
        return await Promise.resolve(`${iv.toString("hex")}:${encrypted}`);
    }
    return Promise.resolve(str);
  };

  export const decrypt = (str: any): string => {
    if (process.env.DATA_KEY && str.indexOf(":") > 0) {
      const arr: string[] = str.split(":");
      const iv: Buffer = Buffer.from(arr[0], "hex");
      const encrypted: Buffer = Buffer.from(arr[1], "hex");
      const key: Buffer = Buffer.from(process.env.DATA_KEY, "base64");
      const cipher: crypto.Decipher = crypto.createDecipheriv("aes256", key, iv);
      // According to the docs, input encoding (hex) should not be passed here
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      let decrypted: string = cipher.update(encrypted, "hex", "utf8");
      decrypted += cipher.final("utf8");
      return decrypted;
    }
    return str;
  };

const generateRandom = async (numberOfBytes: any): Promise<any> => {
    if (process.env.AWS_REGION) {
      return kms
        .generateRandom({ NumberOfBytes: numberOfBytes })
        .promise()
        .then(function (data: any) {
          return Promise.resolve(data.Plaintext);
        });
    }
    return Promise.resolve(crypto.randomBytes(numberOfBytes));
  };

// encrypt('abcd').then(res=>{
//   console.log(res)
// }).catch(err=>{console.log(err)})