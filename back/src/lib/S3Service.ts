import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3Service {
    private s3Client: S3Client;
    private bucketName: string;
    private cloudfrontDomain: string;

    constructor(bucketName: string, cloudfrontDomain: string) {
        // Configure S3 client based on environment
        const s3Options: any = {};
        
        // For local development, you might need to configure endpoint
        if (process.env.AWS_SAM_LOCAL === 'true') {
            // S3 local configuration if needed
            // s3Options.endpoint = 'http://localhost:4566'; // for localstack
        }
        
        this.s3Client = new S3Client(s3Options);
        this.bucketName = bucketName;
        this.cloudfrontDomain = cloudfrontDomain;
    }

    async uploadBase64Image(key: string, base64Content: string, contentType: string): Promise<void> {
        // Remove the data:image/jpeg;base64, part if present
        const base64Data = base64Content.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ContentEncoding: 'base64'
        });

        try {
            await this.s3Client.send(command);
            console.log(`Successfully uploaded image to ${key}`);
        } catch (error) {
            console.error('Error uploading base64 image:', error);
            throw error;
        }
    }

    async generatePresignedUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            throw error;
        }
    }

    async generatePresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            console.error('Error generating presigned download URL:', error);
            throw error;
        }
    }

    async deleteImage(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        try {
            await this.s3Client.send(command);
            console.log(`Successfully deleted image at ${key}`);
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    getPublicUrl(key: string): string {
        // For public files, return CloudFront URL
        // Validate CloudFront domain format
        if (!this.cloudfrontDomain || this.cloudfrontDomain === 'test-cf-domain.cloudfront.net') {
            console.warn('Using test CloudFront domain - this may not work in production');
        }
        return `https://${this.cloudfrontDomain}/${key}`;
    }
    
    async generatePrivatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            console.error('Error generating private presigned URL:', error);
            throw error;
        }
    }
}

export default S3Service; 