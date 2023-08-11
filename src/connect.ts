import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamodbAddConnection } from './aws';

export const handler = async (
	event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
	try {
		const tableName = process.env.AWS_TABLE_NAME ?? 'websocket-connections';

		const connectionId = event.requestContext.connectionId;

		if (!connectionId) {
			throw new Error('No connectionId');
		}

		const res = await dynamodbAddConnection(tableName, connectionId);

		if (res instanceof Error) {
			return {
				statusCode: 500,
				body: res.message,
				headers: {
					'context-type': 'text/plain; charset=utf-8',
				},
			};
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `User ${connectionId} connected!`,
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: (error as Error).message,
			headers: {
				'context-type': 'text/plain; charset=utf-8',
			},
		};
	}
};
