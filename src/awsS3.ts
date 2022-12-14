import * as AWS from "aws-sdk";
import { createWriteStream } from "fs";
import fs from "fs";
import path from "path";
import * as s3Config from "./config";

//Dodnload file from s3
export const callDownloadS3File = async () => {
// return new Promise (function(resolve, reject){
  const params: any = {
    Bucket: s3Config.BUCKET, // bucket name
    Key: s3Config.KEYFILE, // file name
  };
  console.log("Params : ", params);
  // let file = fs.createWriteStream("./accounts.json");
  try {
      AWS.config.update({
        accessKeyId: s3Config.ACCESSKEYID,
        secretAccessKey: s3Config.SECRETACCESSKEY,
        region: s3Config.REGION,
      });
      const s3 = new AWS.S3();
      const result = await s3.getObject(params).promise();
      if(result && result.Body){
        return result.Body.toString()
        // const data = Buffer.from(body, 'base64').toString()
        // return data;
      }
      // s3.getObject(params).createReadStream().on("end", () => {
      //     resolve('Successful');
      //   }).on("error", () => {
      //     console.log("Failed to download");
      //     reject('Failed');
      //   }).pipe(file);
    // return result;
  } catch (error) {
    return error;
  }
// });
}

//uploading file to s3 bucket
export const uploads3File = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, "accounts.json"),
      "utf-8",
      async (error, data: string) => {
        if (error) throw error;
        const params = {
          Bucket: "identrust-worker-dev", // bucket name
          Key: "accounts.json", // file name
          ContentType: "application/json", //File type
          Body: data, //Data read from the file
        };
        AWS.config.update({
          accessKeyId: s3Config.ACCESSKEYID,
          secretAccessKey: s3Config.SECRETACCESSKEY,
          region: s3Config.REGION,
        });
        const s3 = new AWS.S3();
        s3.upload(params, (err: any, _data: any) => {
          if (err) throw err;
          console.log("Uploaded Successfully at location : ", _data.location);
        });
      });
  });
};

// export default { downloadS3File, uploads3File }

// downloadS3File();
// callDownloadS3File();
// //# This function for delete file from s3 bucket
// const s3delete = function (params) {
//     return new Promise((resolve, reject) => {
//         s3.createBucket({
//             Bucket: BUCKET_NAME        /* Put your bucket name */
//         }, function () {
//             s3.deleteObject(params, function (err, data) {
//                 if (err) console.log(err);
//                 else
//                     console.log(
//                         "Successfully deleted file from bucket";
//                     );
//                 console.log(data);
//             });
//         });
//     });
// };
