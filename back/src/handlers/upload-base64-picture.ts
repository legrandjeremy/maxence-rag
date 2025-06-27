import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Logger } from '@aws-lambda-powertools/logger';
import { v4 as uuidv4 } from 'uuid';
import { PictureUploadRequest, Picture } from '../models/Picture';
import { dynamoClient, picturesTableName, s3Service } from '../lib/common';
import PictureStore from '../lib/PictureStore';

const logger = new Logger({ serviceName: `${process.env.ENVIRONMENT}-maijin-defi-challenge-upload-base64-picture` });

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
        if (!requestData.contactId || !requestData.category || !requestData.contentType || !requestData.base64Content) {
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

        // Upload the image to S3
        await s3Service.uploadBase64Image(key, requestData.base64Content, requestData.contentType);

        // Create picture record in DynamoDB
        const pictureStore = new PictureStore(picturesTableName, dynamoClient);
        
        // Get existing pictures count to determine order
        const existingPictures = await pictureStore.getPicturesByContactIdAndCategory(requestData.contactId, requestData.category);
        const order = existingPictures.length;
        
        const picture: Picture = {
            id: pictureId,
            contactId: requestData.contactId,
            category: requestData.category,
            key: key,
            contentType: requestData.contentType,
            order: order,
            createdAt: new Date().toISOString()
        };

        await pictureStore.addPicture(picture);

        // Return CloudFront URL for the uploaded image
        const isPublic = requestData.category.startsWith('public/');
        const imageUrl = isPublic 
            ? s3Service.getPublicUrl(key)
            : await s3Service.generatePrivatePresignedUrl(key);

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: pictureId,
                url: imageUrl,
                message: "Picture uploaded successfully"
            })
        };
    } catch (error) {
        logger.error("Error uploading picture", { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to upload picture" })
        };
    }
}; 