import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';
import { dynamodbScanTable } from './aws';

export const handler = async (
	event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
	try {
		const headers: APIGatewayProxyResult['headers'] = {
			'context-type': 'text/plain; charset=utf-8',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
		};

		const tableName = process.env.AWS_TABLE_NAME ?? 'test_vendors';

		const pageLimit = event.queryStringParameters?.limit ?? 10;

		const lastEvaluatedStarKey = event.queryStringParameters
			?.lastEvaluatedKey
			? marshall(JSON.parse(event.queryStringParameters.lastEvaluatedKey))
			: undefined;

		const scanIterator = dynamodbScanTable(
			tableName,
			Number(pageLimit),
			lastEvaluatedStarKey
		);

		const { value } = (await scanIterator.next()) as {
			value: AWS.DynamoDB.ScanOutput;
		};

		if (value) {
			return {
				statusCode: 200,
				body: JSON.stringify({
					items: value.Items!,
					count: value.Count!,
					lastEvaluatedKey: value.LastEvaluatedKey
						? unmarshall(value.LastEvaluatedKey)
						: null,
				}),
                headers
			};
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				items: [],
				count: 0,
				lastEvaluatedKey: null,
			}),
            headers
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
