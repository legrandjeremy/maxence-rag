import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Logger } from '@aws-lambda-powertools/logger';
import { dynamoClient, picturesTableName, s3Service } from '../lib/common';
import PictureStore from '../lib/PictureStore';

const logger = new Logger({ serviceName: `${process.env.ENVIRONMENT}-maijin-defi-challenge-get-private-picture` });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        const pictureId = event.pathParameters?.id;
        
        if (!pictureId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing picture ID parameter" })
            };
        }

        // Get picture from DynamoDB
        const pictureStore = new PictureStore(picturesTableName, dynamoClient);
        const picture = await pictureStore.getPictureById(pictureId);

        if (!picture) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Picture not found" })
            };
        }

        // Check if this is a private picture
        if (!picture.category.startsWith('private/')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "This endpoint is only for private pictures" })
            };
        }

        // Generate a pre-signed URL for the private picture
        const presignedUrl = await s3Service.generatePrivatePresignedUrl(picture.key);

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: picture.id,
                url: presignedUrl,
                contentType: picture.contentType,
                category: picture.category
            })
        };
    } catch (error) {
        logger.error("Error retrieving private picture", { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to retrieve private picture" })
        };
    }
}; 