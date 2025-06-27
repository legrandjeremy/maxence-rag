export interface Picture {
    id: string;
    contactId: string;
    category: string;
    key: string;
    contentType: string;
    order: number;
    createdAt: string;
    updatedAt?: string;
}

export interface PictureCategory {
    contactId: string;
    category: string;
    totalPictures: number;
    lastUpdatedAt: string;
}

export interface PictureUploadRequest {
    contactId: string;
    category: string;
    contentType: string;
    base64Content?: string;
}

export interface PictureListResponse {
    contactId: string;
    pictures: PictureResponse[];
}

export interface PictureResponse {
    id: string;
    category: string;
    url: string;
    contentType: string;
    order: number;
    createdAt: string;
    updatedAt?: string;
}

export interface PresignedUrlResponse {
    uploadUrl: string;
    key: string;
    id: string;
} 