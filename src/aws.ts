import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import AWS from 'aws-sdk';
import 'dotenv/config';

const AWS_REGION = process.env.AWS_REGION ?? 'eu-west-2';

AWS.config.update({ region: AWS_REGION });

const dynamodb = new AWS.DynamoDB();

const sqs = new AWS.SQS();

export async function* dynamodbScanTable(
	tableName: string,
	limit: number = 25,
	lastEvaluatedStarKey?: AWS.DynamoDB.Key
) {
	while (true) {
		const params: AWS.DynamoDB.ScanInput = {
			TableName: tableName,
			Limit: limit,
		};

		if (lastEvaluatedStarKey) {
			params.ExclusiveStartKey = lastEvaluatedStarKey;
		}

		try {
			const result = await dynamodb.scan(params).promise();

			if (!result.Count) return;

			lastEvaluatedStarKey = result.LastEvaluatedKey;

			result.Items = result.Items?.map((item) => unmarshall(item));

			yield result;
		} catch (error) {
			throw new Error(
				`dynamodbScanTable error response: ${(error as Error).message}`
			);
		}
	}
}

export const getAllScanResults = async <T>(
	tableName: string,
	limit: number = 25
) => {
	try {
		const scanIterator = dynamodbScanTable(tableName, limit);

		const results: T[] = [];

		let isDone = false;

		while (!isDone) {
			const { value, done } = await scanIterator.next();

			const scanOutput = value as AWS.DynamoDB.ScanOutput;

			const items = scanOutput?.Items as T[];

			if (items) {
				results.push(...items);
			}
			
			if (done || !scanOutput.LastEvaluatedKey) {
				isDone = true;
			}
		}

		return results;
	} catch (error) {
		throw new Error(
			`getAllScanResults error response: ${(error as Error).message}`
		);
	}
};


export const dynamodbAddConnection = async (
	tableName: string,
	connectionId: string
) => {
	try {
		const result = await dynamodb
			.putItem({ TableName: tableName, Item: marshall({ connectionId }) })
			.promise();

		return result;
	} catch (error) {
		throw new Error(
			`dynamodbAddConnection error: ${(error as Error).message}`
		);
	}
};

export const dynamodbRemoveConnection = async (
	tableName: string,
	connectionId: string
) => {
	try {
		const result = await dynamodb
			.deleteItem({
				TableName: tableName,
				Key: marshall({ connectionId }),
			})
			.promise();

		return result;
	} catch (error) {
		throw new Error(
			`dynamodbRemoveConnection error: ${(error as Error).message}`
		);
	}
};

export const sqsDeleteMessage = async (
	queueUrl: string,
	receiptHandle: string
) => {
	try {
		const result = await sqs
			.deleteMessage({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
			.promise();
		return result;
	} catch (error) {
		throw new Error(`sqsDeleteMessage error: ${(error as Error).message}`);
	}
};

type BroadcastMessageWebsocketProps = {
	apiGateway: AWS.ApiGatewayManagementApi;
	connections: any[];
	message: string;
	tableName: string;
};

export const broadcastMessageWebsocket = async ({
	apiGateway,
	connections,
	message,
	tableName,
}: BroadcastMessageWebsocketProps) => {
	try {
		const sendVendorsCall = connections.map(async (connection) => {
			const { connectionId } = connection;

			try {
				await apiGateway
					.postToConnection({
						ConnectionId: connectionId,
						Data: message,
					})
					.promise();
			} catch (error) {
				if ((error as any).statusCode === 410) {
					console.log('Deleting stale connection:', connectionId);
					const res = await dynamodbRemoveConnection(
						tableName,
						connectionId
					);

					if (res instanceof Error) return error;
				} else {
					return error;
				}
			}
		});

		return await Promise.all(sendVendorsCall);
	} catch (error) {
		throw new Error(
			`broadcastMessageWebsocket error: ${(error as Error).message}`
		);
	}
};
