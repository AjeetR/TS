import pemstrip from "pemstrip";
import crypto from "crypto";
import AWS from "aws-sdk";
import argon2 from "argon2";
import { Producer } from "sqs-producer";
import { env, config } from "../config";
import { requestGet } from "../api/utils/request";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import * as pvutils from "pvutils";
import inet_ipv4 from "inet_ipv4";

const kms = new AWS.KMS();

const SQS_LOGGING_URL = config?.[env]?.node?.sqsLoggingUrl || null;
const AWS_REGION = config?.[env]?.node?.workerApi?.region || null;

interface CachedLogNotificationTypes {
  expires: number;
  cache: null;
}
const cachedLogNotificationTypes: CachedLogNotificationTypes = {
  expires: 0,
  cache: null,
};

interface DNMAPEntry {
  key: string;
  label: string;
  pos?: number;
  value?: any;
}

class Common {
  CERTDNORDER = [
    "CN",
    "OU",
    "O",
    "L",
    "ST",
    "C",
    "DC",
    "E",
    "serialNumber",
    "businessCategory",
    "jurisdictionL",
    "jurisdictionST",
    "jurisdictionC",
    "AEID",
  ];

  DNTYPES = {
    "2.5.4.6": "C",
    "2.5.4.10": "O",
    "2.5.4.11": "OU",
    "2.5.4.3": "CN",
    "2.5.4.7": "L",
    "2.5.4.8": "ST",
    "2.5.4.12": "T",
    "2.5.4.42": "GN",
    "2.5.4.43": "I",
    "2.5.4.4": "SN",
    "1.2.840.113549.1.9.1": "E-mail",
    "0.9.2342.19200300.100.1.25": "DC",
    "2.5.4.5": "serialNumber",
    "2.5.4.15": "businessCategory",
    "1.3.6.1.4.1.311.60.2.1.1": "jurisdictionL",
    "1.3.6.1.4.1.311.60.2.1.2": "jurisdictionST",
    "1.3.6.1.4.1.311.60.2.1.3": "jurisdictionC",
    "1.3.6.1.4.1.37734.1": "AEID",
  };

  DNLABEL: DNMAPEntry[] = [{ key: "AEID", label: "1.3.6.1.4.1.37734.1" }];

  encrypt = (str: any): Promise<any> => {
    if (process.env.DATA_KEY) {
      return this.generateRandom(16).then((iv: any) => {
        const key = Buffer.from(process.env.DATA_KEY ?? "", "base64");
        const cipher = crypto.createCipheriv("aes256", key, iv);
        let encrypted = cipher.update(str, "utf8", "hex");
        encrypted += cipher.final("hex");
        return Promise.resolve(`${iv.toString("hex")}:${encrypted}`);
      });
    }
    return Promise.resolve(str);
  };

