import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Logger } from '@aws-lambda-powertools/logger';
import { v4 as uuidv4 } from 'uuid';
import { PictureUploadRequest, PresignedUrlResponse, Picture } from '../models/Picture';
import { dynamoClient, picturesTableName, s3Service } from '../lib/common';
import PictureStore from '../lib/PictureStore';

const logger = new Logger({ serviceName: `${process.env.ENVIRONMENT}-maijin-defi-challenge-create-presigned-url` });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing request body" })
            };
        }

        const requestData: PictureUploadRequest = JSON.parse(event.body);
        
        // Validate required fields
        if (!requestData.contactId || !requestData.category || !requestData.contentType) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required fields" })
            };
        }

        // Validate category prefix
        if (!requestData.category.startsWith('public/') && !requestData.category.startsWith('private/')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Category must start with 'public/' or 'private/'" })
            };
        }

        const pictureId = uuidv4();
        const fileExtension = requestData.contentType.split('/')[1] || 'jpg';
        const key = `${requestData.contactId}/${requestData.category}/${pictureId}.${fileExtension}`;

        // Create the pre-signed URL
        const uploadUrl = await s3Service.generatePresignedUrl(key, requestData.contentType);

        // Create picture record in DynamoDB (with empty fields to be updated after upload)
        const pictureStore = new PictureStore(picturesTableName, dynamoClient);
        
        // Get existing pictures count to determine order
        let order = 0;
        try {
            const existingPictures = await pictureStore.getPicturesByContactIdAndCategory(requestData.contactId, requestData.category);
            order = existingPictures.length ?? 0;
        } catch (error) {
            order = 0;
        }

        const picture: Picture = {
            id: pictureId,
            contactId: requestData.contactId,
            category: requestData.category,
            key: key,
            contentType: requestData.contentType,
            order: order + 1,
            createdAt: new Date().toISOString()
        };

        await pictureStore.addPicture(picture);

        const response: PresignedUrlResponse = {
            uploadUrl,
            key,
            id: pictureId
        };

        return {
            statusCode: 200,
            body: JSON.stringify(response)
        };
    } catch (error) {
        logger.error("Error creating presigned URL", { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to create presigned URL" })
        };
    }
}; 