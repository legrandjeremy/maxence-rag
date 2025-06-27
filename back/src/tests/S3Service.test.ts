import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import S3Service from '../lib/S3Service';

// Mock the getSignedUrl function
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mocked-presigned-url.com')
}));

const s3Mock = mockClient(S3Client);

describe('S3Service Tests', () => {
  const bucketName = 'test-bucket';
  const cloudfrontDomain = 'test-distribution.cloudfront.net';
  let s3Service: S3Service;

  beforeEach(() => {
    s3Mock.reset();
    s3Service = new S3Service(bucketName, cloudfrontDomain);
    (getSignedUrl as jest.Mock).mockClear();
  });

  it('should upload base64 image successfully', async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    
    const key = 'public/test/123/image.jpg';
    const base64Content = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABA...';
    const contentType = 'image/jpeg';
    
    await expect(s3Service.uploadBase64Image(key, base64Content, contentType)).resolves.not.toThrow();
    
    expect(s3Mock.calls()).toHaveLength(1);
    const putObjectCall = s3Mock.call(0);
    expect(putObjectCall.args[0].input).toEqual({
      Bucket: bucketName,
      Key: key,
      Body: expect.any(Buffer),
      ContentType: contentType,
      ContentEncoding: 'base64'
    });
  });

  it('should generate presigned URL successfully', async () => {
    const key = 'public/test/123/image.jpg';
    const contentType = 'image/jpeg';
    
    const url = await s3Service.generatePresignedUrl(key, contentType);
    
    expect(url).toBe('https://mocked-presigned-url.com');
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 3600 }
    );
  });

  it('should delete image successfully', async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});
    
    const key = 'public/test/123/image.jpg';
    
    await expect(s3Service.deleteImage(key)).resolves.not.toThrow();
    
    expect(s3Mock.calls()).toHaveLength(1);
    const deleteObjectCall = s3Mock.call(0);
    expect(deleteObjectCall.args[0].input).toEqual({
      Bucket: bucketName,
      Key: key
    });
  });

  it('should generate public URL correctly', () => {
    const key = 'public/test/123/image.jpg';
    
    const url = s3Service.getPublicUrl(key);
    
    expect(url).toBe(`https://${cloudfrontDomain}/${key}`);
  });

  it('should generate private presigned URL successfully', async () => {
    const key = 'private/test/123/image.jpg';
    
    const url = await s3Service.generatePrivatePresignedUrl(key);
    
    expect(url).toBe('https://mocked-presigned-url.com');
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(GetObjectCommand),
      { expiresIn: 3600 }
    );
  });

  it('should get public URL correctly', () => {
    const key = 'public/test/123/image.jpg';
    const url = s3Service.getPublicUrl(key);
    expect(url).toBe(`https://${cloudfrontDomain}/${key}`);
  });

  it('should create an S3Service instance', () => {
    const bucketName = 'test-bucket';
    const cloudfrontDomain = 'test-distribution.cloudfront.net';
    const s3Service = new S3Service(bucketName, cloudfrontDomain);
    
    expect(s3Service).toBeDefined();
  });
  
  it('should return the correct public URL', () => {
    const bucketName = 'test-bucket';
    const cloudfrontDomain = 'test-distribution.cloudfront.net';
    const s3Service = new S3Service(bucketName, cloudfrontDomain);
    
    const key = 'public/test/123/image.jpg';
    const url = s3Service.getPublicUrl(key);
    
    expect(url).toBe(`https://${cloudfrontDomain}/${key}`);
  });
}); 