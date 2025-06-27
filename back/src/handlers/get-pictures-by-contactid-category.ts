import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Logger } from '@aws-lambda-powertools/logger';
import { PictureListResponse, PictureResponse } from '../models/Picture';
import { dynamoClient, picturesTableName, s3Service } from '../lib/common';
import PictureStore from '../lib/PictureStore';

const logger = new Logger({ serviceName: `${process.env.ENVIRONMENT}-maijin-defi-challenge-get-pictures-by-contactid-category` });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        const contactIdParam = event.pathParameters?.contactId;
        const category = event.pathParameters?.category;
        
        if (!contactIdParam || !category) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing contactid or category parameter" })
            };
        }

        const contactId = contactIdParam;

        // Validate category prefix
        if (!category.startsWith('public/') && !category.startsWith('private/')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Category must start with 'public/' or 'private/'" })
            };
        }

        // Get pictures from DynamoDB
        const pictureStore = new PictureStore(picturesTableName, dynamoClient);
        const pictures = await pictureStore.getPicturesByContactIdAndCategory(contactId, category);

        // Format response with CloudFront URLs
        const formattedPictures: PictureResponse[] = await Promise.all(pictures.map(async picture => {
            const isPublic = picture.category.startsWith('public/');
            const url = isPublic 
                ? s3Service.getPublicUrl(picture.key)
                : await s3Service.generatePrivatePresignedUrl(picture.key);
                
            return {
                id: picture.id,
                category: picture.category,
                url: url,
                contentType: picture.contentType,
                order: picture.order,
                createdAt: picture.createdAt,
                updatedAt: picture.updatedAt
            };
        }));

        // Sort by order
        formattedPictures.sort((a, b) => a.order - b.order);

        const response: PictureListResponse = {
            contactId,
            pictures: formattedPictures
        };

        return {
            statusCode: 200,
            body: JSON.stringify(response)
        };
    } catch (error) {
        logger.error("Error retrieving pictures", { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to retrieve pictures" })
        };
    }
}; 