import * as AWS from "aws-sdk";
import * as s3Config from "./config";

//Dodnload file from s3
export const callDownloadS3File = async () => {
  const params: any = {
    Bucket: s3Config.BUCKET, // bucket name
    Key: s3Config.KEYFILE, // file name
  };
  try {
    AWS.config.update({
      accessKeyId: s3Config.ACCESSKEYID,
      secretAccessKey: s3Config.SECRETACCESSKEY,
      region: s3Config.REGION,
    });
    const s3 = new AWS.S3();
    const result = await s3.getObject(params).promise();
    if (result && result.Body) {
      console.log('Downloaded successful')
      return result.Body.toString()
    } else {
      return ({ "Status": 404, "message": "No data found" })
    }
  } catch (error) {
    return error;
  }
}

//uploading file to s3 bucket
export const uploads3File = async (accounts: any) => {
  const params : any= {
    Bucket: s3Config.BUCKET, // bucket name
    Key: s3Config.KEYFILE, // file name
    ContentType: "application/json", //File type
    Body: JSON.stringify(accounts), //Data read from the file
  };
  AWS.config.update({
    accessKeyId: s3Config.ACCESSKEYID,
    secretAccessKey: s3Config.SECRETACCESSKEY,
    region: s3Config.REGION,
  });
  const s3 = new AWS.S3();
  
  const result = await s3.putObject(params).promise()
  if(result !== undefined){
      const response = `Uploaded Successfully`
      console.log(response);
      return response;
    } else {
      return ('Failed to upload')
    }
};

// export default { downloadS3File, uploads3File }
