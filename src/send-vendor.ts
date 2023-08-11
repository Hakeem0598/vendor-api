import { APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import AWS from 'aws-sdk';
import {
    broadcastMessageWebsocket,
    getAllScanResults,
    sqsDeleteMessage,
} from './aws';

export const handler = async (
	event: SQSEvent
): Promise<APIGatewayProxyResult> => {
	try {
		const tableName = process.env.AWS_TABLE_NAME ?? 'websocket-connections';
		const sqsUrl =
			process.env.AWS_SQS_URL ??
			'https://sqs.eu-west-2.amazonaws.com/559954134534/myQueue';

		const websocketUrl = process.env.AWS_WEBSOCKET_URL ?? '';

		const endpoint = new URL(websocketUrl);

		const apiGatewayManagementAPI = new AWS.ApiGatewayManagementApi({
			apiVersion: '2018-11-29',
			endpoint: endpoint.hostname + endpoint.pathname,
		});

		const message = event.Records[0].body;

		if (!message) {
			return {
				statusCode: 500,
				body: 'event message empty',
				headers: {
					'context-type': 'text/plain; charset=utf-8',
				},
			};
		}

		const connections = await getAllScanResults<string>(tableName, 20);

		if (connections instanceof Error) {
			return {
				statusCode: 500,
				body: connections.message,
				headers: {
					'context-type': 'text/plain; charset=utf-8',
				},
			};
		}

		const res = await broadcastMessageWebsocket({
			apiGateway: apiGatewayManagementAPI,
			connections,
			message,
			tableName,
		});

		if (res instanceof Error) {
			return {
				statusCode: 500,
				body: res.message,
				headers: {
					'context-type': 'text/plain; charset=utf-8',
				},
			};
		}

		await sqsDeleteMessage(sqsUrl, event.Records[0].receiptHandle);

		return {
			statusCode: 200,
			body: 'success',
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
