#Gets data from dynamodb based on the unique code generated and gives it to the browser for local decrytpion

#Psudocode 
# Get a code from the user and check against the passkey if thats the right one 
# Query that specific code linked text only
# Return the encyppted text for local decyption on device 

import json, boto3, os, time
#Define the resources 
dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table(os.environ['TABLE_NAME'])

import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    # Read the session code from the URL query parameter
    session_code = event['queryStringParameters']['session_code']
    
    # Ask DynamoDB for the item with that session code
    response = table.get_item(Key={'session_code': session_code})
    
    # If no item found , wrong code or already expired
    if 'Item' not in response:
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code not found or expired'})
        }
    
    item = response['Item']
    
    # Return ciphertext and IV to the browser
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'ciphertext': item['ciphertext'],
            'iv':         item['iv']
        })
    }