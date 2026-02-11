import http from 'http';
import https from 'https';

export class OtpGateway {
  private static instance: OtpGateway;
  private  OTP_TEMPLATE = 'Your Login OTP for Gaddiel ERP is {#numeric#}';
  private  OTP_SAMPLE_URL = process.env.OTP_GATEWAY_URL || "";
  private  CHANNEL = process.env.CHANNEL || "Trans";
  private  API_KEY = process.env.API_KEY || "";
  private  SENDGRID_ID = process.env.SENDGRID_ID || "";


  private constructor() {
    this.OTP_SAMPLE_URL = process.env.OTP_GATEWAY_URL || "";
  }

  static getInstance(): OtpGateway {
    if (!OtpGateway.instance) {
      OtpGateway.instance = new OtpGateway();
    }

    return OtpGateway.instance;
  }

  generateSixDigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  buildOtpMessage(otp: string): string {
    return this.OTP_TEMPLATE.replace('{#numeric#}', otp);
  }

  private async sendGetRequest(url: string): Promise<{ statusCode: number; response: string }> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client
        .get(url, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 0,
              response: body,
            });
          });
        })
        .on('error', (error) => reject(error));
    });
  }

  async sendOtpViaGetRequest(mobile: string, otp: string) {
    const message = this.buildOtpMessage(otp);
    const gatewayUrl = new URL(this.OTP_SAMPLE_URL);
    gatewayUrl.searchParams.set('APIKey', this.API_KEY);
    gatewayUrl.searchParams.set('senderid', this.SENDGRID_ID);
    gatewayUrl.searchParams.set('channel', this.CHANNEL);
    gatewayUrl.searchParams.set('DCS', "0");
    gatewayUrl.searchParams.set('flashsms', "0");
    gatewayUrl.searchParams.set('number', mobile);
    gatewayUrl.searchParams.set('text', message);

    return this.sendGetRequest(gatewayUrl.toString());
  }
}

export const otpGateway = OtpGateway.getInstance();

// Backward-compatible exports for existing imports across the project.
export const generateSixDigitOtp = (): string => {
  return otpGateway.generateSixDigitOtp();
};

export const buildOtpMessage = (otp: string): string => {
  return otpGateway.buildOtpMessage(otp);
};

export const sendOtpViaGetRequest = async (mobile: string, otp: string) => {
  return otpGateway.sendOtpViaGetRequest(mobile, otp);
};
