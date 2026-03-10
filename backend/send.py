#This script take what the browser sends and put it in DynamoDB.

#Psudocode
#1. Define the rescources we talk to through boto3 in this case DynamoDB and a table

#2. Define the handler
#3. When a request arrives pull out the Session ID, the Secret Message, and the Encryption Key (IV).

#Create a new entry in the table with those three pieces of info.
#- : "Now" + 30 minutes. 
#- Tag the entry with that expiration timestamp so it self-destructs later.

dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event,context):
    body = json.loads(event[body])

    session_code = body['session_code']
    ciphertext   = body['ciphertext']
    iv           = body['iv']
    
    table.put_item(Item={
        'session_code': session_code,
        'ciphertext':   ciphertext,
        'iv':           iv,
        'ttl':          int(time.time()) + 1800
    })
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Stored successfully'})
    }