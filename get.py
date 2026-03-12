import json, boto3, os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    session_code = event['queryStringParameters']['session_code']
    response = table.get_item(Key={'session_code': session_code})

    if 'Item' not in response:
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code not found or expired'})
        }

    item = response['Item']
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ciphertext': item['ciphertext'], 'iv': item['iv']})
    }