  decrypt = (str: any): string => {
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

  hasProperty = (obj: any, prop: any): boolean => {
    const props = prop.split(".");
    let tmpObject = obj;
    for (let i = 0; i < props.length; i += 1) {
      if (!Object.prototype.hasOwnProperty.call(tmpObject, props[i])) {
        return false;
      }
      tmpObject = tmpObject[props[i]];
    }
    return true;
  };

  generateRandom = (numberOfBytes: any): Promise<any> => {
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

  generateArgonString = async function (clearText: string): Promise<string> {
    const hash = await argon2.hash(clearText);
    return hash;
  };

  buildDNOrder(order: any, inDn: any): any {
    const dn: any = {};
    for (let i = 0; i < order.length; i += 1) {
      if (this.hasProperty(inDn, order[i])) {
        dn[order[i]] = inDn[order[i]];
      }
    }
    return dn;
  }

  buildCertDNOrder(inDn: any) {
    return this.buildDNOrder(this.CERTDNORDER, inDn);
  }

  buildDNFromObjectByKey = (inDn: any): string => {
    let dn = "";
    Object.keys(inDn).forEach((key) => {
      // find the label - in case it is different than the key - used for custom DN attributes like AEID
      const dnLabel = this.DNLABEL.find((o) => o.key === key)?.label || key;
      if (Array.isArray(inDn[key])) {
        inDn[key].forEach((val: string) => {
          // ACM-316 - escape any embedded commas
          const noCommaValue = val.replace(/([^\\]),/g, "$1\\,");
          dn = `${dn}${dnLabel}=${noCommaValue},`;
        });
      } else {
        // ACM-316 - escape any embedded commas
        const val = inDn[key].replace(/([^\\]),/g, "$1\\,");
        if (val) {
          dn = `${dn}${dnLabel}=${val},`;
        }
      }
    });
    // remove the trailing comma
    return dn.slice(0, -1);
  };

  buildDN(inDN: any): any {
    const dn: any[] = [];
    for (let i = 0; i < inDN.typesAndValues.length; i += 1) {
      let dnType = this.DNTYPES[inDN.typesAndValues[i].type];
      if (typeof dnType === "undefined") {
        dnType = inDN.typesAndValues[i].type;
      }
      const dnValue = inDN.typesAndValues[i].value.valueBlock.value;
      dn.push({
        tag: dnType,
        value: dnValue,
        order:
          this.CERTDNORDER.indexOf(dnType) >= 0
            ? this.CERTDNORDER.indexOf(dnType)
            : this.CERTDNORDER.length,
      });
    }
    return dn.sort((a, b) => {
      if (a.order === b.order) {
        return -1;
      }
      return a.order - b.order;
    });
  }

  printDN(dn: any): string {
    return dn
      .map((dnEntry) => {
        const val = dnEntry.value.replace(/([^\\]),/g, "$1\\,");
        return `${dnEntry.tag}=${val}`;
      })
      .join(", ");
  }

  parseSANs(commonName: string, extensions: any): any {
    const SANs: any[] = [];
    SANs.push({
      sanType: "CN",
      sanValue: commonName,
    });
    if (extensions) {
      const altNameExtension = extensions.find((extension) => extension.extnID === "2.5.29.17");
      if (altNameExtension) {
        altNameExtension.parsedValue.altNames.forEach((altName) => {
          switch (altName.type) {
            case 0: {
              const otherNameOID = altName.value.valueBlock.value[0];
              if (otherNameOID.valueBlock.toJSON().value === "1.3.6.1.4.1.311.20.2.3") {
                // UPN
                const upnValue = altName.value.valueBlock.value[1];
                SANs.push({
                  sanType: "UPN",
                  sanValue: upnValue.valueBlock.value[0].valueBlock.value,
                });
              }
              break;
            }
            case 1: {
              SANs.push({
                sanType: "email",
                sanValue: altName.value,
              });
              break;
            }
            case 2: {
              SANs.push({
                sanType: "DNS",
                sanValue: altName.value,
              });
              break;
            }
            case 6: {
              SANs.push({
                sanType: "URI",
                sanValue: altName.value,
              });
              break;
            }
            case 7: {
              let hex = pvutils.bufferToHexCodes(altName.value.valueBlock.valueHex);
              if (hex.length == 32) {
                // ipv6
                hex = (hex.match(/.{1,4}/g) || []).join(":");
              } else if (hex.length == 8) {
                // ipv4
                hex = inet_ipv4.normalize(`0x${hex}`);
              }
              SANs.push({
                sanType: "IP Address",
                sanValue: hex,
              });
              break;
            }
            default:
              break;
          }
        });
      }
    }
    return SANs;
  }

  algomap = {
    "1.2.840.113549.1.1.2": "md2WithRSAEncryption",
    "1.2.840.113549.1.1.4": "md5WithRSAEncryption",
    "1.2.840.10040.4.3": "dsa-with-SHA1",
    "1.2.840.10045.4.1": "ecdsa-with-SHA1",
    "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
    "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
    "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
    "1.2.840.113549.1.1.10": "RSA-PSS",
    "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
    "1.2.840.113549.1.1.14": "sha224WithRSAEncryption",
    "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
    "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
    "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  }; // array mapping of common algorithm OIDs and corresponding types

  parseCertificate(str: any) {
    // build the PEM format string if it doesn't exist!
    const pem = str.replace(/(-----(BEGIN|END)( NEW|) CERTIFICATE-----|\r\n|\n|\r|\s)/gm, "");
    const asn1 = asn1js.fromBER(pvutils.stringToArrayBuffer(pvutils.fromBase64(pem)));
    const pkijsCert = new pkijs.Certificate({ schema: asn1.result });

    const cert: any = {};
    cert.serial = pvutils.bufferToHexCodes(pkijsCert.serialNumber.valueBlock.valueHex);
    cert.subject = this.buildDN(pkijsCert.subject);
    cert.issuer = this.buildDN(pkijsCert.issuer);
    cert.commonName = cert.subject.find((dnEntry) => dnEntry.tag === "CN").value;
    cert.subjectDN = this.printDN(cert.subject);
    cert.issuerDN = this.printDN(cert.issuer);
    if (cert.subjectDN === cert.issuerDN) {
      cert.isRoot = true;
    }
    cert.notBefore = pkijsCert.notBefore.value;
    cert.notAfter = pkijsCert.notAfter.value;
    cert.notBeforeISO = cert.notBefore.toISOString();
    cert.notAfterISO = cert.notAfter.toISOString();
    cert.SANs = this.parseSANs(cert.commonName, pkijsCert.extensions);
    cert.signatureAlgorithm = this.algomap[pkijsCert.signatureAlgorithm.algorithmId];
    cert.pem = pemstrip.assemble({
      base64: Buffer.from(pkijsCert.toSchema(true).toBER(false)).toString("base64"),
      tag: "CERTIFICATE",
    });

    return cert;
  }

  parseDerFile(buffer: any) {
    const str = Buffer.from(buffer, "binary").toString("base64");
    return this.parseCertificate(str);
  }

  buildCSR = (str: any) => {
    let csr = str;
    if (!str.startsWith("-----")) {
      const b64 = str.replace(/\n/g, "").replace(/\r/g, "");
      csr = pemstrip.assemble({ base64: b64, tag: "CERTIFICATE REQUEST" });
    }
    return csr;
  };

  getHawkOptions = () => {
    const { externalUri } = config[env].server;
    const { externalPort } = config[env].server;
    return {
      host: externalUri.replace(/.*?:\/\//g, ""),
      port: externalPort,
    };
  };

  // Source: https://blog.bitsrc.io/build-a-cron-job-in-nodejs-d117abd0be45
  cron = (fn: any, ms: any) => {
    let timeout: any;
    async function cb() {
      if (timeout) clearTimeout(timeout);
      try {
        await fn();
      } catch (err: any) {
        console.log(`cron error: ${err.message}`);
      }
      timeout = setTimeout(cb, ms);
    }
    timeout = setTimeout(cb, ms);
  };

  // Source: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
  validateEmail = (email: any): boolean => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  getCachedLogNotificationTypes = async (): Promise<string[] | null> => {
    if (!config[env].node.loggingNotifications?.baseUrl) {
      return [];
    }
    const nowTs = new Date().getTime();

    // TODO: This said expired, but the object says expires, so I changed to that assuming
    // this is a bug
    if (nowTs < cachedLogNotificationTypes.expires && cachedLogNotificationTypes.cache) {
      console.log("getCachedLogNotificationTypes cache hit");
      return cachedLogNotificationTypes.cache;
    }

    const { microserviceAuthJwt } = config[env].node;
    const loggingNotificationsBaseUrl = config[env].node.loggingNotifications.baseUrl;

    const headers = {
      Authorization: `Bearer ${microserviceAuthJwt}`,
    };
    const results = await requestGet(`${loggingNotificationsBaseUrl}/subscription-types`, headers);

    if (results.error) {
      if (cachedLogNotificationTypes.cache) {
        // Error, fallback to cache
        return cachedLogNotificationTypes.cache;
      }
      // unrecoverable error
      throw new Error(results.error);
    }

    console.log(`getCachedLogNotificationTypes loaded types ${JSON.stringify(results)}`);

    // save cache
    const oneDayFromNowTs = nowTs + 1000 * 60 * 60 * 24;

    // TODO: This said expired, but the object says expires, so I changed to that
    cachedLogNotificationTypes.expires = oneDayFromNowTs;
    cachedLogNotificationTypes.cache = results;
    return cachedLogNotificationTypes.cache;
  };

  async logToSqs(rcd: {
    type: string;
    id: string;
    accountId?: string | null;
    organizationId?: string | null;
    userId?: string | null;
    targetUserId?: string | null;
    [key: string]: any;
  }) {
    const notificationTypes: string[] | null = await this.getCachedLogNotificationTypes();
    if (SQS_LOGGING_URL && notificationTypes && notificationTypes.includes(rcd.type)) {
      try {
        const msgAttrs: any = {
          type: {
            DataType: "String",
            StringValue: rcd.type,
          },
        };
        if (rcd.accountId != null) {
          console.log(`LOGGING SQS - setting accountId: ${rcd.accountId}`);
          msgAttrs.accountId = {
            DataType: "String",
            StringValue: rcd.accountId,
          };
        }
        if (rcd.organizationId != null) {
          console.log(`LOGGING SQS - setting organizationId: ${rcd.organizationId}`);
          msgAttrs.organizationId = {
            DataType: "String",
            StringValue: rcd.organizationId,
          };
        }
        if (rcd.userId != null) {
          console.log(`LOGGING SQS - setting userId: ${rcd.userId}`);
          msgAttrs.userId = {
            DataType: "String",
            StringValue: rcd.userId,
          };
        }
        if (rcd.targetUserId != null) {
          console.log(`LOGGING SQS - setting targetUserId: ${rcd.targetUserId}`);
          msgAttrs.userId = {
            DataType: "String",
            StringValue: rcd.targetUserId,
          };
        }
        console.log(`***** LOGGING SQS msgAttrs = ${JSON.stringify(msgAttrs)}`);

        const producer = Producer.create({
          queueUrl: SQS_LOGGING_URL,
          region: AWS_REGION,
        });
        // TODO: This returns a promise now but I can't see how we can check individual
        // results from the SendMessageBatchResultEntryList
        producer.send({
          id: rcd.id,
          messageAttributes: msgAttrs,
          body: JSON.stringify(rcd),
        });
        console.log(`wrote to LOGGING SQS: ${rcd.type}`);
      } catch (err) {
        // do nothing
        console.log("logToSns error: ", err);
      }
    }
  }
}

export const common = new Common();
