import { describe, it, expect } from '@jest/globals';
import { Picture, PictureCategory, PictureUploadRequest, PictureListResponse, PictureResponse, PresignedUrlResponse } from '../models/Picture';

describe('Picture Model Tests', () => {
  it('should create a Picture object correctly', () => {
    const picture: Picture = {
      id: 'test-id',
      contactId: 12345,
      category: 'public/profile',
      key: 'public/profile/12345/test-id.jpg',
      contentType: 'image/jpeg',
      order: 0,
      createdAt: new Date().toISOString()
    };

    expect(picture.id).toBe('test-id');
    expect(picture.contactId).toBe(12345);
    expect(picture.category).toBe('public/profile');
    expect(picture.key).toContain('public/profile/12345/test-id.jpg');
    expect(picture.contentType).toBe('image/jpeg');
    expect(picture.order).toBe(0);
    expect(picture.createdAt).toBeDefined();
  });

  it('should create a PictureCategory object correctly', () => {
    const category: PictureCategory = {
      contactId: 12345,
      category: 'public/profile',
      totalPictures: 3,
      lastUpdatedAt: new Date().toISOString()
    };

    expect(category.contactId).toBe(12345);
    expect(category.category).toBe('public/profile');
    expect(category.totalPictures).toBe(3);
    expect(category.lastUpdatedAt).toBeDefined();
  });

  it('should create a PictureUploadRequest object correctly', () => {
    const request: PictureUploadRequest = {
      contactId: 12345,
      category: 'public/profile',
      contentType: 'image/jpeg',
      base64Content: 'data:image/jpeg;base64,/9j/4AAQSkZ...'
    };

    expect(request.contactId).toBe(12345);
    expect(request.category).toBe('public/profile');
    expect(request.contentType).toBe('image/jpeg');
    expect(request.base64Content).toBeDefined();
  });

  it('should create a PictureResponse object correctly', () => {
    const response: PictureResponse = {
      id: 'test-id',
      category: 'public/profile',
      url: 'https://example.cloudfront.net/public/profile/12345/test-id.jpg',
      contentType: 'image/jpeg',
      order: 0,
      createdAt: new Date().toISOString()
    };

    expect(response.id).toBe('test-id');
    expect(response.category).toBe('public/profile');
    expect(response.url).toContain('cloudfront.net');
    expect(response.contentType).toBe('image/jpeg');
    expect(response.order).toBe(0);
    expect(response.createdAt).toBeDefined();
  });

  it('should create a PresignedUrlResponse object correctly', () => {
    const presignedUrl: PresignedUrlResponse = {
      uploadUrl: 'https://example-bucket.s3.amazonaws.com/public/profile/12345/test-id.jpg?X-Amz-Algorithm=...',
      key: 'public/profile/12345/test-id.jpg',
      id: 'test-id'
    };

    expect(presignedUrl.uploadUrl).toContain('s3.amazonaws.com');
    expect(presignedUrl.key).toBe('public/profile/12345/test-id.jpg');
    expect(presignedUrl.id).toBe('test-id');
  });
}); 